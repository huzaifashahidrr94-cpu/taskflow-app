import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Zap,
    Plus,
    Play,
    CheckCircle2,
    AlertCircle,
    ArrowRight,
    TrendingUp,
    MessageSquare,
    CheckSquare,
    Sparkles,
    ToggleLeft,
    ToggleRight,
    X,
    Loader2,
    Trash2
} from 'lucide-react';

const TRIGGER_OPTIONS = [
    { id: 'deal_won', label: 'When Deal is moved to "Closed Won"', icon: TrendingUp, color: 'text-emerald-600 bg-emerald-50' },
    { id: 'high_priority_task', label: 'When High Priority Task is created', icon: CheckSquare, color: 'text-rose-600 bg-rose-50' },
    { id: 'new_lead_added', label: 'When a new Contact or Lead is added', icon: Sparkles, color: 'text-blue-600 bg-blue-50' }
];

const ACTION_OPTIONS = [
    { id: 'send_chat_alert', label: 'Post automated notification in #general Team Chat', icon: MessageSquare },
    { id: 'create_onboarding_task', label: 'Auto-generate "Client Onboarding" task', icon: CheckSquare },
    { id: 'update_contact_status', label: 'Flag Contact status as "VIP Client"', icon: Sparkles }
];

export default function WorkflowAutomation({ workspaceId }) {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // New Workflow Form
    const [title, setTitle] = useState('');
    const [trigger, setTrigger] = useState('deal_won');
    const [action, setAction] = useState('send_chat_alert');
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        if (workspaceId) fetchWorkflows();
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchWorkflows = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('workflows')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error && !error.message.includes('relation')) throw error;

            // Fallback demo workflows if table is fresh
            setWorkflows(
                data || [
                    {
                        id: 'wf-1',
                        title: 'Auto-Notify Team on Big Sales Win',
                        trigger: 'deal_won',
                        action: 'send_chat_alert',
                        is_active: true,
                        runs_count: 14
                    },
                    {
                        id: 'wf-2',
                        title: 'Create Client Onboarding Task',
                        trigger: 'deal_won',
                        action: 'create_onboarding_task',
                        is_active: true,
                        runs_count: 8
                    }
                ]
            );
        } catch (err) {
            console.error('Error fetching workflows:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateWorkflow = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newWf = {
            id: 'wf-' + Date.now(),
            workspace_id: workspaceId,
            title: title.trim(),
            trigger,
            action,
            is_active: true,
            runs_count: 0
        };

        setWorkflows([newWf, ...workflows]);
        setIsModalOpen(false);
        setTitle('');
        triggerToast(`Automation "${newWf.title}" is now active!`);

        try {
            await supabase.from('workflows').insert([newWf]);
        } catch (err) {
            console.error('Error saving workflow:', err.message);
        }
    };

    const toggleWorkflow = async (id, currentStatus) => {
        setWorkflows((prev) =>
            prev.map((w) => (w.id === id ? { ...w, is_active: !currentStatus } : w))
        );

        try {
            await supabase.from('workflows').update({ is_active: !currentStatus }).eq('id', id);
        } catch (err) {
            console.error('Error toggling workflow:', err.message);
        }
    };

    const deleteWorkflow = async (id) => {
        setWorkflows((prev) => prev.filter((w) => w.id !== id));
        triggerToast('Automation rule removed.');

        try {
            await supabase.from('workflows').delete().eq('id', id);
        } catch (err) {
            console.error('Error deleting workflow:', err.message);
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-semibold">Loading automation engine...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Zap className="w-6 h-6 text-amber-500 fill-amber-500" /> Visual Workflow Automations
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Build custom "If This, Then That" triggers to automate deals, chat alerts, and task handoffs.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" /> Create New Rule
                </button>
            </div>

            {/* Rules List */}
            <div className="space-y-4">
                {workflows.map((wf) => {
                    const trigObj = TRIGGER_OPTIONS.find((t) => t.id === wf.trigger) || TRIGGER_OPTIONS[0];
                    const actObj = ACTION_OPTIONS.find((a) => a.id === wf.action) || ACTION_OPTIONS[0];
                    const TrigIcon = trigObj.icon;
                    const ActIcon = actObj.icon;

                    return (
                        <div
                            key={wf.id}
                            className={`bg-white border rounded-3xl p-5 shadow-xs transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${wf.is_active ? 'border-slate-200/80' : 'border-slate-200 opacity-60 bg-slate-50/50'
                                }`}
                        >
                            <div className="flex items-start md:items-center gap-4 min-w-0 flex-1">
                                <button
                                    onClick={() => toggleWorkflow(wf.id, wf.is_active)}
                                    className="mt-1 md:mt-0 text-slate-400 hover:text-blue-600 transition cursor-pointer shrink-0"
                                    title={wf.is_active ? 'Pause Rule' : 'Activate Rule'}
                                >
                                    {wf.is_active ? (
                                        <ToggleRight className="w-8 h-8 text-blue-600" />
                                    ) : (
                                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                                    )}
                                </button>

                                <div className="space-y-2 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-extrabold text-slate-900 text-sm truncate">{wf.title}</h3>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
                                            Executed {wf.runs_count} times
                                        </span>
                                    </div>

                                    {/* Flow Connection Visual */}
                                    <div className="flex items-center gap-2 text-xs flex-wrap">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold ${trigObj.color}`}>
                                            <TrigIcon className="w-3.5 h-3.5" />
                                            {trigObj.label}
                                        </span>

                                        <ArrowRight className="w-4 h-4 text-slate-300 shrink-0" />

                                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl font-bold bg-slate-100 text-slate-700">
                                            <ActIcon className="w-3.5 h-3.5 text-blue-600" />
                                            {actObj.label}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <button
                                onClick={() => deleteWorkflow(wf.id)}
                                className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0 self-end md:self-center"
                                title="Delete Automation"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* MODAL: Rule Builder */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Zap className="w-5 h-5 text-amber-500 fill-amber-500" /> New Automation Rule
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateWorkflow} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Rule Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Notify Team on Deal Win"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">IF (Trigger Event)</label>
                                <select
                                    value={trigger}
                                    onChange={(e) => setTrigger(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none"
                                >
                                    {TRIGGER_OPTIONS.map((t) => (
                                        <option key={t.id} value={t.id}>{t.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">THEN (Automated Action)</label>
                                <select
                                    value={action}
                                    onChange={(e) => setAction(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none"
                                >
                                    {ACTION_OPTIONS.map((a) => (
                                        <option key={a.id} value={a.id}>{a.label}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex-1 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex-1 shadow-xs cursor-pointer"
                                >
                                    Activate Rule
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 transition-all duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">{toast.message}</span>
                </div>
            )}
        </div>
    );
}