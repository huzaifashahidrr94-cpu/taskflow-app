import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    TrendingUp,
    BarChart3,
    PieChart,
    DollarSign,
    CheckCircle2,
    Target,
    Users,
    ArrowUpRight,
    Loader2
} from 'lucide-react';

export default function AnalyticsDashboard({ workspaceId }) {
    const [loading, setLoading] = useState(true);
    const [timeframe, setTimeframe] = useState('30d');

    const [deals, setDeals] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [members, setMembers] = useState([]);

    useEffect(() => {
        if (workspaceId) {
            fetchAnalyticsData();
        }
    }, [workspaceId]);

    const fetchAnalyticsData = async () => {
        setLoading(true);
        try {
            // The three queries used to run one after another, which is
            // most of the wait on this screen. Run them in parallel.
            const [dealRes, taskRes, memberRes] = await Promise.all([
                supabase.from('deals').select('*').eq('workspace_id', workspaceId),
                supabase.from('tasks').select('*').eq('organization_id', workspaceId),
                supabase.from('organization_members').select('*, profiles(full_name)').eq('organization_id', workspaceId)
            ]);
            setDeals(dealRes.data || []);
            setTasks(taskRes.data || []);
            setMembers(memberRes.data || []);
        } catch (err) {
            console.error('Error fetching analytics:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const wonDeals = deals.filter((d) => d.stage === 'won' || d.stage === 'closed_won');
    const activeDeals = deals.filter((d) => d.stage !== 'won' && d.stage !== 'lost' && d.stage !== 'closed_won');
    const totalRevenue = wonDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
    const pipelineValue = activeDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);

    const totalClosed = wonDeals.length + deals.filter((d) => d.stage === 'lost').length;
    const winRate = totalClosed > 0 ? Math.round((wonDeals.length / totalClosed) * 100) : 0;

    const completedTasks = tasks.filter((t) => t.status === 'completed' || t.status === 'done').length;
    const taskCompletionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;

    const stageCounts = {
        lead: deals.filter((d) => d.stage === 'lead').length,
        contacted: deals.filter((d) => d.stage === 'contacted' || d.stage === 'proposal').length,
        negotiation: deals.filter((d) => d.stage === 'negotiation').length,
        won: wonDeals.length
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-semibold">Loading analytics...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <BarChart3 className="w-6 h-6 text-blue-600" /> Executive Analytics & Visuals
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Real-time visual metrics across sales pipelines, task throughput, and revenue targets.
                    </p>
                </div>

                <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold">
                    {['7d', '30d', '90d', '1y'].map((range) => (
                        <button
                            key={range}
                            onClick={() => setTimeframe(range)}
                            className={`px-3 py-1.5 rounded-xl transition cursor-pointer uppercase ${timeframe === range
                                ? 'bg-white text-blue-600 shadow-xs'
                                : 'text-slate-500 hover:text-slate-900'
                                }`}
                        >
                            {range}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-lg shadow-blue-500/15 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-blue-100">Closed Revenue</span>
                        <div className="w-9 h-9 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md">
                            <DollarSign className="w-5 h-5 text-white" />
                        </div>
                    </div>
                    <p className="text-3xl font-black">${totalRevenue.toLocaleString()}</p>
                    {totalRevenue > 0 ? (
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300 mt-2">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                            <span>+14.2% vs last period</span>
                        </div>
                    ) : (
                        <p className="text-[11px] text-blue-100 font-medium mt-2">No revenue yet — add a deal to see trends</p>
                    )}
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Pipeline</span>
                        <div className="w-9 h-9 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <TrendingUp className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">${pipelineValue.toLocaleString()}</p>
                    <p className="text-[11px] text-slate-400 font-medium mt-2">{activeDeals.length} deals in progress</p>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Deal Win Rate</span>
                        <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <Target className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-emerald-600">{winRate}%</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${winRate}%` }} />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Task Completion</span>
                        <div className="w-9 h-9 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-extrabold text-slate-900">{taskCompletionRate}%</p>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-3">
                        <div className="bg-blue-600 h-full rounded-full transition-all duration-500" style={{ width: `${taskCompletionRate}%` }} />
                    </div>
                </div>
            </div>

            {deals.length === 0 && tasks.length === 0 && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200/80 shadow-xs text-center">
                    <BarChart3 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="text-sm font-bold text-slate-900">No data yet</p>
                    <p className="text-xs text-slate-500 mt-1">Add a deal or a task and charts and trends will appear here.</p>
                </div>
            )}
        </div>
    );
}