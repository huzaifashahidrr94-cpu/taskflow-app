import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    DollarSign,
    Plus,
    Calendar,
    User,
    Mail,
    FileText,
    X,
    Loader2,
    Trash2,
    TrendingUp,
    MessageSquare,
    AlertCircle,
    CheckCircle2
} from 'lucide-react';

const STAGES = [
    { id: 'lead', name: 'Lead Qualified', color: 'border-[#4F46E5] text-[#4F46E5] bg-[#EEF2FF]' },
    { id: 'proposal', name: 'Proposal Sent', color: 'border-amber-400 text-amber-700 bg-amber-50' },
    { id: 'negotiation', name: 'In Negotiation', color: 'border-violet-400 text-violet-700 bg-violet-50' },
    { id: 'won', name: 'Closed Won', color: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
    { id: 'lost', name: 'Closed Lost', color: 'border-rose-400 text-rose-700 bg-rose-50' }
];

export default function DealsKanban({ workspaceId }) {
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedDeal, setSelectedDeal] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        if (workspaceId) {
            fetchDeals();

            // Real-Time Supabase WebSocket Channel Listener
            const channel = supabase
                .channel(`deals_kanban_realtime_${workspaceId}`)
                .on(
                    'postgres_changes',
                    {
                        event: '*',
                        schema: 'public',
                        table: 'deals',
                        filter: `workspace_id=eq.${workspaceId}`
                    },
                    () => {
                        fetchDeals();
                        window.dispatchEvent(new Event('taskflow_badge_update'));
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3500);
    };

    const fetchDeals = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('deals')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setDeals(data || []);
        } catch (err) {
            console.error('Error fetching deals:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStageChange = async (dealId, newStage) => {
        setDeals(prev => prev.map(d => d.id === dealId ? { ...d, stage: newStage } : d));
        try {
            const { error } = await supabase.from('deals').update({ stage: newStage }).eq('id', dealId);
            if (error) throw error;
            window.dispatchEvent(new Event('taskflow_badge_update'));
        } catch (err) {
            console.error('Error updating stage:', err.message);
            fetchDeals();
        }
    };

    const handleDeleteDeal = async (id) => {
        setDeals(prev => prev.filter(d => d.id !== id));
        setIsModalOpen(false);
        try {
            const { error } = await supabase.from('deals').delete().eq('id', id);
            if (error) throw error;
            triggerToast("Deal removed successfully");
            window.dispatchEvent(new Event('taskflow_badge_update'));
        } catch (err) {
            console.error('Error deleting deal:', err.message);
            fetchDeals();
        }
    };

    const handleLaunchWarRoom = async (deal) => {
        const channelName = `deal-${deal.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

        try {
            const { data: channelData, error: channelErr } = await supabase
                .from('channels')
                .insert([{
                    workspace_id: workspaceId,
                    name: channelName,
                    is_private: true,
                    deal_id: deal.id,
                    allowed_roles: ['admin', 'sales', 'employee']
                }])
                .select()
                .single();

            if (channelErr && !channelErr.message.includes('unique')) throw channelErr;

            const briefingContent = `🚨 **DEAL WAR ROOM LAUNCHED** 🚨\n\n` +
                `**Deal Title:** ${deal.title}\n` +
                `**Target Revenue:** $${Number(deal.value || 0).toLocaleString()}\n` +
                `**Client Contact:** ${deal.contact_name || 'N/A'} (${deal.contact_email || 'No email'})\n` +
                `**Target Close Date:** ${deal.target_close_date || 'Unspecified'}\n\n` +
                `*Let's coordinate strategy here to close this contract!*`;

            await supabase.from('messages').insert([{
                workspace_id: workspaceId,
                channel: channelName,
                sender_name: 'CRM System Bot',
                sender_role: 'system',
                content: briefingContent
            }]);

            triggerToast(`War Room #${channelName} created in Team Chat!`);
            window.dispatchEvent(new Event('taskflow_badge_update'));
            setIsModalOpen(false);
        } catch (err) {
            console.error('Error launching war room:', err.message);
            triggerToast("War room launched!");
            setIsModalOpen(false);
        }
    };

    const totalPipeline = deals.filter(d => d.stage !== 'lost').reduce((acc, curr) => acc + Number(curr.value || 0), 0);
    const closedWon = deals.filter(d => d.stage === 'won').reduce((acc, curr) => acc + Number(curr.value || 0), 0);
    const winRate = deals.length > 0 ? Math.round((deals.filter(d => d.stage === 'won').length / deals.length) * 100) : 0;

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans bg-[#FAFAF9]">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#18181B] tracking-tight flex items-center gap-2">
                        <TrendingUp className="w-6 h-6 text-[#4F46E5]" /> Sales CRM Pipeline
                    </h1>
                    <p className="text-[#71717A] text-sm mt-0.5">Track deal stages, expected revenue, and launch dedicated chat war rooms.</p>
                </div>

                <button
                    onClick={() => {
                        setSelectedDeal(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold px-4 py-2.5 rounded-[8px] text-xs transition flex items-center gap-2 shadow-sm cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Add New Deal
                </button>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm">
                    <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-[0.05em]">Active Pipeline</span>
                    <p className="text-3xl font-extrabold text-[#18181B] mt-2 tabular-nums">${totalPipeline.toLocaleString()}</p>
                </div>

                <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm">
                    <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-[0.05em]">Closed Won Revenue</span>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-2 tabular-nums">${closedWon.toLocaleString()}</p>
                </div>

                <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm">
                    <span className="text-[11px] font-semibold text-[#71717A] uppercase tracking-[0.05em]">Win Conversion Rate</span>
                    <p className="text-3xl font-extrabold text-[#4F46E5] mt-2 tabular-nums">{winRate}%</p>
                </div>
            </div>

            {/* Kanban Board Columns */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto pb-4">
                {STAGES.map((stage) => {
                    const stageDeals = deals.filter(d => d.stage === stage.id);
                    const stageSum = stageDeals.reduce((acc, curr) => acc + Number(curr.value || 0), 0);

                    return (
                        <div key={stage.id} className="bg-white border border-[#E4E4E7] rounded-[12px] p-3 flex flex-col min-w-[220px]">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border tracking-[0.05em] uppercase ${stage.color}`}>
                                    {stage.name} ({stageDeals.length})
                                </span>
                                <span className="text-[11px] font-extrabold text-[#71717A] tabular-nums">${stageSum.toLocaleString()}</span>
                            </div>

                            <div className="flex-1 space-y-3">
                                {stageDeals.map((deal) => (
                                    <div
                                        key={deal.id}
                                        onClick={() => {
                                            setSelectedDeal(deal);
                                            setIsModalOpen(true);
                                        }}
                                        className="bg-[#FAFAF9] p-4 rounded-[12px] border border-[#E4E4E7] hover:shadow-md transition cursor-pointer group"
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-bold text-[#18181B] text-xs group-hover:text-[#4F46E5] transition">{deal.title}</h4>
                                            <span className="font-extrabold text-emerald-600 text-xs shrink-0 tabular-nums">${Number(deal.value || 0).toLocaleString()}</span>
                                        </div>

                                        {deal.contact_name && (
                                            <p className="text-[11px] text-[#71717A] flex items-center gap-1 mb-1">
                                                <User className="w-3 h-3 text-[#71717A]" /> {deal.contact_name}
                                            </p>
                                        )}

                                        <div className="mt-3 pt-2 border-t border-[#E4E4E7] flex items-center justify-between">
                                            <select
                                                value={deal.stage}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => handleStageChange(deal.id, e.target.value)}
                                                className="text-[10px] font-bold text-[#18181B] bg-white border border-[#E4E4E7] rounded-[8px] px-2 py-1 outline-none cursor-pointer"
                                            >
                                                {STAGES.map(s => (
                                                    <option key={s.id} value={s.id}>{s.name}</option>
                                                ))}
                                            </select>

                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleLaunchWarRoom(deal);
                                                }}
                                                className="p-1 hover:bg-[#EEF2FF] text-[#4F46E5] rounded-[8px] transition cursor-pointer"
                                                title="Launch Chat War Room"
                                            >
                                                <MessageSquare className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Add / Edit Modal */}
            {isModalOpen && (
                <DealModal
                    workspaceId={workspaceId}
                    deal={selectedDeal}
                    onClose={() => setIsModalOpen(false)}
                    onDelete={handleDeleteDeal}
                    onLaunchWarRoom={handleLaunchWarRoom}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchDeals();
                        window.dispatchEvent(new Event('taskflow_badge_update'));
                    }}
                />
            )}

            {/* Floating Success Toast */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700 transition-all duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">{toast.message}</span>
                </div>
            )}

        </div>
    );
}

function DealModal({ workspaceId, deal, onClose, onDelete, onLaunchWarRoom, onSuccess }) {
    const [title, setTitle] = useState(deal?.title || '');
    const [value, setValue] = useState(deal?.value || '');
    const [stage, setStage] = useState(deal?.stage || 'lead');
    const [contactName, setContactName] = useState(deal?.contact_name || '');
    const [contactEmail, setContactEmail] = useState(deal?.contact_email || '');
    const [targetCloseDate, setTargetCloseDate] = useState(deal?.target_close_date || '');
    const [notes, setNotes] = useState(deal?.notes || '');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!workspaceId) {
            setError('Workspace ID is missing. Try re-selecting your active workspace.');
            setLoading(false);
            return;
        }

        const payload = {
            workspace_id: workspaceId,
            title: title.trim(),
            value: Number(value) || 0,
            stage,
            contact_name: contactName.trim() || null,
            contact_email: contactEmail.trim() || null,
            target_close_date: targetCloseDate || null,
            notes: notes.trim() || null
        };

        try {
            if (deal?.id) {
                const { error: updateErr } = await supabase.from('deals').update(payload).eq('id', deal.id);
                if (updateErr) throw updateErr;
            } else {
                const { error: insertErr } = await supabase.from('deals').insert([payload]);
                if (insertErr) throw insertErr;
            }
            onSuccess();
        } catch (err) {
            console.error('Error saving deal:', err);
            setError(`Failed to save deal: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm font-sans">
            <div className="bg-white border border-[#E4E4E7] rounded-[12px] w-full max-w-md p-6 shadow-2xl relative">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-[#18181B] flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-[#4F46E5]" />
                        {deal ? 'Edit Deal Opportunity' : 'Add New Commercial Deal'}
                    </h3>
                    <button onClick={onClose} className="text-[#71717A] hover:text-[#18181B] cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {error && (
                    <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-[8px] flex items-center gap-2 text-xs text-rose-600 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Deal Title</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Acme Corp Website Redesign"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Target Revenue ($)</label>
                            <input
                                type="number"
                                required
                                placeholder="15000"
                                value={value}
                                onChange={e => setValue(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Pipeline Stage</label>
                            <select
                                value={stage}
                                onChange={e => setStage(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-bold focus:outline-none cursor-pointer"
                            >
                                {STAGES.map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Contact Name</label>
                            <input
                                type="text"
                                placeholder="John Smith"
                                value={contactName}
                                onChange={e => setContactName(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Target Close Date</label>
                            <input
                                type="date"
                                value={targetCloseDate}
                                onChange={e => setTargetCloseDate(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Deal Notes</label>
                        <textarea
                            rows="2"
                            placeholder="Log requirements, key decision makers..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-3 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20 resize-none"
                        />
                    </div>

                    {deal && (
                        <button
                            type="button"
                            onClick={() => onLaunchWarRoom(deal)}
                            className="w-full py-2.5 px-4 bg-[#EEF2FF] border border-[#C7D2FE] text-[#4F46E5] font-extrabold rounded-[8px] text-xs flex items-center justify-center gap-2 hover:bg-[#E0E7FF] transition cursor-pointer"
                        >
                            <MessageSquare className="w-4 h-4" /> Launch Chat War Room
                        </button>
                    )}

                    <div className="pt-2 flex gap-3">
                        {deal && (
                            <button
                                type="button"
                                onClick={() => onDelete(deal.id)}
                                className="py-2.5 px-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-[8px] text-xs transition cursor-pointer"
                            >
                                Delete
                            </button>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] font-semibold rounded-[8px] text-xs transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[8px] text-xs flex justify-center items-center gap-2 transition cursor-pointer shadow-sm"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {deal ? 'Update Deal' : 'Create Deal'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}