import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { toast } from './ToastContainer';
import {
    Bell,
    CheckCheck,
    X,
    MessageSquare
} from 'lucide-react';

export default function NotificationsPopover({ workspaceId, currentUser, setActiveTab, setActiveChannel, onNavigate }) {
    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('unread');
    const popoverRef = useRef(null);

    const unreadCount = notifications.filter((n) => !n.read).length;

    useEffect(() => {
        if (workspaceId) {
            fetchNotifications();

            const channel = supabase
                .channel(`notifs_${workspaceId}`)
                .on(
                    'postgres_changes',
                    { event: 'INSERT', schema: 'public', table: 'activity_feed' },
                    (payload) => {
                        setNotifications((prev) => [payload.new, ...prev]);
                        toast.info(`New notification: ${payload.new.title || 'Workspace activity'}`);
                    }
                )
                .subscribe();

            return () => {
                supabase.removeChannel(channel);
            };
        }
    }, [workspaceId]);

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (popoverRef.current && !popoverRef.current.contains(e.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchNotifications = async () => {
        try {
            const { data, error } = await supabase
                .from('activity_feed')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) setNotifications(data);
        } catch (err) {
            console.error('Error fetching activity notifications:', err);
        }
    };

    const markAsRead = async (id) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        await supabase.from('activity_feed').update({ read: true }).eq('id', id);
    };

    const markAllAsRead = async () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success('All notifications marked as read');
        await supabase
            .from('activity_feed')
            .update({ read: true })
            .eq('read', false);
    };

    const handleNotificationClick = async (item) => {
        if (!item.read) {
            await markAsRead(item.id);
        }

        const channelMatch = (item.title || '').match(/#([\w-]+)/);
        const targetChannel = channelMatch ? channelMatch[1] : 'general';
        const cleanSnippet = (item.snippet || item.content || '').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim();

        const navPayload = {
            channel: targetChannel,
            snippet: cleanSnippet,
            time: Date.now()
        };

        // Queue in localStorage so TeamChat reads it even if unmounted right now
        localStorage.setItem('pending_chat_nav', JSON.stringify(navPayload));

        if (typeof setActiveTab === 'function') setActiveTab('chat');
        if (typeof setActiveChannel === 'function') setActiveChannel(targetChannel);
        if (typeof onNavigate === 'function') onNavigate('chat', navPayload);

        window.dispatchEvent(new CustomEvent('navigate-to-chat', { detail: navPayload }));
        setIsOpen(false);
    };

    const cleanText = (raw) => {
        if (!raw) return 'Updated workspace activity';
        return raw.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Just now';
        const d = new Date(dateStr);
        if (isNaN(d.getTime())) return 'Just now';
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const displayedNotifications = notifications.filter((n) =>
        filter === 'unread' ? !n.read : true
    );

    return (
        <div className="relative" ref={popoverRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                title="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white font-extrabold text-[9px] rounded-full flex items-center justify-center border-2 border-white shadow-2xs">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-3xl shadow-2xl z-50 overflow-hidden font-sans">
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                        <div className="flex items-center gap-2">
                            <h3 className="font-bold text-sm text-slate-900">Activity & Mentions</h3>
                            {unreadCount > 0 && (
                                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-100 text-blue-700 rounded-full">
                                    {unreadCount} new
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setIsOpen(false)}
                                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    <div className="flex border-b border-slate-100 px-4 pt-2 gap-4 text-xs font-semibold text-slate-500">
                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`pb-2 border-b-2 transition cursor-pointer ${filter === 'unread'
                                ? 'border-blue-600 text-blue-600 font-bold'
                                : 'border-transparent hover:text-slate-800'
                                }`}
                        >
                            Unread ({unreadCount})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`pb-2 border-b-2 transition cursor-pointer ${filter === 'all'
                                ? 'border-blue-600 text-blue-600 font-bold'
                                : 'border-transparent hover:text-slate-800'
                                }`}
                        >
                            All Activity
                        </button>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {displayedNotifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs">
                                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="font-semibold">No notifications right now</p>
                                <p className="text-[10px] text-slate-400 mt-0.5">You're all caught up!</p>
                            </div>
                        ) : (
                            displayedNotifications.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleNotificationClick(item)}
                                    className={`w-full text-left p-3.5 hover:bg-slate-50 transition cursor-pointer flex items-start gap-3 text-xs ${!item.read ? 'bg-blue-50/30' : ''
                                        }`}
                                >
                                    <div className="p-2 rounded-xl bg-blue-100/80 text-blue-600 shrink-0 mt-0.5">
                                        <MessageSquare className="w-3.5 h-3.5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-bold text-slate-900 truncate">
                                                {cleanText(item.title || item.sender_name || 'System Update')}
                                            </p>
                                            {!item.read && (
                                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-slate-600 text-[11px] line-clamp-2 mt-0.5 leading-relaxed">
                                            {cleanText(item.snippet || item.content || item.message)}
                                        </p>
                                        <span className="text-[9px] text-slate-400 font-mono mt-1 block">
                                            {formatDate(item.created_at)}
                                        </span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}