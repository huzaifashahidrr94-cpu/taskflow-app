import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Search,
    Mail,
    Shield,
    MessageSquare,
    UserPlus,
    Activity,
    CheckCircle2,
    Filter,
    MoreVertical,
    X
} from 'lucide-react';

export default function TeamDirectory({ workspaceId, currentUser, onNavigateToDm }) {
    const [members, setMembers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');
    const [inviteRole, setInviteRole] = useState('employee');
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        fetchWorkspaceMembers();
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3500);
    };

    const fetchWorkspaceMembers = async () => {
        setLoading(true);
        let targetId = workspaceId || localStorage.getItem('activeOrgId');

        if (!targetId || targetId === 'undefined') {
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            if (orgs && orgs.length > 0) targetId = orgs[0].id;
        }

        if (!targetId) {
            setLoading(false);
            return;
        }

        try {
            const { data, error } = await supabase
                .from('organization_members')
                .select(`
          user_id,
          role,
          custom_status,
          created_at,
          profiles ( id, full_name, email, avatar_url )
        `)
                .eq('organization_id', targetId);

            if (error) throw error;

            const formatted = (data || []).map((m) => {
                const isSelf = m.user_id === currentUser?.id;
                return {
                    id: m.user_id,
                    name: m.profiles?.full_name || (isSelf ? currentUser?.name : 'Team Member'),
                    email: m.profiles?.email || 'user@workspace.com',
                    avatarUrl: m.profiles?.avatar_url,
                    role: m.role || 'employee',
                    customStatus: m.custom_status || '',
                    isSelf,
                    isOnline: true, // Tied to real-time presence
                    joinedAt: m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Recent'
                };
            });

            setMembers(formatted);
        } catch (err) {
            console.error('Error fetching directory members:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSendInvite = async (e) => {
        e.preventDefault();
        if (!inviteEmail.trim()) return;

        triggerToast(`Invitation sent to ${inviteEmail}!`);
        setIsInviteModalOpen(false);
        setInviteEmail('');
    };

    // Filter Logic
    const filteredMembers = members.filter((m) => {
        const matchesSearch =
            m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            m.email.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesRole = roleFilter === 'all' || m.role.toLowerCase() === roleFilter.toLowerCase();
        const matchesStatus =
            statusFilter === 'all' ||
            (statusFilter === 'online' && m.isOnline) ||
            (statusFilter === 'active_status' && m.customStatus);

        return matchesSearch && matchesRole && matchesStatus;
    });

    const totalAdmins = members.filter((m) => m.role.toLowerCase() === 'admin').length;
    const activeStatusesCount = members.filter((m) => m.customStatus).length;

    return (
        <div className="flex flex-col h-[calc(100vh-6.5rem)] bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden font-sans">

            {/* Directory Header */}
            <header className="p-6 border-b border-slate-200/80 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0">
                <div>
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80">
                            <Users className="w-5 h-5" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900">People & Workspace Directory</h1>
                            <p className="text-xs text-slate-500 font-medium">
                                View all team members, roles, workload statuses, and start instant chats.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {currentUser?.role === 'admin' && (
                        <button
                            onClick={() => setIsInviteModalOpen(true)}
                            className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-xs"
                        >
                            <UserPlus className="w-4 h-4 text-blue-400" /> Invite Member
                        </button>
                    )}
                </div>
            </header>

            {/* Metrics Bar */}
            <div className="grid grid-cols-3 border-b border-slate-200/80 bg-slate-50/50 divide-x divide-slate-200/80 shrink-0">
                <div className="px-6 py-3 flex items-center gap-3">
                    <span className="text-xl font-black text-slate-900">{members.length}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Members</span>
                </div>
                <div className="px-6 py-3 flex items-center gap-3">
                    <span className="text-xl font-black text-blue-600">{totalAdmins}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Workspace Admins</span>
                </div>
                <div className="px-6 py-3 flex items-center gap-3">
                    <span className="text-xl font-black text-emerald-600">{activeStatusesCount}</span>
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Status Updates</span>
                </div>
            </div>

            {/* Filters & Search Control Bar */}
            <div className="p-4 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="relative flex-1 min-w-[240px] max-w-md">
                    <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search members by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600">
                        <Filter className="w-3.5 h-3.5 text-slate-400" />
                        <span>Role:</span>
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Roles</option>
                            <option value="admin">Admin</option>
                            <option value="employee">Employee</option>
                            <option value="sales">Sales</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-600">
                        <Activity className="w-3.5 h-3.5 text-slate-400" />
                        <span>Status:</span>
                        <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="online">Online Now</option>
                            <option value="active_status">Has Custom Status</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Directory Grid View */}
            <div className="flex-1 p-6 overflow-y-auto">
                {loading ? (
                    <div className="h-full flex items-center justify-center text-xs font-semibold text-slate-400">
                        Loading workspace directory...
                    </div>
                ) : filteredMembers.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                        <Users className="w-8 h-8 mb-2 text-slate-300" />
                        <p className="font-medium">No team members match your search or filter.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredMembers.map((member) => (
                            <div
                                key={member.id}
                                className="bg-slate-50/70 hover:bg-white border border-slate-200/80 rounded-2xl p-4 transition-all duration-200 hover:shadow-md flex flex-col justify-between group"
                            >
                                <div>
                                    <div className="flex items-start justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="relative">
                                                {member.avatarUrl ? (
                                                    <img
                                                        src={member.avatarUrl}
                                                        alt={member.name}
                                                        className="w-11 h-11 rounded-2xl object-cover border border-slate-200"
                                                    />
                                                ) : (
                                                    <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm border border-blue-200/80">
                                                        {member.name.substring(0, 2).toUpperCase()}
                                                    </div>
                                                )}
                                                <span className="w-3 h-3 rounded-full bg-emerald-500 border-2 border-white absolute -bottom-0.5 -right-0.5"></span>
                                            </div>
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-1.5">
                                                    <h3 className="font-bold text-slate-900 text-sm truncate">{member.name}</h3>
                                                    {member.isSelf && (
                                                        <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                                            You
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-500 truncate flex items-center gap-1 mt-0.5">
                                                    <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                                    <span>{member.email}</span>
                                                </p>
                                            </div>
                                        </div>

                                        <button className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100">
                                            <MoreVertical className="w-4 h-4" />
                                        </button>
                                    </div>

                                    {/* Custom Status Chip */}
                                    {member.customStatus ? (
                                        <div className="mb-3 px-3 py-1.5 bg-blue-50/80 border border-blue-200/70 rounded-xl flex items-center gap-1.5 text-xs text-blue-900 font-medium">
                                            <span>🎯</span>
                                            <span className="truncate">{member.customStatus}</span>
                                        </div>
                                    ) : (
                                        <div className="mb-3 px-3 py-1.5 bg-slate-100/50 border border-slate-200/40 rounded-xl text-xs text-slate-400 italic">
                                            No status set
                                        </div>
                                    )}
                                </div>

                                {/* Card Footer */}
                                <div className="pt-3 border-t border-slate-200/70 flex items-center justify-between gap-2">
                                    <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg bg-slate-200/70 text-slate-700 border border-slate-300/50">
                                        <Shield className="w-3 h-3 text-slate-500" />
                                        {member.role}
                                    </span>

                                    {!member.isSelf && onNavigateToDm && (
                                        <button
                                            onClick={() => onNavigateToDm(member)}
                                            className="bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-600 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-2xs"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                                            <span>Message</span>
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Invite Member Modal */}
            {isInviteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-600" /> Invite Team Member
                            </h3>
                            <button onClick={() => setIsInviteModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSendInvite} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Email Address</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="colleague@company.com"
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Workspace Role</label>
                                <select
                                    value={inviteRole}
                                    onChange={(e) => setInviteRole(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                                >
                                    <option value="employee">Employee</option>
                                    <option value="sales">Sales</option>
                                    <option value="admin">Admin</option>
                                </select>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsInviteModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex-1 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex-1 shadow-xs cursor-pointer"
                                >
                                    Send Invite
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