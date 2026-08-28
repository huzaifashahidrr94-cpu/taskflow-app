import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    FormInput,
    Plus,
    CheckCircle2,
    Copy,
    ExternalLink,
    Eye,
    Loader2,
    Trash2,
    X,
    Sparkles,
    Share2,
    Send,
    Check,
    Tag
} from 'lucide-react';

export default function FormsBuilder({ workspaceId, currentUser }) {
    const [forms, setForms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [previewForm, setPreviewForm] = useState(null);
    const [copiedId, setCopiedId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    // New Form Builder State
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [targetType, setTargetType] = useState('lead'); // 'lead', 'task', 'ticket'

    // Submission Simulation Form State
    const [simName, setSimName] = useState('');
    const [simEmail, setSimEmail] = useState('');
    const [simMessage, setSimMessage] = useState('');

    useEffect(() => {
        if (workspaceId) fetchForms();
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchForms = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('forms')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error && !error.message.includes('relation')) throw error;

            const fallbackForms = [
                {
                    id: 'form-101',
                    title: '🌐 Website Lead Qualification Form',
                    description: 'Embedded on landing page to capture high-intent enterprise prospects.',
                    target_type: 'lead',
                    submissions_count: 24,
                    created_at: '2026-08-10'
                },
                {
                    id: 'form-102',
                    title: '🛠️ Client Feature Request & Bug Report',
                    description: 'Public intake form for existing clients to submit support tickets.',
                    target_type: 'ticket',
                    submissions_count: 11,
                    created_at: '2026-08-18'
                }
            ];

            setForms(data && data.length > 0 ? data : fallbackForms);
        } catch (err) {
            console.error('Error fetching forms:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateForm = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newForm = {
            id: 'form-' + Math.floor(100 + Math.random() * 900),
            workspace_id: workspaceId,
            title: title.trim(),
            description: description.trim() || 'Public intake form',
            target_type: targetType,
            submissions_count: 0,
            created_at: new Date().toISOString().split('T')[0]
        };

        setForms([newForm, ...forms]);
        setIsModalOpen(false);
        setTitle('');
        setDescription('');
        triggerToast(`Intake form "${newForm.title}" published!`);

        try {
            await supabase.from('forms').insert([newForm]);
        } catch (err) {
            console.error('Error saving form:', err.message);
        }
    };

    const handleCopyLink = (id) => {
        const url = `${window.location.origin}/form/${id}`;
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        triggerToast('Public URL copied to clipboard!');
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleDeleteForm = async (id) => {
        setForms((prev) => prev.filter((f) => f.id !== id));
        triggerToast('Form deleted.');

        try {
            await supabase.from('forms').delete().eq('id', id);
        } catch (err) {
            console.error('Error deleting form:', err.message);
        }
    };

    const handleTestSubmit = (e) => {
        e.preventDefault();
        if (!simName.trim() || !simEmail.trim()) return;

        // Increment submission count
        setForms((prev) =>
            prev.map((f) =>
                f.id === previewForm.id ? { ...f, submissions_count: f.submissions_count + 1 } : f
            )
        );

        const destinationLabel =
            previewForm.target_type === 'lead'
                ? 'Contacts & Leads Directory'
                : previewForm.target_type === 'ticket'
                    ? 'Helpdesk Support Queue'
                    : 'Company Tasks';

        triggerToast(`Submission received! Record auto-created in ${destinationLabel}.`);
        setSimName('');
        setSimEmail('');
        setSimMessage('');
        setPreviewForm(null);
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs font-semibold">Loading Public Forms Builder...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <FormInput className="w-6 h-6 text-indigo-600" /> Public Intake Forms
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Build web forms to automatically convert client submissions into CRM Leads, Tasks, or Support Tickets.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-indigo-500/20"
                >
                    <Plus className="w-4 h-4" /> Create New Form
                </button>
            </div>

            {/* Form Roster Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {forms.map((f) => (
                    <div
                        key={f.id}
                        className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-slate-300 transition"
                    >
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span
                                    className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md uppercase ${f.target_type === 'lead'
                                            ? 'bg-blue-100 text-blue-800'
                                            : f.target_type === 'ticket'
                                                ? 'bg-sky-100 text-sky-800'
                                                : 'bg-emerald-100 text-emerald-800'
                                        }`}
                                >
                                    Auto-Creates: {f.target_type.toUpperCase()}
                                </span>
                                <span className="text-xs text-slate-400 font-bold">{f.submissions_count} Submissions</span>
                            </div>

                            <h3 className="font-extrabold text-slate-900 text-base">{f.title}</h3>
                            <p className="text-xs text-slate-500">{f.description}</p>
                        </div>

                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setPreviewForm(f)}
                                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                                >
                                    <Eye className="w-3.5 h-3.5" /> Preview Form
                                </button>

                                <button
                                    onClick={() => handleCopyLink(f.id)}
                                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5"
                                >
                                    {copiedId === f.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                                    {copiedId === f.id ? 'Copied' : 'Share URL'}
                                </button>
                            </div>

                            <button
                                onClick={() => handleDeleteForm(f.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {/* CREATE FORM MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <FormInput className="w-5 h-5 text-indigo-600" /> Build Intake Form
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateForm} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Form Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Client Feedback & Bug Report"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Target Action on Submission</label>
                                <select
                                    value={targetType}
                                    onChange={(e) => setTargetType(e.target.value)}
                                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                                >
                                    <option value="lead">Auto-create new Lead in Contacts Directory</option>
                                    <option value="task">Auto-create new Task in Company Tasks</option>
                                    <option value="ticket">Auto-create Support Ticket in Helpdesk</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Sub-heading / Instructions</label>
                                <textarea
                                    rows={3}
                                    placeholder="Instructions displayed to clients at the top of the form..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                                />
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
                                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl text-xs flex-1 shadow-xs cursor-pointer"
                                >
                                    Publish Form
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* FORM PREVIEW / SIMULATION MODAL */}
            {previewForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative font-sans space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <span className="text-[10px] font-extrabold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md uppercase">
                                Public Form Live Preview
                            </span>
                            <button onClick={() => setPreviewForm(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-1">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">{previewForm.title}</h2>
                            <p className="text-xs text-slate-500">{previewForm.description}</p>
                        </div>

                        <form onSubmit={handleTestSubmit} className="space-y-3.5 text-xs bg-slate-50 p-5 rounded-2xl border border-slate-200/80">
                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Your Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Sarah Connor"
                                    value={simName}
                                    onChange={(e) => setSimName(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="sarah@example.com"
                                    value={simEmail}
                                    onChange={(e) => setSimEmail(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-700 mb-1">Request Details / Message</label>
                                <textarea
                                    rows={3}
                                    required
                                    placeholder="Describe your request..."
                                    value={simMessage}
                                    onChange={(e) => setSimMessage(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl font-medium"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-indigo-500/20"
                            >
                                <Send className="w-3.5 h-3.5" /> Submit Intake Form
                            </button>
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