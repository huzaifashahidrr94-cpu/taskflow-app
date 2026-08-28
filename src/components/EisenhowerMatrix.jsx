import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Flame,
    Calendar,
    Users,
    Trash2,
    CheckCircle2,
    Loader2,
    Clock,
    AlertCircle,
    ArrowRight,
    Filter
} from 'lucide-react';

export default function EisenhowerMatrix({ workspaceId }) {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        if (workspaceId) fetchTasks();
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('organization_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setTasks(data || []);
        } catch (err) {
            console.error('Error loading matrix tasks:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const updateTaskQuadrant = async (taskId, priority, dueDate) => {
        // Quadrants are derived from priority and due date proximity
        setTasks((prev) =>
            prev.map((t) => (t.id === taskId ? { ...t, priority, due_date: dueDate } : t))
        );

        try {
            const { error } = await supabase
                .from('tasks')
                .update({ priority, due_date: dueDate })
                .eq('id', taskId);

            if (error) throw error;
            triggerToast('Task quadrant reassigned!');
        } catch (err) {
            console.error('Error shifting quadrant:', err.message);
            fetchTasks();
        }
    };

    // Helper logic to classify task into Quadrants
    const isUrgent = (task) => {
        if (task.priority === 'high') return true;
        if (!task.due_date) return false;
        const due = new Date(task.due_date);
        const now = new Date();
        const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
        return diffDays <= 2;
    };

    const isImportant = (task) => {
        return task.priority === 'high' || task.priority === 'medium';
    };

    const q1DoFirst = tasks.filter((t) => isUrgent(t) && isImportant(t) && t.status !== 'completed');
    const q2Schedule = tasks.filter((t) => !isUrgent(t) && isImportant(t) && t.status !== 'completed');
    const q3Delegate = tasks.filter((t) => isUrgent(t) && !isImportant(t) && t.status !== 'completed');
    const q4Eliminate = tasks.filter((t) => !isUrgent(t) && !isImportant(t) && t.status !== 'completed');

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-semibold">Categorizing tasks into Eisenhower Quadrants...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans">
            {/* Matrix Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Flame className="w-6 h-6 text-rose-500" /> Eisenhower Task Matrix
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Focus on what truly drives impact. Manage urgency versus importance in real time.
                    </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 px-3.5 py-2 rounded-xl shadow-2xs">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <span>{tasks.filter((t) => t.status !== 'completed').length} Active Tasks Sorted</span>
                </div>
            </div>

            {/* $2 \times 2$ Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* QUADRANT 1: DO FIRST */}
                <div className="bg-rose-50/50 border-2 border-rose-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-rose-200/80 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center font-bold">
                                    <Flame className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-sm">1. Do First</h3>
                                    <p className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">Urgent & Important</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold bg-rose-100 text-rose-800 border border-rose-300 px-2.5 py-0.5 rounded-full">
                                {q1DoFirst.length}
                            </span>
                        </div>

                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {q1DoFirst.length === 0 ? (
                                <p className="text-xs text-rose-400 font-medium text-center py-6">No urgent fires right now!</p>
                            ) : (
                                q1DoFirst.map((t) => (
                                    <MatrixTaskCard key={t.id} task={t} onShift={updateTaskQuadrant} targetQuadrant="do" />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* QUADRANT 2: SCHEDULE */}
                <div className="bg-blue-50/50 border-2 border-blue-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-blue-200/80 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                                    <Calendar className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-sm">2. Schedule</h3>
                                    <p className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Not Urgent, But Important</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold bg-blue-100 text-blue-800 border border-blue-300 px-2.5 py-0.5 rounded-full">
                                {q2Schedule.length}
                            </span>
                        </div>

                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {q2Schedule.length === 0 ? (
                                <p className="text-xs text-blue-400 font-medium text-center py-6">No scheduled strategic tasks.</p>
                            ) : (
                                q2Schedule.map((t) => (
                                    <MatrixTaskCard key={t.id} task={t} onShift={updateTaskQuadrant} targetQuadrant="schedule" />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* QUADRANT 3: DELEGATE */}
                <div className="bg-amber-50/50 border-2 border-amber-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-amber-200/80 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold">
                                    <Users className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-sm">3. Delegate</h3>
                                    <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider">Urgent, But Not Important</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold bg-amber-100 text-amber-800 border border-amber-300 px-2.5 py-0.5 rounded-full">
                                {q3Delegate.length}
                            </span>
                        </div>

                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {q3Delegate.length === 0 ? (
                                <p className="text-xs text-amber-500 font-medium text-center py-6">No tasks to delegate.</p>
                            ) : (
                                q3Delegate.map((t) => (
                                    <MatrixTaskCard key={t.id} task={t} onShift={updateTaskQuadrant} targetQuadrant="delegate" />
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* QUADRANT 4: ELIMINATE / LOW PRIORITY */}
                <div className="bg-slate-100/70 border-2 border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col justify-between">
                    <div>
                        <div className="flex items-center justify-between mb-4 border-b border-slate-200 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-slate-600 text-white flex items-center justify-center font-bold">
                                    <Trash2 className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-sm">4. Don't Do / Backlog</h3>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Neither Urgent Nor Important</p>
                                </div>
                            </div>
                            <span className="text-xs font-extrabold bg-slate-200 text-slate-800 border border-slate-300 px-2.5 py-0.5 rounded-full">
                                {q4Eliminate.length}
                            </span>
                        </div>

                        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                            {q4Eliminate.length === 0 ? (
                                <p className="text-xs text-slate-400 font-medium text-center py-6">No backlog items.</p>
                            ) : (
                                q4Eliminate.map((t) => (
                                    <MatrixTaskCard key={t.id} task={t} onShift={updateTaskQuadrant} targetQuadrant="eliminate" />
                                ))
                            )}
                        </div>
                    </div>
                </div>

            </div>

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

function MatrixTaskCard({ task, onShift, targetQuadrant }) {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0];

    return (
        <div className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-2xs hover:shadow-sm transition flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0 flex-1">
                <h4 className="font-bold text-slate-900 text-xs truncate">{task.title}</h4>
                <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                    <span className="font-semibold text-slate-600">{task.assignee || task.assigned_to || 'Unassigned'}</span>
                    {task.due_date && (
                        <span className="flex items-center gap-1 font-mono text-slate-500">
                            <Clock className="w-3 h-3 text-slate-400" /> {task.due_date}
                        </span>
                    )}
                </div>
            </div>

            {/* Shift Quadrant Action Select */}
            <select
                onChange={(e) => {
                    const val = e.target.value;
                    if (val === 'do') onShift(task.id, 'high', tomorrow);
                    if (val === 'schedule') onShift(task.id, 'medium', nextWeek);
                    if (val === 'delegate') onShift(task.id, 'low', tomorrow);
                    if (val === 'eliminate') onShift(task.id, 'low', null);
                }}
                value={targetQuadrant}
                className="bg-slate-50 border border-slate-200 rounded-xl px-2 py-1 text-[10px] font-bold text-slate-700 outline-none cursor-pointer"
            >
                <option value="do">Move to: Do First</option>
                <option value="schedule">Move to: Schedule</option>
                <option value="delegate">Move to: Delegate</option>
                <option value="eliminate">Move to: Backlog</option>
            </select>
        </div>
    );
}