import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import {
    Send,
    MessageSquare,
    Search,
    Hash,
    Smile,
    Paperclip,
    Bookmark,
    CornerUpLeft,
    CheckCircle2,
    X,
    User,
    AlertCircle,
    MessageCircle,
    AtSign,
    Activity,
    BarChart2,
    Check,
    Lock,
    Plus,
    UserPlus,
    Mic,
    Square,
    Play,
    Pause,
    Trash2,
    Volume2,
    Download,
    FileText,
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Link as LinkIcon,
    List,
    ListOrdered,
    Type,
    Video,
    Terminal,
    Eraser,
    BellRing
} from 'lucide-react';

const EMOJI_LIST = [
    '😀', '😂', '😍', '🔥', '👍', '🎉',
    '🚀', '❤️', '👀', '✅', '💯', '🙌',
    '⭐', '💡', '📌', '💼', '🎯', '💬',
    '⚡', '👏', '🤖', '🤝', '🥳', '😎'
];

const DEFAULT_CHANNELS = [
    { id: 'general', name: 'general', is_private: false, allowed_roles: ['admin', 'employee', 'sales'], allowed_users: [] },
    { id: 'product-design', name: 'product-design', is_private: false, allowed_roles: ['admin', 'employee', 'sales'], allowed_users: [] },
    { id: 'marketing-launch', name: 'marketing-launch', is_private: false, allowed_roles: ['admin', 'employee', 'sales'], allowed_users: [] },
    { id: 'management-only', name: 'management-only', is_private: true, allowed_roles: ['admin'], allowed_users: [] }
];

export default function TeamChat({ workspaceId, currentUser }) {
    const [allRawMessages, setAllRawMessages] = useState([]);
    const [teamList, setTeamList] = useState([]);
    const [polls, setPolls] = useState([]);
    const [channels, setChannels] = useState(DEFAULT_CHANNELS);

    const [errorMsg, setErrorMsg] = useState('');
    const [chatType, setChatType] = useState('channel');
    const [activeChannel, setActiveChannel] = useState('general');
    const [activeDmPartner, setActiveDmPartner] = useState(null);

    const [notifPermission, setNotifPermission] = useState('default');

    const [showFormatBar, setShowFormatBar] = useState(true);
    const [activeFormats, setActiveFormats] = useState({
        bold: false,
        italic: false,
        underline: false,
        strikeThrough: false,
        insertUnorderedList: false,
        insertOrderedList: false
    });

    const [pendingFile, setPendingFile] = useState(null);
    const [isEmojiPickerOpen, setIsEmojiPickerOpen] = useState(false);
    const fileInputRef = useRef(null);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const recordingTimerRef = useRef(null);

    const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
    const [isPollModalOpen, setIsPollModalOpen] = useState(false);
    const [isChannelModalOpen, setIsChannelModalOpen] = useState(false);
    const [isInviteChannelModalOpen, setIsInviteChannelModalOpen] = useState(false);
    const [myCustomStatus, setMyCustomStatus] = useState('');

    const [channelError, setChannelError] = useState('');
    const [pollError, setPollError] = useState('');

    const [newChannelName, setNewChannelName] = useState('');
    const [newChannelIsPrivate, setNewChannelIsPrivate] = useState(false);
    const [newChannelRoles, setNewChannelRoles] = useState(['admin', 'employee', 'sales']);

    const [pollQuestion, setPollQuestion] = useState('');
    const [pollOptionsInput, setPollOptionsInput] = useState(['Option 1', 'Option 2']);

    const [mentionMenu, setMentionMenu] = useState({ open: false, query: '' });

    const [activeThreadMsg, setActiveThreadMsg] = useState(null);
    const [threadReplies, setThreadReplies] = useState([]);
    const [newThreadMessage, setNewThreadMessage] = useState('');

    const [bookmarkedIds, setBookmarkedIds] = useState(new Set());
    const [toast, setToast] = useState({ show: false, message: '' });

    const chatEndRef = useRef(null);
    const threadEndRef = useRef(null);
    const editorRef = useRef(null);

    if (currentUser?.role === 'client') {
        return (
            <div className="p-8 text-center text-slate-500 font-medium">
                Team Chat is for internal staff members only.
            </div>
        );
    }

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3500);
    };

    useEffect(() => {
        if ('Notification' in window) {
            setNotifPermission(Notification.permission);
            if (Notification.permission === 'default') {
                Notification.requestPermission().then((perm) => {
                    setNotifPermission(perm);
                });
            }
        }
    }, []);

    const triggerDesktopNotification = (sender, content) => {
        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                let cleanBody = content || '';
                if (cleanBody.startsWith('[VOICE_NOTE]:')) {
                    cleanBody = '🎙️ Sent a voice note';
                } else if (cleanBody.startsWith('[FILE_ATTACHMENT]:')) {
                    cleanBody = '📎 Sent an attachment';
                } else {
                    const doc = new DOMParser().parseFromString(cleanBody, 'text/html');
                    cleanBody = doc.body.textContent || cleanBody;
                }

                new Notification(`New message from ${sender}`, {
                    body: cleanBody.substring(0, 100),
                    icon: '/favicon.ico',
                    silent: false
                });
            } catch (err) {
                console.warn('Desktop OS notification error:', err);
            }
        }
    };

    useEffect(() => {
        if (!workspaceId) return;
        fetchTeamMembers();
        fetchPolls();
        fetchChannels();
    }, [workspaceId]);

    // Isolated fetch and realtime subscription for current active channel/DM
    useEffect(() => {
        if (!workspaceId) return;
        fetchMessages();

        const channelTopic = `chat-${workspaceId}-${chatType}-${chatType === 'channel' ? activeChannel : activeDmPartner?.id}`;
        const subscription = supabase
            .channel(channelTopic)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
                fetchMessages();
                if (activeThreadMsg) fetchThreadReplies(activeThreadMsg.id);

                if (payload.eventType === 'INSERT' && payload.new) {
                    const newMsg = payload.new;
                    const myName = currentUser?.name || '';
                    if (newMsg.sender_name && myName && !newMsg.sender_name.toLowerCase().includes(myName.toLowerCase())) {
                        triggerDesktopNotification(newMsg.sender_name, newMsg.content);
                    }
                }
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'polls' }, () => {
                fetchPolls();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'channels' }, () => {
                fetchChannels();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(subscription);
        };
    }, [workspaceId, chatType, activeChannel, activeDmPartner, activeThreadMsg]);

    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [allRawMessages, polls]);

    useEffect(() => {
        threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [threadReplies]);

    const execCmd = (e, command, value = null) => {
        if (e) e.preventDefault();
        if (editorRef.current) {
            editorRef.current.focus();
        }
        document.execCommand(command, false, value);
        checkActiveFormats();
    };

    const clearFormatting = (e) => {
        if (e) e.preventDefault();
        if (editorRef.current) {
            editorRef.current.focus();
        }
        document.execCommand('removeFormat', false, null);
        checkActiveFormats();
    };

    const checkActiveFormats = () => {
        setActiveFormats({
            bold: document.queryCommandState('bold'),
            italic: document.queryCommandState('italic'),
            underline: document.queryCommandState('underline'),
            strikeThrough: document.queryCommandState('strikeThrough'),
            insertUnorderedList: document.queryCommandState('insertUnorderedList'),
            insertOrderedList: document.queryCommandState('insertOrderedList')
        });
    };

    const insertLink = (e) => {
        if (e) e.preventDefault();
        const url = prompt('Enter website link URL:', 'https://');
        if (url) {
            execCmd(e, 'createLink', url);
        }
    };

    const insertCodeBlock = (e) => {
        if (e) e.preventDefault();
        execCmd(e, 'formatBlock', '<pre>');
    };

    const insertEmoji = (emoji) => {
        if (editorRef.current) {
            editorRef.current.focus();
            document.execCommand('insertText', false, emoji);
        }
        setIsEmojiPickerOpen(false);
    };

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert('File size exceeds 5MB limit.');
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setPendingFile({
                name: file.name,
                size: (file.size / 1024).toFixed(1) + ' KB',
                type: file.type,
                data: reader.result
            });
        };
        reader.readAsDataURL(file);
    };

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            audioChunksRef.current = [];
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) audioChunksRef.current.push(e.data);
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            recordingTimerRef.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);
        } catch (err) {
            console.error('Mic error:', err);
            alert('Microphone access denied or not supported.');
        }
    };

    const stopAndSendRecording = () => {
        if (!mediaRecorderRef.current) return;
        clearInterval(recordingTimerRef.current);

        mediaRecorderRef.current.onstop = async () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = async () => {
                const base64Audio = reader.result;
                await postMessagePayload(`[VOICE_NOTE]:${base64Audio}`);
            };

            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            }
            setIsRecording(false);
            setRecordingTime(0);
        };

        mediaRecorderRef.current.stop();
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current) {
            clearInterval(recordingTimerRef.current);
            if (mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop());
            }
            setIsRecording(false);
            setRecordingTime(0);
            audioChunksRef.current = [];
        }
    };

    const fetchChannels = async () => {
        if (!workspaceId) return;
        try {
            const { data, error } = await supabase
                .from('channels')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: true });

            if (!error && data && data.length > 0) {
                setChannels(data);
            }
        } catch (err) {
            console.error('Error fetching channels:', err.message);
        }
    };

    const handleCreateChannel = async (e) => {
        e.preventDefault();
        setChannelError('');

        if (!newChannelName.trim() || !workspaceId) {
            setChannelError('Channel name and workspace ID are required.');
            return;
        }

        const formattedName = newChannelName.trim().toLowerCase().replace(/\s+/g, '-');

        try {
            const { error } = await supabase.from('channels').insert({
                workspace_id: workspaceId,
                name: formattedName,
                is_private: newChannelIsPrivate,
                allowed_roles: newChannelRoles,
                allowed_users: [],
                created_by: currentUser?.name || 'Admin'
            });

            if (error) throw error;

            setIsChannelModalOpen(false);
            setNewChannelName('');
            setNewChannelIsPrivate(false);
            setNewChannelRoles(['admin', 'employee', 'sales']);
            triggerToast(`Channel #${formattedName} created!`);
            fetchChannels();
            setActiveChannel(formattedName);
            setChatType('channel');
        } catch (err) {
            console.error('Error creating channel:', err);
            setChannelError(`Failed to create channel: ${err.message}`);
        }
    };

    const handleToggleChannelMember = async (targetUser) => {
        const currentCh = channels.find((c) => c.name === activeChannel);
        if (!currentCh) return;

        let currentAllowedUsers = Array.isArray(currentCh.allowed_users) ? [...currentCh.allowed_users] : [];
        const userIdentifier = targetUser.id || targetUser.name;
        const isMember = currentAllowedUsers.includes(userIdentifier);

        if (isMember) {
            currentAllowedUsers = currentAllowedUsers.filter((u) => u !== userIdentifier);
        } else {
            currentAllowedUsers.push(userIdentifier);
        }

        setChannels((prev) => prev.map((c) => (c.name === activeChannel ? { ...c, allowed_users: currentAllowedUsers } : c)));

        try {
            const { error } = await supabase
                .from('channels')
                .update({ allowed_users: currentAllowedUsers })
                .eq('workspace_id', workspaceId)
                .eq('name', activeChannel);

            if (error) throw error;
            triggerToast(`Access updated for ${targetUser.name}`);
        } catch (err) {
            console.error('Error toggling member access:', err.message);
            fetchChannels();
        }
    };

    const fetchTeamMembers = async () => {
        try {
            const { data, error } = await supabase
                .from('organization_members')
                .select(`
          user_id,
          role,
          custom_status,
          profiles ( full_name )
        `)
                .eq('organization_id', workspaceId);

            if (error) throw error;

            let members = (data || []).map((m) => {
                const isSelf = m.user_id === currentUser?.id;
                return {
                    id: m.user_id,
                    name: isSelf ? `${m.profiles?.full_name || currentUser?.name} (You)` : (m.profiles?.full_name || m.user_id),
                    role: m.role || 'team',
                    status: isSelf ? (myCustomStatus || m.custom_status || '') : (m.custom_status || ''),
                    isSelf
                };
            });

            members.sort((a, b) => a.isSelf - b.isSelf);
            setTeamList(members);
        } catch (err) {
            console.error('Error fetching team members:', err.message);
        }
    };

    const fetchPolls = async () => {
        if (!workspaceId) return;
        try {
            const { data, error } = await supabase
                .from('polls')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('created_at', { ascending: true });

            if (!error && data) setPolls(data);
        } catch (err) {
            console.error('Error fetching polls:', err.message);
        }
    };

    const handleCreatePoll = async (e) => {
        e.preventDefault();
        setPollError('');

        if (!pollQuestion.trim() || !workspaceId) {
            setPollError('Question and Workspace ID are required.');
            return;
        }

        const formattedOptions = pollOptionsInput
            .filter((o) => o.trim().length > 0)
            .map((opt, idx) => ({ id: idx, text: opt.trim(), votes: [] }));

        try {
            const { error } = await supabase.from('polls').insert({
                workspace_id: workspaceId,
                channel: activeChannel || 'general',
                question: pollQuestion.trim(),
                options: formattedOptions,
                created_by: currentUser?.name || 'Team Member'
            });

            if (error) throw error;

            setIsPollModalOpen(false);
            setPollQuestion('');
            setPollOptionsInput(['Option 1', 'Option 2']);
            triggerToast('Team Poll created successfully!');
            fetchPolls();
        } catch (err) {
            console.error('Error creating poll:', err);
            setPollError(`Failed to save poll: ${err.message}`);
        }
    };

    const handleVotePoll = async (pollId, optionId) => {
        const targetPoll = polls.find((p) => p.id === pollId);
        if (!targetPoll) return;

        const userName = currentUser?.name || 'User';

        const updatedOptions = targetPoll.options.map((opt) => {
            const cleanedVotes = opt.votes.filter((v) => v !== userName);
            if (opt.id === optionId) {
                return { ...opt, votes: [...cleanedVotes, userName] };
            }
            return { ...opt, votes: cleanedVotes };
        });

        setPolls((prev) => prev.map((p) => (p.id === pollId ? { ...p, options: updatedOptions } : p)));

        await supabase.from('polls').update({ options: updatedOptions }).eq('id', pollId);
    };

    const handleUpdateStatus = async (statusText) => {
        setMyCustomStatus(statusText);
        setIsStatusModalOpen(false);
        setTeamList((prev) => prev.map((m) => (m.isSelf ? { ...m, status: statusText } : m)));

        try {
            await supabase
                .from('organization_members')
                .update({ custom_status: statusText })
                .eq('organization_id', workspaceId)
                .eq('user_id', currentUser?.id);

            triggerToast('Live workload status updated!');
        } catch (err) {
            console.error('Error updating status:', err.message);
        }
    };

    // Strict channel-isolated message fetching
    const fetchMessages = async () => {
        if (!workspaceId) return;

        let query = supabase.from('messages').select('*').eq('workspace_id', workspaceId);

        if (chatType === 'channel') {
            query = query.eq('channel', activeChannel).eq('is_dm', false);
        } else if (chatType === 'dm') {
            query = query.eq('is_dm', true);
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            setErrorMsg(`Database error: ${error.message}`);
        } else if (data) {
            if (chatType === 'dm' && activeDmPartner) {
                const dms = data.filter(
                    (m) =>
                        (m.sender_id === currentUser?.id && m.recipient_id === activeDmPartner.id) ||
                        (m.sender_id === activeDmPartner.id && m.recipient_id === currentUser?.id)
                );
                setAllRawMessages(dms);
            } else {
                setAllRawMessages(data);
            }
        }
    };

    const fetchThreadReplies = async (parentMsgId) => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('parent_message_id', parentMsgId)
            .order('created_at', { ascending: true });

        if (!error && data) setThreadReplies(data);
    };

    const handleEditorInput = () => {
        checkActiveFormats();
        const text = editorRef.current ? editorRef.current.innerText : '';
        const lastWord = text.split(/\s/).pop() || '';

        if (lastWord.startsWith('@')) {
            setMentionMenu({ open: true, query: lastWord.slice(1).toLowerCase() });
        } else {
            setMentionMenu({ open: false, query: '' });
        }
    };

    // In-place mention insertion fix
    const insertMention = (tagText) => {
        if (!editorRef.current) return;
        editorRef.current.focus();

        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);

            if (range.startContainer.nodeType === Node.TEXT_NODE) {
                const text = range.startContainer.textContent;
                const atIdx = text.lastIndexOf('@');
                if (atIdx !== -1) {
                    range.startContainer.textContent = text.substring(0, atIdx);
                }
            }

            const tagNode = document.createElement('span');
            tagNode.className = "px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-extrabold text-xs inline-block";
            tagNode.contentEditable = "false";
            tagNode.textContent = `@${tagText}`;

            range.insertNode(tagNode);

            const spaceNode = document.createTextNode('\u00A0');
            tagNode.after(spaceNode);

            const newRange = document.createRange();
            newRange.setStartAfter(spaceNode);
            newRange.setEndAfter(spaceNode);
            sel.removeAllRanges();
            sel.addRange(newRange);
        } else {
            editorRef.current.innerHTML += `<span class="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-extrabold text-xs inline-block" contenteditable="false">@${tagText}</span>&nbsp;`;
        }
        setMentionMenu({ open: false, query: '' });
    };

    const handleOpenThread = (msg) => {
        setActiveThreadMsg(msg);
        fetchThreadReplies(msg.id);
    };

    // Fail-safe post logic that preserves text until Supabase confirms insert
    const postMessagePayload = async (contentString) => {
        setErrorMsg('');
        if (!contentString.trim()) return;

        let targetWorkspaceId = workspaceId;
        if (!targetWorkspaceId) {
            const { data: orgs } = await supabase.from('organizations').select('id').limit(1);
            if (orgs && orgs.length > 0) {
                targetWorkspaceId = orgs[0].id;
            } else {
                const err = "Workspace ID missing. Please refresh your workspace.";
                setErrorMsg(err);
                triggerToast(err);
                return;
            }
        }

        const isDM = chatType === 'dm';
        const senderName = currentUser?.name || 'Team Member';

        const payload = {
            workspace_id: targetWorkspaceId,
            channel: isDM ? 'direct-message' : activeChannel || 'general',
            is_dm: isDM,
            recipient_id: isDM && activeDmPartner?.id ? activeDmPartner.id : null,
            sender_id: currentUser?.id && currentUser.id.length === 36 ? currentUser.id : null,
            sender_name: senderName,
            sender_role: currentUser?.role || 'team',
            content: contentString.trim(),
            reactions: []
        };

        // Insert into DB
        const { data, error } = await supabase.from('messages').insert([payload]).select();

        if (error) {
            setErrorMsg(`Failed to send message: ${error.message}`);
            triggerToast(`Error: ${error.message}`);
            // DO NOT CLEAR EDITOR -> Text stays safe in input box
            return;
        }

        // CLEAR EDITOR ONLY ON CONFIRMED SUCCESS
        if (editorRef.current) editorRef.current.innerHTML = '';
        setPendingFile(null);
        setMentionMenu({ open: false, query: '' });

        if (data && data[0]) {
            setAllRawMessages((prev) => [...prev, data[0]]);

            // Sync to Unified Activity Inbox
            const doc = new DOMParser().parseFromString(contentString, 'text/html');
            let cleanSnippet = (doc.body.textContent || contentString).replace(/\s+/g, ' ').trim();
            const isMention = contentString.includes('@');

            try {
                await supabase.from('activity_feed').insert([{
                    workspace_id: targetWorkspaceId,
                    type: isMention ? 'mention' : 'chat',
                    category: 'Team Chat',
                    title: isMention
                        ? `${senderName} mentioned someone in #${activeChannel}`
                        : `New message in #${activeChannel}`,
                    snippet: cleanSnippet.substring(0, 140),
                    content: contentString.trim(),
                    read: false,
                    sender: senderName
                }]);
            } catch (feedErr) {
                console.warn('Activity feed sync note:', feedErr.message);
            }
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();

        let rawHtml = editorRef.current?.innerHTML?.trim() || '';
        if (rawHtml === '<br>' || rawHtml === '<p><br></p>') rawHtml = '';

        if (pendingFile) {
            const filePayload = JSON.stringify({
                text: rawHtml,
                file: pendingFile
            });
            rawHtml = `[FILE_ATTACHMENT]:${filePayload}`;
        }

        if (!rawHtml) return;
        await postMessagePayload(rawHtml);
    };

    const handleSendThreadReply = async (e) => {
        e.preventDefault();
        if (!newThreadMessage.trim() || !activeThreadMsg) return;

        const payload = {
            workspace_id: workspaceId,
            channel: activeThreadMsg.channel,
            parent_message_id: activeThreadMsg.id,
            sender_id: currentUser?.id && currentUser.id.length === 36 ? currentUser.id : null,
            sender_name: currentUser?.name || 'Team Member',
            sender_role: currentUser?.role || 'team',
            content: newThreadMessage.trim(),
            reactions: []
        };

        const { data, error } = await supabase.from('messages').insert([payload]).select();

        if (error) {
            triggerToast(`Reply failed: ${error.message}`);
            return;
        }

        setNewThreadMessage('');

        if (data && data[0]) {
            setThreadReplies((prev) => [...prev, data[0]]);
            fetchMessages();

            supabase.from('activity_feed').insert([{
                workspace_id: workspaceId,
                type: 'chat',
                category: 'Team Chat',
                title: `${currentUser?.name || 'Team Member'} replied in thread`,
                snippet: newThreadMessage.trim().substring(0, 140),
                sender: currentUser?.name || 'Team Member',
                read: false
            }]);
        }
    };

    const toggleReaction = async (msgId, emoji) => {
        const targetMsg = allRawMessages.find((m) => m.id === msgId) || threadReplies.find((m) => m.id === msgId);
        if (!targetMsg) return;

        let updatedReactions = Array.isArray(targetMsg.reactions) ? [...targetMsg.reactions] : [];
        const existingIndex = updatedReactions.findIndex((r) => r.emoji === emoji && r.user === currentUser?.name);

        if (existingIndex > -1) {
            updatedReactions.splice(existingIndex, 1);
        } else {
            updatedReactions.push({ emoji, user: currentUser?.name });
        }

        setAllRawMessages((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions: updatedReactions } : m)));
        setThreadReplies((prev) => prev.map((m) => (m.id === msgId ? { ...m, reactions: updatedReactions } : m)));

        if (!msgId.toString().startsWith('temp-')) {
            await supabase.from('messages').update({ reactions: updatedReactions }).eq('id', msgId);
        }
    };

    const toggleBookmark = (id) => {
        setBookmarkedIds((prev) => {
            const next = new Set(prev);
            const isSaving = !next.has(id);
            isSaving ? next.add(id) : next.delete(id);
            triggerToast(isSaving ? 'Message saved to bookmarks!' : 'Message removed from bookmarks');
            return next;
        });
    };

    const renderFormattedContent = (content) => {
        if (!content) return '';

        if (content.startsWith('[VOICE_NOTE]:')) {
            const audioUrl = content.replace('[VOICE_NOTE]:', '');
            return <VoiceNotePlayer audioUrl={audioUrl} />;
        }

        if (content.startsWith('[FILE_ATTACHMENT]:')) {
            try {
                const payload = JSON.parse(content.replace('[FILE_ATTACHMENT]:', ''));
                const { text, file } = payload;
                const isImage = file?.type?.startsWith('image/');

                return (
                    <div className="space-y-2">
                        {text && <div dangerouslySetInnerHTML={{ __html: text }} className="prose text-xs max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-2 [&_pre]:rounded-lg [&_a]:text-blue-600 [&_a]:underline" />}
                        <div className="bg-slate-100/90 border border-slate-200/80 p-3 rounded-2xl max-w-sm">
                            {isImage ? (
                                <div className="space-y-2">
                                    <img src={file.data} alt={file.name} className="max-h-48 rounded-xl object-cover w-full border border-slate-200" />
                                    <div className="flex items-center justify-between pt-1">
                                        <span className="text-[11px] font-bold text-slate-700 truncate max-w-[180px]">{file.name}</span>
                                        <a
                                            href={file.data}
                                            download={file.name}
                                            className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-600 hover:text-blue-600 flex items-center gap-1 text-[10px] font-bold"
                                        >
                                            <Download className="w-3 h-3" /> Download
                                        </a>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-2.5 truncate">
                                        <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-200">
                                            <FileText className="w-5 h-5" />
                                        </div>
                                        <div className="truncate">
                                            <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                                            <p className="text-[10px] text-slate-400 font-medium">{file.size}</p>
                                        </div>
                                    </div>
                                    <a
                                        href={file.data}
                                        download={file.name}
                                        className="p-2 bg-white border border-slate-200 rounded-xl text-slate-700 hover:text-blue-600 flex items-center gap-1 text-xs font-bold shrink-0"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                );
            } catch (err) {
                console.error('File parse error:', err);
            }
        }

        return (
            <div
                dangerouslySetInnerHTML={{ __html: content }}
                className="prose text-xs max-w-none leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-2 [&_pre]:rounded-lg [&_a]:text-blue-600 [&_a]:underline"
            />
        );
    };

    const visibleChannels = channels.filter((ch) => {
        if (!ch.is_private) return true;
        const allowedRoles = Array.isArray(ch.allowed_roles) ? ch.allowed_roles : ['admin'];
        const allowedUsers = Array.isArray(ch.allowed_users) ? ch.allowed_users : [];

        const hasRole = allowedRoles.includes(currentUser?.role || 'employee');
        const isUserAllowed = allowedUsers.includes(currentUser?.id) || allowedUsers.includes(currentUser?.name);

        return hasRole || isUserAllowed || currentUser?.role === 'admin';
    });

    const mainMessages = allRawMessages.filter((m) => !m.parent_message_id);
    const activeChannelPolls = chatType === 'channel' ? polls.filter((p) => p.channel === activeChannel) : [];

    const unifiedStream = [
        ...mainMessages.map((m) => ({ ...m, itemType: 'message' })),
        ...activeChannelPolls.map((p) => ({ ...p, itemType: 'poll' }))
    ].sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));

    const mentionOptions = [
        { id: 'everyone', name: 'everyone', role: 'All Workspace Members' },
        { id: 'admin', name: 'admin', role: 'All Workspace Admins' },
        { id: 'sales', name: 'sales', role: 'All Sales Team' },
        ...teamList.map((t) => ({ id: t.id, name: t.name, role: t.role }))
    ].filter((item) => item.name.toLowerCase().includes(mentionMenu.query));

    const currentChannelObj = channels.find((c) => c.name === activeChannel);

    return (
        <div className="relative flex h-[calc(100vh-6.5rem)] bg-white border border-slate-200/80 rounded-3xl shadow-sm overflow-hidden font-sans">

            <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

            {/* Sidebar */}
            <aside className="w-64 bg-slate-50/70 border-r border-slate-200/80 flex flex-col shrink-0">
                <div className="p-4 border-b border-slate-200/70 flex items-center justify-between">
                    <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <span>Workspace Chat</span>
                    </div>

                    <button
                        onClick={() => setIsStatusModalOpen(true)}
                        className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-200/60 rounded-lg transition text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title="Set Live Status"
                    >
                        <Activity className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-[10px] hidden sm:inline">Status</span>
                    </button>
                </div>

                {myCustomStatus && (
                    <div className="mx-3 mt-3 p-2 bg-blue-50/80 border border-blue-200/70 rounded-xl flex items-center justify-between text-xs text-blue-900 font-medium">
                        <span className="truncate text-[11px] font-bold">🎯 {myCustomStatus}</span>
                        <button onClick={() => handleUpdateStatus('')} className="text-blue-400 hover:text-blue-700 p-0.5">
                            <X className="w-3 h-3" />
                        </button>
                    </div>
                )}

                <div className="p-3">
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search conversations..."
                            className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-2 space-y-4 text-xs">
                    {/* Channels Section */}
                    <div>
                        <div className="flex items-center justify-between px-2.5 py-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            <span>Channels</span>
                            {currentUser?.role === 'admin' && (
                                <button
                                    onClick={() => {
                                        setChannelError('');
                                        setIsChannelModalOpen(true);
                                    }}
                                    className="p-0.5 hover:bg-slate-200/70 text-slate-600 rounded transition cursor-pointer"
                                    title="Create Workspace Channel"
                                >
                                    <Plus className="w-3.5 h-3.5" />
                                </button>
                            )}
                        </div>
                        <div className="space-y-0.5 mt-1">
                            {visibleChannels.map((ch) => (
                                <button
                                    key={ch.id || ch.name}
                                    onClick={() => {
                                        setChatType('channel');
                                        setActiveChannel(ch.name);
                                        setActiveDmPartner(null);
                                        setActiveThreadMsg(null);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${chatType === 'channel' && activeChannel === ch.name
                                        ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-2 truncate">
                                        {ch.is_private ? (
                                            <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                        ) : (
                                            <Hash className="w-3.5 h-3.5 shrink-0 opacity-60" />
                                        )}
                                        <span className="truncate">{ch.name}</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Direct Messages Section */}
                    <div>
                        <div className="flex items-center justify-between px-2.5 py-1 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                            <span>Direct Messages</span>
                        </div>
                        <div className="space-y-0.5 mt-1">
                            {teamList.map((member) => (
                                <button
                                    key={member.id}
                                    onClick={() => {
                                        setChatType('dm');
                                        setActiveDmPartner(member);
                                        setActiveThreadMsg(null);
                                    }}
                                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left cursor-pointer ${chatType === 'dm' && activeDmPartner?.id === member.id
                                        ? 'bg-blue-50 text-blue-600 font-semibold shadow-xs'
                                        : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                        }`}
                                >
                                    <div className="flex items-center gap-2.5 truncate min-w-0">
                                        <div className="relative shrink-0">
                                            <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[10px]">
                                                {member.name[0]?.toUpperCase()}
                                            </div>
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 border border-white absolute -bottom-0.5 -right-0.5"></span>
                                        </div>
                                        <div className="truncate min-w-0">
                                            <p className="font-semibold text-slate-800 text-xs truncate">{member.name}</p>
                                            {member.status && (
                                                <p className="text-[10px] text-blue-600 font-bold truncate">{member.status}</p>
                                            )}
                                        </div>
                                    </div>
                                    <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-bold shrink-0 ml-1">
                                        {member.role}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Chat Stream */}
            <div className="flex-1 flex flex-col bg-white min-w-0">
                <header className="h-14 border-b border-slate-200/80 px-6 flex items-center justify-between bg-white shrink-0">
                    <div className="flex items-center gap-2">
                        {chatType === 'channel' ? (
                            <>
                                {currentChannelObj?.is_private ? (
                                    <Lock className="w-4 h-4 text-amber-500" />
                                ) : (
                                    <Hash className="w-4 h-4 text-slate-400" />
                                )}
                                <h2 className="font-bold text-slate-900 text-sm capitalize">{activeChannel}</h2>
                                {currentChannelObj?.is_private ? (
                                    <span className="text-xs bg-amber-50 text-amber-700 font-bold border border-amber-200 px-2 py-0.5 rounded-full ml-2">
                                        Private Channel
                                    </span>
                                ) : (
                                    <span className="text-xs text-slate-400 font-normal ml-2">Public team channel</span>
                                )}
                            </>
                        ) : (
                            <>
                                <User className="w-4 h-4 text-blue-600" />
                                <h2 className="font-bold text-slate-900 text-sm">{activeDmPartner?.name}</h2>
                                {activeDmPartner?.status && (
                                    <span className="text-xs text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 ml-2">
                                        {activeDmPartner.status}
                                    </span>
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {notifPermission !== 'granted' && (
                            <button
                                onClick={() => {
                                    if ('Notification' in window) {
                                        Notification.requestPermission().then((perm) => {
                                            setNotifPermission(perm);
                                            if (perm === 'granted') triggerToast('Desktop notifications enabled!');
                                        });
                                    }
                                }}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-indigo-200/80 shadow-2xs"
                                title="Enable OS Desktop Notifications"
                            >
                                <BellRing className="w-3.5 h-3.5" /> Enable Desktop Popups
                            </button>
                        )}

                        {chatType === 'channel' && (
                            <>
                                <button
                                    onClick={() => setIsInviteChannelModalOpen(true)}
                                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-slate-200/80 shadow-2xs"
                                >
                                    <UserPlus className="w-3.5 h-3.5 text-blue-600" /> Invite to Channel
                                </button>

                                <button
                                    onClick={() => {
                                        setPollError('');
                                        setIsPollModalOpen(true);
                                    }}
                                    className="bg-blue-50 hover:bg-blue-100 text-blue-600 font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer border border-blue-200/80 shadow-2xs"
                                >
                                    <BarChart2 className="w-4 h-4 text-blue-600" /> Create Poll
                                </button>
                            </>
                        )}
                    </div>
                </header>

                {errorMsg && (
                    <div className="m-4 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-600 font-medium">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                <div className="flex-1 p-6 overflow-y-auto space-y-6">
                    {unifiedStream.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs">
                            <MessageSquare className="w-8 h-8 mb-2 text-slate-300" />
                            <p className="font-medium">
                                {chatType === 'channel'
                                    ? `No messages in #${activeChannel} yet. Be the first!`
                                    : `Start of private message history with ${activeDmPartner?.name}.`}
                            </p>
                        </div>
                    ) : (
                        unifiedStream.map((item) => {
                            if (item.itemType === 'poll') {
                                const poll = item;
                                const totalVotes = poll.options.reduce((acc, opt) => acc + (opt.votes?.length || 0), 0);
                                const myName = currentUser?.name || 'User';

                                return (
                                    <div key={`poll-${poll.id}`} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 max-w-2xl shadow-xs my-2">
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                                                <BarChart2 className="w-3 h-3" /> Team Poll • Posted by {poll.created_by}
                                            </span>
                                            <span className="text-[10px] text-slate-400 font-semibold">{totalVotes} Total Votes</span>
                                        </div>

                                        <h3 className="font-extrabold text-slate-900 text-sm mb-3">{poll.question}</h3>

                                        <div className="space-y-2">
                                            {poll.options.map((opt) => {
                                                const votesCount = opt.votes?.length || 0;
                                                const percent = totalVotes > 0 ? Math.round((votesCount / totalVotes) * 100) : 0;
                                                const hasVotedThisOption = opt.votes?.includes(myName);

                                                return (
                                                    <button
                                                        key={opt.id}
                                                        type="button"
                                                        onClick={() => handleVotePoll(poll.id, opt.id)}
                                                        className={`w-full text-left p-2.5 rounded-xl border transition relative overflow-hidden flex items-center justify-between cursor-pointer ${hasVotedThisOption
                                                            ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                                                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-800'
                                                            }`}
                                                    >
                                                        <div
                                                            className="absolute left-0 top-0 bottom-0 bg-blue-100/60 transition-all duration-300 pointer-events-none"
                                                            style={{ width: `${percent}%` }}
                                                        />

                                                        <div className="relative z-10 flex items-center gap-2 text-xs">
                                                            {hasVotedThisOption && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                                            <span>{opt.text}</span>
                                                        </div>

                                                        <span className="relative z-10 text-[11px] font-bold text-slate-500">
                                                            {votesCount} ({percent}%)
                                                        </span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            }

                            const msg = item;
                            const formattedTime = msg.created_at
                                ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                : 'Just now';
                            const isBookmarked = bookmarkedIds.has(msg.id);
                            const reactionList = Array.isArray(msg.reactions) ? msg.reactions : [];

                            const replies = allRawMessages.filter((r) => r.parent_message_id === msg.id);
                            const replyCount = replies.length;
                            const lastReply = replies[replies.length - 1];

                            const senderMember = teamList.find((t) => t.name.toLowerCase().startsWith(msg.sender_name?.toLowerCase()));

                            return (
                                <div
                                    key={`msg-${msg.id}`}
                                    className="relative flex gap-3.5 group p-2.5 rounded-2xl hover:bg-slate-50/50 border border-transparent transition-all"
                                >
                                    <div className="absolute right-4 -top-3 hidden group-hover:flex items-center bg-white border border-slate-200 shadow-md rounded-xl p-1 gap-1 z-10 transition-all">
                                        {['✅', '👀', '🙌', '❤️'].map((emoji) => (
                                            <button
                                                key={emoji}
                                                onClick={() => toggleReaction(msg.id, emoji)}
                                                className="p-1 hover:bg-slate-100 rounded-lg text-xs transition cursor-pointer"
                                                title={`React with ${emoji}`}
                                            >
                                                {emoji}
                                            </button>
                                        ))}
                                        <div className="w-px h-4 bg-slate-200 mx-0.5" />
                                        <button
                                            onClick={() => handleOpenThread(msg)}
                                            className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-blue-600 rounded-lg text-xs transition cursor-pointer flex items-center gap-1 font-semibold"
                                            title="Reply in thread drawer"
                                        >
                                            <CornerUpLeft className="w-3.5 h-3.5 text-blue-600" />
                                            <span className="text-[10px]">Reply in Thread</span>
                                        </button>
                                        <button
                                            onClick={() => toggleBookmark(msg.id)}
                                            className={`p-1.5 hover:bg-slate-100 rounded-lg text-xs transition cursor-pointer ${isBookmarked ? 'text-amber-500' : 'text-slate-500'
                                                }`}
                                            title="Bookmark message"
                                        >
                                            <Bookmark className="w-3.5 h-3.5" />
                                        </button>
                                    </div>

                                    <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center font-bold text-xs text-blue-700 shrink-0 shadow-xs">
                                        {(msg.sender_name || 'U').substring(0, 2).toUpperCase()}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                            <span className="font-bold text-slate-900 text-xs">{msg.sender_name}</span>
                                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 uppercase border border-slate-200/60">
                                                {msg.sender_role}
                                            </span>
                                            {senderMember?.status && (
                                                <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200/60">
                                                    {senderMember.status}
                                                </span>
                                            )}
                                            <span className="text-[10px] text-slate-400">{formattedTime}</span>
                                            {isBookmarked && (
                                                <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-md border border-amber-200">
                                                    Saved
                                                </span>
                                            )}
                                        </div>

                                        <div className="text-sm text-slate-800 leading-relaxed bg-slate-50/80 border border-slate-200/60 rounded-2xl p-3 inline-block max-w-2xl shadow-xs">
                                            {renderFormattedContent(msg.content)}
                                        </div>

                                        {replyCount > 0 && (
                                            <div className="mt-2">
                                                <button
                                                    onClick={() => handleOpenThread(msg)}
                                                    className="inline-flex items-center gap-2 bg-blue-50/80 hover:bg-blue-100/90 border border-blue-200/80 px-2.5 py-1 rounded-xl text-xs text-blue-700 font-bold transition cursor-pointer shadow-2xs"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5 text-blue-600" />
                                                    <span>{replyCount} {replyCount === 1 ? 'reply' : 'replies'}</span>
                                                    {lastReply && (
                                                        <span className="text-[10px] text-slate-500 font-normal ml-1">
                                                            • Last reply {new Date(lastReply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    )}
                                                </button>
                                            </div>
                                        )}

                                        {reactionList.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {Object.entries(
                                                    reactionList.reduce((acc, curr) => {
                                                        acc[curr.emoji] = (acc[curr.emoji] || 0) + 1;
                                                        return acc;
                                                    }, {})
                                                ).map(([emoji, count]) => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => toggleReaction(msg.id, emoji)}
                                                        className="inline-flex items-center gap-1 bg-slate-100 hover:bg-blue-50 border border-slate-200/80 px-2 py-0.5 rounded-full text-xs font-semibold text-slate-700 transition cursor-pointer"
                                                    >
                                                        <span>{emoji}</span>
                                                        <span className="text-[10px] text-slate-500">{count}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={chatEndRef} />
                </div>

                {/* WYSIWYG RICH TEXT COMPOSER */}
                <div className="p-4 border-t border-slate-200/80 bg-white relative">

                    {/* Emoji Picker Popover */}
                    {isEmojiPickerOpen && (
                        <div className="absolute bottom-full left-12 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl p-3 grid grid-cols-6 gap-1.5 w-60 z-30 font-sans">
                            {EMOJI_LIST.map((emoji) => (
                                <button
                                    key={emoji}
                                    type="button"
                                    onClick={() => insertEmoji(emoji)}
                                    className="p-1.5 hover:bg-slate-100 rounded-xl text-lg transition cursor-pointer text-center"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Pending File Preview */}
                    {pendingFile && (
                        <div className="mb-2 p-2 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs text-blue-900 font-medium">
                            <div className="flex items-center gap-2 truncate">
                                <Paperclip className="w-4 h-4 text-blue-600 shrink-0" />
                                <span className="font-bold truncate">{pendingFile.name}</span>
                                <span className="text-[10px] text-blue-500 font-semibold">({pendingFile.size})</span>
                            </div>
                            <button onClick={() => setPendingFile(null)} className="text-blue-400 hover:text-blue-700 p-0.5 cursor-pointer">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    )}

                    {/* Mention Options Popover */}
                    {mentionMenu.open && mentionOptions.length > 0 && (
                        <div className="absolute bottom-full left-4 mb-2 bg-white border border-slate-200 rounded-2xl shadow-xl w-64 overflow-hidden z-30 font-sans">
                            <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-100 text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                <AtSign className="w-3 h-3 text-blue-600" /> Mention Team Member or Role
                            </div>
                            <div className="max-h-48 overflow-y-auto">
                                {mentionOptions.map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => insertMention(opt.name)}
                                        className="w-full px-3 py-2 text-left hover:bg-blue-50 flex items-center justify-between transition cursor-pointer border-b border-slate-50 text-xs"
                                    >
                                        <span className="font-bold text-slate-800">@{opt.name}</span>
                                        <span className="text-[10px] text-slate-400 capitalize">{opt.role}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {isRecording ? (
                        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 flex items-center justify-between animate-pulse">
                            <div className="flex items-center gap-3">
                                <div className="w-3 h-3 rounded-full bg-rose-600 animate-ping" />
                                <span className="font-extrabold text-xs text-rose-700">Recording Voice Note...</span>
                                <span className="font-mono text-xs font-bold bg-white px-2 py-0.5 rounded-md border border-rose-200 text-rose-900">
                                    {String(Math.floor(recordingTime / 60)).padStart(2, '0')}:{String(recordingTime % 60).padStart(2, '0')}
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={cancelRecording}
                                    className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-100 rounded-xl transition cursor-pointer"
                                    title="Cancel Recording"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                                <button
                                    type="button"
                                    onClick={stopAndSendRecording}
                                    className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-1.5 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                                >
                                    <Square className="w-3.5 h-3.5 fill-current" /> Send Voice Note
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-50/90 border border-slate-200 rounded-2xl overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition shadow-2xs">

                            {/* VISUAL FORMATTING TOOLBAR */}
                            {showFormatBar && (
                                <div className="px-3 py-1.5 bg-slate-100/70 border-b border-slate-200/80 flex items-center gap-1 text-slate-600 flex-wrap text-xs">
                                    <button
                                        type="button"
                                        onMouseDown={(e) => execCmd(e, 'bold')}
                                        className={`p-1.5 rounded-md transition cursor-pointer font-bold ${activeFormats.bold ? 'bg-blue-200 text-blue-900' : 'hover:bg-white hover:text-slate-900'
                                            }`}
                                        title="Bold"
                                    >
                                        <Bold className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => execCmd(e, 'italic')}
                                        className={`p-1.5 rounded-md transition cursor-pointer ${activeFormats.italic ? 'bg-blue-200 text-blue-900' : 'hover:bg-white hover:text-slate-900'
                                            }`}
                                        title="Italic"
                                    >
                                        <Italic className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => execCmd(e, 'underline')}
                                        className={`p-1.5 rounded-md transition cursor-pointer ${activeFormats.underline ? 'bg-blue-200 text-blue-900' : 'hover:bg-white hover:text-slate-900'
                                            }`}
                                        title="Underline"
                                    >
                                        <Underline className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => execCmd(e, 'strikeThrough')}
                                        className={`p-1.5 rounded-md transition cursor-pointer ${activeFormats.strikeThrough ? 'bg-blue-200 text-blue-900' : 'hover:bg-white hover:text-slate-900'
                                            }`}
                                        title="Strikethrough"
                                    >
                                        <Strikethrough className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="w-px h-3.5 bg-slate-200 mx-1" />

                                    <button
                                        type="button"
                                        onMouseDown={insertLink}
                                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer"
                                        title="Insert Link"
                                    >
                                        <LinkIcon className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onMouseDown={(e) => execCmd(e, 'insertUnorderedList')}
                                        className={`p-1.5 rounded-md transition cursor-pointer ${activeFormats.insertUnorderedList ? 'bg-blue-200 text-blue-900' : 'hover:bg-white hover:text-slate-900'
                                            }`}
                                        title="Bulleted List"
                                    >
                                        <List className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                        type="button"
                                        onMouseDown={(e) => execCmd(e, 'insertOrderedList')}
                                        className={`p-1.5 rounded-md transition cursor-pointer ${activeFormats.insertOrderedList ? 'bg-blue-200 text-blue-900' : 'hover:bg-white hover:text-slate-900'
                                            }`}
                                        title="Numbered List"
                                    >
                                        <ListOrdered className="w-3.5 h-3.5" />
                                    </button>

                                    <div className="w-px h-3.5 bg-slate-200 mx-1" />

                                    <button
                                        type="button"
                                        onMouseDown={insertCodeBlock}
                                        className="p-1.5 hover:bg-white hover:text-slate-900 rounded-md transition cursor-pointer"
                                        title="Code Block"
                                    >
                                        <Terminal className="w-3.5 h-3.5" />
                                    </button>

                                    <button
                                        type="button"
                                        onMouseDown={clearFormatting}
                                        className="p-1.5 hover:bg-white hover:text-rose-600 rounded-md transition cursor-pointer ml-auto"
                                        title="Clear All Formatting"
                                    >
                                        <Eraser className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            )}

                            {/* LIVE RICH-TEXT CONTENTEDITABLE EDITING BOX */}
                            <div
                                ref={editorRef}
                                contentEditable
                                onInput={handleEditorInput}
                                onKeyUp={checkActiveFormats}
                                onMouseUp={checkActiveFormats}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSendMessage(e);
                                    }
                                }}
                                className="w-full min-h-[70px] max-h-48 overflow-y-auto bg-transparent text-sm text-slate-900 focus:outline-none p-3 leading-relaxed [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_pre]:bg-slate-900 [&_pre]:text-slate-100 [&_pre]:p-2 [&_pre]:rounded-lg [&_pre]:font-mono [&_a]:text-blue-600 [&_a]:underline"
                                style={{ outline: 'none' }}
                            />

                            {/* BOTTOM ACTION BAR */}
                            <div className="px-3 py-2 bg-slate-100/50 border-t border-slate-200/60 flex items-center justify-between">
                                <div className="flex items-center gap-1 text-slate-500">
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        className="w-7 h-7 rounded-full bg-slate-200/80 hover:bg-slate-300 flex items-center justify-center transition cursor-pointer text-slate-700"
                                        title="Add attachment"
                                    >
                                        <Plus className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setShowFormatBar(!showFormatBar)}
                                        className={`p-1.5 rounded-lg transition cursor-pointer ${showFormatBar ? 'bg-blue-100 text-blue-700 font-bold' : 'hover:bg-slate-200/60'
                                            }`}
                                        title="Toggle formatting toolbar"
                                    >
                                        <Type className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setIsEmojiPickerOpen(!isEmojiPickerOpen)}
                                        className="p-1.5 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                                        title="Insert Emoji"
                                    >
                                        <Smile className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (editorRef.current) {
                                                editorRef.current.focus();
                                                execCmd(null, 'insertText', '@');
                                            }
                                        }}
                                        className="p-1.5 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
                                        title="Mention someone (@)"
                                    >
                                        <AtSign className="w-4 h-4" />
                                    </button>

                                    <div className="w-px h-3.5 bg-slate-200 mx-1" />

                                    <button
                                        type="button"
                                        onClick={() => triggerToast("Starting Video Call Huddle...")}
                                        className="p-1.5 hover:bg-slate-200/60 hover:text-blue-600 rounded-lg transition cursor-pointer"
                                        title="Start Video Huddle"
                                    >
                                        <Video className="w-4 h-4" />
                                    </button>

                                    <button
                                        type="button"
                                        onClick={startRecording}
                                        className="p-1.5 hover:bg-rose-50 hover:text-rose-600 rounded-lg transition cursor-pointer"
                                        title="Record Voice Note"
                                    >
                                        <Mic className="w-4 h-4 text-rose-500" />
                                    </button>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleSendMessage}
                                    className="bg-slate-900 hover:bg-slate-800 text-white font-semibold px-4 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                                >
                                    <span>Send</span>
                                    <Send className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Slide-Out Thread Drawer Panel */}
            {activeThreadMsg && (
                <aside className="w-80 bg-slate-50/90 border-l border-slate-200/80 flex flex-col shrink-0 transition-all duration-300">
                    <div className="p-4 border-b border-slate-200/80 flex items-center justify-between bg-white">
                        <div className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-blue-600" />
                            <h3 className="font-bold text-slate-900 text-sm">Thread</h3>
                        </div>
                        <button onClick={() => setActiveThreadMsg(null)} className="text-slate-400 hover:text-slate-700 p-1 rounded-lg hover:bg-slate-100">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <div className="p-4 bg-white border-b border-slate-200/60 shadow-2xs">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 text-xs">{activeThreadMsg.sender_name}</span>
                            <span className="text-[9px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 uppercase">
                                {activeThreadMsg.sender_role}
                            </span>
                        </div>
                        <div className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-xl border border-slate-200/60">
                            {renderFormattedContent(activeThreadMsg.content)}
                        </div>
                    </div>

                    <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs">
                        {threadReplies.length === 0 ? (
                            <div className="text-center text-slate-400 py-8">
                                <p className="font-medium">No replies in this thread yet.</p>
                                <p className="text-[10px] mt-1">Start the conversation below!</p>
                            </div>
                        ) : (
                            threadReplies.map((reply) => (
                                <div key={reply.id} className="bg-white border border-slate-200/70 p-3 rounded-2xl shadow-2xs space-y-1">
                                    <div className="flex items-center justify-between">
                                        <span className="font-bold text-slate-900 text-xs">{reply.sender_name}</span>
                                        <span className="text-[9px] text-slate-400">
                                            {reply.created_at ? new Date(reply.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'}
                                        </span>
                                    </div>
                                    <div className="text-slate-800 leading-normal whitespace-pre-wrap">{renderFormattedContent(reply.content)}</div>
                                </div>
                            ))
                        )}
                        <div ref={threadEndRef} />
                    </div>

                    <div className="p-3 border-t border-slate-200/80 bg-white">
                        <form onSubmit={handleSendThreadReply} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="Reply to thread..."
                                value={newThreadMessage}
                                onChange={(e) => setNewThreadMessage(e.target.value)}
                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                            />
                            <button
                                type="submit"
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition cursor-pointer shadow-xs"
                            >
                                <Send className="w-3.5 h-3.5" />
                            </button>
                        </form>
                    </div>
                </aside>
            )}

            {/* MODALS */}
            {isInviteChannelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <UserPlus className="w-5 h-5 text-blue-600" /> Channel Member Access
                            </h3>
                            <button onClick={() => setIsInviteChannelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <p className="text-xs text-slate-500 mb-3">
                            Grant or revoke direct access for specific teammates in <b>#{activeChannel}</b>:
                        </p>

                        <div className="max-h-60 overflow-y-auto space-y-1.5 divide-y divide-slate-100 text-xs">
                            {teamList.map((member) => {
                                const userIdentifier = member.id || member.name;
                                const allowedList = Array.isArray(currentChannelObj?.allowed_users) ? currentChannelObj.allowed_users : [];
                                const isUserAccessGranted = allowedList.includes(userIdentifier);

                                return (
                                    <div key={member.id} className="pt-2 flex items-center justify-between">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-[11px]">
                                                {member.name[0]?.toUpperCase()}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-xs">{member.name}</p>
                                                <p className="text-[10px] text-slate-400 capitalize">{member.role}</p>
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleChannelMember(member)}
                                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${isUserAccessGranted
                                                ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {isUserAccessGranted ? 'Access Granted' : 'Grant Access'}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="pt-4 flex justify-end">
                            <button
                                type="button"
                                onClick={() => setIsInviteChannelModalOpen(false)}
                                className="px-4 py-2 bg-slate-900 text-white font-semibold rounded-xl text-xs cursor-pointer"
                            >
                                Done
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {isChannelModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Hash className="w-5 h-5 text-blue-600" /> Create Workspace Channel
                            </h3>
                            <button onClick={() => setIsChannelModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {channelError && (
                            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-600 font-medium">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{channelError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreateChannel} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Channel Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. social-media"
                                    value={newChannelName}
                                    onChange={(e) => setNewChannelName(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                                <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800">
                                    <input
                                        type="checkbox"
                                        checked={newChannelIsPrivate}
                                        onChange={(e) => setNewChannelIsPrivate(e.target.checked)}
                                        className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                                    />
                                    <span>Private Channel (Role-Locked)</span>
                                </label>
                                <p className="text-[11px] text-slate-500">Only members with selected roles or explicit invitations can view or enter this channel.</p>
                            </div>

                            {newChannelIsPrivate && (
                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1.5">Allowed Access Roles</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {['admin', 'employee', 'sales'].map((role) => (
                                            <button
                                                key={role}
                                                type="button"
                                                onClick={() => {
                                                    if (newChannelRoles.includes(role)) {
                                                        setNewChannelRoles(newChannelRoles.filter((r) => r !== role));
                                                    } else {
                                                        setNewChannelRoles([...newChannelRoles, role]);
                                                    }
                                                }}
                                                className={`py-2 px-2 rounded-xl border font-bold capitalize transition cursor-pointer text-center ${newChannelRoles.includes(role)
                                                    ? 'bg-blue-50 text-blue-600 border-blue-300'
                                                    : 'bg-white text-slate-500 border-slate-200'
                                                    }`}
                                            >
                                                {role}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsChannelModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex-1 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-xl text-xs flex-1 shadow-xs cursor-pointer"
                                >
                                    Create Channel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isPollModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <BarChart2 className="w-5 h-5 text-blue-600" /> Create Team Poll
                            </h3>
                            <button onClick={() => setIsPollModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {pollError && (
                            <div className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-600 font-medium">
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                <span>{pollError}</span>
                            </div>
                        )}

                        <form onSubmit={handleCreatePoll} className="space-y-3.5 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Poll Question</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Which design direction should we launch?"
                                    value={pollQuestion}
                                    onChange={(e) => setPollQuestion(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Options</label>
                                <div className="space-y-2">
                                    {pollOptionsInput.map((opt, idx) => (
                                        <div key={idx} className="flex gap-2">
                                            <input
                                                type="text"
                                                required
                                                placeholder={`Option ${idx + 1}`}
                                                value={opt}
                                                onChange={(e) => {
                                                    const updated = [...pollOptionsInput];
                                                    updated[idx] = e.target.value;
                                                    setPollOptionsInput(updated);
                                                }}
                                                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            />
                                            {pollOptionsInput.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => setPollOptionsInput(pollOptionsInput.filter((_, i) => i !== idx))}
                                                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl"
                                                >
                                                    <X className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {pollOptionsInput.length < 5 && (
                                    <button
                                        type="button"
                                        onClick={() => setPollOptionsInput([...pollOptionsInput, ''])}
                                        className="mt-2 text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                                    >
                                        + Add Option
                                    </button>
                                )}
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsPollModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex-1 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex-1 shadow-xs cursor-pointer"
                                >
                                    Post Poll
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isStatusModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-sm p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <Activity className="w-5 h-5 text-blue-600" /> Set Live Status
                            </h3>
                            <button onClick={() => setIsStatusModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-3 text-xs">
                            <p className="text-slate-500">Pick a quick status or write your current workload focus:</p>

                            <div className="grid grid-cols-1 gap-1.5">
                                {['Working on Task #1', 'In a Client Meeting', 'Deep Code Focus', 'Out for Lunch', 'Away / AFK'].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => handleUpdateStatus(s)}
                                        className="w-full text-left px-3 py-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-xl font-medium text-slate-800 transition cursor-pointer"
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

                            <div className="pt-2">
                                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Custom Status Text</label>
                                <input
                                    type="text"
                                    placeholder="e.g., Reviewing Q3 Sales Leads"
                                    value={myCustomStatus}
                                    onChange={(e) => setMyCustomStatus(e.target.value)}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                                />
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus('')}
                                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-semibold flex-1"
                                >
                                    Clear Status
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleUpdateStatus(myCustomStatus)}
                                    className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold flex-1 shadow-xs"
                                >
                                    Save Status
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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

function VoiceNotePlayer({ audioUrl }) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
        } else {
            audioRef.current.play();
        }
        setIsPlaying(!isPlaying);
    };

    return (
        <div className="flex items-center gap-3 bg-slate-100/90 border border-slate-200/80 p-2.5 rounded-2xl min-w-[220px]">
            <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                onTimeUpdate={() => {
                    if (audioRef.current) {
                        const pct = (audioRef.current.currentTime / audioRef.current.duration) * 100;
                        setProgress(pct || 0);
                    }
                }}
            />
            <button
                type="button"
                onClick={togglePlay}
                className="w-9 h-9 rounded-full bg-rose-600 text-white flex items-center justify-center hover:bg-rose-700 transition cursor-pointer shadow-xs shrink-0"
            >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
            </button>

            <div className="flex-1 min-w-[120px] space-y-1">
                <div className="flex justify-between text-[10px] font-bold text-slate-600">
                    <span className="flex items-center gap-1"><Volume2 className="w-3 h-3 text-rose-500" /> Voice Note</span>
                    <span>{isPlaying ? 'Playing...' : 'Audio Clip'}</span>
                </div>
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                    <div className="bg-rose-600 h-full transition-all" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
}