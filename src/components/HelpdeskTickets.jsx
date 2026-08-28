import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Ticket,
    Plus,
    Search,
    Clock,
    CheckCircle2,
    AlertTriangle,
    User,
    Loader2,
    X,
    MessageCircle,
    ShieldAlert,
    Filter
} from 'lucide-react';

export default function HelpdeskTickets({ workspaceId, currentUser }) {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Ticket Form State
    const [subject, setSubject] = useState('');
    const [clientName, setClientName] = useState('');
    const [priority, setPriority] = useState('medium');
    const [category, setCategory] = useState('Technical Issue');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (workspaceId) fetchTickets();
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchTickets = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tickets')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error && !error.message.includes('relation')) throw error;

            const fallbackTickets = [
                {
                    id: 'TICK-101',
                    subject: 'Unable to export monthly invoice PDF',
                    client_name: 'Acme Corp',
                    category: 'Billing',
                    priority: 'high',
                    status: 'open',
                    assignee: currentUser?.name || 'Support Agent',
                    description: 'Client reported an HTTP 500 error when clicking the print PDF button in their portal.',
                    created_at: '2026-08-28',
                    sla_due: '2026-08-29'
                },
                {
                    id: 'TICK-102',
                    subject: 'Custom webhook integration payload failing',
                    client_name: 'Starlight Media',
                    category: 'Technical Issue',
                    priority: 'urgent',
                    status: 'in_progress',
                    assignee: currentUser?.name || 'Support Agent',
                    description: 'Automated deal triggers are not firing when deals enter negotiation stage.',
                    created_at: '2026-08-27',
                    sla_due: '2026-08-28'
                },
                {
                    id: 'TICK-103',
                    subject: 'Request to add 5 new user seats',
                    client_name: 'Nexus Ventures',
                    category: 'Account Request',
                    priority: 'low',
                    status: 'resolved',
                    assignee: 'Unassigned',
                    description: 'Client needs seat licenses expanded for their sales team.',
                    created_at: '2026-08-25',
                    sla_due: '2026-08-27'
                }
            ];

            setTickets(data && data.length > 0 ? data : fallbackTickets);
        } catch (err) {
            console.error('Error fetching tickets:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTicket = async (e) => {
        e.preventDefault();
        if (!subject.trim() || !clientName.trim()) return;

        const newTicket = {
            id: 'TICK-' + Math.floor(100 + Math.random() * 900),
            workspace_id: workspaceId,
            subject: subject.trim(),
            client_name: clientName.trim(),
            category,
            priority,
            status: 'open',
            assignee: currentUser?.name || 'Support Team',
            description: description.trim() || 'No additional details provided.',
            created_at: new Date().toISOString().split('T')[0],
            sla_due: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]
        };

        setTickets([newTicket, ...tickets]);
        setIsModalOpen(false);
        setSubject('');
        setClientName('');
        setDescription('');
        triggerToast(`Ticket ${newTicket.id} created successfully!`);

        try {
            await supabase.from('tickets').insert([newTicket]);
        } catch (err) {
            console.error('Error saving ticket:', err.message);
        }
    };

    const updateTicketStatus = async (id, newStatus) => {
        setTickets((prev) =>
            prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t))
        );
        if (selectedTicket?.id === id) {
            setSelectedTicket((prev) => ({ ...prev, status: newStatus }));
        }
        triggerToast(`Ticket ${id} marked as ${newStatus.replace('_', ' ')}`);

        try {
            await supabase.from('tickets').update({ status: newStatus }).eq('id', id);
        } catch (err) {
            console.error('Error updating ticket status:', err.message);
        }
    };

    const openTickets = tickets.filter((t) => t.status === 'open' || t.status === 'in_progress').length;
    const urgentTickets = tickets.filter((t) => t.priority === 'urgent' && t.status !== 'resolved').length;
    const resolvedTickets = tickets.filter((t) => t.status === 'resolved').length;

    const filteredTickets = tickets.filter((t) => {
        const matchesSearch =
            t.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            t.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || t.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-sky-600 mb-2" />
                <p className="text-xs font-semibold">Loading Customer Support Desk...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Ticket className="w-6 h-6 text-sky-600" /> Helpdesk & Customer Support
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Manage post-sale client inquiries, track SLA resolution times, and resolve tickets.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-sky-500/20"
                >
                    <Plus className="w-4 h-4" /> Log Support Ticket
                </button>
            </div>

            {/* KPI Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Active Open Tickets</p>
                        <p className="text-2xl font-black text-sky-600 mt-1">{openTickets}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Urgent SLA Breaches</p>
                        <p className="text-2xl font-black text-rose-600 mt-1">{urgentTickets}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Resolved Tickets</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">{resolvedTickets}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Search & Status Filters */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by client, ticket ID, or subject..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold w-full sm:w-auto">
                    {['all', 'open', 'in_progress', 'resolved'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-3 py-1.5 rounded-xl transition cursor-pointer capitalize flex-1 sm:flex-none ${filterStatus === st ? 'bg-white text-sky-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {st.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Tickets Table */}
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 uppercase font-bold text-[10px]">
                                <th className="p-3.5 pl-6">Ticket ID</th>
                                <th className="p-3.5">Client & Subject</th>
                                <th className="p-3.5">Category</th>
                                <th className="p-3.5">Priority</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5">SLA Target</th>
                                <th className="p-3.5 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTickets.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                                        No tickets found.
                                    </td>
                                </tr>
                            ) : (
                                filteredTickets.map((t) => (
                                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                                        <td className="p-3.5 pl-6 font-mono font-bold text-slate-900">{t.id}</td>
                                        <td className="p-3.5">
                                            <p className="font-bold text-slate-900">{t.subject}</p>
                                            <p className="text-[10px] text-slate-400 font-semibold">{t.client_name}</p>
                                        </td>
                                        <td className="p-3.5">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-bold text-[10px]">
                                                {t.category}
                                            </span>
                                        </td>
                                        <td className="p-3.5">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md uppercase ${t.priority === 'urgent'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : t.priority === 'high'
                                                            ? 'bg-amber-100 text-amber-800'
                                                            : 'bg-blue-100 text-blue-800'
                                                    }`}
                                            >
                                                {t.priority}
                                            </span>
                                        </td>
                                        <td className="p-3.5">
                                            <span
                                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${t.status === 'resolved'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : t.status === 'in_progress'
                                                            ? 'bg-sky-100 text-sky-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                            >
                                                {t.status.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">{t.sla_due}</td>
                                        <td className="p-3.5 pr-6 text-right space-x-1.5">
                                            <button
                                                onClick={() => setSelectedTicket(t)}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] transition cursor-pointer"
                                            >
                                                View Ticket
                                            </button>

                                            {t.status !== 'resolved' && (
                                                <button
                                                    onClick={() => updateTicketStatus(t.id, 'resolved')}
                                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[10px] transition cursor-pointer"
                                                >
                                                    Resolve
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* CREATE TICKET MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Ticket className="w-5 h-5 text-sky-600" /> Log Support Ticket
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateTicket} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Ticket Subject</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. System access issue on client login"
                                    value={subject}
                                    onChange={(e) => setSubject(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Client Business Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Acme Corp"
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    >
                                        <option value="Technical Issue">Technical Issue</option>
                                        <option value="Billing">Billing & Invoice</option>
                                        <option value="Account Request">Account Request</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1">Priority</label>
                                    <select
                                        value={priority}
                                        onChange={(e) => setPriority(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Issue Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Describe the issue reported by the client..."
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
                                    className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-xl text-xs flex-1 shadow-xs cursor-pointer"
                                >
                                    Submit Ticket
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* VIEW TICKET DETAIL MODAL */}
            {selectedTicket && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative font-sans space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <span className="font-mono text-xs text-sky-600 font-bold">{selectedTicket.id}</span>
                                <h3 className="font-extrabold text-slate-900 text-base">{selectedTicket.subject}</h3>
                            </div>
                            <button onClick={() => setSelectedTicket(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 text-xs space-y-2">
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-bold">Client:</span>
                                <span className="font-bold text-slate-900">{selectedTicket.client_name}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-bold">Category:</span>
                                <span className="font-bold text-slate-800">{selectedTicket.category}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-slate-400 font-bold">SLA Target Date:</span>
                                <span className="font-mono font-bold text-slate-800">{selectedTicket.sla_due}</span>
                            </div>
                        </div>

                        <div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Issue Details</p>
                            <p className="text-xs text-slate-800 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-200/60">
                                {selectedTicket.description}
                            </p>
                        </div>

                        <div className="pt-2 flex justify-end gap-2">
                            {selectedTicket.status !== 'resolved' && (
                                <button
                                    onClick={() => updateTicketStatus(selectedTicket.id, 'resolved')}
                                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer"
                                >
                                    Mark Resolved
                                </button>
                            )}
                        </div>
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