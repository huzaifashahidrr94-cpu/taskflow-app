import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutGrid, ArrowRight, Sparkles, Zap, Users, Bot,
    Check, Star, ShieldCheck, BarChart3, MessageSquare,
    Clock, ChevronDown, Globe, Mail, Lock, Building2,
    CheckCircle2, ArrowUpRight, Headphones, FileText, Send, HelpCircle, Activity
} from 'lucide-react';

// Animation Variants
const pageVariants = {
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -15, transition: { duration: 0.25 } }
};

const floatAnimation = (delay = 0) => ({
    animate: {
        y: [0, -12, 0],
        rotate: [0, 1, 0],
        transition: {
            duration: 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
            delay: delay
        }
    }
});

const pulseGlow = {
    animate: {
        scale: [1, 1.12, 1],
        opacity: [0.3, 0.5, 0.3],
        transition: {
            duration: 6,
            repeat: Infinity,
            ease: "easeInOut"
        }
    }
};

export default function LandingTest() {
    const [activePage, setActivePage] = useState('home');
    const [billingCycle, setBillingCycle] = useState('monthly');
    const [activeFeatureTab, setActiveFeatureTab] = useState(0);
    const [openFaq, setOpenFaq] = useState(null);
    const [formSubmitted, setFormSubmitted] = useState(false);

    const featureModules = [
        {
            id: 'tasks',
            title: 'Task & Project Engine',
            subtitle: 'Organize priorities with zero friction',
            desc: 'Flexible Kanban boards, priority matrices, and automated sprint tracking synced directly to your database.',
            icon: LayoutGrid,
            highlights: ['Custom Workflow Automation', 'Priority Matrix Routing', 'Sub-task Time Tracking', 'Supabase Realtime Sync']
        },
        {
            id: 'crm',
            title: 'Sales & Client CRM',
            subtitle: 'Close deals and issue invoices faster',
            desc: 'Track sales pipelines, manage client contact directories, and generate professional PDF invoices directly from closed deals.',
            icon: BarChart3,
            highlights: ['Visual Sales Pipelines', 'Automated PDF Invoicing', 'Client Portal Integration', 'Revenue Forecasting']
        },
        {
            id: 'chat',
            title: 'Team Collaboration Hub',
            subtitle: 'Instant messaging built for focus',
            desc: 'Channels, direct messages, and code snippet sharing. Convert any chat message into an actionable task with a single click.',
            icon: MessageSquare,
            highlights: ['Threaded Conversations', 'One-Click Task Conversion', 'Granular Role Permissions', 'Low Latency Messaging']
        },
        {
            id: 'ai',
            title: 'AI Workgrid Copilot',
            subtitle: 'Automate weekly management reports',
            desc: 'AI-assisted weekly summaries, intelligent task prioritization, and automated client status updates powered by your workspace data.',
            icon: Bot,
            highlights: ['Weekly Digest Summaries', 'Auto Task Prioritization', 'Smart Search & Retrieval', 'Custom Workflow Triggers']
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white relative overflow-x-hidden">

            {/* Dynamic Floating Ambient Background Glows */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <motion.div
                    {...pulseGlow}
                    className="absolute -top-[10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] bg-blue-400/15 rounded-full blur-[140px]"
                />
                <motion.div
                    animate={{
                        x: [0, 40, 0],
                        y: [0, -30, 0]
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-[40%] -right-[10%] w-[500px] h-[500px] bg-sky-300/20 rounded-full blur-[130px]"
                />
            </div>

            {/* Top Banner */}
            <div className="relative z-50 bg-blue-600 text-white text-xs font-semibold py-2 px-4 text-center flex items-center justify-center gap-2 shadow-sm">
                <motion.div animate={{ rotate: [0, 15, -15, 0] }} transition={{ repeat: Infinity, duration: 2 }}>
                    <Sparkles className="w-3.5 h-3.5" />
                </motion.div>
                <span>Workgrid 2.0 is live! Explore our new CRM and AI Copilot modules.</span>
                <button onClick={() => setActivePage('features')} className="underline font-bold hover:text-blue-100 ml-2">
                    Learn More →
                </button>
            </div>

            {/* Navigation Bar */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
                <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
                    <button onClick={() => setActivePage('home')} className="flex items-center gap-3 text-left group">
                        <motion.div
                            whileHover={{ rotate: 90 }}
                            transition={{ type: "spring", stiffness: 200 }}
                            className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-500/25"
                        >
                            <LayoutGrid className="w-5 h-5" />
                        </motion.div>
                        <div>
                            <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-none">Workgrid</span>
                            <span className="text-[10px] font-semibold text-blue-600 uppercase tracking-wider">Unified Workspace</span>
                        </div>
                    </button>

                    {/* Navigation Links */}
                    <nav className="hidden md:flex items-center gap-1 bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200">
                        {[
                            { id: 'home', label: 'Home' },
                            { id: 'features', label: 'Features' },
                            { id: 'pricing', label: 'Pricing' },
                            { id: 'about', label: 'About Us' },
                            { id: 'contact', label: 'Contact' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActivePage(tab.id)}
                                className={`relative px-5 py-2 rounded-xl text-xs font-bold transition-all ${activePage === tab.id ? 'text-blue-600' : 'text-slate-600 hover:text-slate-900'
                                    }`}
                            >
                                {activePage === tab.id && (
                                    <motion.div
                                        layoutId="activeNavBg"
                                        className="absolute inset-0 bg-white rounded-xl shadow-sm border border-slate-200/80"
                                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                    />
                                )}
                                <span className="relative z-10">{tab.label}</span>
                            </button>
                        ))}
                    </nav>

                    <div className="flex items-center gap-3">
                        <button className="text-xs font-bold text-slate-700 hover:text-blue-600 px-4 py-2.5 transition">
                            Sign In
                        </button>
                        <motion.button
                            whileHover={{ scale: 1.04 }}
                            whileTap={{ scale: 0.96 }}
                            onClick={() => setActivePage('pricing')}
                            className="text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl transition shadow-lg shadow-blue-600/30"
                        >
                            Get Started Free
                        </motion.button>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="relative z-10">
                <AnimatePresence mode="wait">

                    {/* HOME PAGE */}
                    {activePage === 'home' && (
                        <motion.div key="home" variants={pageVariants} initial="initial" animate="animate" exit="exit">

                            {/* Hero Section */}
                            <section className="relative pt-20 pb-24 bg-gradient-to-b from-blue-50/60 via-white to-white overflow-hidden">
                                <div className="max-w-7xl mx-auto px-6 text-center relative z-10">

                                    {/* Pulsing Pill Badge */}
                                    <motion.div
                                        initial={{ scale: 0.9, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-100/80 border border-blue-200 text-blue-700 text-xs font-bold mb-8 shadow-sm"
                                    >
                                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                                        <span>Real-time Workspace Orchestration</span>
                                    </motion.div>

                                    <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-8">
                                        One single platform for your <br />
                                        <span className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-600 bg-clip-text text-transparent">
                                            tasks, sales CRM, and team chat.
                                        </span>
                                    </h1>

                                    <p className="text-slate-600 text-lg md:text-xl max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
                                        Eliminate context switching across 5 separate apps. Workgrid unifies task boards, sales pipelines, client invoicing, and AI automations into one fluid interface.
                                    </p>

                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
                                        <motion.button
                                            whileHover={{ y: -3, scale: 1.02 }}
                                            whileTap={{ y: 0 }}
                                            onClick={() => setActivePage('pricing')}
                                            className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm transition shadow-xl shadow-blue-600/30"
                                        >
                                            Start Free 14-Day Trial <ArrowRight className="w-4 h-4" />
                                        </motion.button>
                                        <motion.button
                                            whileHover={{ scale: 1.02 }}
                                            onClick={() => setActivePage('features')}
                                            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm border border-slate-300 transition shadow-sm"
                                        >
                                            Explore All Features
                                        </motion.button>
                                    </div>

                                    {/* Infinite Marquee Ticker */}
                                    <div className="border-y border-slate-200/80 py-4 bg-white/60 backdrop-blur-sm overflow-hidden mb-16">
                                        <motion.div
                                            animate={{ x: [0, -1000] }}
                                            transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
                                            className="flex items-center gap-12 whitespace-nowrap text-xs font-bold text-slate-400 uppercase tracking-widest"
                                        >
                                            <span>⚡ Postman API Connected</span>
                                            <span>•</span>
                                            <span>🛡️ Supabase RLS Row-Level Security</span>
                                            <span>•</span>
                                            <span>📊 Automated PDF Invoicing</span>
                                            <span>•</span>
                                            <span>💬 Realtime Channel Messaging</span>
                                            <span>•</span>
                                            <span>⚡ Postman API Connected</span>
                                            <span>•</span>
                                            <span>🛡️ Supabase RLS Row-Level Security</span>
                                            <span>•</span>
                                            <span>📊 Automated PDF Invoicing</span>
                                        </motion.div>
                                    </div>
                                </div>

                                {/* Live Floating Interactive Dashboard Mockup */}
                                <div className="max-w-6xl mx-auto px-6 relative">

                                    {/* Floating Widget 1 */}
                                    <motion.div
                                        {...floatAnimation(0)}
                                        className="hidden lg:flex items-center gap-3 absolute -top-8 -left-6 z-20 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <Activity className="w-5 h-5 animate-pulse" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">Sprint Velocity</p>
                                            <p className="text-[11px] text-emerald-600 font-semibold">+24% Tasks Completed</p>
                                        </div>
                                    </motion.div>

                                    {/* Floating Widget 2 */}
                                    <motion.div
                                        {...floatAnimation(2.5)}
                                        className="hidden lg:flex items-center gap-3 absolute -bottom-6 -right-6 z-20 bg-white p-4 rounded-2xl border border-slate-200 shadow-xl"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <BarChart3 className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-slate-900">New Deal Closed</p>
                                            <p className="text-[11px] text-blue-600 font-semibold">$18,400 • Enterprise Plan</p>
                                        </div>
                                    </motion.div>

                                    {/* Main Dashboard Screen */}
                                    <div className="rounded-3xl border border-slate-200 bg-slate-950 p-4 shadow-2xl text-white">
                                        <div className="flex items-center justify-between pb-4 border-b border-slate-800 text-xs font-mono text-slate-400">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-rose-500" />
                                                <div className="w-3 h-3 rounded-full bg-amber-500" />
                                                <div className="w-3 h-3 rounded-full bg-emerald-500" />
                                            </div>
                                            <span className="text-slate-300">workgrid.app/workspace/live</span>
                                            <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Realtime Sync Active
                                            </span>
                                        </div>

                                        <div className="grid md:grid-cols-12 gap-6 pt-6 text-left">
                                            <div className="md:col-span-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
                                                <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Active Workspace</p>
                                                <div className="space-y-1">
                                                    <div className="bg-blue-600 text-white font-bold text-xs px-3 py-2.5 rounded-xl flex items-center justify-between">
                                                        <span>Kanban Tasks</span>
                                                        <span className="bg-blue-700 px-1.5 py-0.5 rounded text-[10px]">14</span>
                                                    </div>
                                                    <div className="text-slate-400 hover:bg-slate-800 font-medium text-xs px-3 py-2.5 rounded-xl flex items-center justify-between">
                                                        <span>Sales Pipeline</span>
                                                        <span className="text-emerald-400 font-mono text-[10px]">$48k</span>
                                                    </div>
                                                    <div className="text-slate-400 hover:bg-slate-800 font-medium text-xs px-3 py-2.5 rounded-xl flex items-center justify-between">
                                                        <span>Team Chat</span>
                                                        <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="md:col-span-9 bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-6">
                                                <div className="flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-bold text-base text-white">Live Operations Metrics</h3>
                                                        <p className="text-xs text-slate-400">PostgreSQL table listener connected</p>
                                                    </div>
                                                    <motion.button whileHover={{ scale: 1.05 }} className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg">
                                                        + Add Custom Task
                                                    </motion.button>
                                                </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                                        <p className="text-xs text-slate-400">Pipeline Value</p>
                                                        <p className="text-2xl font-bold text-white mt-1">$142,800</p>
                                                        <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                                                            <motion.div animate={{ width: ["0%", "78%"] }} transition={{ duration: 1.5 }} className="h-full bg-emerald-400" />
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                                        <p className="text-xs text-slate-400">Task Velocity</p>
                                                        <p className="text-2xl font-bold text-blue-400 mt-1">92.4%</p>
                                                        <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                                                            <motion.div animate={{ width: ["0%", "92%"] }} transition={{ duration: 1.5 }} className="h-full bg-blue-500" />
                                                        </div>
                                                    </div>
                                                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                                                        <p className="text-xs text-slate-400">Invoices Issued</p>
                                                        <p className="text-2xl font-bold text-amber-400 mt-1">8 Pending</p>
                                                        <div className="h-1.5 w-full bg-slate-800 rounded-full mt-3 overflow-hidden">
                                                            <motion.div animate={{ width: ["0%", "60%"] }} transition={{ duration: 1.5 }} className="h-full bg-amber-400" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Interactive Features List */}
                            <section className="py-24 bg-slate-50 border-t border-slate-200">
                                <div className="max-w-7xl mx-auto px-6">
                                    <div className="text-center max-w-2xl mx-auto mb-16">
                                        <h2 className="text-3xl font-extrabold text-slate-900 mb-4">Built for maximum focus</h2>
                                        <p className="text-slate-600 text-sm">Everything you need to organize work, close client deals, and coordinate your team.</p>
                                    </div>

                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                                        {[
                                            { icon: LayoutGrid, title: 'Smart Kanban', desc: 'Custom state boards, priority matrices, and sub-task dependencies.' },
                                            { icon: BarChart3, title: 'CRM & Billing', desc: 'Track sales pipelines, log deals, and auto-generate invoice PDFs.' },
                                            { icon: MessageSquare, title: 'Live Team Chat', desc: 'Instant messaging with direct task creation from chat threads.' },
                                            { icon: Bot, title: 'AI Copilot', desc: 'Automated weekly management digests and priority recommendations.' }
                                        ].map((item, idx) => (
                                            <motion.div
                                                key={idx}
                                                whileHover={{ y: -6 }}
                                                className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-sm transition"
                                            >
                                                <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-6">
                                                    <item.icon className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-bold text-slate-900 mb-2">{item.title}</h3>
                                                <p className="text-slate-600 text-xs leading-relaxed">{item.desc}</p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </section>
                        </motion.div>
                    )}

                    {/* FEATURES PAGE */}
                    {activePage === 'features' && (
                        <motion.div key="features" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="py-16 bg-white">
                            <div className="max-w-7xl mx-auto px-6">

                                <div className="text-center max-w-3xl mx-auto mb-16">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                        Platform Features
                                    </span>
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-4">
                                        Four core tools in one interface
                                    </h1>
                                    <p className="text-slate-600 text-base">
                                        Click through the modules below to test our dynamic preview engine.
                                    </p>
                                </div>

                                {/* Tab Switcher */}
                                <div className="flex flex-wrap justify-center gap-3 mb-12">
                                    {featureModules.map((module, idx) => {
                                        const Icon = module.icon;
                                        const isActive = activeFeatureTab === idx;
                                        return (
                                            <button
                                                key={module.id}
                                                onClick={() => setActiveFeatureTab(idx)}
                                                className={`flex items-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-xs transition-all ${isActive
                                                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25'
                                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                    }`}
                                            >
                                                <Icon className="w-4 h-4" />
                                                <span>{module.title}</span>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Animated Detail Container */}
                                <AnimatePresence mode="wait">
                                    <motion.div
                                        key={activeFeatureTab}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.3 }}
                                        className="bg-slate-50 border border-slate-200 rounded-3xl p-8 md:p-12 mb-20"
                                    >
                                        <div className="grid md:grid-cols-2 gap-12 items-center">
                                            <div>
                                                <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-6 shadow-md shadow-blue-500/20">
                                                    {React.createElement(featureModules[activeFeatureTab].icon, { className: "w-6 h-6" })}
                                                </div>
                                                <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2">
                                                    {featureModules[activeFeatureTab].subtitle}
                                                </p>
                                                <h2 className="text-3xl font-extrabold text-slate-900 mb-4">
                                                    {featureModules[activeFeatureTab].title}
                                                </h2>
                                                <p className="text-slate-600 text-sm leading-relaxed mb-8">
                                                    {featureModules[activeFeatureTab].desc}
                                                </p>

                                                <div className="grid grid-cols-2 gap-3 mb-8">
                                                    {featureModules[activeFeatureTab].highlights.map((highlight, hIdx) => (
                                                        <div key={hIdx} className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                                                            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                                                            <span>{highlight}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <button
                                                    onClick={() => setActivePage('pricing')}
                                                    className="inline-flex items-center gap-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-white px-5 py-3 rounded-xl border border-slate-200 shadow-sm"
                                                >
                                                    Try Module Free <ArrowRight className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-md">
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center pb-3 border-b border-slate-100">
                                                        <span className="font-bold text-slate-900 text-sm">Module Connection</span>
                                                        <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 font-bold text-[10px] rounded-full">Live Active</span>
                                                    </div>
                                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                                                        <p className="text-xs font-bold text-slate-800">Database Engine</p>
                                                        <p className="text-xs text-slate-500">Connected directly to Supabase with real-time websocket synchronization.</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </AnimatePresence>

                            </div>
                        </motion.div>
                    )}

                    {/* PRICING PAGE */}
                    {activePage === 'pricing' && (
                        <motion.div key="pricing" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="py-16 bg-white">
                            <div className="max-w-7xl mx-auto px-6">

                                <div className="text-center max-w-3xl mx-auto mb-12">
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                        Transparent Plans
                                    </span>
                                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 mt-4 mb-4">
                                        Simple, flat-rate pricing
                                    </h1>
                                    <p className="text-slate-600 text-base mb-8">
                                        Choose the plan that fits your team. Cancel anytime.
                                    </p>

                                    <div className="inline-flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
                                        <button
                                            onClick={() => setBillingCycle('monthly')}
                                            className={`px-5 py-2 rounded-xl text-xs font-bold transition ${billingCycle === 'monthly' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                                                }`}
                                        >
                                            Monthly Billing
                                        </button>
                                        <button
                                            onClick={() => setBillingCycle('annual')}
                                            className={`px-5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${billingCycle === 'annual' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-600'
                                                }`}
                                        >
                                            Annual Billing <span className="bg-emerald-100 text-emerald-700 text-[10px] px-2 py-0.5 rounded-full font-extrabold">Save 20%</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-20">
                                    {/* Starter */}
                                    <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Starter</h3>
                                            <p className="text-slate-500 text-xs mb-6">Great for small teams getting organized.</p>
                                            <div className="mb-6">
                                                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                                                <span className="text-slate-500 text-xs"> / free forever</span>
                                            </div>
                                            <ul className="space-y-3 text-xs text-slate-700 mb-8">
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Up to 5 team members</li>
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Task Management & Kanban</li>
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Live Team Channels</li>
                                            </ul>
                                        </div>
                                        <button className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition">Get Started Free</button>
                                    </motion.div>

                                    {/* Pro */}
                                    <motion.div whileHover={{ y: -4 }} className="bg-blue-600 text-white border-2 border-blue-600 rounded-3xl p-8 flex flex-col justify-between shadow-2xl shadow-blue-600/30 relative">
                                        <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                                            Most Popular
                                        </span>
                                        <div>
                                            <h3 className="text-xl font-bold text-white mb-2">Pro Team</h3>
                                            <p className="text-blue-100 text-xs mb-6">For growing businesses needing CRM & AI.</p>
                                            <div className="mb-6">
                                                <span className="text-4xl font-extrabold text-white">
                                                    {billingCycle === 'monthly' ? '$29' : '$23'}
                                                </span>
                                                <span className="text-blue-200 text-xs"> / user / month</span>
                                            </div>
                                            <ul className="space-y-3 text-xs text-blue-50 mb-8">
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white shrink-0" /> Unlimited team members</li>
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white shrink-0" /> Full Sales & CRM Pipelines</li>
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white shrink-0" /> AI Copilot Digests</li>
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-white shrink-0" /> Automated PDF Invoicing</li>
                                            </ul>
                                        </div>
                                        <button className="w-full py-3.5 rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-extrabold text-xs transition shadow-md">Start 14-Day Free Trial</button>
                                    </motion.div>

                                    {/* Enterprise */}
                                    <motion.div whileHover={{ y: -4 }} className="bg-white border border-slate-200 rounded-3xl p-8 flex flex-col justify-between shadow-sm">
                                        <div>
                                            <h3 className="text-xl font-bold text-slate-900 mb-2">Enterprise</h3>
                                            <p className="text-slate-500 text-xs mb-6">Custom security, SLA, and dedicated support.</p>
                                            <div className="mb-6">
                                                <span className="text-4xl font-extrabold text-slate-900">Custom</span>
                                            </div>
                                            <ul className="space-y-3 text-xs text-slate-700 mb-8">
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Isolated Supabase Cluster</li>
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> SSO / SAML Authentication</li>
                                                <li className="flex items-center gap-2"><Check className="w-4 h-4 text-blue-600 shrink-0" /> Dedicated Account Manager</li>
                                            </ul>
                                        </div>
                                        <button onClick={() => setActivePage('contact')} className="w-full py-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs transition">Contact Sales</button>
                                    </motion.div>
                                </div>

                            </div>
                        </motion.div>
                    )}

                    {/* ABOUT PAGE */}
                    {activePage === 'about' && (
                        <motion.div key="about" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="py-16 bg-white">
                            <div className="max-w-4xl mx-auto px-6 text-center">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                    Our Mission
                                </span>
                                <h1 className="text-4xl font-extrabold text-slate-900 mt-4 mb-6">
                                    Reengineering everyday workspace efficiency
                                </h1>
                                <p className="text-slate-600 text-base leading-relaxed max-w-2xl mx-auto">
                                    Workgrid was designed to replace slow, disconnected SaaS tools with a clean, unified platform engineered for velocity.
                                </p>
                            </div>
                        </motion.div>
                    )}

                    {/* CONTACT PAGE */}
                    {activePage === 'contact' && (
                        <motion.div key="contact" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="py-16 bg-white max-w-2xl mx-auto px-6">
                            <div className="text-center mb-10">
                                <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                                    Get In Touch
                                </span>
                                <h1 className="text-3xl font-extrabold text-slate-900 mt-4">We are here to help</h1>
                            </div>

                            {formSubmitted ? (
                                <div className="bg-emerald-50 border border-emerald-200 p-8 rounded-2xl text-center space-y-3">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                                    <h3 className="text-lg font-bold text-slate-900">Message Received!</h3>
                                    <button onClick={() => setFormSubmitted(false)} className="text-xs font-bold text-blue-600 underline">Send another message</button>
                                </div>
                            ) : (
                                <form onSubmit={(e) => { e.preventDefault(); setFormSubmitted(true); }} className="bg-slate-50 p-8 rounded-3xl border border-slate-200 space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Work Email</label>
                                        <input required type="email" placeholder="you@company.com" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600" />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Message</label>
                                        <textarea required rows={4} placeholder="How can we assist your team?" className="w-full bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600" />
                                    </div>
                                    <button type="submit" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition shadow-lg shadow-blue-600/25">
                                        Send Message
                                    </button>
                                </form>
                            )}
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-200 bg-slate-900 text-slate-400 text-xs py-8">
                <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold">W</div>
                        <span className="font-extrabold text-white text-sm">Workgrid</span>
                    </div>
                    <p>© 2026 Workgrid Systems Inc. All rights reserved.</p>
                </div>
            </footer>

        </div>
    );
}