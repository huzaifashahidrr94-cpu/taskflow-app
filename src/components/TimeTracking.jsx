import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Clock,
    Play,
    Square,
    Plus,
    DollarSign,
    CheckCircle2,
    Calendar,
    User,
    Loader2,
    Trash2,
    Tag
} from 'lucide-react';

export default function TimeTracking({ workspaceId, currentUser }) {
    const [timeLogs, setTimeLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [elapsedSeconds, setElapsedSeconds] = useState(0);
    const [timerTaskTitle, setTimerTaskTitle] = useState('');
    const [hourlyRate, setHourlyRate] = useState('45');
    const [isBillable, setIsBillable] = useState(true);
    const [toast, setToast] = useState({ show: false, message: '' });

    useEffect(() => {
        if (workspaceId) fetchTimeLogs();
    }, [workspaceId]);

    // Live Timer Ticker
    useEffect(() => {
        let interval = null;
        if (isTimerRunning) {
            interval = setInterval(() => {
                setElapsedSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [isTimerRunning]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchTimeLogs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: false });

            if (error && !error.message.includes('relation')) throw error;

            const fallbackLogs = [
                {
                    id: 'log-1',
                    task_title: 'API Integration & Webhook Sync',
                    user_name: currentUser?.name || 'Jane Doe',
                    duration_minutes: 135,
                    hourly_rate: 65,
                    is_billable: true,
                    date: '2026-08-27'
                },
                {
                    id: 'log-2',
                    task_title: 'Weekly Sales Pipeline Review',
                    user_name: currentUser?.name || 'Jane Doe',
                    duration_minutes: 45,
                    hourly_rate: 45,
                    is_billable: false,
                    date: '2026-08-28'
                }
            ];

            setTimeLogs(data && data.length > 0 ? data : fallbackLogs);
        } catch (err) {
            console.error('Error fetching time logs:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStopTimer = async () => {
        if (!timerTaskTitle.trim()) {
            triggerToast('Please enter a task name before stopping!');
            return;
        }

        const minutes = Math.max(1, Math.round(elapsedSeconds / 60));
        const newLog = {
            id: 'log-' + Date.now(),
            workspace_id: workspaceId,
            task_title: timerTaskTitle.trim(),
            user_name: currentUser?.fullName || currentUser?.name || 'Team Member',
            duration_minutes: minutes,
            hourly_rate: Number(hourlyRate),
            is_billable: isBillable,
            date: new Date().toISOString().split('T')[0]
        };

        setTimeLogs([newLog, ...timeLogs]);
        setIsTimerRunning(false);
        setElapsedSeconds(0);
        setTimerTaskTitle('');
        triggerToast(`Logged ${minutes} mins for "${newLog.task_title}"`);

        try {
            await supabase.from('time_logs').insert([newLog]);
        } catch (err) {
            console.error('Error saving time log:', err.message);
        }
    };

    const handleDeleteLog = async (id) => {
        setTimeLogs((prev) => prev.filter((l) => l.id !== id));
        triggerToast('Time log removed.');

        try {
            await supabase.from('time_logs').delete().eq('id', id);
        } catch (err) {
            console.error('Error deleting time log:', err.message);
        }
    };

    const formatHMS = (secs) => {
        const hrs = Math.floor(secs / 3600);
        const mins = Math.floor((secs % 3600) / 60);
        const s = secs % 60;
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    // Metrics
    const totalMinutes = timeLogs.reduce((sum, l) => sum + Number(l.duration_minutes || 0), 0);
    const totalHours = (totalMinutes / 60).toFixed(1);
    const billableLogs = timeLogs.filter((l) => l.is_billable);
    const totalBillableAmount = billableLogs.reduce(
        (sum, l) => sum + (Number(l.duration_minutes || 0) / 60) * Number(l.hourly_rate || 0),
        0
    );

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-amber-600 mb-2" />
                <p className="text-xs font-semibold">Loading Timesheets & Billable Hours...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Clock className="w-6 h-6 text-amber-500" /> Time Tracking & Timesheets
                </h1>
                <p className="text-slate-500 text-sm mt-0.5">
                    Live stopwatch for active tasks, billable client rates, and team timesheet logs.
                </p>
            </div>

            {/* Live Timer Control Bar */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex-1 w-full flex flex-col sm:flex-row items-center gap-4">
                    <input
                        type="text"
                        placeholder="What task are you working on right now?"
                        value={timerTaskTitle}
                        disabled={isTimerRunning}
                        onChange={(e) => setTimerTaskTitle(e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800/80 border border-slate-700 rounded-2xl text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                    />

                    <div className="flex items-center gap-3 shrink-0">
                        <div className="flex items-center gap-1 bg-slate-800 border border-slate-700 px-3 py-2 rounded-2xl text-xs">
                            <span className="text-slate-400 font-bold">$</span>
                            <input
                                type="number"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                className="w-12 bg-transparent text-white font-mono font-bold outline-none"
                            />
                            <span className="text-slate-400 font-medium">/hr</span>
                        </div>

                        <button
                            type="button"
                            onClick={() => setIsBillable(!isBillable)}
                            className={`px-3 py-2 rounded-2xl text-xs font-bold transition cursor-pointer border ${isBillable
                                    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                                    : 'bg-slate-800 text-slate-400 border-slate-700'
                                }`}
                        >
                            {isBillable ? 'Billable' : 'Non-Billable'}
                        </button>
                    </div>
                </div>

                {/* Stopwatch Display */}
                <div className="flex items-center gap-6 shrink-0">
                    <span className="font-mono text-3xl font-black text-amber-400 tracking-wider">
                        {formatHMS(elapsedSeconds)}
                    </span>

                    {!isTimerRunning ? (
                        <button
                            onClick={() => {
                                if (!timerTaskTitle.trim()) {
                                    triggerToast('Enter a task description first!');
                                    return;
                                }
                                setIsTimerRunning(true);
                            }}
                            className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-amber-500/20"
                        >
                            <Play className="w-4 h-4 fill-slate-950" /> Start Timer
                        </button>
                    ) : (
                        <button
                            onClick={handleStopTimer}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-black px-6 py-3 rounded-2xl text-xs flex items-center gap-2 transition cursor-pointer shadow-lg shadow-rose-600/20"
                        >
                            <Square className="w-4 h-4 fill-white" /> Stop & Log
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Total Tracked Hours</p>
                        <p className="text-2xl font-black text-slate-900 mt-1">{totalHours} hrs</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                        <Clock className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Billable Amount</p>
                        <p className="text-2xl font-black text-emerald-600 mt-1">${totalBillableAmount.toFixed(2)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                        <DollarSign className="w-5 h-5" />
                    </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Logged Entries</p>
                        <p className="text-2xl font-black text-blue-600 mt-1">{timeLogs.length} Sessions</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                        <Tag className="w-5 h-5" />
                    </div>
                </div>
            </div>

            {/* Timesheet Log Table */}
            <div className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-xs">
                <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                    <h3 className="font-extrabold text-slate-900 text-sm">Recent Timesheet Entries</h3>
                    <span className="text-xs text-slate-400 font-semibold">{timeLogs.length} Records</span>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-400 uppercase font-bold text-[10px]">
                                <th className="p-3.5 pl-6">Task / Activity</th>
                                <th className="p-3.5">Logged By</th>
                                <th className="p-3.5">Duration</th>
                                <th className="p-3.5">Billing Rate</th>
                                <th className="p-3.5">Value</th>
                                <th className="p-3.5">Date</th>
                                <th className="p-3.5 pr-6 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {timeLogs.map((log) => {
                                const hours = (log.duration_minutes / 60).toFixed(2);
                                const value = log.is_billable ? (hours * log.hourly_rate).toFixed(2) : '0.00';

                                return (
                                    <tr key={log.id} className="hover:bg-slate-50/60 transition">
                                        <td className="p-3.5 pl-6 font-bold text-slate-900">{log.task_title}</td>
                                        <td className="p-3.5 text-slate-600 font-medium">{log.user_name}</td>
                                        <td className="p-3.5 font-mono font-bold text-slate-900">{log.duration_minutes} mins ({hours}h)</td>
                                        <td className="p-3.5">
                                            <span
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${log.is_billable ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                                                    }`}
                                            >
                                                {log.is_billable ? `$${log.hourly_rate}/hr` : 'Non-Billable'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-mono font-bold text-emerald-600">${value}</td>
                                        <td className="p-3.5 font-mono text-slate-500 text-[11px]">{log.date}</td>
                                        <td className="p-3.5 pr-6 text-right">
                                            <button
                                                onClick={() => handleDeleteLog(log.id)}
                                                className="p-1.5 text-slate-400 hover:text-rose-600 transition cursor-pointer"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
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