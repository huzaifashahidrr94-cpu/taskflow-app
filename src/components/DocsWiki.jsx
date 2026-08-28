import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
    BookOpen,
    Plus,
    Search,
    FileText,
    Edit3,
    Trash2,
    Tag,
    CheckCircle2,
    Loader2,
    X,
    Lock,
    Globe
} from 'lucide-react';

const CATEGORIES = ['Engineering', 'Sales SOPs', 'HR Policies', 'Marketing', 'Product & Design', 'General Wiki'];

export default function DocsWiki({ workspaceId, currentUser }) {
    const [docs, setDocs] = useState([]);
    const [selectedDoc, setSelectedDoc] = useState(null);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('All');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDocId, setEditingDocId] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '' });

    // Form state
    const [title, setTitle] = useState('');
    const [category, setCategory] = useState('General Wiki');
    const [content, setContent] = useState('');
    const [tags, setTags] = useState('');
    const [isPrivate, setIsPrivate] = useState(false);

    useEffect(() => {
        if (workspaceId) fetchDocs();
    }, [workspaceId]);

    const triggerToast = (msg) => {
        setToast({ show: true, message: msg });
        setTimeout(() => setToast({ show: false, message: '' }), 3000);
    };

    const fetchDocs = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('documents')
                .select('*')
                .eq('workspace_id', workspaceId)
                .order('updated_at', { ascending: false });

            if (error && !error.message.includes('relation')) throw error;

            const fallbackDocs = [
                {
                    id: 'doc-1',
                    workspace_id: workspaceId,
                    title: '🚀 Sales Onboarding & Closing Playbook',
                    category: 'Sales SOPs',
                    content: `### Sales Closing Playbook\n\n1. **Lead Discovery Call**: Always qualify BANT (Budget, Authority, Need, Timeline).\n2. **Demo Presentation**: Tailor value proposition to pain points recorded in Contacts Directory.\n3. **Proposal Submission**: Move deal stage to "Negotiation" in Deals Kanban.\n4. **Closing**: Send contract link via client portal.`,
                    author_name: 'Sales Lead',
                    tags: ['Sales', 'Playbook', 'SOP'],
                    is_private: false,
                    updated_at: new Date().toISOString()
                },
                {
                    id: 'doc-2',
                    workspace_id: workspaceId,
                    title: '📘 Employee PTO & Remote Work Policy',
                    category: 'HR Policies',
                    content: `### Workplace PTO Guidelines\n\n* **Vacation Days**: 15 days paid vacation annually.\n* **Submission**: Log all time-off through the **HR & PTO** tab at least 3 days in advance.\n* **Sick Leave**: Notify your department head via Team Chat before 9 AM.`,
                    author_name: 'HR Team',
                    tags: ['HR', 'PTO', 'Policy'],
                    is_private: false,
                    updated_at: new Date().toISOString()
                }
            ];

            const loadedDocs = data && data.length > 0 ? data : fallbackDocs;
            setDocs(loadedDocs);
            setSelectedDoc(loadedDocs[0]);
        } catch (err) {
            console.error('Error fetching docs:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenCreateModal = () => {
        setEditingDocId(null);
        setTitle('');
        setCategory('General Wiki');
        setContent('');
        setTags('');
        setIsPrivate(false);
        setIsModalOpen(true);
    };

    const handleOpenEditModal = (doc) => {
        setEditingDocId(doc.id);
        setTitle(doc.title);
        setCategory(doc.category || 'General Wiki');
        setContent(doc.content || '');
        setTags(doc.tags ? doc.tags.join(', ') : '');
        setIsPrivate(!!doc.is_private);
        setIsModalOpen(true);
    };

    const handleSaveDoc = async (e) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) return;

        const formattedTags = tags
            ? tags.split(',').map((t) => t.trim()).filter(Boolean)
            : ['Wiki'];

        const authorName = currentUser?.fullName || currentUser?.name || 'Team Member';
        const updatedAt = new Date().toISOString();

        if (editingDocId) {
            // Edit existing doc
            const updatedDoc = {
                ...selectedDoc,
                title: title.trim(),
                category,
                content: content.trim(),
                tags: formattedTags,
                is_private: isPrivate,
                updated_at: updatedAt
            };

            setDocs((prev) => prev.map((d) => (d.id === editingDocId ? updatedDoc : d)));
            setSelectedDoc(updatedDoc);
            setIsModalOpen(false);
            triggerToast('Document updated successfully!');

            try {
                await supabase
                    .from('documents')
                    .update({
                        title: title.trim(),
                        category,
                        content: content.trim(),
                        tags: formattedTags,
                        is_private: isPrivate,
                        updated_at: updatedAt
                    })
                    .eq('id', editingDocId);
            } catch (err) {
                console.error('Error updating document:', err.message);
            }
        } else {
            // Create new doc
            const newDoc = {
                id: 'doc-' + Date.now(),
                workspace_id: workspaceId,
                title: title.trim(),
                category,
                content: content.trim(),
                author_name: authorName,
                tags: formattedTags,
                is_private: isPrivate,
                updated_at: updatedAt
            };

            setDocs([newDoc, ...docs]);
            setSelectedDoc(newDoc);
            setIsModalOpen(false);
            triggerToast('Document published to Wiki!');

            try {
                await supabase.from('documents').insert([newDoc]);
            } catch (err) {
                console.error('Error saving document:', err.message);
            }
        }

        setTitle('');
        setContent('');
        setTags('');
        setIsPrivate(false);
        setEditingDocId(null);
    };

    const handleDeleteDoc = async (id) => {
        const updated = docs.filter((d) => d.id !== id);
        setDocs(updated);
        if (selectedDoc?.id === id) {
            setSelectedDoc(updated[0] || null);
        }
        triggerToast('Document deleted.');

        try {
            await supabase.from('documents').delete().eq('id', id);
        } catch (err) {
            console.error('Error deleting doc:', err.message);
        }
    };

    const filteredDocs = docs.filter((d) => {
        const matchesSearch =
            d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            d.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'All' || d.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const renderFormattedContent = (rawText) => {
        if (!rawText) return null;
        const lines = rawText.split('\n');

        return (
            <div className="space-y-2 font-sans text-xs text-slate-800 leading-relaxed">
                {lines.map((line, idx) => {
                    const trimmed = line.trim();
                    if (trimmed.startsWith('### ')) {
                        return <h3 key={idx} className="text-base font-extrabold text-slate-900 mt-4 mb-1">{trimmed.replace('### ', '')}</h3>;
                    }
                    if (trimmed.startsWith('## ')) {
                        return <h2 key={idx} className="text-lg font-black text-slate-900 mt-5 mb-1.5">{trimmed.replace('## ', '')}</h2>;
                    }
                    if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                        return (
                            <div key={idx} className="flex items-start gap-2 ml-2 my-1">
                                <span className="text-blue-600 font-bold">•</span>
                                <span>{trimmed.replace(/^[\*\-]\s+/, '')}</span>
                            </div>
                        );
                    }
                    if (/^\d+\.\s/.test(trimmed)) {
                        return (
                            <div key={idx} className="flex items-start gap-2 ml-2 my-1">
                                <span className="text-blue-600 font-bold">{trimmed.match(/^\d+\./)[0]}</span>
                                <span>{trimmed.replace(/^\d+\.\s+/, '')}</span>
                            </div>
                        );
                    }
                    if (!trimmed) return <div key={idx} className="h-2" />;
                    return <p key={idx} className="my-1">{line}</p>;
                })}
            </div>
        );
    };

    if (loading) {
        return (
            <div className="p-12 text-center text-slate-400 flex flex-col items-center justify-center font-sans">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mb-2" />
                <p className="text-xs font-semibold">Loading Wiki & Knowledge Base...</p>
            </div>
        );
    }

    return (
        <div className="p-8 max-w-7xl mx-auto w-full font-sans space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                        <BookOpen className="w-6 h-6 text-blue-600" /> Docs & Workspace Wiki
                    </h1>
                    <p className="text-slate-500 text-sm mt-0.5">
                        Centralized SOPs, product specs, meeting notes, and knowledge base.
                    </p>
                </div>

                <button
                    onClick={handleOpenCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md shadow-blue-500/20"
                >
                    <Plus className="w-4 h-4" /> New Document
                </button>
            </div>

            {/* Main Layout: Sidebar + Document Reader */}
            <div className="flex flex-col lg:flex-row gap-6 min-h-[600px]">
                {/* Left Search & Doc Roster */}
                <div className="w-full lg:w-80 bg-white border border-slate-200/80 rounded-3xl p-4 shadow-xs flex flex-col shrink-0">
                    <div className="relative mb-3">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Search docs & notes..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                        />
                    </div>

                    {/* Category Filter Pills */}
                    <div className="flex items-center gap-1 overflow-x-auto pb-2 mb-3 text-[10px] font-bold">
                        <button
                            onClick={() => setSelectedCategory('All')}
                            className={`px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer ${selectedCategory === 'All' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            All
                        </button>
                        {CATEGORIES.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-2.5 py-1 rounded-lg transition shrink-0 cursor-pointer ${selectedCategory === cat ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Doc List */}
                    <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 max-h-[500px]">
                        {filteredDocs.length === 0 ? (
                            <p className="text-xs text-slate-400 text-center py-8">No documents found.</p>
                        ) : (
                            filteredDocs.map((doc) => (
                                <button
                                    key={doc.id}
                                    onClick={() => setSelectedDoc(doc)}
                                    className={`w-full text-left p-3 rounded-2xl transition border cursor-pointer ${selectedDoc?.id === doc.id
                                            ? 'bg-blue-50/80 border-blue-300 text-blue-900 shadow-2xs'
                                            : 'bg-white border-transparent hover:bg-slate-50 text-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="font-extrabold text-xs truncate max-w-[180px]">{doc.title}</span>
                                        {doc.is_private ? (
                                            <Lock className="w-3 h-3 text-amber-500 shrink-0" />
                                        ) : (
                                            <Globe className="w-3 h-3 text-slate-300 shrink-0" />
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400">
                                        <span className="font-semibold text-slate-500">{doc.category}</span>
                                        <span>•</span>
                                        <span>{new Date(doc.updated_at).toLocaleDateString()}</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Right Content Reader */}
                <div className="flex-1 bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs flex flex-col">
                    {selectedDoc ? (
                        <div className="space-y-6 flex-1 flex flex-col">
                            {/* Doc Actions Bar */}
                            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                                <div>
                                    <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-blue-50 text-blue-700 uppercase border border-blue-200/60">
                                        {selectedDoc.category}
                                    </span>
                                    <p className="text-xs text-slate-400 font-medium mt-2">
                                        Authored by <b className="text-slate-700">{selectedDoc.author_name}</b> • Last updated{' '}
                                        {new Date(selectedDoc.updated_at).toLocaleDateString()}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenEditModal(selectedDoc)}
                                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition cursor-pointer"
                                        title="Edit Document"
                                    >
                                        <Edit3 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteDoc(selectedDoc.id)}
                                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                                        title="Delete Document"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Title & Tags */}
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">{selectedDoc.title}</h2>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    {selectedDoc.tags?.map((t, idx) => (
                                        <span key={idx} className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                                            <Tag className="w-2.5 h-2.5 text-slate-400" /> {t}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Formatted Reader View */}
                            <div className="flex-1 bg-slate-50/60 border border-slate-200/60 rounded-2xl p-5">
                                {renderFormattedContent(selectedDoc.content)}
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-slate-400 py-16">
                            <FileText className="w-10 h-10 mb-2 text-slate-300" />
                            <p className="font-semibold text-xs">Select a document from the left to read or edit</p>
                        </div>
                    )}
                </div>
            </div>

            {/* CREATE / EDIT DOC MODAL */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
                    <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative font-sans">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-blue-600" />
                                {editingDocId ? 'Edit Workspace Document' : 'Create Workspace Document'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveDoc} className="space-y-4 text-xs">
                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Document Title</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Q3 Sales Strategy & SOP"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1">Category</label>
                                    <select
                                        value={category}
                                        onChange={(e) => setCategory(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none cursor-pointer"
                                    >
                                        {CATEGORIES.map((cat) => (
                                            <option key={cat} value={cat}>{cat}</option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block font-bold text-slate-600 uppercase mb-1">Tags (Comma Separated)</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Sales, Strategy, SOP"
                                        value={tags}
                                        onChange={(e) => setTags(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block font-bold text-slate-600 uppercase mb-1">Document Body / Notes (Supports Markdown)</label>
                                <textarea
                                    required
                                    rows={8}
                                    placeholder="Write documentation using Markdown (e.g., ### Header, * bullet point)..."
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-mono"
                                />
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                                <input
                                    type="checkbox"
                                    id="isPrivate"
                                    checked={isPrivate}
                                    onChange={(e) => setIsPrivate(e.target.checked)}
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                />
                                <label htmlFor="isPrivate" className="text-xs font-semibold text-slate-700 cursor-pointer flex items-center gap-1">
                                    <Lock className="w-3.5 h-3.5 text-amber-500" /> Private Document (Only visible to creators/admins)
                                </label>
                            </div>

                            <div className="pt-2 flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex-1 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-xs flex-1 shadow-md shadow-blue-500/20 cursor-pointer"
                                >
                                    {editingDocId ? 'Save Changes' : 'Publish Document'}
                                </button>
                            </div>
                        </form>
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