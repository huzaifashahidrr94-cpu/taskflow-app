import React, { useState } from 'react';
import { X } from 'lucide-react';

export default function TaskModal({ isOpen, onClose, onCreateTask, teamMembers = [] }) {
    const [title, setTitle] = useState('');
    const [assignee, setAssignee] = useState('');
    const [status, setStatus] = useState('todo');
    const [priority, setPriority] = useState('medium');
    const [revenueAtRisk, setRevenueAtRisk] = useState('');
    const [isClientVisible, setIsClientVisible] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        onCreateTask({
            id: Date.now().toString(),
            title: title.trim(),
            assignee: assignee || null,
            status,
            priority,
            revenue_at_risk: Number(revenueAtRisk) || 0,
            is_client_visible: isClientVisible,
            subtasks: []
        });

        // Reset & close
        setTitle('');
        setAssignee('');
        setStatus('todo');
        setPriority('medium');
        setRevenueAtRisk('');
        setIsClientVisible(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl border border-zinc-200">
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-zinc-200">
                    <h2 className="text-lg font-bold text-zinc-900">Create New Task</h2>
                    <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-900 rounded-lg cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Task Title *</label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. Implement OAuth Flow"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm text-zinc-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Assignee</label>
                            <select
                                value={assignee}
                                onChange={(e) => setAssignee(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-hidden"
                            >
                                <option value="">Unassigned</option>
                                {teamMembers.map((m) => {
                                    const name = m.profiles?.full_name || m.user_id;
                                    return <option key={m.user_id} value={name}>{name}</option>;
                                })}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Priority</label>
                            <select
                                value={priority}
                                onChange={(e) => setPriority(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-hidden"
                            >
                                <option value="low">LOW</option>
                                <option value="medium">MEDIUM</option>
                                <option value="high">HIGH</option>
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Status</label>
                            <select
                                value={status}
                                onChange={(e) => setStatus(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-hidden"
                            >
                                <option value="todo">TO DO</option>
                                <option value="in_progress">IN PROGRESS</option>
                                <option value="completed">COMPLETED</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-zinc-700 uppercase mb-1">Revenue Risk ($)</label>
                            <input
                                type="number"
                                placeholder="0"
                                value={revenueAtRisk}
                                onChange={(e) => setRevenueAtRisk(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 focus:outline-hidden"
                            />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 pt-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={isClientVisible}
                            onChange={(e) => setIsClientVisible(e.target.checked)}
                            className="rounded border-zinc-300 text-indigo-600 focus:ring-0"
                        />
                        <span className="text-xs font-medium text-zinc-700">Make visible in Client Portal</span>
                    </label>

                    <div className="flex justify-end gap-2 pt-4 border-t border-zinc-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                        >
                            Create Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}