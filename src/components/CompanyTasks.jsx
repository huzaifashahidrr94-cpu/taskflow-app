import React, { useState } from 'react';
import {
    LayoutGrid,
    List,
    Plus,
    CheckCircle2,
    Clock,
    AlertCircle,
    Eye,
    EyeOff,
    DollarSign,
    CheckSquare,
    ChevronDown,
    ChevronUp,
    Trash2,
    Loader2,
    UserCheck,
    Users,
    X,
    Lock
} from 'lucide-react';

export default function CompanyTasks({
    tasks,
    teamMembers,
    loading,
    userRole,
    currentUser,
    onUpdateField,
    onDeleteTask,
    onOpenModal
}) {
    const isAdmin = userRole === 'admin';
    const [viewMode, setViewMode] = useState('list');
    const [taskFilter, setTaskFilter] = useState(isAdmin ? 'all' : 'my_tasks');
    const [expandedTaskId, setExpandedTaskId] = useState(null);
    const [newSubtaskText, setNewSubtaskText] = useState('');

    const myName = currentUser?.fullName || currentUser?.name || '';

    // Wrapper function to notify sidebar badge listeners on status/assignee updates
    const handleFieldUpdate = (taskId, field, value) => {
        onUpdateField(taskId, field, value);
        if (field === 'status' || field === 'assignee') {
            window.dispatchEvent(new Event('taskflow_badge_update'));
        }
    };

    // Filter tasks strictly based on user role
    const filteredTasks = tasks.filter(task => {
        if (!isAdmin || taskFilter === 'my_tasks') {
            if (!task.assignee) return false;
            return (
                task.assignee.toLowerCase() === myName.toLowerCase() ||
                task.assignee.toLowerCase() === currentUser?.name?.toLowerCase()
            );
        }
        return true;
    });

    // Calculate metrics
    const totalRevenueAtRisk = filteredTasks
        .filter(t => t.status !== 'completed' && Number(t.revenue_at_risk) > 0)
        .reduce((acc, t) => acc + Number(t.revenue_at_risk), 0);

    const handleAddSubtask = (taskId, currentSubtasks) => {
        if (!newSubtaskText.trim()) return;
        const updated = [
            ...(Array.isArray(currentSubtasks) ? currentSubtasks : []),
            { id: Date.now(), text: newSubtaskText.trim(), completed: false }
        ];
        handleFieldUpdate(taskId, 'subtasks', updated);
        setNewSubtaskText('');
    };

    const handleToggleSubtask = (taskId, currentSubtasks, subtaskId) => {
        const updated = (Array.isArray(currentSubtasks) ? currentSubtasks : []).map(s =>
            s.id === subtaskId ? { ...s, completed: !s.completed } : s
        );
        handleFieldUpdate(taskId, 'subtasks', updated);
    };

    const handleDeleteSubtask = (taskId, currentSubtasks, subtaskId) => {
        const updated = (Array.isArray(currentSubtasks) ? currentSubtasks : []).filter(s => s.id !== subtaskId);
        handleFieldUpdate(taskId, 'subtasks', updated);
    };

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans bg-zinc-50">

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-zinc-900 tracking-tight flex items-center gap-2">
                        Company Tasks
                        {!isAdmin && (
                            <span className="text-[11px] bg-indigo-50 text-indigo-600 border border-indigo-200 px-2 py-0.5 rounded-full font-semibold uppercase tracking-[0.05em] flex items-center gap-1">
                                <Lock className="w-3 h-3 text-indigo-600" /> Member View
                            </span>
                        )}
                    </h1>
                    <p className="text-zinc-500 text-sm mt-0.5">
                        {isAdmin
                            ? 'Full workspace task management and team oversight.'
                            : 'Tasks specifically assigned to you.'}
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Admin-Only Filter Controls */}
                    {isAdmin && (
                        <div className="bg-white p-1 rounded-lg border border-zinc-200 flex items-center gap-1 shadow-xs">
                            <button
                                onClick={() => setTaskFilter('all')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${taskFilter === 'all'
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                    : 'bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                    }`}
                            >
                                <Users className="w-3.5 h-3.5" /> All Workspace Tasks
                            </button>
                            <button
                                onClick={() => setTaskFilter('my_tasks')}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${taskFilter === 'my_tasks'
                                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                    : 'bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                    }`}
                            >
                                <UserCheck className="w-3.5 h-3.5" /> My Assigned
                            </button>
                        </div>
                    )}

                    {/* View Mode Toggle */}
                    <div className="bg-white p-1 rounded-lg border border-zinc-200 flex items-center gap-1 shadow-xs">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${viewMode === 'list'
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                : 'bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }`}
                        >
                            <List className="w-3.5 h-3.5" /> List
                        </button>
                        <button
                            onClick={() => setViewMode('kanban')}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${viewMode === 'kanban'
                                ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
                                : 'bg-white text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                                }`}
                        >
                            <LayoutGrid className="w-3.5 h-3.5" /> Kanban
                        </button>
                    </div>

                    {isAdmin && (
                        <button
                            onClick={onOpenModal}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg px-4 py-2 text-xs font-semibold transition flex items-center gap-2 cursor-pointer shadow-xs"
                        >
                            <Plus className="w-4 h-4" /> New Task
                        </button>
                    )}
                </div>
            </div>

            {/* Metric Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
                <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-500">
                        {isAdmin && taskFilter === 'all' ? 'Total Workspace Queue' : 'My Assigned Queue'}
                    </span>
                    <p className="text-3xl font-extrabold text-zinc-900 mt-2 tabular-nums">{filteredTasks.length}</p>
                    <span className="inline-block mt-3 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full text-[11px] font-semibold uppercase tracking-[0.05em] px-2.5 py-0.5">
                        Real-time Sync
                    </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-500">Revenue at Risk</span>
                    <p className="text-3xl font-extrabold text-zinc-900 mt-2 tabular-nums">
                        ${totalRevenueAtRisk.toLocaleString()}
                    </p>
                    <span className={`inline-block mt-3 rounded-full text-[11px] font-semibold uppercase tracking-[0.05em] px-2.5 py-0.5 border ${totalRevenueAtRisk > 0 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-emerald-50 text-emerald-600 border-emerald-200'
                        }`}>
                        {totalRevenueAtRisk > 0 ? '🚨 Attached Value at Risk' : '✅ No Blocked Deals'}
                    </span>
                </div>

                <div className="bg-white p-5 rounded-xl border border-zinc-200 shadow-xs">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.05em] text-zinc-500">Client Visible</span>
                    <p className="text-3xl font-extrabold text-zinc-900 mt-2 tabular-nums">
                        {filteredTasks.filter(t => t.is_client_visible).length}
                    </p>
                    <span className="inline-block mt-3 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-full text-[11px] font-semibold uppercase tracking-[0.05em] px-2.5 py-0.5">
                        Synced to Portal
                    </span>
                </div>
            </div>

            {/* LIST VIEW */}
            {viewMode === 'list' && (
                <div className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-zinc-50 border-b border-zinc-200">
                                    <th className="w-8 px-4 py-3.5"></th>
                                    <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.05em]">Task & Checklists</th>
                                    <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.05em]">Status</th>
                                    <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.05em]">Priority</th>
                                    <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.05em]">Assignee</th>
                                    <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.05em]">Revenue Link</th>
                                    <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.05em]">Portal</th>
                                    {isAdmin && <th className="px-4 py-3.5 text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.05em] text-right">Action</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-200">
                                {loading ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 8 : 7} className="px-6 py-12 text-center text-zinc-500">
                                            <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                                            Loading tasks...
                                        </td>
                                    </tr>
                                ) : filteredTasks.length === 0 ? (
                                    <tr>
                                        <td colSpan={isAdmin ? 8 : 7} className="px-6 py-16 text-center">
                                            <CheckCircle2 className="w-8 h-8 text-zinc-400 mx-auto mb-2" />
                                            <h3 className="text-base font-semibold text-zinc-900 mb-0.5">No assigned tasks found</h3>
                                            <p className="text-xs text-zinc-500">
                                                {isAdmin ? 'No tasks in workspace.' : 'You have no pending tasks assigned to you right now.'}
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredTasks.map((task) => {
                                        const subtaskList = Array.isArray(task.subtasks) ? task.subtasks : [];
                                        const completedSubtasks = subtaskList.filter(s => s.completed).length;
                                        const progressPercent = subtaskList.length > 0 ? Math.round((completedSubtasks / subtaskList.length) * 100) : 0;
                                        const isExpanded = expandedTaskId === task.id;

                                        return (
                                            <React.Fragment key={task.id}>
                                                <tr className="hover:bg-zinc-50 transition group">
                                                    <td className="px-4 py-4 text-center">
                                                        <button
                                                            onClick={() => setExpandedTaskId(isExpanded ? null : task.id)}
                                                            className="text-zinc-500 hover:text-zinc-900 p-1 rounded-md hover:bg-zinc-100 transition cursor-pointer"
                                                        >
                                                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                        </button>
                                                    </td>

                                                    <td className="px-4 py-4 min-w-[200px]">
                                                        {isAdmin ? (
                                                            <input
                                                                type="text"
                                                                value={task.title}
                                                                onChange={(e) => handleFieldUpdate(task.id, 'title', e.target.value)}
                                                                className="bg-transparent border border-transparent hover:border-zinc-200 focus:border-indigo-600 rounded-md px-2 py-1 text-sm font-semibold text-zinc-900 focus:outline-hidden w-full transition"
                                                            />
                                                        ) : (
                                                            <span className="text-sm font-semibold text-zinc-900 px-2">{task.title}</span>
                                                        )}
                                                        {subtaskList.length > 0 && (
                                                            <div className="flex items-center gap-2 mt-1 px-2">
                                                                <div className="flex-1 h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                                    <div
                                                                        className="h-full bg-indigo-600 transition-all duration-300"
                                                                        style={{ width: `${progressPercent}%` }}
                                                                    />
                                                                </div>
                                                                <span className="text-[10px] font-semibold text-zinc-500 tabular-nums">
                                                                    {completedSubtasks}/{subtaskList.length} ({progressPercent}%)
                                                                </span>
                                                            </div>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        <select
                                                            value={task.status || 'todo'}
                                                            onChange={(e) => handleFieldUpdate(task.id, 'status', e.target.value)}
                                                            className="bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 px-2.5 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-indigo-600/20 cursor-pointer"
                                                        >
                                                            <option value="todo">TO DO</option>
                                                            <option value="in_progress">IN PROGRESS</option>
                                                            <option value="completed">COMPLETED</option>
                                                        </select>
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {isAdmin ? (
                                                            <select
                                                                value={task.priority || 'medium'}
                                                                onChange={(e) => handleFieldUpdate(task.id, 'priority', e.target.value)}
                                                                className={`border rounded-lg text-xs font-bold px-2.5 py-1.5 focus:outline-hidden cursor-pointer ${task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                    task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                        'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                                    }`}
                                                            >
                                                                <option value="low">LOW</option>
                                                                <option value="medium">MEDIUM</option>
                                                                <option value="high">HIGH</option>
                                                            </select>
                                                        ) : (
                                                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                                task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                                    'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                                }`}>
                                                                {(task.priority || 'LOW').toUpperCase()}
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {isAdmin ? (
                                                            <select
                                                                value={task.assignee || ''}
                                                                onChange={(e) => handleFieldUpdate(task.id, 'assignee', e.target.value || null)}
                                                                className="bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-medium text-zinc-900 px-2.5 py-1.5 focus:outline-hidden cursor-pointer"
                                                            >
                                                                <option value="">Unassigned</option>
                                                                {teamMembers.map((m) => {
                                                                    const name = m.profiles?.full_name || m.user_id;
                                                                    return <option key={m.user_id} value={name}>{name}</option>;
                                                                })}
                                                            </select>
                                                        ) : (
                                                            <span className="text-xs font-medium text-zinc-900">{task.assignee || 'Unassigned'}</span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {isAdmin ? (
                                                            <div className="relative flex items-center">
                                                                <span className="absolute left-2.5 text-xs text-zinc-500 font-bold">$</span>
                                                                <input
                                                                    type="number"
                                                                    placeholder="0"
                                                                    value={task.revenue_at_risk || ''}
                                                                    onChange={(e) => handleFieldUpdate(task.id, 'revenue_at_risk', Number(e.target.value))}
                                                                    className="w-24 pl-6 pr-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-xs font-semibold text-zinc-900 tabular-nums focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                                                                />
                                                            </div>
                                                        ) : (
                                                            <span className="text-xs font-semibold text-zinc-900 tabular-nums">${Number(task.revenue_at_risk || 0).toLocaleString()}</span>
                                                        )}
                                                    </td>

                                                    <td className="px-4 py-4">
                                                        {isAdmin ? (
                                                            <button
                                                                onClick={() => handleFieldUpdate(task.id, 'is_client_visible', !task.is_client_visible)}
                                                                className={`p-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition cursor-pointer ${task.is_client_visible
                                                                    ? 'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                                    : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-900'
                                                                    }`}
                                                                title="Toggle Client Portal Visibility"
                                                            >
                                                                {task.is_client_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                                            </button>
                                                        ) : (
                                                            <span className="text-xs text-zinc-500">{task.is_client_visible ? 'Visible' : 'Hidden'}</span>
                                                        )}
                                                    </td>

                                                    {isAdmin && (
                                                        <td className="px-4 py-4 text-right">
                                                            <button
                                                                onClick={() => {
                                                                    onDeleteTask(task.id);
                                                                    window.dispatchEvent(new Event('taskflow_badge_update'));
                                                                }}
                                                                className="text-zinc-500 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>

                                                {isExpanded && (
                                                    <tr className="bg-zinc-50/80">
                                                        <td colSpan={isAdmin ? 8 : 7} className="px-12 py-4 border-b border-zinc-200">
                                                            <div className="max-w-xl space-y-3">
                                                                <h4 className="text-[11px] font-semibold text-zinc-500 uppercase tracking-[0.05em] flex items-center gap-1.5">
                                                                    <CheckSquare className="w-3.5 h-3.5 text-indigo-600" /> Subtask Checklist
                                                                </h4>

                                                                <div className="space-y-1.5">
                                                                    {subtaskList.map((st) => (
                                                                        <div key={st.id} className="flex items-center justify-between p-2 bg-white border border-zinc-200 rounded-lg shadow-xs text-xs">
                                                                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                                                                <input
                                                                                    type="checkbox"
                                                                                    checked={st.completed}
                                                                                    onChange={() => handleToggleSubtask(task.id, subtaskList, st.id)}
                                                                                    className="rounded border-zinc-200 text-indigo-600 focus:ring-0 cursor-pointer"
                                                                                />
                                                                                <span className={st.completed ? 'line-through text-zinc-500' : 'text-zinc-900 font-medium'}>
                                                                                    {st.text}
                                                                                </span>
                                                                            </label>
                                                                            <button
                                                                                onClick={() => handleDeleteSubtask(task.id, subtaskList, st.id)}
                                                                                className="text-zinc-500 hover:text-rose-600 p-1 cursor-pointer"
                                                                            >
                                                                                <X className="w-3.5 h-3.5" />
                                                                            </button>
                                                                        </div>
                                                                    ))}
                                                                </div>

                                                                <div className="flex gap-2">
                                                                    <input
                                                                        type="text"
                                                                        placeholder="Add subtask item..."
                                                                        value={newSubtaskText}
                                                                        onChange={(e) => setNewSubtaskText(e.target.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && handleAddSubtask(task.id, subtaskList)}
                                                                        className="flex-1 px-3 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs text-zinc-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-600"
                                                                    />
                                                                    <button
                                                                        onClick={() => handleAddSubtask(task.id, subtaskList)}
                                                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
                                                                    >
                                                                        Add
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </React.Fragment>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* KANBAN VIEW */}
            {viewMode === 'kanban' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { key: 'todo', title: 'To Do', badge: 'bg-zinc-100 text-zinc-900 border border-zinc-200' },
                        { key: 'in_progress', title: 'In Progress', badge: 'bg-amber-50 text-amber-700 border border-amber-200' },
                        { key: 'completed', title: 'Completed', badge: 'bg-emerald-50 text-emerald-700 border border-emerald-200' }
                    ].map((col) => {
                        const columnTasks = filteredTasks.filter(t => (t.status || 'todo') === col.key);

                        return (
                            <div key={col.key} className="bg-zinc-50 border border-zinc-200 rounded-xl p-4 flex flex-col min-h-[500px]">
                                <div className="flex items-center justify-between mb-4 px-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-zinc-900 text-sm">{col.title}</h3>
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold tabular-nums ${col.badge}`}>
                                            {columnTasks.length}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-3 flex-1 overflow-y-auto">
                                    {columnTasks.map((task) => (
                                        <div key={task.id} className="bg-white border border-zinc-200 rounded-xl p-4 shadow-xs hover:shadow-md transition">
                                            <div className="flex items-start justify-between mb-2">
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${task.priority === 'high' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                                                    task.priority === 'medium' ? 'bg-amber-50 text-amber-600 border-amber-200' :
                                                        'bg-indigo-50 text-indigo-600 border-indigo-200'
                                                    }`}>
                                                    {(task.priority || 'LOW').toUpperCase()}
                                                </span>

                                                <div className="flex items-center gap-1">
                                                    {task.is_client_visible && (
                                                        <Eye className="w-3.5 h-3.5 text-indigo-600" title="Visible in Client Portal" />
                                                    )}
                                                    {isAdmin && (
                                                        <button
                                                            onClick={() => {
                                                                onDeleteTask(task.id);
                                                                window.dispatchEvent(new Event('taskflow_badge_update'));
                                                            }}
                                                            className="text-zinc-500 hover:text-rose-600 p-1 cursor-pointer"
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            <h4 className="font-bold text-zinc-900 text-sm mb-2">{task.title}</h4>

                                            {Number(task.revenue_at_risk) > 0 && (
                                                <div className="mb-3 p-1.5 bg-rose-50 border border-rose-200/60 rounded-lg flex items-center gap-1 text-[11px] font-bold text-rose-700 tabular-nums">
                                                    <DollarSign className="w-3.5 h-3.5" />
                                                    <span>${Number(task.revenue_at_risk).toLocaleString()} Risk</span>
                                                </div>
                                            )}

                                            <div className="pt-2 border-t border-zinc-200 flex items-center justify-between text-xs">
                                                <span className="text-zinc-500 text-[11px] font-medium">{task.assignee || 'Unassigned'}</span>
                                                <select
                                                    value={task.status || 'todo'}
                                                    onChange={(e) => handleFieldUpdate(task.id, 'status', e.target.value)}
                                                    className="bg-zinc-50 border border-zinc-200 rounded-lg text-[10px] font-semibold text-zinc-900 px-2 py-1 cursor-pointer"
                                                >
                                                    <option value="todo">TO DO</option>
                                                    <option value="in_progress">IN PROGRESS</option>
                                                    <option value="completed">DONE</option>
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

        </div>
    );
}