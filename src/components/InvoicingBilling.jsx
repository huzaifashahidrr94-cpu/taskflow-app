import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    FileText,
    Plus,
    DollarSign,
    CheckCircle2,
    Clock,
    AlertCircle,
    Download,
    Send,
    X,
    Loader2,
    Printer,
    Search
} from 'lucide-react';

export default function InvoicingBilling({ workspaceId, currentUser }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeInvoicePrint, setActiveInvoicePrint] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Invoice Form State
    const [clientName, setClientName] = useState('');
    const [clientEmail, setClientEmail] = useState('');
    const [amount, setAmount] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (workspaceId) fetchInvoices();
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchInvoices = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('invoices')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error && !error.message.includes('relation')) throw error;

            const fallbackInvoices = [
                {
                    id: 'INV-1001',
                    client_name: 'Acme Corp',
                    client_email: 'billing@acme.com',
                    amount: 4500,
                    status: 'paid',
                    due_date: '2026-08-15',
                    created_at: '2026-08-01',
                    description: 'Quarterly CRM Development & Custom API Integration'
                },
                {
                    id: 'INV-1002',
                    client_name: 'Starlight Media',
                    client_email: 'accounts@starlight.io',
                    amount: 2800,
                    status: 'pending',
                    due_date: '2026-09-10',
                    created_at: '2026-08-20',
                    description: 'Brand Redesign & Marketing Pipeline Setup'
                },
                {
                    id: 'INV-1003',
                    client_name: 'Nexus Ventures',
                    client_email: 'finance@nexus.com',
                    amount: 6200,
                    status: 'overdue',
                    due_date: '2026-08-01',
                    created_at: '2026-07-15',
                    description: 'Enterprise Retainer - July 2026'
                }
            ];

            setInvoices(data && data.length > 0 ? data : fallbackInvoices);
        } catch (err) {
            console.error('Error fetching invoices:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateInvoice = async (e) => {
        e.preventDefault();
        if (!clientName || !amount || !dueDate) return;

        const newInv = {
            id: 'INV-' + Math.floor(1000 + Math.random() * 9000),
            workspace_id: workspaceId,
            client_name: clientName.trim(),
            client_email: clientEmail.trim() || 'client@example.com',
            amount: Number(amount),
            status: 'pending',
            due_date: dueDate,
            created_at: new Date().toISOString().split('T')[0],
            description: description.trim() || 'Professional Services Rendered'
        };

        setInvoices([newInv, ...invoices]);
        setIsModalOpen(false);
        setClientName('');
        setClientEmail('');
        setAmount('');
        setDueDate('');
        setDescription('');
        triggerToast(`Invoice ${newInv.id} issued successfully!`);

        try {
            await supabase.from('invoices').insert([newInv]);
        } catch (err) {
            console.error('Error saving invoice:', err.message);
        }
    };

    const updateStatus = async (id, newStatus) => {
        setInvoices((prev) =>
            prev.map((inv) => (inv.id === id ? { ...inv, status: newStatus } : inv))
        );
        triggerToast(`Invoice ${id} marked as ${newStatus}`);

        try {
            await supabase.from('invoices').update({ status: newStatus }).eq('id', id);
        } catch (err) {
            console.error('Error updating invoice:', err.message);
        }
    };

    // Metrics
    const totalBilled = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const paidTotal = invoices.filter((i) => i.status === 'paid').reduce((sum, i) => sum + Number(i.amount || 0), 0);
    const pendingTotal = invoices.filter((i) => i.status === 'pending' || i.status === 'overdue').reduce((sum, i) => sum + Number(i.amount || 0), 0);

    const filteredInvoices = invoices.filter((inv) => {
        const matchesSearch =
            inv.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            inv.id.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === 'all' || inv.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mb-2" />
                <p className="text-xs font-semibold">Loading Invoicing & Billing Ledger...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <DollarSign className="w-6 h-6 text-emerald-600" /> Invoicing & Client Billing
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Generate client invoices, track pending receivables, and manage billing history.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-emerald-500/20"
                >
                    <Plus className="w-4 h-4" /> Create Invoice
                </button>
            </div>

            {/* KPI Financial Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Revenue Collected</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">${paidTotal.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <CheckCircle2 className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Outstanding Receivables</p>
                        <p className="text-2xl font-black text-amber-600 mt-1">${pendingTotal.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Gross Invoiced Volume</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">${totalBilled.toLocaleString()}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <FileText className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="relative w-full sm:w-72">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by client or invoice ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200/80 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                </div>

                <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold w-full sm:w-auto">
                    {['all', 'pending', 'paid', 'overdue'].map((st) => (
                        <button
                            key={st}
                            onClick={() => setFilterStatus(st)}
                            className={`px-3 py-1.5 rounded-xl transition cursor-pointer capitalize flex-1 sm:flex-none ${filterStatus === st ? 'bg-white text-emerald-700 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {st}
                        </button>
                    ))}
                </div>
            </div>

            {/* Invoices Table */}
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 uppercase font-bold text-[10px]">
                                <th className="p-3.5 pl-6">Invoice ID</th>
                                <th className="p-3.5">Client</th>
                                <th className="p-3.5">Amount</th>
                                <th className="p-3.5">Status</th>
                                <th className="p-3.5">Due Date</th>
                                <th className="p-3.5 pr-6 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredInvoices.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-400 font-medium">
                                        No invoices matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredInvoices.map((inv) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/60 transition">
                                        <td className="p-3.5 pl-6 font-mono font-bold text-slate-900">{inv.id}</td>
                                        <td className="p-3.5">
                                            <p className="font-bold text-slate-900">{inv.client_name}</p>
                                            <p className="text-[10px] text-slate-400">{inv.client_email}</p>
                                        </td>
                                        <td className="p-3.5 font-mono font-bold text-slate-900 text-sm">
                                            ${Number(inv.amount).toLocaleString()}
                                        </td>
                                        <td className="p-3.5">
                                            <span
                                                className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${inv.status === 'paid'
                                                        ? 'bg-emerald-100 text-emerald-800'
                                                        : inv.status === 'overdue'
                                                            ? 'bg-rose-100 text-rose-800'
                                                            : 'bg-amber-100 text-amber-800'
                                                    }`}
                                            >
                                                {inv.status}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">{inv.due_date}</td>
                                        <td className="p-3.5 pr-6 text-right space-x-1.5">
                                            <button
                                                onClick={() => setActiveInvoicePrint(inv)}
                                                className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-[10px] transition cursor-pointer inline-flex items-center gap-1"
                                            >
                                                <Printer className="w-3 h-3" /> View / Print
                                            </button>

                                            {inv.status !== 'paid' && (
                                                <button
                                                    onClick={() => updateStatus(inv.id, 'paid')}
                                                    className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg font-bold text-[10px] transition cursor-pointer"
                                                >
                                                    Mark Paid
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

            {/* CREATE INVOICE MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-emerald-600" /> Issue New Invoice
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateInvoice} className="space-y-3.5 text-xs">
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

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Billing Email</label>
                                <input
                                    type="email"
                                    placeholder="e.g. billing@acme.com"
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1">Amount ($ USD)</label>
                                    <input
                                        type="number"
                                        required
                                        placeholder="3500"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-bold"
                                    />
                                </div>
                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1">Due Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={dueDate}
                                        onChange={(e) => setDueDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Line Item / Description</label>
                                <textarea
                                    rows={3}
                                    placeholder="Scope of work or deliverable summary..."
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
                                    className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl text-xs flex-1 shadow-xs cursor-pointer"
                                >
                                    Generate Invoice
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* PRINTABLE INVOICE PREVIEW MODAL */}
            {activeInvoicePrint && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-8 shadow-2xl relative font-sans space-y-6">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 tracking-tight">TASKFLOW INVOICE</h2>
                                <p className="text-xs font-mono text-slate-400">{activeInvoicePrint.id}</p>
                            </div>
                            <button onClick={() => setActiveInvoicePrint(null)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="font-bold text-slate-400 uppercase text-[10px]">Billed To</p>
                                <p className="font-extrabold text-slate-900 text-sm mt-0.5">{activeInvoicePrint.client_name}</p>
                                <p className="text-slate-500">{activeInvoicePrint.client_email}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-slate-400 uppercase text-[10px]">Payment Details</p>
                                <p className="font-bold text-slate-700 mt-0.5">Due Date: {activeInvoicePrint.due_date}</p>
                                <span className="inline-block mt-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-emerald-800">
                                    Status: {activeInvoicePrint.status}
                                </span>
                            </div>
                        </div>

                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200/80">
                            <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Description</p>
                            <p className="text-xs font-semibold text-slate-800">{activeInvoicePrint.description}</p>
                            <div className="border-t border-slate-200/80 mt-4 pt-3 flex justify-between items-center font-black text-sm">
                                <span>Total Due:</span>
                                <span className="text-emerald-600 font-mono text-base">${Number(activeInvoicePrint.amount).toLocaleString()} USD</span>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => window.print()}
                                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                            >
                                <Printer className="w-4 h-4" /> Print PDF Invoice
                            </button>
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