import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Search,
    Plus,
    MapPin,
    Wrench,
    Phone,
    Mail,
    FileText,
    X,
    Loader2,
    Trash2,
    Edit2,
    Building2,
    Filter
} from 'lucide-react';

export default function ContactsDirectory({ workspaceId }) {
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingContact, setEditingContact] = useState(null);

    useEffect(() => {
        if (workspaceId) fetchContacts();
    }, [workspaceId]);

    const fetchContacts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('contacts')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setContacts(data || []);
        } catch (err) {
            console.error('Error fetching contacts:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id) => {
        setContacts(prev => prev.filter(c => c.id !== id));
        try {
            const { error } = await supabase.from('contacts').delete().eq('id', id);
            if (error) throw error;
        } catch (err) {
            console.error('Error deleting contact:', err.message);
            fetchContacts();
        }
    };

    // Search & Filter Logic
    const filteredContacts = contacts.filter(c => {
        const matchesSearch =
            c.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.service_requested?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.phone?.includes(searchTerm);

        const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans">

            {/* Header & Main Trigger */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Users className="w-6 h-6 text-blue-600" /> Contacts & Leads Directory
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">Track prospective clients, requested services, cities, and interaction notes.</p>
                </div>

                <button
                    onClick={() => {
                        setEditingContact(null);
                        setIsModalOpen(true);
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                    <Plus className="w-4 h-4" /> Add New Lead
                </button>
            </div>

            {/* Overview Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Leads & Clients</span>
                    <p className="text-3xl font-extrabold text-slate-900 mt-2">{contacts.length}</p>
                    <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/60">
                        Directory Database
                    </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Inquiries</span>
                    <p className="text-3xl font-extrabold text-amber-600 mt-2">
                        {contacts.filter(c => c.status === 'lead' || c.status === 'contacted').length}
                    </p>
                    <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200/60">
                        Pending Conversion
                    </span>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Services Requested</span>
                    <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                        {new Set(contacts.map(c => c.service_requested).filter(Boolean)).size}
                    </p>
                    <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                        Unique Categories
                    </span>
                </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-white p-4 border border-slate-200/80 rounded-2xl shadow-2xs">
                <div className="relative flex-1 w-full">
                    <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search by lead name, city, service, or phone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer w-full sm:w-auto"
                    >
                        <option value="all">All Statuses</option>
                        <option value="lead">New Lead</option>
                        <option value="contacted">Contacted</option>
                        <option value="qualified">Qualified</option>
                        <option value="customer">Customer</option>
                        <option value="lost">Lost</option>
                    </select>
                </div>
            </div>

            {/* Contacts Table */}
            <div className="bg-white border border-slate-200/70 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 uppercase tracking-wider text-[11px] font-semibold">
                                <th className="px-6 py-3.5">Lead Name</th>
                                <th className="px-6 py-3.5">Service Requested</th>
                                <th className="px-6 py-3.5">City / Location</th>
                                <th className="px-6 py-3.5">Contact Info</th>
                                <th className="px-6 py-3.5">Status</th>
                                <th className="px-6 py-3.5">Notes</th>
                                <th className="px-4 py-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs">
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-12 text-center text-slate-400">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                        Loading contacts directory...
                                    </td>
                                </tr>
                            ) : filteredContacts.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-16 text-center text-slate-400">
                                        <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                                        <p className="font-semibold text-slate-700">No leads found</p>
                                        <p className="text-[11px]">Add a contact or adjust your search term.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredContacts.map((contact) => (
                                    <tr key={contact.id} className="hover:bg-slate-50/60 transition group">
                                        {/* Lead Name */}
                                        <td className="px-6 py-4 font-bold text-slate-900">{contact.name}</td>

                                        {/* Service Requested */}
                                        <td className="px-6 py-4">
                                            {contact.service_requested ? (
                                                <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full font-bold">
                                                    <Wrench className="w-3 h-3 text-blue-500" /> {contact.service_requested}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400 font-normal">Not specified</span>
                                            )}
                                        </td>

                                        {/* City */}
                                        <td className="px-6 py-4">
                                            {contact.city ? (
                                                <span className="inline-flex items-center gap-1 text-slate-700 font-semibold">
                                                    <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" /> {contact.city}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">No city</span>
                                            )}
                                        </td>

                                        {/* Phone & Email */}
                                        <td className="px-6 py-4 space-y-1">
                                            {contact.phone && (
                                                <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                                                    <Phone className="w-3 h-3 text-slate-400" /> {contact.phone}
                                                </div>
                                            )}
                                            {contact.email && (
                                                <div className="flex items-center gap-1.5 text-slate-500">
                                                    <Mail className="w-3 h-3 text-slate-400" /> {contact.email}
                                                </div>
                                            )}
                                        </td>

                                        {/* Status Badge */}
                                        <td className="px-6 py-4">
                                            <span className={`px-2.5 py-1 rounded-full font-bold border capitalize ${contact.status === 'customer' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                                                    contact.status === 'qualified' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                                                        contact.status === 'contacted' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                            contact.status === 'lost' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                'bg-blue-50 text-blue-600 border-blue-200'
                                                }`}>
                                                {contact.status || 'lead'}
                                            </span>
                                        </td>

                                        {/* Interaction Notes */}
                                        <td className="px-6 py-4 max-w-xs">
                                            {contact.notes ? (
                                                <p className="text-slate-600 line-clamp-2 italic text-[11px] bg-slate-50 p-2 rounded-lg border border-slate-200/60">
                                                    "{contact.notes}"
                                                </p>
                                            ) : (
                                                <span className="text-slate-300">No notes added</span>
                                            )}
                                        </td>

                                        {/* Actions */}
                                        <td className="px-4 py-4 text-right space-x-1">
                                            <button
                                                onClick={() => {
                                                    setEditingContact(contact);
                                                    setIsModalOpen(true);
                                                }}
                                                className="text-slate-400 hover:text-blue-600 p-1.5 rounded-lg hover:bg-blue-50 transition cursor-pointer"
                                                title="Edit Contact"
                                            >
                                                <Edit2 className="w-3.5 h-3.5" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(contact.id)}
                                                className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                                title="Delete Contact"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Add / Edit Contact Modal */}
            {isModalOpen && (
                <ContactFormModal
                    workspaceId={workspaceId}
                    contact={editingContact}
                    onClose={() => setIsModalOpen(false)}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        fetchContacts();
                    }}
                />
            )}

        </div>
    );
}

function ContactFormModal({ workspaceId, contact, onClose, onSuccess }) {
    const [name, setName] = useState(contact?.name || '');
    const [email, setEmail] = useState(contact?.email || '');
    const [phone, setPhone] = useState(contact?.phone || '');
    const [city, setCity] = useState(contact?.city || '');
    const [serviceRequested, setServiceRequested] = useState(contact?.service_requested || '');
    const [status, setStatus] = useState(contact?.status || 'lead');
    const [notes, setNotes] = useState(contact?.notes || '');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            workspace_id: workspaceId,
            name,
            email: email || null,
            phone: phone || null,
            city: city || null,
            service_requested: serviceRequested || null,
            status,
            notes: notes || null
        };

        try {
            if (contact?.id) {
                const { error } = await supabase.from('contacts').update(payload).eq('id', contact.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('contacts').insert([payload]);
                if (error) throw error;
            }
            onSuccess();
        } catch (err) {
            console.error('Error saving contact:', err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl relative p-6 font-sans">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        {contact ? 'Edit Lead Profile' : 'Add New Lead'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
                    <div>
                        <label className="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. John Doe"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Service Wanted</label>
                            <input
                                type="text"
                                placeholder="e.g. SEO, Web Design"
                                value={serviceRequested}
                                onChange={e => setServiceRequested(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-600 uppercase tracking-wider mb-1">City / Location</label>
                            <input
                                type="text"
                                placeholder="e.g. Edison, NJ"
                                value={city}
                                onChange={e => setCity(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Phone Number</label>
                            <input
                                type="text"
                                placeholder="+1 (555) 000-0000"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>

                        <div>
                            <label className="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Email</label>
                            <input
                                type="email"
                                placeholder="john@example.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Lead Status</label>
                        <select
                            value={status}
                            onChange={e => setStatus(e.target.value)}
                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                        >
                            <option value="lead">New Lead</option>
                            <option value="contacted">Contacted</option>
                            <option value="qualified">Qualified</option>
                            <option value="customer">Customer</option>
                            <option value="lost">Lost</option>
                        </select>
                    </div>

                    <div>
                        <label className="block font-semibold text-slate-600 uppercase tracking-wider mb-1">Interaction Notes</label>
                        <textarea
                            rows="3"
                            placeholder="Add details from meeting, requirements, budget notes..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex justify-center items-center gap-2 transition cursor-pointer shadow-xs"
                        >
                            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                            {contact ? 'Update Lead' : 'Save Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}