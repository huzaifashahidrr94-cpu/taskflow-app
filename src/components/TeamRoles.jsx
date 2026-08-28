import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    Activity,
    CheckCircle2,
    AlertTriangle,
    TrendingUp,
    BarChart2,
    Shield,
    Briefcase,
    Layers,
    UserCheck,
    Zap,
    Loader2,
    X
} from 'lucide-react';

export default function TeamRoles({ workspaceId, currentUser }) {
    const [members, setMembers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [deals, setDeals] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        if (workspaceId) {
            loadHeatmapData();
        }
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3500);
    };

    const loadHeatmapData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Team Members
            const { data: memberData, error: memberErr } = await supabase
                .from('organization_members')
                .select(`
          user_id,
          role,
          custom_status,
          profiles ( full_name, email )
        `)
                .eq('organization_id', workspaceId);

            if (memberErr) throw memberErr;

            // 2. Fetch Tasks
            const { data: taskData, error: taskErr } = await supabase
                .from('tasks')
                .select('*')
                .eq('organization_id', workspaceId);

            if (taskErr && !taskErr.message.includes('column')) console.error(taskErr);

            // 3. Fetch Deals
            const { data: dealData, error: dealErr } = await supabase
                .from('deals')
                .select('*')
                .eq('workspace_id', workspaceId);

            if (dealErr && !dealErr.message.includes('column')) console.error(dealErr);

            const rawMembers = memberData || [];
            const rawTasks = taskData || [];
            const rawDeals = dealData || [];

            // Calculate Workload Metrics per Member
            const compiled = rawMembers.map((m) => {
                const name = m.profiles?.full_name || m.user_id;
                const email = m.profiles?.email || 'N/A';

                const assignedTasks = rawTasks.filter(
                    (t) => t.assigned_to === m.user_id || (t.assigned_name && t.assigned_name.toLowerCase() === name.toLowerCase())
                );

                const activeTasks = assignedTasks.filter((t) => t.status !== 'completed' && t.status !== 'done');
                const completedTasks = assignedTasks.filter((t) => t.status === 'completed' || t.status === 'done');

                const assignedDeals = rawDeals.filter(
                    (d) => d.contact_name?.toLowerCase().includes(name.toLowerCase()) || d.stage !== 'lost'
                );
                const totalPipelineRisk = assignedDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

                let capacity = 'Balanced';
                let badgeColor = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                let barColor = 'bg-emerald-500';

                if (activeTasks.length >= 7 || totalPipelineRisk >= 75000) {
                    capacity = 'Overloaded';
                    badgeColor = 'bg-rose-50 text-rose-700 border-rose-200';
                    barColor = 'bg-rose-500';
                } else if (activeTasks.length >= 4 || totalPipelineRisk >= 35000) {
                    capacity = 'Heavy Load';
                    badgeColor = 'bg-amber-50 text-amber-700 border-amber-200';
                    barColor = 'bg-amber-500';
                }

                return {
                    id: m.user_id,
                    name,
                    email,
                    role: m.role || 'team',
                    status: m.custom_status || '',
                    activeTaskCount: activeTasks.length,
                    completedTaskCount: completedTasks.length,
                    totalPipelineRisk,
                    capacity,
                    badgeColor,
                    barColor,
                    tasksList: assignedTasks
                };
            });

            setMembers(compiled);
            setTasks(rawTasks);
            setDeals(rawDeals);
        } catch (err) {
            console.error('Heatmap Data Load Error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        setMembers((prev) => prev.map((m) => (m.id === userId ? { ...m, role: newRole } : m)));

        try {
            const { error } = await supabase
                .from('organization_members')
                .update({ role: newRole })
                .eq('organization_id', workspaceId)
                .eq('user_id', userId);

            if (error) throw error;
            triggerToast(`Updated member role to ${newRole.toUpperCase()}`);
        } catch (err) {
            console.error('Role update error:', err.message);
            loadHeatmapData();
        }
    };

    const totalActiveTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'done').length;
    const overloadedCount = members.filter((m) => m.capacity === 'Overloaded').length;
    const totalRiskPipeline = deals.filter((d) => d.stage !== 'lost').reduce((acc, curr) => acc + Number(curr.value || 0), 0);

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Activity className="w-6 h-6 text-blue-600" /> Team Workload & Capacity Heatmap
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Monitor active task density, assigned deal risk, and prevent team burnout before it happens.
                    </p>
                </div>

                <button
                    onClick={loadHeatmapData}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-4 py-2.5 rounded-xl text-xs transition flex items-center gap-2 cursor-pointer shadow-2xs"
                >
                    <Layers className="w-4 h-4 text-blue-600" /> Refresh Heatmap
                </button>
            </div>

            {/* Analytics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Tasks Managed</span>
                        <p className="text-3xl font-extrabold text-slate-900 mt-1">{totalActiveTasks}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <BarChart2 className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Overloaded Staff Alert</span>
                        <p className="text-3xl font-extrabold text-rose-600 mt-1">{overloadedCount} Members</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                        <AlertTriangle className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm flex items-center justify-between">
                    <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Exposure</span>
                        <p className="text-3xl font-extrabold text-emerald-600 mt-1">${totalRiskPipeline.toLocaleString()}</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Member Heatmap Grid */}
            {loading ? (
                <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                    <p className="text-xs font-semibold">Calculating team workload distribution...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {members.map((member) => {
                        const maxTaskThreshold = 10;
                        const percentage = Math.min(Math.round((member.activeTaskCount / maxTaskThreshold) * 100), 100);

                        return (
                            <div
                                key={member.id}
                                className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
                            >
                                <div>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 font-extrabold flex items-center justify-center text-sm shadow-2xs">
                                                {member.name[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-slate-900 text-sm">{member.name}</h3>
                                                <p className="text-[11px] text-slate-400 truncate max-w-[150px]">{member.email}</p>
                                            </div>
                                        </div>

                                        <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border ${member.badgeColor}`}>
                                            {member.capacity}
                                        </span>
                                    </div>

                                    {member.status && (
                                        <div className="mb-4 p-2 bg-blue-50/70 border border-blue-200/60 rounded-xl text-xs text-blue-900 font-semibold truncate">
                                            🎯 {member.status}
                                        </div>
                                    )}

                                    <div className="space-y-1.5 mb-5">
                                        <div className="flex items-center justify-between text-[11px]">
                                            <span className="font-semibold text-slate-500">Task Capacity Load</span>
                                            <span className="font-bold text-slate-800">{member.activeTaskCount} Active Tasks</span>
                                        </div>
                                        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${member.barColor} transition-all duration-500 rounded-full`}
                                                style={{ width: `${Math.max(percentage, 8)}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-2 mb-4 p-3 bg-slate-50 border border-slate-200/70 rounded-2xl text-xs">
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Completed</span>
                                            <p className="font-extrabold text-slate-800 text-sm mt-0.5">{member.completedTaskCount} Tasks</p>
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-bold text-slate-400 uppercase">Pipeline Risk</span>
                                            <p className="font-extrabold text-emerald-600 text-sm mt-0.5">
                                                ${member.totalPipelineRisk.toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                                    <div className="flex items-center gap-1.5">
                                        <Shield className="w-3.5 h-3.5 text-slate-400" />
                                        <select
                                            value={member.role}
                                            disabled={currentUser?.role !== 'admin'}
                                            onChange={(e) => handleRoleChange(member.id, e.target.value)}
                                            className="text-xs font-bold text-slate-700 bg-transparent outline-none cursor-pointer capitalize"
                                        >
                                            <option value="admin">Admin</option>
                                            <option value="employee">Employee</option>
                                            <option value="sales">Sales</option>
                                            <option value="team">Team Member</option>
                                        </select>
                                    </div>

                                    <button
                                        onClick={() => setSelectedMember(member)}
                                        className="text-xs font-bold text-blue-600 hover:underline cursor-pointer"
                                    >
                                        View Tasks
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Task Inspector Modal */}
            {selectedMember && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                                    {selectedMember.name[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="text-base font-bold text-slate-900">{selectedMember.name}'s Workload</h3>
                                    <p className="text-xs text-slate-400">{selectedMember.activeTaskCount} Active Assigned Tasks</p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedMember(null)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1 text-xs">
                            {selectedMember.tasksList.length === 0 ? (
                                <div className="p-8 text-center text-slate-400 font-medium">No tasks currently assigned to this member.</div>
                            ) : (
                                selectedMember.tasksList.map((t) => (
                                    <div key={t.id || t.title} className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex items-center justify-between">
                                        <div>
                                            <h4 className="font-bold text-slate-800 text-xs">{t.title}</h4>
                                            <span className="text-[10px] text-slate-400 capitalize">Priority: {t.priority || 'medium'}</span>
                                        </div>
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600 uppercase">
                                            {t.status || 'todo'}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="pt-4 mt-2 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedMember(null)}
                                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs cursor-pointer"
                            >
                                Close Inspector
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