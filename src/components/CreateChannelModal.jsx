import React, { useState } from 'react';
import { X, UserPlus } from 'lucide-react';

export default function CreateChannelModal({ isOpen, onClose, onCreateChannel }) {
    const [channelName, setChannelName] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);
    const [selectedRoles, setSelectedRoles] = useState([]);

    // Specific member invitation states
    const [userInput, setUserInput] = useState('');
    const [invitedMembers, setInvitedMembers] = useState([]);

    if (!isOpen) return null;

    const handleAddMember = (e) => {
        e.preventDefault();
        const trimmed = userInput.trim().toLowerCase();
        if (trimmed && !invitedMembers.includes(trimmed)) {
            setInvitedMembers([...invitedMembers, trimmed]);
            setUserInput('');
        }
    };

    const handleRemoveMember = (memberToRemove) => {
        setInvitedMembers(invitedMembers.filter((m) => m !== memberToRemove));
    };

    const toggleRole = (role) => {
        setSelectedRoles((prev) =>
            prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
        );
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onCreateChannel({
            name: channelName,
            isPrivate,
            allowedRoles: selectedRoles,
            allowedMembers: invitedMembers,
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100">

                {/* Header */}
                <div className="flex items-center justify-between pb-4">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-600 text-xl font-bold">#</span>
                        <h2 className="text-lg font-bold text-slate-900">Create Workspace Channel</h2>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Channel Name */}
                    <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Channel Name
                        </label>
                        <input
                            type="text"
                            required
                            placeholder="e.g. social-media"
                            value={channelName}
                            onChange={(e) => setChannelName(e.target.value)}
                            className="w-full rounded-xl bg-slate-50 border border-slate-200 px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                        />
                    </div>

                    {/* Private Toggle */}
                    <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isPrivate}
                                onChange={(e) => setIsPrivate(e.target.checked)}
                                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                            />
                            <div>
                                <span className="text-xs font-bold text-slate-900 block">
                                    Private Channel (Role or Member-Locked)
                                </span>
                                <span className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                                    Only members with selected roles or explicit invitations can view or enter this channel.
                                </span>
                            </div>
                        </label>
                    </div>

                    {/* Private Channel Options */}
                    {isPrivate && (
                        <div className="space-y-4 pt-1">

                            {/* Role Selection */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Allowed Access Roles
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {['Admin', 'Employee', 'Sales'].map((role) => {
                                        const active = selectedRoles.includes(role);
                                        return (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => toggleRole(role)}
                                                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition border ${active
                                                    ? 'bg-blue-50 border-blue-500 text-blue-600'
                                                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Specific Invited Members Input */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                                    Specific Invited Members
                                </label>
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            placeholder="Enter username or email..."
                                            value={userInput}
                                            onChange={(e) => setUserInput(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddMember(e))}
                                            className="w-full rounded-xl bg-slate-50 border border-slate-200 pl-8 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition"
                                        />
                                        <UserPlus className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleAddMember}
                                        className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                                    >
                                        Add
                                    </button>
                                </div>

                                {/* Member Tags */}
                                {invitedMembers.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 pt-1">
                                        {invitedMembers.map((member) => (
                                            <span
                                                key={member}
                                                className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 border border-blue-200 px-2.5 py-1 rounded-full text-[11px] font-medium"
                                            >
                                                {member}
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveMember(member)}
                                                    className="hover:text-rose-600 transition"
                                                >
                                                    <X className="w-3 h-3" />
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </div>

                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-1/2 rounded-xl bg-slate-100 hover:bg-slate-200 py-2.5 text-xs font-bold text-slate-700 transition"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="w-1/2 rounded-xl bg-slate-900 hover:bg-slate-800 py-2.5 text-xs font-bold text-white transition shadow-sm"
                        >
                            Create Channel
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
}