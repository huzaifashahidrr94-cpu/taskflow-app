import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
    Inbox,
    MessageSquare,
    TrendingUp,
    Ticket,
    CheckCircle2,
    Archive,
    Send,
    Loader2,
    Mail,
    RotateCcw,
    CheckCheck,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Link,
    List,
    ListOrdered,
    Code,
    Plus,
    Type,
    Smile,
    AtSign,
    Video,
    Mic,
    Paperclip,
    X,
    Eraser,
    Image as ImageIcon
} from 'lucide-react';

export default function UnifiedInbox({ workspaceId, currentUser }) {
    const userName = currentUser?.fullName || currentUser?.name || 'User';

    const [activities, setActivities] = useState([]);
    const [filter, setFilter] = useState('all');
    const [loading, setLoading] = useState(true);
    const [selectedActivity, setSelectedActivity] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Rich Composer State
    const [attachments, setAttachments] = useState([]);
    const [showFormatting, setShowFormatting] = useState(true);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);

    // Active format states for highlighting toolbar buttons
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strike: false,
        ul: false,
        ol: false,
    });

    const editorRef = useRef(null);
    const fileInputRef = useRef(null);
    const timerRef = useRef(null);

    const fetchActivities = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('activity_feed')
                .select('*')
                .order('created_at', { ascending: false });

            if (!error && data && data.length > 0) {
                setActivities(data);
                setSelectedActivity(data[0]);
            } else {
                const defaultActivities = [
                    {
                        id: 'act-1',
                        type: 'mention',
                        category: 'Chat Mention',
                        title: `Alex mentioned ${userName} in Team Chat`,
                        snippet: `@${userName} Could you review the updated API endpoints for the client portal auth flow?`,
                        sender: 'Alex Johnson',
                        read: false,
                        archived: false,
                        created_at: '10:15 AM'
                    },
                    {
                        id: 'act-2',
                        type: 'deal',
                        category: 'Sales Pipeline',
                        title: 'Enterprise Software License moved to Proposal Sent',
                        snippet: 'Acme Corp deal updated to $15,000 ARR. Requires contract signature.',
                        sender: 'Sales System',
                        read: true,
                        archived: false,
                        created_at: 'Yesterday'
                    }
                ];
                setActivities(defaultActivities);
                setSelectedActivity(defaultActivities[0]);
            }
        } catch (err) {
            console.error('Unexpected inbox error:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (workspaceId) fetchActivities();

        const channel = supabase
            .channel('activity_feed_realtime')
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'activity_feed' },
                (payload) => {
                    setActivities((prev) => [payload.new, ...prev]);
                    setSelectedActivity((prev) => prev || payload.new);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [workspaceId]);

    // Auto-read selected notification on view
    useEffect(() => {
        if (selectedActivity && !selectedActivity.read) {
            markAsRead(selectedActivity.id);
        }
    }, [selectedActivity?.id]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const markAsRead = async (id) => {
        setActivities((prev) =>
            prev.map((a) => (a.id === id ? { ...a, read: true } : a))
        );
        setSelectedActivity((prev) => (prev?.id === id ? { ...prev, read: true } : prev));

        try {
            await supabase
                .from('activity_feed')
                .update({ read: true })
                .eq('id', id);
        } catch (err) {
            console.warn('Saved read state locally');
        } finally {
            window.dispatchEvent(new Event('taskflow_badge_update'));
        }
    };

    const markAllAsRead = async () => {
        setActivities((prev) => prev.map((a) => ({ ...a, read: true })));
        if (selectedActivity) {
            setSelectedActivity((prev) => (prev ? { ...prev, read: true } : null));
        }
        triggerToast('All notifications marked as read');

        try {
            await supabase
                .from('activity_feed')
                .update({ read: true })
                .eq('read', false);
        } catch (err) {
            console.warn('Marked all read locally');
        } finally {
            window.dispatchEvent(new Event('taskflow_badge_update'));
        }
    };

    const handleArchive = async (id) => {
        setActivities((prev) =>
            prev.map((a) => (a.id === id ? { ...a, archived: true } : a))
        );
        setSelectedActivity((prev) => (prev?.id === id ? { ...prev, archived: true } : prev));
        triggerToast('Notification moved to Archive');

        try {
            await supabase.from('activity_feed').update({ archived: true }).eq('id', id);
        } catch (err) {
            console.warn('Archived locally:', err.message);
        } finally {
            window.dispatchEvent(new Event('taskflow_badge_update'));
        }
    };

    const handleUnarchive = async (id) => {
        setActivities((prev) =>
            prev.map((a) => (a.id === id ? { ...a, archived: false } : a))
        );
        setSelectedActivity((prev) => (prev?.id === id ? { ...prev, archived: false } : prev));
        triggerToast('Notification restored to Inbox');

        try {
            await supabase.from('activity_feed').update({ archived: false }).eq('id', id);
        } catch (err) {
            console.warn('Restored locally:', err.message);
        } finally {
            window.dispatchEvent(new Event('taskflow_badge_update'));
        }
    };

    // --- SELECTION & COMMAND STATE TRACKING ---
    const updateActiveFormats = () => {
        try {
            setActiveFormats({
                bold: document.queryCommandState('bold'),
                italic: document.queryCommandState('italic'),
                underline: document.queryCommandState('underline'),
                strike: document.queryCommandState('strikethrough'),
                ul: document.queryCommandState('insertUnorderedList'),
                ol: document.queryCommandState('insertOrderedList'),
            });
        } catch (e) {
            // Ignore document state query errors on empty selection
        }
    };

    const execCommand = (command, value = null) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand(command, false, value);
            updateActiveFormats();
        }
    };

    const handleAddLink = () => {
        const url = prompt('Enter link URL:', 'https://');
        if (url) execCommand('createLink', url);
    };

    const handleClearEditor = () => {
        if (editorRef.current) {
            editorRef.current.innerHTML = '';
            editorRef.current.focus();
            updateActiveFormats();
        }
    };

    const handleInsertText = (text) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, text);
            updateActiveFormats();
        }
    };

    const handleInsertMention = () => {
        const targetName = selectedActivity?.sender || 'team';
        if (editorRef.current) {
            editorRef.current.focus();
            const html = `<span style="color: #4f46e5; font-weight: 700; background-color: #eef2ff; padding: 2px 6px; border-radius: 6px;">@${targetName}</span>&nbsp;`;
            document.execCommand('insertHTML', false, html);
            updateActiveFormats();
        }
    };

    // Attachment Handlers
    const handleFileUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        const newAttachments = files.map((f) => ({
            id: 'file-' + Date.now() + Math.random(),
            name: f.name,
            size: (f.size / 1024).toFixed(1) + ' KB',
            type: f.type.startsWith('image/') ? 'image' : 'file'
        }));

        setAttachments((prev) => [...prev, ...newAttachments]);
        triggerToast(`Attached ${files.length} file(s)`);
    };

    const removeAttachment = (id) => {
        setAttachments((prev) => prev.filter((a) => a.id !== id));
    };

    // Voice Note Recorder Simulation
    const toggleRecording = () => {
        if (isRecording) {
            clearInterval(timerRef.current);
            setIsRecording(false);
            setAttachments((prev) => [
                ...prev,
                {
                    id: 'audio-' + Date.now(),
                    name: `Voice Note (${recordingTime}s).mp3`,
                    size: '120 KB',
                    type: 'audio'
                }
            ]);
            setRecordingTime(0);
            triggerToast('Voice note attached');
        } else {
            setIsRecording(true);
            setRecordingTime(0);
            timerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        }
    };

    const handleQuickReply = (e) => {
        e.preventDefault();
        const editorText = editorRef.current?.innerText?.trim() || '';

        if ((!editorText && attachments.length === 0) || !selectedActivity) return;

        const senderName = selectedActivity.sender || 'sender';
        const attachInfo = attachments.length > 0 ? `\n\n📎 Attachments: ${attachments.map(a => a.name).join(', ')}` : '';

        const updatedSnippet = `${selectedActivity.snippet}\n\n👉 Your Reply (${userName}): ${editorText || 'Sent attachments'}${attachInfo}`;

        setSelectedActivity((prev) => ({
            ...prev,
            snippet: updatedSnippet
        }));

        setActivities((prev) =>
            prev.map((a) =>
                a.id === selectedActivity.id
                    ? { ...a, snippet: updatedSnippet }
                    : a
            )
        );

        triggerToast(`Reply sent to ${senderName}!`);
        if (editorRef.current) editorRef.current.innerHTML = '';
        setAttachments([]);
        updateActiveFormats();
    };

    const filteredActivities = activities.filter((a) => {
        if (filter === 'archived') return a.archived === true;
        if (a.archived) return false;

        if (filter === 'mentions') return a.type === 'mention';
        if (filter === 'deals') return a.type === 'deal';
        if (filter === 'tickets') return a.type === 'ticket';
        return true;
    });

    const getActivityIcon = (type) => {
        switch (type) {
            case 'mention':
                return <MessageSquare className="w-4 h-4 text-purple-600" />;
            case 'deal':
                return <TrendingUp className="w-4 h-4 text-emerald-600" />;
            case 'ticket':
                return <Ticket className="w-4 h-4 text-sky-600" />;
            default:
                return <Mail className="w-4 h-4 text-indigo-600" />;
        }
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-2" />
                <p className="text-xs font-semibold">Loading Unified Inbox...</p>
            </div>
        );
    }

    return (
        <div className="p-6 w-full font-sans space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Inbox className="w-6 h-6 text-indigo-600" /> Unified Activity Inbox
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Single stream combining chat mentions, deal changes, tickets, and client emails.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={markAllAsRead}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
                    >
                        <CheckCheck className="w-4 h-4 text-indigo-600" /> Mark All Read
                    </button>

                    {/* Filter Pills */}
                    <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200/80 text-xs font-bold">
                        {['all', 'mentions', 'deals', 'tickets', 'archived'].map((f) => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={`px-3.5 py-1.5 rounded-xl capitalize transition cursor-pointer ${filter === f
                                        ? 'bg-white text-slate-900 shadow-2xs'
                                        : 'text-slate-500 hover:text-slate-900'
                                    }`}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Main Split Workbench */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left 5 Cols: Notifications Feed */}
                <div className="lg:col-span-5 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs space-y-2.5 max-h-[600px] overflow-y-auto">
                    {filteredActivities.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 my-auto">
                            <Inbox className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="text-xs font-semibold">No items in this category</p>
                        </div>
                    ) : (
                        filteredActivities.map((act) => {
                            const isSelected = selectedActivity?.id === act.id;
                            const isUnread = !act.read;

                            return (
                                <div
                                    key={act.id}
                                    onClick={() => {
                                        setSelectedActivity(act);
                                        markAsRead(act.id);
                                    }}
                                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1.5 ${isSelected
                                            ? 'bg-indigo-50/90 border-indigo-300 shadow-xs ring-1 ring-indigo-500/20'
                                            : isUnread
                                                ? 'bg-slate-900 border-slate-800 text-white shadow-md hover:bg-slate-800'
                                                : 'bg-white border-slate-200/60 hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-lg border shadow-2xs ${isUnread && !isSelected ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200/60'
                                                }`}>
                                                {getActivityIcon(act.type)}
                                            </div>
                                            <span className={`text-[10px] font-extrabold uppercase tracking-wider ${isUnread && !isSelected ? 'text-indigo-400' : 'text-slate-500'
                                                }`}>
                                                {act.category}
                                            </span>
                                            {isUnread && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" title="Unread Message" />
                                            )}
                                        </div>

                                        <span className={`text-[10px] font-medium ${isUnread && !isSelected ? 'text-slate-400' : 'text-slate-400'
                                            }`}>
                                            {act.created_at}
                                        </span>
                                    </div>

                                    <p className={`text-xs font-extrabold line-clamp-1 ${isUnread && !isSelected ? 'text-white' : 'text-slate-900'
                                        }`}>
                                        {act.title}
                                    </p>
                                    <p className={`text-[11px] line-clamp-2 ${isUnread && !isSelected ? 'text-slate-300' : 'text-slate-500'
                                        }`}>
                                        {act.snippet}
                                    </p>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Right 7 Cols: Selected Item Details & Visual Rich Reply Composer */}
                <div className="lg:col-span-7 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col justify-between min-h-[480px]">
                    {selectedActivity ? (
                        <div className="space-y-6">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2.5 rounded-2xl bg-indigo-50 border border-indigo-100">
                                        {getActivityIcon(selectedActivity.type)}
                                    </div>
                                    <div>
                                        <span className="text-[10px] font-extrabold text-indigo-700 uppercase tracking-wider">
                                            {selectedActivity.category}
                                        </span>
                                        <h3 className="text-base font-black text-slate-900">{selectedActivity.title}</h3>
                                    </div>
                                </div>

                                {selectedActivity.archived ? (
                                    <button
                                        onClick={() => handleUnarchive(selectedActivity.id)}
                                        className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition"
                                    >
                                        <RotateCcw className="w-3.5 h-3.5" /> Restore to Inbox
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => handleArchive(selectedActivity.id)}
                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                                        title="Archive Notification"
                                    >
                                        <Archive className="w-4 h-4" />
                                    </button>
                                )}
                            </div>

                            <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                                <div className="flex items-center justify-between text-xs text-slate-500 font-semibold">
                                    <span>From: {selectedActivity.sender || 'Unknown'}</span>
                                    <span>Received: {selectedActivity.created_at}</span>
                                </div>
                                <p className="text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-wrap">
                                    {selectedActivity.snippet}
                                </p>
                            </div>

                            {/* RICH CHAT COMPOSER WITH ACTIVE BUTTON HIGHLIGHTING */}
                            <form onSubmit={handleQuickReply} className="space-y-2 pt-2">
                                <label className="block text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                                    Quick Reply / Note
                                </label>

                                <div className="border border-slate-200/90 rounded-2xl overflow-hidden bg-slate-50/50 focus-within:border-indigo-500/50 focus-within:ring-2 focus-within:ring-indigo-500/10 transition-all">
                                    {/* Top Rich Formatting Toolbar */}
                                    {showFormatting && (
                                        <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200/70 flex items-center justify-between text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); execCommand('bold'); }}
                                                    className={`p-1.5 rounded-lg cursor-pointer transition ${activeFormats.bold ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                                                        }`}
                                                    title="Bold"
                                                >
                                                    <Bold className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); execCommand('italic'); }}
                                                    className={`p-1.5 rounded-lg cursor-pointer transition ${activeFormats.italic ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                                                        }`}
                                                    title="Italic"
                                                >
                                                    <Italic className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); execCommand('underline'); }}
                                                    className={`p-1.5 rounded-lg cursor-pointer transition ${activeFormats.underline ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                                                        }`}
                                                    title="Underline"
                                                >
                                                    <Underline className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); execCommand('strikeThrough'); }}
                                                    className={`p-1.5 rounded-lg cursor-pointer transition ${activeFormats.strike ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                                                        }`}
                                                    title="Strikethrough"
                                                >
                                                    <Strikethrough className="w-3.5 h-3.5" />
                                                </button>

                                                <span className="w-px h-3.5 bg-slate-300 mx-1" />

                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); handleAddLink(); }}
                                                    className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer transition text-slate-700"
                                                    title="Insert Link"
                                                >
                                                    <Link className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); execCommand('insertUnorderedList'); }}
                                                    className={`p-1.5 rounded-lg cursor-pointer transition ${activeFormats.ul ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                                                        }`}
                                                    title="Bullet List"
                                                >
                                                    <List className="w-3.5 h-3.5" />
                                                </button>

                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); execCommand('insertOrderedList'); }}
                                                    className={`p-1.5 rounded-lg cursor-pointer transition ${activeFormats.ol ? 'bg-indigo-600 text-white font-bold shadow-2xs' : 'hover:bg-slate-200 text-slate-700'
                                                        }`}
                                                    title="Numbered List"
                                                >
                                                    <ListOrdered className="w-3.5 h-3.5" />
                                                </button>

                                                <span className="w-px h-3.5 bg-slate-300 mx-1" />

                                                <button
                                                    type="button"
                                                    onMouseDown={(e) => { e.preventDefault(); execCommand('formatBlock', '<pre>'); }}
                                                    className="p-1.5 hover:bg-slate-200 rounded-lg cursor-pointer transition text-slate-700"
                                                    title="Code Block"
                                                >
                                                    <Code className="w-3.5 h-3.5" />
                                                </button>
                                            </div>

                                            <button
                                                type="button"
                                                onClick={handleClearEditor}
                                                className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer"
                                                title="Clear Editor"
                                            >
                                                <Eraser className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    )}

                                    {/* VISUAL EDITABLE AREA WITH OVERRIDDEN TAILWIND LIST STYLES */}
                                    <div
                                        ref={editorRef}
                                        contentEditable
                                        onKeyUp={updateActiveFormats}
                                        onMouseUp={updateActiveFormats}
                                        onSelect={updateActiveFormats}
                                        className="w-full min-h-[80px] max-h-[160px] overflow-y-auto px-3.5 py-2.5 bg-transparent text-xs text-slate-900 focus:outline-none leading-relaxed border-none empty:before:content-[attr(data-placeholder)] empty:before:text-slate-400 empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_u]:underline"
                                        data-placeholder={`Reply directly to ${selectedActivity.sender || 'sender'}...`}
                                    />

                                    {/* Pending Attachments Bar */}
                                    {attachments.length > 0 && (
                                        <div className="px-3 py-1.5 bg-slate-100/60 border-t border-slate-200/60 flex flex-wrap gap-1.5">
                                            {attachments.map((file) => (
                                                <span
                                                    key={file.id}
                                                    className="text-[10px] font-bold text-slate-700 bg-white border border-slate-200 px-2 py-1 rounded-lg flex items-center gap-1.5 shadow-2xs"
                                                >
                                                    {file.type === 'image' ? (
                                                        <ImageIcon className="w-3 h-3 text-indigo-500" />
                                                    ) : file.type === 'audio' ? (
                                                        <Mic className="w-3 h-3 text-rose-500" />
                                                    ) : (
                                                        <Paperclip className="w-3 h-3 text-slate-400" />
                                                    )}
                                                    <span className="truncate max-w-[120px]">{file.name}</span>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAttachment(file.id)}
                                                        className="text-slate-400 hover:text-rose-600 cursor-pointer"
                                                    >
                                                        <X className="w-3 h-3" />
                                                    </button>
                                                </span>
                                            ))}
                                        </div>
                                    )}

                                    {/* Bottom Action Bar */}
                                    <div className="px-3 py-2 bg-slate-100/40 border-t border-slate-200/60 flex items-center justify-between">
                                        <div className="flex items-center gap-1">
                                            <input
                                                type="file"
                                                ref={fileInputRef}
                                                onChange={handleFileUpload}
                                                multiple
                                                className="hidden"
                                            />

                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                className="p-1.5 rounded-lg bg-slate-200/80 hover:bg-slate-300 text-slate-700 cursor-pointer transition"
                                                title="Attach File or Image"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => setShowFormatting(!showFormatting)}
                                                className={`p-1.5 rounded-lg text-slate-700 cursor-pointer transition ${showFormatting ? 'bg-indigo-100 text-indigo-700 font-bold' : 'hover:bg-slate-200/80'
                                                    }`}
                                                title="Toggle Text Formatting Bar"
                                            >
                                                <Type className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleInsertText(' 😊')}
                                                className="p-1.5 text-slate-500 hover:bg-slate-200/80 rounded-lg cursor-pointer"
                                                title="Add Emoji"
                                            >
                                                <Smile className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={handleInsertMention}
                                                className="p-1.5 text-slate-500 hover:bg-slate-200/80 rounded-lg cursor-pointer"
                                                title="Mention User"
                                            >
                                                <AtSign className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => triggerToast('Video recording launched')}
                                                className="p-1.5 text-slate-500 hover:bg-slate-200/80 rounded-lg cursor-pointer"
                                                title="Attach Video"
                                            >
                                                <Video className="w-3.5 h-3.5" />
                                            </button>

                                            <button
                                                type="button"
                                                onClick={toggleRecording}
                                                className={`p-1.5 rounded-lg cursor-pointer transition ${isRecording
                                                        ? 'bg-rose-500 text-white animate-pulse'
                                                        : 'text-rose-500 hover:bg-rose-50'
                                                    }`}
                                                title={isRecording ? 'Stop Recording' : 'Record Voice Note'}
                                            >
                                                <Mic className="w-3.5 h-3.5" />
                                            </button>

                                            {isRecording && (
                                                <span className="text-[10px] font-bold text-rose-600 animate-pulse ml-1">
                                                    {recordingTime}s
                                                </span>
                                            )}
                                        </div>

                                        <button
                                            type="submit"
                                            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm transition"
                                        >
                                            Send <Send className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 my-auto">
                            <Inbox className="w-10 h-10 mb-2 text-slate-300" />
                            <p className="text-xs font-bold text-slate-500">Select an item from the inbox stream</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Toast */}
            {toast.show && (
                <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-slate-700">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span className="text-xs font-semibold">{toast.message}</span>
                </div>
            )}
        </div>
    );
}