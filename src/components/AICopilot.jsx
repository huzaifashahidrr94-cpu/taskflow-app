import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
    Sparkles,
    Bot,
    Send,
    User,
    CheckCircle2,
    Loader2,
    Key,
    FileText,
    UserCheck,
    RotateCcw
} from 'lucide-react';

export default function AICopilot({ workspaceId, currentUser, userRole = 'employee' }) {
    const userName = currentUser?.fullName || currentUser?.name || 'Employee';
    const isAdmin = userRole === 'admin';
    const isSales = userRole === 'sales';

    const [messages, setMessages] = useState([
        {
            id: 'm-1',
            sender: 'bot',
            text: `Hello ${userName}! I am your TaskFlow AI Copilot. (View Mode: **${userRole.toUpperCase()}**). How can I help with your assigned work today?`
        }
    ]);
    const [inputPrompt, setPrompt] = useState('');
    const [apiKey, setApiKey] = useState(localStorage.getItem('gemini_api_key') || '');
    const [showApiKeyInput, setShowApiKeyInput] = useState(!localStorage.getItem('gemini_api_key'));
    const [loading, setLoading] = useState(false);
    const [contextData, setContextData] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    useEffect(() => {
        if (workspaceId) loadWorkspaceContext();
    }, [workspaceId, userRole, userName]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const saveApiKey = (key) => {
        setApiKey(key);
        localStorage.setItem('gemini_api_key', key);
        setShowApiKeyInput(false);
        triggerToast('API Key saved successfully!');
    };

    // 1. Gather Context & Enforce Strict Personal Assignment Filtering
    const loadWorkspaceContext = async () => {
        try {
            const [tasksRes, ticketsRes, docsRes, dealsRes] = await Promise.all([
                supabase.from('tasks').select('*').eq('organization_id', workspaceId).limit(20),
                supabase.from('tickets').select('*').eq('workspace_id', workspaceId).limit(20),
                supabase.from('documents').select('title, category, tags').eq('workspace_id', workspaceId).limit(10),
                isAdmin || isSales
                    ? supabase.from('deals').select('*').eq('workspace_id', workspaceId).limit(10)
                    : Promise.resolve({ data: [] })
            ]);

            const rawTasks = tasksRes.data || [
                { title: 'Update landing page hero copy', status: 'in_progress', assignee: userName },
                { title: 'Prepare Q3 sprint documentation', status: 'todo', assignee: userName },
                { title: 'Fix PDF invoice printing issue', status: 'todo', assignee: 'Alex' },
                { title: 'Review Figma wireframes', status: 'completed', assignee: 'Sarah' }
            ];

            // FILTER FOR EMPLOYEES: Only keep tasks assigned to THIS current user
            const filteredTasks = isAdmin
                ? rawTasks
                : rawTasks.filter((t) =>
                    t.assignee && t.assignee.toLowerCase().includes(userName.toLowerCase())
                );

            const rawTickets = ticketsRes.data || [
                { subject: 'Need access to API keys', priority: 'medium', status: 'open', assignee: userName },
                { subject: 'Billing error on monthly tier', priority: 'high', status: 'open', assignee: 'Finance Team' }
            ];

            const filteredTickets = isAdmin
                ? rawTickets
                : rawTickets.filter((t) =>
                    t.assignee && t.assignee.toLowerCase().includes(userName.toLowerCase())
                );

            setContextData({
                userTasks: filteredTasks,
                userTickets: filteredTickets,
                docs: docsRes.data || [],
                deals: isAdmin || isSales ? (dealsRes.data || []) : []
            });
        } catch (err) {
            console.error('Error loading workspace context:', err);
        }
    };

    // 2. Query AI with Strict Privacy Guidelines
    const handleSendMessage = async (textToSend) => {
        const query = textToSend || inputPrompt;
        if (!query.trim()) return;

        const lower = query.toLowerCase();

        // Guardrail: Block non-admins from querying revenue/deals
        if ((lower.includes('deal') || lower.includes('revenue') || lower.includes('pipeline')) && !isAdmin && !isSales) {
            setMessages((prev) => [
                ...prev,
                { id: 'usr-' + Date.now(), sender: 'user', text: query },
                {
                    id: 'bot-' + Date.now(),
                    sender: 'bot',
                    text: `🔒 **Privacy Guard**: You are currently logged in as **${userName}** (${userRole.toUpperCase()}). Financial deals and sales pipelines are restricted to Sales Reps and Workspace Admins.`
                }
            ]);
            setPrompt('');
            return;
        }

        const userMessage = { id: 'usr-' + Date.now(), sender: 'user', text: query };
        setMessages((prev) => [...prev, userMessage]);
        setPrompt('');
        setLoading(true);

        const systemContext = `
You are TaskFlow AI Copilot.
Active User Name: ${userName}
Active User Role: ${userRole.toUpperCase()}

STRICT PRIVACY RULES:
1. The user is an ${userRole.toUpperCase()}.
2. You must ONLY disclose items assigned to ${userName}.
3. Do NOT reveal or list tasks or tickets assigned to other teammates (e.g., Alex, Sarah).

LIVE PERSONAL DATA FOR ${userName.toUpperCase()}:
- Assigned Tasks: ${JSON.stringify(contextData?.userTasks || [])}
- Assigned Tickets: ${JSON.stringify(contextData?.userTickets || [])}
- Available Docs: ${JSON.stringify(contextData?.docs || [])}
`;

        if (apiKey.trim()) {
            try {
                const response = await fetch(
                    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey.trim()}`,
                    {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `${systemContext}\n\nUser Question: ${query}` }] }]
                        })
                    }
                );

                const data = await response.json();
                const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (aiText) {
                    setMessages((prev) => [...prev, { id: 'bot-' + Date.now(), sender: 'bot', text: aiText }]);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error('API Error:', err);
            }
        }

        // Fallback Engine filtering exclusively by user
        setTimeout(() => {
            let responseText = '';

            if (lower.includes('task') || lower.includes('todo') || lower.includes('work') || lower.includes('summarize')) {
                const myTasks = contextData?.userTasks || [];

                if (myTasks.length === 0) {
                    responseText = `### 📋 Your Assigned Tasks (${userName})\n\nYou currently have no open tasks assigned directly to you.`;
                } else {
                    responseText = `### 📋 Your Assigned Tasks (${userName})\n\n` +
                        myTasks
                            .map((t) => `* **${t.title}**: ${t.status.replace('_', ' ').toUpperCase()}`)
                            .join('\n');
                }
            } else if (lower.includes('location') || lower.includes('address') || lower.includes('website')) {
                responseText = `Subject: Action Required: Business Location Details for Website Integration\n\nHi [Client Name],\n\nHope you are having a productive week!\n\nWe are currently setting up your business profile and location directory on your website. Could you please send over your current business address(es), operating hours, and primary contact phone number?\n\nOnce received, our team will add them directly to your live site.\n\nBest regards,\n${userName}`;
            } else {
                responseText = `I reviewed your request against tasks specifically assigned to **${userName}**.\n\nPlease let me know if you need assistance drafting an email or breaking down your next task!`;
            }

            setMessages((prev) => [...prev, { id: 'bot-' + Date.now(), sender: 'bot', text: responseText }]);
            setLoading(false);
        }, 1000);
    };

    const parseInlineBold = (text) => {
        if (!text) return null;
        const parts = text.split(/(\*\*.*?\*\*)/g);

        return parts.map((part, pIdx) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return (
                    <strong key={pIdx} className="font-extrabold text-slate-900">
                        {part.slice(2, -2)}
                    </strong>
                );
            }
            return part;
        });
    };

    const renderFormattedText = (text) => {
        if (!text) return null;
        const lines = text.split('\n');

        return (
            <div className="space-y-1.5">
                {lines.map((line, idx) => {
                    const trimmed = line.trim();

                    if (trimmed.startsWith('###')) {
                        return (
                            <h4 key={idx} className="font-black text-slate-900 text-sm mt-3 mb-1">
                                {parseInlineBold(trimmed.replace('###', '').trim())}
                            </h4>
                        );
                    }

                    if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
                        const cleanLine = trimmed.replace(/^[\*\-]\s+/, '').replace(/^\d+\.\s+/, '');
                        return (
                            <div key={idx} className="flex items-start gap-2 ml-2 my-1 text-xs text-slate-700">
                                <span className="text-purple-600 font-bold">•</span>
                                <div className="flex-1">{parseInlineBold(cleanLine)}</div>
                            </div>
                        );
                    }

                    if (!trimmed) return <div key={idx} className="h-1" />;

                    return (
                        <p key={idx} className="text-xs text-slate-800 my-0.5">
                            {parseInlineBold(line)}
                        </p>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="p-8 max-w-5xl mx-auto w-full font-sans space-y-6">
            {/* Header Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-5">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Sparkles className="w-6 h-6 text-purple-600" /> Conversational AI Copilot
                    </h1>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>User: <strong className="text-slate-800">{userName}</strong></span>
                        <span>•</span>
                        <span className="px-2 py-0.5 bg-purple-100 text-purple-800 font-extrabold rounded-md uppercase">
                            {userRole}
                        </span>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3.5 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer border border-slate-200/80"
                    >
                        <Key className="w-3.5 h-3.5 text-purple-600" /> {apiKey ? 'API Connected' : 'Connect Gemini API Key'}
                    </button>
                </div>
            </div>

            {/* API Key Drawer */}
            {showApiKeyInput && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-2xl flex items-center gap-3 text-xs">
                    <Key className="w-4 h-4 text-purple-600 shrink-0" />
                    <input
                        type="password"
                        placeholder="Paste Google Gemini API key (Free at aistudio.google.com)..."
                        value={apiKey}
                        onChange={(e) => setApiKey(e.target.value)}
                        className="flex-1 px-3 py-2 bg-white border border-purple-200 rounded-xl text-slate-900 focus:outline-none"
                    />
                    <button
                        onClick={() => saveApiKey(apiKey)}
                        className="px-4 py-2 bg-purple-600 text-white font-bold rounded-xl cursor-pointer hover:bg-purple-700 transition"
                    >
                        Save Key
                    </button>
                </div>
            )}

            {/* Quick Action Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                    onClick={() => handleSendMessage('Summarize my assigned tasks')}
                    className="px-3 py-1.5 bg-white border border-slate-200/80 hover:border-purple-300 rounded-xl text-slate-700 shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                    <UserCheck className="w-3.5 h-3.5 text-purple-600" /> Summarize My Assigned Tasks
                </button>
                <button
                    onClick={() => handleSendMessage('Write a polite email asking a client for their business locations')}
                    className="px-3 py-1.5 bg-white border border-slate-200/80 hover:border-purple-300 rounded-xl text-slate-700 shrink-0 cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                    <FileText className="w-3.5 h-3.5 text-purple-600" /> Draft Client Location Request
                </button>
            </div>

            {/* Conversational Chat Thread */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs min-h-[480px] flex flex-col justify-between space-y-4">
                <div className="space-y-4 overflow-y-auto max-h-[440px] pr-2">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            {msg.sender === 'bot' && (
                                <div className="w-8 h-8 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4" />
                                </div>
                            )}

                            <div
                                className={`max-w-xl p-4 rounded-2xl text-xs ${msg.sender === 'user'
                                    ? 'bg-purple-600 text-white font-medium rounded-tr-none'
                                    : 'bg-slate-50 border border-slate-200/80 text-slate-800 rounded-tl-none whitespace-pre-wrap'
                                    }`}
                            >
                                {msg.sender === 'bot' ? renderFormattedText(msg.text) : msg.text}
                            </div>

                            {msg.sender === 'user' && (
                                <div className="w-8 h-8 rounded-2xl bg-slate-900 text-white flex items-center justify-center shrink-0 text-xs font-bold">
                                    {userName[0]?.toUpperCase() || 'U'}
                                </div>
                            )}
                        </div>
                    ))}

                    {loading && (
                        <div className="flex gap-3 items-center text-slate-400 text-xs font-semibold pl-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                            <span>Fetching personal tasks for {userName}...</span>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <form onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }} className="relative pt-2">
                    <input
                        type="text"
                        placeholder="Ask Copilot about your assigned tasks, or draft custom emails..."
                        value={inputPrompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        className="w-full pl-4 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                    <button
                        type="submit"
                        disabled={loading || !inputPrompt.trim()}
                        className="absolute right-2 top-3.5 p-1.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white rounded-xl transition cursor-pointer"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </form>
            </div>

            {/* Toast */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">{toast.message}</span>
                </div>
            )}
        </div>
    );
}