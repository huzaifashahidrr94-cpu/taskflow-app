export default function LightDashboardPreview() {
    return (
        <div className="flex h-screen bg-[#F8FAFC] text-slate-800 font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white/80 backdrop-blur-md border-r border-slate-200/80 p-5 flex flex-col justify-between">
                <div>
                    <div className="flex items-center gap-3 px-2 mb-8">
                        <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center shadow-md shadow-blue-500/20">
                            T
                        </div>
                        <span className="font-bold text-lg text-slate-900 tracking-tight">TaskFlow</span>
                    </div>

                    <nav className="space-y-1">
                        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-slate-100/80 text-blue-600 font-semibold text-sm">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            Company Tasks
                        </button>
                        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition text-sm font-medium">
                            Sales Pipeline
                        </button>
                        <button className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition text-sm font-medium">
                            Team Chat
                        </button>
                    </nav>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200/60 rounded-2xl flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xs">
                        H
                    </div>
                    <div className="text-xs">
                        <p className="font-semibold text-slate-900">Huzaifa</p>
                        <p className="text-slate-500">Admin</p>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 p-8 overflow-y-auto">
                <header className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard Overview</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Welcome back! Here is what's happening today.</p>
                    </div>
                    <button className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-2.5 rounded-xl text-sm transition shadow-sm">
                        + New Task
                    </button>
                </header>

                {/* Content Cards */}
                <div className="grid grid-cols-3 gap-5">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Tasks</span>
                        <p className="text-3xl font-extrabold text-slate-900 mt-2">24</p>
                        <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200/60">
                            ↑ 12% vs last week
                        </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pipeline Value</span>
                        <p className="text-3xl font-extrabold text-slate-900 mt-2">$48,200</p>
                        <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200/60">
                            5 Deals Pending
                        </span>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200/70 shadow-sm shadow-slate-200/50">
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Team Activity</span>
                        <p className="text-3xl font-extrabold text-slate-900 mt-2">98%</p>
                        <span className="inline-block mt-3 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-50 text-purple-600 border border-purple-200/60">
                            All Systems Go
                        </span>
                    </div>
                </div>
            </main>
        </div>
    );
}