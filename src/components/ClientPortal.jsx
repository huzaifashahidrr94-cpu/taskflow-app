import { CheckCircle2, Clock, FileText, Globe } from 'lucide-react'

export default function ClientPortal({ workspaceName, tasks = [] }) {
    return (
        <div className="p-8 max-w-5xl mx-auto">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white mb-8 shadow-xl">
                <div className="flex items-center gap-3 mb-2">
                    <Globe className="w-6 h-6" />
                    <h1 className="text-2xl font-bold">{workspaceName || 'Project'} Client Portal</h1>
                </div>
                <p className="text-blue-100 text-sm">
                    Welcome! Track real-time progress on your project milestones and pending deliverables below.
                </p>
            </div>

            {/* Deliverables Overview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-400" />
                    Active Project Deliverables
                </h2>

                {tasks.length === 0 ? (
                    <p className="text-slate-400 text-sm py-4">No active deliverables found for this project.</p>
                ) : (
                    <div className="space-y-3">
                        {tasks.map((item) => (
                            <div
                                key={item.id}
                                className="flex items-center justify-between p-4 rounded-xl bg-slate-950/60 border border-slate-800"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                        {item.status === 'DONE' ? (
                                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                        ) : item.status === 'IN_PROGRESS' ? (
                                            <Clock className="w-5 h-5 text-blue-400 animate-pulse" />
                                        ) : (
                                            <div className="w-2.5 h-2.5 rounded-full bg-slate-600" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-medium text-white text-sm">{item.title}</p>
                                        <p className="text-xs text-slate-400">
                                            Target Completion: {item.due_date || 'TBD'}
                                        </p>
                                    </div>
                                </div>

                                <span
                                    className={`text-xs px-3 py-1 rounded-full font-semibold border ${item.status === 'DONE'
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                            : item.status === 'IN_PROGRESS'
                                                ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                                                : 'bg-slate-800 text-slate-400 border-slate-700'
                                        }`}
                                >
                                    {item.status === 'DONE'
                                        ? 'DELIVERED'
                                        : item.status === 'IN_PROGRESS'
                                            ? 'IN DEVELOPMENT'
                                            : 'UPCOMING'}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}