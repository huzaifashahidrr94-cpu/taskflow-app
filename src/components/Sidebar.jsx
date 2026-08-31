import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Inbox,
    LayoutGrid,
    Sparkles,
    Flame,
    Target,
    FormInput,
    Ticket,
    Clock,
    DollarSign,
    BookOpen,
    UserCheck,
    BarChart3,
    Zap,
    TrendingUp,
    Contact,
    MessageSquare,
    Activity,
    UserPlus,
    LogOut
} from 'lucide-react';

export default function Sidebar({
    activeTab = 'tasks',
    setActiveTab = () => { },
    workspaceId = null,
    userRole = 'employee',
    currentUser = {},
    onSignOut = () => { },
    onOpenInvite = () => { }
}) {
    const [counts, setCounts] = useState({
        inbox: 0,
        tasks: 0,
        tickets: 0,
        pto: 0
    });

    const myName = (currentUser?.fullName || currentUser?.name || '').toLowerCase();
    const userEmail = currentUser?.name || 'User';
    const userInitial = (userEmail[0] || 'U').toUpperCase();

    useEffect(() => {
        if (!workspaceId) return;

        fetchBadgeCounts();

        const handleCustomUpdate = () => fetchBadgeCounts();
        window.addEventListener('workgrid_badge_update', handleCustomUpdate);
        window.addEventListener('taskflow_badge_update', handleCustomUpdate);

        const channelTopic = `sidebar_badges_${workspaceId}_${Math.random().toString(36).substring(2, 7)}`;
        const channel = supabase
            .channel(channelTopic)
            .on('postgres_changes', { event: '*', schema: 'public' }, () => {
                fetchBadgeCounts();
            })
            .subscribe();

        return () => {
            window.removeEventListener('workgrid_badge_update', handleCustomUpdate);
            window.removeEventListener('taskflow_badge_update', handleCustomUpdate);
            supabase.removeChannel(channel);
        };
    }, [workspaceId, myName, activeTab]);

    const fetchBadgeCounts = async () => {
        try {
            const { data: inboxData } = await supabase
                .from('activity_feed')
                .select('id, read')
                .eq('read', false);
            const inboxCount = inboxData ? inboxData.length : 0;

            const { data: taskData } = await supabase
                .from('tasks')
                .select('id, assignee, status')
                .eq('organization_id', workspaceId)
                .neq('status', 'completed');

            const myTasksCount = (taskData || []).filter(t => {
                if (!t.assignee || !myName) return false;
                return t.assignee.toLowerCase() === myName;
            }).length;

            const { data: ticketData } = await supabase
                .from('tickets')
                .select('id, status')
                .eq('status', 'open');
            const ticketsCount = ticketData ? ticketData.length : 0;

            const { data: ptoData } = await supabase
                .from('pto_requests')
                .select('id, status')
                .eq('status', 'pending');
            const ptoCount = ptoData ? ptoData.length : 0;

            setCounts({
                inbox: inboxCount,
                tasks: myTasksCount,
                tickets: ticketsCount,
                pto: ptoCount
            });
        } catch (err) {
            console.warn('Error fetching badge counts:', err);
            setCounts({ inbox: 0, tasks: 0, tickets: 0, pto: 0 });
        }
    };

    // Prioritized and categorized navigation structure
    const navSections = [
        {
            title: 'DAILY WORK',
            items: [
                { id: 'inbox', label: 'Unified Inbox', icon: Inbox, badge: counts.inbox, badgeColor: 'bg-purple-600' },
                { id: 'tasks', label: 'Company Tasks', icon: LayoutGrid, badge: counts.tasks, badgeColor: 'bg-blue-600' },
                { id: 'chat', label: 'Team Chat', icon: MessageSquare },
                { id: 'copilot', label: 'AI Copilot', icon: Sparkles },
            ]
        },
        {
            title: 'SALES & CLIENTS',
            items: [
                { id: 'sales', label: 'Sales Pipeline', icon: TrendingUp, roleRestricted: true },
                { id: 'contacts', label: 'Contacts & Leads', icon: Contact },
                { id: 'helpdesk', label: 'Helpdesk & Support', icon: Ticket, badge: counts.tickets, badgeColor: 'bg-amber-500' },
                { id: 'invoicing', label: 'Invoicing & Billing', icon: DollarSign },
            ]
        },
        {
            title: 'MANAGEMENT',
            items: [
                { id: 'matrix', label: 'Eisenhower Matrix', icon: Flame },
                { id: 'okrs', label: 'OKRs & Goals', icon: Target },
                { id: 'team', label: 'Team & Workload', icon: Activity },
                { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
            ]
        },
        {
            title: 'OPERATIONS',
            items: [
                { id: 'docs', label: 'Docs & Wiki', icon: BookOpen },
                { id: 'timetracking', label: 'Time Tracking', icon: Clock },
                { id: 'hr', label: 'HR & PTO', icon: UserCheck, badge: counts.pto, badgeColor: 'bg-rose-500' },
                { id: 'forms', label: 'Public Forms Builder', icon: FormInput },
                { id: 'automations', label: 'Visual Automations', icon: Zap },
            ]
        }
    ];

    return (
        <aside className="w-64 flex flex-col h-screen overflow-y-auto shrink-0 bg-white/80 backdrop-blur-md border-r border-slate-200/80 p-4 font-sans select-none sticky top-0">
            <div>
                {/* --- WORKGRID BRAND HEADER --- */}
                <div className="flex items-center gap-3 px-2 mb-6">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/20">
                        <LayoutGrid className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-lg text-slate-900 tracking-tight">Workgrid</span>
                </div>

                <nav className="space-y-5">
                    {navSections.map((section, idx) => (
                        <div key={idx} className="space-y-1">
                            <h4 className="px-3 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 mb-1">
                                {section.title}
                            </h4>
                            {section.items.map((item) => {
                                if (item.roleRestricted && userRole !== 'admin' && userRole !== 'sales') {
                                    return null;
                                }
                                const Icon = item.icon;
                                const isActive = activeTab === item.id;

                                return (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${isActive
                                            ? 'bg-blue-50 text-blue-600 font-bold'
                                            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2.5 truncate">
                                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                                            <span className="truncate">{item.label}</span>
                                        </div>

                                        {item.badge > 0 && (
                                            <span className={`px-2 py-0.5 text-[10px] font-extrabold text-white rounded-full tabular-nums shrink-0 shadow-2xs ${item.badgeColor || 'bg-blue-600'}`}>
                                                {item.badge}
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>
            </div>

            <div className="space-y-2 mt-auto pt-6 border-t border-slate-100">
                {userRole === 'admin' && (
                    <button
                        onClick={onOpenInvite}
                        className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200/80 hover:bg-blue-100/80 text-xs font-bold transition cursor-pointer"
                    >
                        <UserPlus className="w-4 h-4" />
                        Invite Teammate
                    </button>
                )}

                <div className="p-2.5 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center justify-between">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                            {userInitial}
                        </div>
                        <div className="text-xs truncate">
                            <p className="font-semibold text-slate-900 truncate">{userEmail}</p>
                            <p className="text-slate-500 capitalize text-[10px]">{userRole}</p>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onSignOut}
                    className="w-full flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                >
                    <LogOut className="w-3.5 h-3.5" />
                    Sign Out
                </button>
            </div>
        </aside>
    );
}