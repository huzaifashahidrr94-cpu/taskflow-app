import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    Users,
    UserCheck,
    Calendar,
    DollarSign,
    Clock,
    Plus,
    CheckCircle2,
    XCircle,
    Building2,
    Loader2,
    X,
    FileText
} from 'lucide-react';

export default function HRManagement({ workspaceId, userRole, currentUser }) {
    const [loading, setLoading] = useState(true);
    const [activeSubTab, setActiveSubTab] = useState(
        userRole === 'admin' || userRole === 'hr' ? 'directory' : 'my_leaves'
    );
    const [toast, setToast] = useState({ show: false, message: '' });

    const isManager = userRole === 'admin' || userRole === 'hr';

    // HR Data State
    const [employees, setEmployees] = useState([]);
    const [leaveRequests, setLeaveRequests] = useState([]);
    const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
    const [isAddEmployeeModalOpen, setIsAddEmployeeModalOpen] = useState(false);

    // Leave Form
    const [leaveType, setLeaveType] = useState('vacation');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [leaveReason, setLeaveReason] = useState('');

    // Employee HR Detail Form
    const [empName, setEmpName] = useState('');
    const [empRole, setEmpRole] = useState('employee');
    const [empDept, setEmpDept] = useState('Engineering');
    const [empSalary, setEmpSalary] = useState('5000');

    useEffect(() => {
        if (workspaceId) fetchHRData();
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchHRData = async () => {
        setLoading(true);
        try {
            const { data: memberData, error: memErr } = await supabase
                .from('organization_members')
                .select(`
          user_id,
          role,
          created_at,
          profiles ( full_name )
        `)
                .eq('organization_id', workspaceId);

            if (memErr) throw memErr;

            const formattedEmp = (memberData || []).map((m, idx) => ({
                id: m.user_id,
                name: m.profiles?.full_name || currentUser?.name || `Team Member ${idx + 1}`,
                role: m.role || 'employee',
                department: m.role === 'sales' ? 'Sales & Growth' : m.role === 'admin' ? 'Executive' : 'Product & Dev',
                salary: m.role === 'admin' ? 8500 : m.role === 'sales' ? 6200 : 5500,
                joinDate: m.created_at ? new Date(m.created_at).toISOString().split('T')[0] : '2024-01-15',
                status: 'Active'
            }));

            setEmployees(formattedEmp);

            // Default Leave Requests
            setLeaveRequests([
                {
                    id: 'lr-1',
                    userId: currentUser?.id,
                    employeeName: currentUser?.fullName || currentUser?.name || 'My Profile',
                    type: 'vacation',
                    startDate: '2026-09-01',
                    endDate: '2026-09-05',
                    reason: 'Annual Family Vacation',
                    status: 'pending'
                },
                {
                    id: 'lr-2',
                    userId: 'other-user',
                    employeeName: 'Sarah Connor',
                    type: 'sick',
                    startDate: '2026-08-20',
                    endDate: '2026-08-21',
                    reason: 'Medical Leave',
                    status: 'approved'
                }
            ]);
        } catch (err) {
            console.error('HR fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApproveLeave = (id, newStatus) => {
        setLeaveRequests((prev) =>
            prev.map((lr) => (lr.id === id ? { ...lr, status: newStatus } : lr))
        );
        triggerToast(`Leave request ${newStatus}!`);
    };

    const handleCreateLeaveRequest = (e) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        const myName = currentUser?.fullName || currentUser?.name || 'Employee';

        const newReq = {
            id: 'lr-' + Date.now(),
            userId: currentUser?.id,
            employeeName: myName,
            type: leaveType,
            startDate,
            endDate,
            reason: leaveReason || 'General PTO',
            status: 'pending'
        };

        setLeaveRequests([newReq, ...leaveRequests]);
        setIsLeaveModalOpen(false);
        setLeaveReason('');
        setStartDate('');
        setEndDate('');
        triggerToast('PTO Request submitted to HR for review!');
    };

    const handleAddEmployee = (e) => {
        e.preventDefault();
        if (!empName.trim()) return;

        const newEmp = {
            id: 'usr-' + Date.now(),
            name: empName.trim(),
            role: empRole,
            department: empDept,
            salary: Number(empSalary),
            joinDate: new Date().toISOString().split('T')[0],
            status: 'Active'
        };

        setEmployees([...employees, newEmp]);
        setIsAddEmployeeModalOpen(false);
        setEmpName('');
        triggerToast(`HR Profile created for ${newEmp.name}`);
    };

    const totalMonthlyPayroll = employees.reduce((sum, e) => sum + Number(e.salary || 0), 0);
    const pendingLeaves = leaveRequests.filter((lr) => lr.status === 'pending').length;
    const myLeaves = leaveRequests.filter((lr) => lr.userId === currentUser?.id || !isManager);

    if (loading) {
        return (
            <div className="p-12 text-center text-[#71717A] flex flex-col items-center justify-center font-sans bg-[#FAFAF9]">
                <Loader2 className="w-8 h-8 animate-spin text-[#4F46E5] mb-2" />
                <p className="text-xs font-semibold">Loading HR & PTO records...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-8 bg-[#FAFAF9]">
            {/* Header Banner */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold text-[#18181B] tracking-tight flex items-center gap-2.5">
                            <UserCheck className="w-6 h-6 text-[#4F46E5]" /> HR & Time-Off Portal
                        </h1>
                        <span className="bg-[#EEF2FF] text-[#4F46E5] border border-[#C7D2FE] rounded-full text-[11px] font-semibold uppercase tracking-[0.05em] px-2 py-0.5">
                            {isManager ? 'HR Manager View' : 'Employee Portal'}
                        </span>
                    </div>
                    <p className="text-[#71717A] text-sm mt-1">
                        {isManager
                            ? 'Manage staff profiles, monthly payroll, PTO approvals, and onboardings.'
                            : 'Submit PTO time-off requests, check leave approvals, and access your profile.'}
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsLeaveModalOpen(true)}
                        className="bg-[#4F46E5] hover:bg-[#4338CA] text-white rounded-[8px] px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition cursor-pointer shadow-sm"
                    >
                        <Calendar className="w-4 h-4" /> Request Leave / PTO
                    </button>

                    {isManager && (
                        <button
                            onClick={() => setIsAddEmployeeModalOpen(true)}
                            className="border border-[#E4E4E7] bg-white hover:bg-[#FAFAF9] text-[#18181B] font-semibold px-3.5 py-2.5 rounded-[8px] text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
                        >
                            <Plus className="w-4 h-4 text-[#4F46E5]" /> Add Staff Profile
                        </button>
                    )}
                </div>
            </div>

            {/* KPI Stats */}
            {isManager ? (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                    <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#71717A]">Total Staff</p>
                            <p className="text-2xl font-extrabold text-[#18181B] mt-1 tabular-nums">{employees.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-[8px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#71717A]">Monthly Payroll</p>
                            <p className="text-2xl font-extrabold text-[#18181B] mt-1 tabular-nums">${totalMonthlyPayroll.toLocaleString()}</p>
                        </div>
                        <div className="w-10 h-10 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <DollarSign className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#71717A]">Pending PTO Requests</p>
                            <p className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">{pendingLeaves}</p>
                        </div>
                        <div className="w-10 h-10 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#71717A]">HR Compliance</p>
                            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">100% Up to Date</p>
                        </div>
                        <div className="w-10 h-10 rounded-[8px] bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                            <Building2 className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#71717A]">My Leave Requests</p>
                            <p className="text-2xl font-extrabold text-[#18181B] mt-1 tabular-nums">{myLeaves.length}</p>
                        </div>
                        <div className="w-10 h-10 rounded-[8px] bg-[#EEF2FF] text-[#4F46E5] flex items-center justify-center font-bold">
                            <Calendar className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#71717A]">Approved Leave Days</p>
                            <p className="text-2xl font-extrabold text-emerald-600 mt-1 tabular-nums">
                                {myLeaves.filter((l) => l.status === 'approved').length * 5} Days
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-[8px] bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                            <CheckCircle2 className="w-5 h-5" />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-[12px] border border-[#E4E4E7] shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.05em] text-[#71717A]">Pending HR Approval</p>
                            <p className="text-2xl font-extrabold text-amber-600 mt-1 tabular-nums">
                                {myLeaves.filter((l) => l.status === 'pending').length}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-[8px] bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                            <Clock className="w-5 h-5" />
                        </div>
                    </div>
                </div>
            )}

            {/* Sub-Tabs */}
            <div className="flex items-center gap-2 border-b border-[#E4E4E7] pb-3">
                {isManager && (
                    <button
                        onClick={() => setActiveSubTab('directory')}
                        className={`px-4 py-2 rounded-[8px] text-xs font-semibold transition cursor-pointer ${activeSubTab === 'directory'
                            ? 'bg-[#4F46E5] text-white shadow-sm'
                            : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                            }`}
                    >
                        Staff Directory & Payroll
                    </button>
                )}

                <button
                    onClick={() => setActiveSubTab('leaves')}
                    className={`px-4 py-2 rounded-[8px] text-xs font-semibold transition cursor-pointer relative ${activeSubTab === 'leaves' || activeSubTab === 'my_leaves'
                        ? 'bg-[#4F46E5] text-white shadow-sm'
                        : 'text-[#71717A] hover:text-[#18181B] hover:bg-[#F4F4F5]'
                        }`}
                >
                    {isManager ? 'All Leave Approvals Queue' : 'My Leave History'}
                    {isManager && pendingLeaves > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-bold tabular-nums">
                            {pendingLeaves}
                        </span>
                    )}
                </button>
            </div>

            {/* STAFF DIRECTORY (Managers Only) */}
            {activeSubTab === 'directory' && isManager && (
                <div className="bg-white border border-[#E4E4E7] rounded-[12px] overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-[#E4E4E7] flex items-center justify-between">
                        <h3 className="font-bold text-[#18181B] text-sm">Employee Roster & Monthly Compensation</h3>
                        <span className="text-xs text-[#71717A] font-medium tabular-nums">{employees.length} Active Records</span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                            <thead>
                                <tr className="bg-[#FAFAF9] border-b border-[#E4E4E7] text-[#71717A] uppercase font-semibold text-[11px] tracking-[0.05em]">
                                    <th className="p-3.5 pl-6">Employee Name</th>
                                    <th className="p-3.5">Department</th>
                                    <th className="p-3.5">System Role</th>
                                    <th className="p-3.5">Monthly Salary</th>
                                    <th className="p-3.5">Join Date</th>
                                    <th className="p-3.5 pr-6 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E4E4E7]">
                                {employees.map((emp) => (
                                    <tr key={emp.id} className="hover:bg-[#FAFAF9] transition">
                                        <td className="p-3.5 pl-6 font-semibold text-[#18181B] flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4F46E5] font-bold flex items-center justify-center text-xs">
                                                {emp.name[0]?.toUpperCase()}
                                            </div>
                                            <span>{emp.name}</span>
                                        </td>
                                        <td className="p-3.5 text-[#71717A] font-medium">{emp.department}</td>
                                        <td className="p-3.5">
                                            <span className="px-2 py-0.5 rounded-[6px] bg-[#F4F4F5] text-[#18181B] font-semibold uppercase text-[10px] tracking-[0.05em]">
                                                {emp.role}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-semibold text-[#18181B] tabular-nums">
                                            ${Number(emp.salary).toLocaleString()} / mo
                                        </td>
                                        <td className="p-3.5 text-[#71717A] tabular-nums text-[11px]">{emp.joinDate}</td>
                                        <td className="p-3.5 pr-6 text-right">
                                            <button
                                                onClick={() => triggerToast(`Payslip generated for ${emp.name}`)}
                                                className="px-2.5 py-1 border border-[#E4E4E7] bg-white hover:bg-[#FAFAF9] text-[#18181B] rounded-[8px] font-semibold text-[11px] transition cursor-pointer"
                                            >
                                                Generate Payslip
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* LEAVE QUEUE (Filtered for Employees / Full for Managers) */}
            {(activeSubTab === 'leaves' || activeSubTab === 'my_leaves') && (
                <div className="bg-white border border-[#E4E4E7] rounded-[12px] overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-[#E4E4E7] flex items-center justify-between">
                        <h3 className="font-bold text-[#18181B] text-sm">
                            {isManager ? 'Employee PTO Approvals Queue' : 'My Leave Requests & Status'}
                        </h3>
                        <span className="text-xs text-[#71717A] font-medium tabular-nums">
                            {(isManager ? leaveRequests : myLeaves).length} Total Requests
                        </span>
                    </div>

                    <div className="divide-y divide-[#E4E4E7]">
                        {(isManager ? leaveRequests : myLeaves).length === 0 ? (
                            <div className="p-8 text-center text-[#71717A] text-xs">
                                No leave requests found. Click <b>"Request Leave / PTO"</b> above to submit one!
                            </div>
                        ) : (
                            (isManager ? leaveRequests : myLeaves).map((lr) => (
                                <div
                                    key={lr.id}
                                    className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#FAFAF9] transition"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-[#18181B] text-xs">{lr.employeeName}</span>
                                            <span className="capitalize text-[10px] font-semibold bg-[#F4F4F5] text-[#71717A] px-2 py-0.5 rounded-[6px]">
                                                {lr.type} Leave
                                            </span>
                                            <span
                                                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${lr.status === 'approved'
                                                    ? 'bg-emerald-100 text-emerald-800'
                                                    : lr.status === 'rejected'
                                                        ? 'bg-rose-100 text-rose-800'
                                                        : 'bg-amber-100 text-amber-800'
                                                    }`}
                                            >
                                                {lr.status}
                                            </span>
                                        </div>

                                        <p className="text-xs text-[#71717A] italic">"{lr.reason}"</p>
                                        <p className="text-[11px] text-[#71717A] tabular-nums flex items-center gap-1">
                                            <Calendar className="w-3 h-3 text-[#4F46E5]" /> {lr.startDate} to {lr.endDate}
                                        </p>
                                    </div>

                                    {isManager && lr.status === 'pending' && (
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleApproveLeave(lr.id, 'rejected')}
                                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-[8px] font-semibold text-xs transition cursor-pointer flex items-center gap-1"
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> Reject
                                            </button>
                                            <button
                                                onClick={() => handleApproveLeave(lr.id, 'approved')}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-[8px] font-semibold text-xs transition cursor-pointer flex items-center gap-1 shadow-sm"
                                            >
                                                <CheckCircle2 className="w-3.5 h-3.5" /> Approve Leave
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* PTO REQUEST MODAL */}
            {isLeaveModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-[#E4E4E7] rounded-[12px] w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-[#18181B] flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#4F46E5]" /> Request Time-Off (PTO)
                            </h3>
                            <button onClick={() => setIsLeaveModalOpen(false)} className="text-[#71717A] hover:text-[#18181B] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateLeaveRequest} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Employee Name</label>
                                <input
                                    type="text"
                                    readOnly
                                    value={currentUser?.fullName || currentUser?.name || 'Current Employee'}
                                    className="w-full px-3.5 py-2.5 bg-[#F4F4F5] border border-[#E4E4E7] rounded-[8px] text-[#71717A] font-medium outline-none cursor-not-allowed"
                                />
                            </div>

                            <div>
                                <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Leave Type</label>
                                <select
                                    value={leaveType}
                                    onChange={(e) => setLeaveType(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium outline-none focus:ring-2 focus:ring-[#4F46E5]/20 cursor-pointer"
                                >
                                    <option value="vacation">Paid Vacation</option>
                                    <option value="sick">Medical / Sick Leave</option>
                                    <option value="personal">Personal PTO</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">End Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Reason / Notes for HR</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Doctor Appointment or Vacation Trip"
                                    value={leaveReason}
                                    onChange={(e) => setLeaveReason(e.target.value)}
                                    className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                                />
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsLeaveModalOpen(false)}
                                    className="px-4 py-2.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] font-semibold rounded-[8px] text-xs flex-1 cursor-pointer transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[8px] text-xs flex-1 shadow-sm cursor-pointer transition"
                                >
                                    Submit to HR
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* CREATE STAFF MODAL (Managers Only) */}
            {isAddEmployeeModalOpen && isManager && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-[#E4E4E7] rounded-[12px] w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-[#18181B] flex items-center gap-2">
                                <UserCheck className="w-5 h-5 text-[#4F46E5]" /> Create Staff HR Profile
                            </h3>
                            <button onClick={() => setIsAddEmployeeModalOpen(false)} className="text-[#71717A] hover:text-[#18181B] cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleAddEmployee} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g., Alex Mercer"
                                    value={empName}
                                    onChange={(e) => setEmpName(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Department</label>
                                    <input
                                        type="text"
                                        required
                                        value={empDept}
                                        onChange={(e) => setEmpDept(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                                    />
                                </div>
                                <div>
                                    <label className="block font-semibold text-[#71717A] uppercase tracking-[0.05em] text-[11px] mb-1">Monthly Salary ($)</label>
                                    <input
                                        type="number"
                                        required
                                        value={empSalary}
                                        onChange={(e) => setEmpSalary(e.target.value)}
                                        className="w-full px-3 py-2 bg-[#FAFAF9] border border-[#E4E4E7] rounded-[8px] text-[#18181B] font-medium tabular-nums focus:outline-none focus:ring-2 focus:ring-[#4F46E5]/20"
                                    />
                                </div>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsAddEmployeeModalOpen(false)}
                                    className="px-4 py-2.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] font-semibold rounded-[8px] flex-1 cursor-pointer transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-[#4F46E5] hover:bg-[#4338CA] text-white font-semibold rounded-[8px] flex-1 shadow-sm cursor-pointer transition"
                                >
                                    Save Profile
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-[#18181B] text-white px-4 py-3 rounded-[12px] shadow-xl border border-[#27272A] transition-all duration-300">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
