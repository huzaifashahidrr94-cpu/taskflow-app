import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Target,
    Plus,
    TrendingUp,
    CheckCircle2,
    ChevronRight,
    Loader2,
    X,
    Trash2,
    Award,
    Layers
} from 'lucide-react';

export default function OKRsGoals({ workspaceId, currentUser }) {
    const [objectives, setObjectives] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuarter, setSelectedQuarter] = useState('Q3 2026');
    const [selectedDepartment, setSelectedDepartment] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Form State
    const [title, setTitle] = useState('');
    const [department, setDepartment] = useState('Executive');
    const [kr1, setKr1] = useState('');
    const [kr2, setKr2] = useState('');

    useEffect(() => {
        if (workspaceId) {
            fetchOKRs();
        } else {
            setLoading(false);
        }
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchOKRs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('okrs')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error && !error.message.includes('relation')) throw error;

            const fallbackOKRs = [
                {
                    id: 'okr-1',
                    title: '🚀 Scale Q3 Recurring Revenue to $50k ARR',
                    quarter: 'Q3 2026',
                    department: 'Sales & Growth',
                    key_results: [
                        { id: 'kr-1', title: 'Close 15 Enterprise CRM deals', current: 11, target: 15 },
                        { id: 'kr-2', title: 'Reduce churn rate to under 2%', current: 85, target: 100 }
                    ]
                },
                {
                    id: 'okr-2',
                    title: '⚡ Elevate Platform Uptime & SLA Performance',
                    quarter: 'Q3 2026',
                    department: 'Engineering',
                    key_results: [
                        { id: 'kr-3', title: 'Maintain 99.9% API response uptime', current: 98, target: 100 },
                        { id: 'kr-4', title: 'Resolve 100% of high-priority tickets within 24h', current: 90, target: 100 }
                    ]
                }
            ];

            setObjectives(data && data.length > 0 ? data : fallbackOKRs);
        } catch (err) {
            console.error('Error fetching OKRs:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOKR = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const krs = [];
        if (kr1.trim()) krs.push({ id: 'kr-' + Date.now() + '-1', title: kr1.trim(), current: 0, target: 100 });
        if (kr2.trim()) krs.push({ id: 'kr-' + Date.now() + '-2', title: kr2.trim(), current: 0, target: 100 });

        const newOKR = {
            id: 'okr-' + Date.now(),
            workspace_id: workspaceId,
            title: title.trim(),
            quarter: selectedQuarter,
            department,
            key_results: krs.length > 0 ? krs : [{ id: 'kr-def', title: 'Achieve primary goal milestone', current: 0, target: 100 }]
        };

        setObjectives([newOKR, ...objectives]);
        setIsModalOpen(false);
        setTitle('');
        setKr1('');
        setKr2('');
        triggerToast(`Objective "${newOKR.title}" created for ${selectedQuarter}!`);

        try {
            await supabase.from('okrs').insert([newOKR]);
        } catch (err) {
            console.error('Error saving OKR:', err.message);
        }
    };

    const updateKRProgress = (okrId, krId, newCurrent) => {
        setObjectives((prev) =>
            prev.map((okr) => {
                if (okr.id !== okrId) return okr;
                const updatedKRs = okr.key_results.map((kr) =>
                    kr.id === krId ? { ...kr, current: Math.min(kr.target, Math.max(0, Number(newCurrent))) } : kr
                );
                return { ...okr, key_results: updatedKRs };
            })
        );
    };

    const handleDeleteOKR = async (id) => {
        setObjectives((prev) => prev.filter((o) => o.id !== id));
        triggerToast('Objective removed.');

        try {
            await supabase.from('okrs').delete().eq('id', id);
        } catch (err) {
            console.error('Error deleting OKR:', err.message);
        }
    };

    const calculateObjectiveProgress = (keyResults) => {
        if (!keyResults || keyResults.length === 0) return 0;
        const totalPct = keyResults.reduce((sum, kr) => sum + (kr.current / kr.target) * 100, 0);
        return Math.round(totalPct / keyResults.length);
    };

    const filteredObjectives = objectives.filter((o) => {
        const matchesQuarter = o.quarter === selectedQuarter;
        const matchesDept = selectedDepartment === 'All' || o.department === selectedDepartment;
        return matchesQuarter && matchesDept;
    });

    const overallProgress =
        filteredObjectives.length > 0
            ? Math.round(
                filteredObjectives.reduce((sum, o) => sum + calculateObjectiveProgress(o.key_results), 0) /
                filteredObjectives.length
            )
            : 0;

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-rose-600 mb-2" />
                <p className="text-xs font-semibold">Loading Company OKRs & Goal Engine...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Target className="w-6 h-6 text-rose-600" /> OKRs & Company Goals
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Align company strategy with measurable Key Results across departments.
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-rose-500/20"
                >
                    <Plus className="w-4 h-4" /> Add Strategic Goal
                </button>
            </div>

            {/* Quarter Selector & Overall Progress */}
            <div className="bg-slate-900 text-white p-6 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-rose-400" />
                        <span className="text-xs font-extrabold uppercase text-rose-300 tracking-wider">Quarterly Alignment</span>
                    </div>
                    <h2 className="text-xl font-extrabold text-white">{selectedQuarter} Execution Progress</h2>
                </div>

                <div className="flex items-center gap-6">
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase">Roll-up Score</span>
                        <p className="text-3xl font-black text-rose-400">{overallProgress}%</p>
                    </div>

                    <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-2xl border border-slate-700 text-xs font-bold">
                        {['Q1 2026', 'Q2 2026', 'Q3 2026', 'Q4 2026'].map((q) => (
                            <button
                                key={q}
                                onClick={() => setSelectedQuarter(q)}
                                className={`px-3 py-1.5 rounded-xl transition cursor-pointer ${selectedQuarter === q ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
                                    }`}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Department Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <span className="text-slate-400 uppercase text-[10px] tracking-wider font-extrabold mr-1">Department:</span>
                {['All', 'Executive', 'Sales & Growth', 'Engineering', 'Product & Design'].map((dept) => (
                    <button
                        key={dept}
                        onClick={() => setSelectedDepartment(dept)}
                        className={`px-3.5 py-1.5 rounded-xl transition cursor-pointer shrink-0 ${selectedDepartment === dept
                            ? 'bg-slate-900 text-white shadow-2xs'
                            : 'bg-white border border-slate-200/80 text-slate-600 hover:bg-slate-50'
                            }`}
                    >
                        {dept}
                    </button>
                ))}
            </div>

            {/* Objectives Cards List */}
            <div className="space-y-5">
                {filteredObjectives.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center text-slate-400">
                        <Target className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                        <p className="text-xs font-bold">No objectives defined for {selectedQuarter} in this department.</p>
                    </div>
                ) : (
                    filteredObjectives.map((obj) => {
                        const pct = calculateObjectiveProgress(obj.key_results);

                        return (
                            <div
                                key={obj.id}
                                className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4 hover:border-slate-300 transition"
                            >
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-extrabold bg-rose-50 text-rose-700 px-2.5 py-0.5 rounded-md border border-rose-200/60 uppercase">
                                                {obj.department}
                                            </span>
                                            <span className="text-xs text-slate-400 font-mono font-bold">{obj.quarter}</span>
                                        </div>
                                        <h3 className="text-lg font-black text-slate-900">{obj.title}</h3>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <div className="w-36 bg-slate-100 h-2.5 rounded-full overflow-hidden">
                                            <div
                                                className="bg-rose-600 h-full rounded-full transition-all duration-500"
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                        <span className="font-mono font-black text-slate-900 text-sm">{pct}%</span>
                                        <button
                                            onClick={() => handleDeleteOKR(obj.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Key Results Slider Items */}
                                <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-4 space-y-3">
                                    <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Key Results Progress</p>
                                    <div className="divide-y divide-slate-200/60">
                                        {obj.key_results.map((kr) => {
                                            const krPct = Math.round((kr.current / kr.target) * 100);

                                            return (
                                                <div key={kr.id} className="pt-3 first:pt-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                                    <div className="space-y-0.5 flex-1">
                                                        <p className="text-xs font-bold text-slate-800">{kr.title}</p>
                                                        <p className="text-[10px] font-mono text-slate-400">
                                                            Current: {kr.current} / Target: {kr.target} ({krPct}%)
                                                        </p>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <input
                                                            type="range"
                                                            min="0"
                                                            max={kr.target}
                                                            value={kr.current}
                                                            onChange={(e) => updateKRProgress(obj.id, kr.id, e.target.value)}
                                                            className="w-32 accent-rose-600 cursor-pointer"
                                                        />
                                                        <span className="font-mono font-bold text-xs text-rose-700 w-10 text-right">{krPct}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            {/* CREATE OKR MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Target className="w-5 h-5 text-rose-600" /> New Company Objective
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateOKR} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Objective Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Scale European Sales & Expansion"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Department</label>
                                <select
                                    value={department}
                                    onChange={(e) => setDepartment(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none"
                                >
                                    <option value="Executive">Executive</option>
                                    <option value="Sales & Growth">Sales & Growth</option>
                                    <option value="Engineering">Engineering</option>
                                    <option value="Product & Design">Product & Design</option>
                                </select>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Key Result 1</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Hire 3 Senior Account Executives"
                                    value={kr1}
                                    onChange={(e) => setKr1(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Key Result 2 (Optional)</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Onboard 20 new enterprise clients"
                                    value={kr2}
                                    onChange={(e) => setKr2(e.target.value)}
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
                                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs flex-1 shadow-xs cursor-pointer"
                                >
                                    Save Objective
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