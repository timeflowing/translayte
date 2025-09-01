'use client';

import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import {
    collection,
    doc,
    onSnapshot,
    serverTimestamp,
    query,
    where,
    getDocs,
    writeBatch,
} from 'firebase/firestore';
import { auth, db } from '@/app/lib/firebaseClient';

// ──────────────────────────────────────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────────────────────────────────────
type Lang = string;

type Project = {
    id: string;
    name: string;
};

type Item = {
    key: string;
    values: Record<Lang, string>;
    context?: string;
    status?: 'draft' | 'in_review' | 'approved' | 'incomplete';
    charLimit?: number;
    history?: Array<{ at: string; by: { uid: string; name?: string }; action: string }>;
    // Optional metadata for the row (display only)
    updatedAt?: string; // ISO
    updatedBy?: { uid: string; name?: string };
};

type SharedPayload = {
    id: string;
    fileName: string;
    sourceLanguage: Lang;
    targetLanguages: Lang[];
    items: Item[];
    pageInfo?: { page: number; pageSize: number; nextCursor?: string | null };
    isOwner: boolean;
};

// ──────────────────────────────────────────────────────────────────────────────
const STATUS_PILL: Record<NonNullable<Item['status']>, string> = {
    draft: 'bg-gray-700 text-gray-200',
    in_review: 'bg-amber-600/80 text-white',
    approved: 'bg-emerald-700 text-white',
    incomplete: 'bg-rose-700 text-white',
};

const LANG_LABELS: Record<string, { title: string; subtitle?: string }> = {
    en: { title: 'EN English', subtitle: 'Source' },
    cs: { title: 'CS Czech' },
    it: { title: 'IT Italian' },
};

function cn(...xs: Array<string | false | null | undefined>) {
    return xs.filter(Boolean).join(' ');
}

function timeAgo(iso?: string) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.round(diff / 60000);
    if (m < 1) return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.round(h / 24);
    return `${d}d ago`;
}

function Avatar({ name }: { name: string }) {
    const initials = name
        .split(' ')
        .map(s => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return (
        <span className="grid h-6 w-6 place-items-center rounded-full bg-violet-500 text-[11px] font-semibold text-white ring-2 ring-[#0F0F23]">
            {initials}
        </span>
    );
}

function PresenceChip({ name = 'Editor' }: { name?: string }) {
    const initials = name
        .split(' ')
        .map(s => s[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();
    return (
        <span className="inline-flex items-center gap-1 rounded-full bg-[#341d6b] px-2 py-0.5 text-[10px] text-violet-200 ring-1 ring-violet-700/40">
            <span className="grid h-3.5 w-3.5 place-items-center rounded-full bg-violet-500 text-[9px] text-white">
                {initials}
            </span>
            editing
        </span>
    );
}

function StatusPill({ status, onClick }: { status: Item['status']; onClick?: () => void }) {
    const s = status || 'draft';
    return (
        <button
            onClick={onClick}
            className={cn(
                'rounded-full px-2.5 py-1 text-xs font-medium leading-none',
                STATUS_PILL[s],
            )}
        >
            {s.replace('_', ' ')}
        </button>
    );
}

function Progress({ cur, max }: { cur: number; max?: number }) {
    if (!max) return <span className="text-[10px] text-gray-500">—</span>;
    const pct = Math.min(100, Math.round((cur / max) * 100));
    const bar = pct >= 90 ? 'bg-rose-600' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-600';
    return (
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
            <div className="h-1.5 w-28 overflow-hidden rounded bg-gray-800">
                <div className={cn('h-full', bar)} style={{ width: `${pct}%` }} />
            </div>
            <span>
                {cur}/{max}
            </span>
        </div>
    );
}

function ColumnHeader({ code }: { code: string }) {
    const label = LANG_LABELS[code.toLowerCase()] || {
        title: code.toUpperCase(),
    };
    return (
        <div className="flex flex-col">
            <span className="text-gray-200">{label.title}</span>
            {label.subtitle && <span className="text-[11px] text-gray-400">{label.subtitle}</span>}
        </div>
    );
}

function EditableCell({
    value,
    onCommit,
    placeholder,
    metaAt,
    metaBy,
    onPresenceChange,
}: {
    value: string;
    onCommit: (v: string) => void;
    placeholder?: string;
    metaAt?: string;
    metaBy?: string;
    onPresenceChange: (active: boolean) => void;
}) {
    const [v, setV] = useState(value);
    const saveTimeout = useRef<NodeJS.Timeout | null>(null);

    // Update local state if the prop changes from outside
    useEffect(() => {
        setV(value);
    }, [value]);

    // Debounced save effect: saves 1.5s after the user stops typing.
    useEffect(() => {
        // If the local value is the same as the prop, there's nothing to save.
        if (v === value) {
            return;
        }

        // Clear any existing timeout to reset the debounce timer.
        if (saveTimeout.current) {
            clearTimeout(saveTimeout.current);
        }

        // Set a new timeout to commit the change after a delay.
        saveTimeout.current = setTimeout(() => {
            onCommit(v);
        }, 1500); // 1.5-second delay

        // Cleanup function to clear the timeout if the component unmounts or `v` changes.
        return () => {
            if (saveTimeout.current) {
                clearTimeout(saveTimeout.current);
            }
        };
    }, [v, value, onCommit]);

    return (
        <div className="rounded-md ring-1 ring-gray-800 bg-[#0B0B1A] focus-within:ring-2 focus-within:ring-[#8B5CF6]">
            <textarea
                className="w-full resize-none bg-transparent px-3 py-2 text-sm text-gray-100 outline-none placeholder-gray-500"
                rows={1}
                value={v}
                onFocus={() => onPresenceChange(true)}
                onBlur={() => {
                    // On blur, commit immediately to prevent data loss, cancelling any scheduled save.
                    if (saveTimeout.current) clearTimeout(saveTimeout.current);
                    if (v !== value) onCommit(v);
                    onPresenceChange(false);
                }}
                onChange={e => setV(e.target.value)}
                onKeyDown={e => {
                    // Commit on Cmd/Ctrl+Enter (prevent newline)
                    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        // Also commit immediately.
                        if (saveTimeout.current) clearTimeout(saveTimeout.current);
                        if (v !== value) onCommit(v);
                    }
                    // Tab will blur naturally; commit happens on blur
                }}
                placeholder={placeholder}
                readOnly={!auth.currentUser}
            />
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Modal Components
// ──────────────────────────────────────────────────────────────────────────────

function Modal({
    isOpen,
    onClose,
    children,
}: {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
            onClick={onClose}
        >
            <div
                className="w-full max-w-md rounded-lg bg-[#12122A] p-6 shadow-xl"
                onClick={e => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
}

function AddKeyModal({
    isOpen,
    onClose,
    onAddKey,
}: {
    isOpen: boolean;
    onClose: () => void;
    onAddKey: (key: string) => void;
}) {
    const [key, setKey] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (key.trim()) {
            onAddKey(key.trim());
            setKey(''); // Reset input
            onClose(); // Close modal on submit
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <form onSubmit={handleSubmit}>
                <h3 className="mb-4 text-lg font-semibold text-white">Add New Translation Key</h3>
                <p className="mb-4 text-sm text-gray-400">
                    Enter a unique key for the new translation. Use dot notation for grouping (e.g.,
                    `common.buttons.submit`).
                </p>
                <div>
                    <label htmlFor="new-key-input" className="sr-only">
                        New Key
                    </label>
                    <input
                        id="new-key-input"
                        type="text"
                        value={key}
                        onChange={e => setKey(e.target.value)}
                        placeholder="e.g., common.submit"
                        className="w-full rounded-lg bg-[#0B0B1A] px-3 py-2 text-sm text-gray-100 ring-1 ring-gray-800 focus:ring-2 focus:ring-[#8B5CF6]"
                        autoFocus
                    />
                </div>
                <div className="mt-6 flex justify-end gap-3">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-700 px-4 py-2 text-sm font-medium text-gray-300 hover:bg-gray-800/60"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="rounded-lg bg-[#8B5CF6] px-4 py-2 text-sm font-medium text-white hover:bg-[#7C3AED] disabled:opacity-50"
                        disabled={!key.trim()}
                    >
                        Add Key
                    </button>
                </div>
            </form>
        </Modal>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Page
// ──────────────────────────────────────────────────────────────────────────────
export default function ShareBoardPage() {
    const params = useParams();
    const token = params.token as string;
    const router = useRouter();
    const [user, authLoading] = useAuthState(auth);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<SharedPayload | null>(null);
    const [allItems, setAllItems] = useState<Item[]>([]);
    const [q, setQ] = useState('');
    const [status, setStatus] = useState<'all' | NonNullable<Item['status']>>('all');
    const [selected, setSelected] = useState<Item | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const activePresenceId = useRef<string | null>(null);
    const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false);
    const [isMember, setIsMember] = useState(false); // New state to track membership

    const currentName = user?.displayName || 'You';

    const langs = useMemo(
        () => (data ? [data.sourceLanguage, ...data.targetLanguages] : []),
        [data],
    );

    // Presence (per-cell) via Firestore (read-only stream)
    const [presence, setPresence] = useState<Record<string, { name: string }>>({});
    useEffect(() => {
        // Only set up the listener if the user is a confirmed member of the project.
        if (!user || !isMember) {
            setPresence({});
            return;
        }
        const unsub = onSnapshot(collection(db, 'projects', token, 'presenceCells'), snap => {
            const m: Record<string, { name: string }> = {};
            snap.forEach(d => {
                const x = d.data();
                m[d.id] = { name: x.name || 'Editor' };
            });
            setPresence(m);
        });
        return () => unsub();
    }, [token, user, isMember]); // Add isMember to dependencies

    const uniqueCollaborators = useMemo(
        () =>
            Object.values(presence)
                .map(p => p.name)
                .filter((v, i, a) => a.indexOf(v) === i),
        [presence],
    );

    const filtered = useMemo(() => {
        const n = q.toLowerCase().trim();
        return allItems.filter(
            r =>
                (status === 'all' ? true : r.status === status) &&
                (!n ||
                    r.key.toLowerCase().includes(n) ||
                    r.context?.toLowerCase().includes(n) ||
                    Object.values(r.values).some(v => v?.toLowerCase().includes(n))),
        );
    }, [allItems, q, status]);

    // Centralized presence management
    async function updateUserPresence(presenceId: string | null) {
        if (!auth.currentUser) return;
        if (activePresenceId.current === presenceId) return;

        const batch = writeBatch(db);

        // Delete old presence doc if it exists
        if (activePresenceId.current) {
            const oldDocRef = doc(db, 'projects', token, 'presenceCells', activePresenceId.current);
            batch.delete(oldDocRef);
        }

        // Set new presence doc if a new one is provided
        if (presenceId) {
            const newDocRef = doc(db, 'projects', token, 'presenceCells', presenceId);
            const [key, lang] = presenceId.split('::');
            batch.set(newDocRef, {
                key,
                lang: lang || 'context',
                uid: auth.currentUser.uid,
                name: auth.currentUser.displayName || 'You',
                updatedAt: serverTimestamp(),
            });
        }

        try {
            await batch.commit();
            activePresenceId.current = presenceId;
        } catch (e) {
            console.error('Failed to update presence', e);
        }
    }

    // Cleanup presence on page unload
    useEffect(() => {
        return () => {
            if (activePresenceId.current) {
                void updateUserPresence(null);
            }
        };
    }, []);

    // Server PATCH queue
    const saveQueue = useRef(Promise.resolve());
    async function commitDelta(update: {
        key: string;
        lang?: string;
        value?: string;
        context?: string;
        status?: Item['status'];
    }) {
        // Optimistically update the main list of items
        setAllItems(currentItems =>
            currentItems.map(item => {
                if (item.key !== update.key) return item;
                const newValues: Record<string, string> = update.lang
                    ? {
                          ...item.values,
                          [update.lang]: update.value ?? '',
                      }
                    : item.values;
                // Ensure all values are strings (no undefined)
                Object.keys(newValues).forEach(k => {
                    if (typeof newValues[k] !== 'string') {
                        newValues[k] = '';
                    }
                });
                return {
                    ...item,
                    values: newValues,
                    context: update.context ?? item.context,
                    status: update.status ?? item.status,
                };
            }),
        );

        saveQueue.current = saveQueue.current.then(async () => {
            const headers: HeadersInit = { 'Content-Type': 'application/json' };
            if (auth.currentUser)
                headers['Authorization'] = `Bearer ${await auth.currentUser.getIdToken()}`;
            const res = await fetch(`/api/share/${token}`, {
                method: 'PATCH',
                headers,
                body: JSON.stringify({ updates: [update] }),
            });
            if (!res.ok) {
                const e = await res.json().catch(() => ({}));
                throw new Error(e.error || 'Failed to save');
            }
        });
        return saveQueue.current;
    }

    const handleAddKey = async (newKey: string) => {
        if (!user) {
            alert('Please sign in to add a new key.');
            return;
        }

        // Check for duplicates
        if (allItems.some(item => item.key === newKey)) {
            alert(`Error: Key "${newKey}" already exists.`);
            return;
        }

        // Create the new item for optimistic update
        const newItem: Item = {
            key: newKey,
            values: langs.reduce((acc, lang) => ({ ...acc, [lang]: '' }), {}),
            status: 'draft',
            updatedAt: new Date().toISOString(),
            updatedBy: {
                uid: user.uid,
                name: currentName,
            },
        };

        // Optimistically add to the top of the list
        setAllItems(currentItems => [newItem, ...currentItems]);

        // Persist the change to the backend.
        await commitDelta({
            key: newKey,
            lang: data?.sourceLanguage,
            value: '', // initial empty value
        });
    };

    // Paging
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Get the items for the current page from the full list
    const itemsOnCurrentPage = useMemo(() => {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        return filtered.slice(start, end);
    }, [filtered, page, pageSize]);

    // Main data loading and project fetching effect.
    // This effect now correctly handles re-loading when the user or project token changes.
    useEffect(() => {
        const loadTranslations = async () => {
            try {
                const headers: HeadersInit = { 'Content-Type': 'application/json' };
                if (user) {
                    try {
                        headers['Authorization'] = `Bearer ${await user.getIdToken()}`;
                    } catch {}
                }
                const url = new URL(`/api/share/${token}`, window.location.origin);

                type ApiTranslationResult = Record<string, Record<string, string>>;
                type ApiResponse = {
                    id: string;
                    fileName: string;
                    sourceLanguage: Lang;
                    targetLanguages: Lang[];
                    translationResult: ApiTranslationResult;
                    pageInfo?: { page: number; pageSize: number; nextCursor?: string | null };
                    isOwner?: boolean;
                };

                const r = await fetch(url.toString(), { headers });
                if (!r.ok) {
                    const e = await r.json().catch(() => ({}));
                    throw new Error(e.error || `Failed to load (${r.status})`);
                }
                const payloadFromApi: ApiResponse = await r.json();

                // transform nested translationResult → Item[]
                const itemsOut: Item[] = [];
                const allKeys = new Set<string>();
                Object.values(payloadFromApi.translationResult || {}).forEach(langObj =>
                    Object.keys(langObj || {}).forEach(k => allKeys.add(k)),
                );

                allKeys.forEach(key => {
                    const values: Record<Lang, string> = {};
                    values[payloadFromApi.sourceLanguage] = ''; // source not in payload → blank
                    payloadFromApi.targetLanguages.forEach(t => {
                        const apiLangKey = Object.keys(payloadFromApi.translationResult || {}).find(
                            k => k.toLowerCase().startsWith(t.toLowerCase()),
                        );
                        values[t] = apiLangKey
                            ? payloadFromApi.translationResult[apiLangKey]?.[key] || ''
                            : '';
                    });
                    itemsOut.push({
                        key,
                        values,
                        status: 'draft',
                    });
                });

                setData({
                    id: payloadFromApi.id,
                    fileName: payloadFromApi.fileName,
                    sourceLanguage: payloadFromApi.sourceLanguage,
                    targetLanguages: payloadFromApi.targetLanguages,
                    isOwner: !!payloadFromApi.isOwner,
                    items: itemsOut,
                    pageInfo: payloadFromApi.pageInfo,
                });
                setAllItems(itemsOut);
            } catch (e) {
                setError(
                    typeof e === 'object' && e !== null && 'message' in e
                        ? (e as { message?: string }).message || 'Failed to load'
                        : 'Failed to load',
                );
            }
        };

        const fetchProjects = async () => {
            if (!user) {
                setProjects([]);
                return;
            }
            try {
                // Query matches members map structure with roles
                const qy = query(
                    collection(db, 'projects'),
                    where(`members.${user.uid}.role`, 'in', ['owner', 'editor', 'viewer']),
                );
                const querySnapshot = await getDocs(qy);
                const userProjects = querySnapshot.docs.map(docSnap => ({
                    id: docSnap.id,
                    name: (docSnap.data() as any).fileName || 'Untitled Project',
                }));
                setProjects(userProjects);
                // After fetching projects, explicitly check if the current user is a member of the *current* project.
                setIsMember(userProjects.some(p => p.id === token));
            } catch (err) {
                console.error('Failed to fetch projects:', err);
                setProjects([]);
                setIsMember(false); // Ensure membership is false on error
            }
        };

        if (!authLoading) {
            // Reset state on token/user change to ensure a clean load
            setLoading(true);
            setError(null);
            setAllItems([]);
            setData(null);
            setPage(1); // Reset to first page
            setIsMember(false); // Reset membership status

            Promise.all([loadTranslations(), fetchProjects()]).finally(() => {
                setLoading(false);
            });
        }
    }, [authLoading, token, user]);

    // For logged-out users (or fetch error), at least show the current project in sidebar
    useEffect(() => {
        if (!user && data && projects.length === 0) {
            setProjects([{ id: token, name: data.fileName }]);
        }
    }, [data, user, projects.length, token]);

    if (loading || authLoading) {
        return (
            <div className="min-h-screen bg-[#0F0F23] grid place-items-center">
                <div className="text-center">
                    <div className="animate-spin w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full mx-auto mb-4" />
                    <p className="text-gray-300">Loading…</p>
                </div>
            </div>
        );
    }
    if (error || !data) {
        return (
            <div className="min-h-screen bg-[#0F0F23] grid place-items-center">
                <div className="text-center">
                    <div className="text-red-400 text-6xl mb-4">❌</div>
                    <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
                    <p className="text-gray-300 mb-4">{error || 'Failed to load'}</p>
                    <button
                        onClick={() => router.push('/')}
                        className="bg-[#8B5CF6] text-white px-6 py-2 rounded-lg hover:bg-[#7C3AED]"
                    >
                        Go Home
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#0F0F23] text-gray-100">
            <div className="grid grid-cols-1 lg:grid-cols-[260px,1fr,320px] gap-0">
                {/* Sidebar (Projects + Languages) */}
                <aside className="hidden lg:block h-screen sticky top-0 border-r border-gray-800 bg-[#0A0A16] p-4">
                    <div className="mb-6">
                        <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                            Projects
                        </div>
                        <ul className="space-y-1">
                            {projects
                                .filter(p => p.id) // Critical fix: Ensure project ID is not empty or null
                                .map(project => (
                                    <li
                                        key={project.id}
                                        onClick={() => router.push(`/share/${project.id}`)}
                                        className={cn(
                                            'truncate rounded-lg px-3 py-2 text-sm cursor-pointer',
                                            project.id === token
                                                ? 'bg-[#17172e] text-white ring-1 ring-violet-800/30'
                                                : 'text-gray-400 hover:bg-[#14142a]',
                                        )}
                                        title={project.name}
                                    >
                                        {project.name}
                                    </li>
                                ))}
                        </ul>
                        <button
                            onClick={() => router.push('/new')}
                            className="mt-4 w-full rounded-lg border border-gray-700 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800/60"
                        >
                            + Create New Project
                        </button>
                    </div>
                    <div>
                        <div className="mb-2 text-xs uppercase tracking-wide text-gray-500">
                            Languages
                        </div>
                        <ul className="space-y-1 text-sm">
                            {[data.sourceLanguage, ...data.targetLanguages].map(l => (
                                <li
                                    key={l}
                                    className="flex items-center gap-2 rounded-md px-2 py-1 hover:bg-[#14142a]"
                                >
                                    <span className="inline-block h-2 w-2 rounded-full bg-violet-500" />{' '}
                                    {l.toUpperCase()}
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>

                {/* Main */}
                <main className="min-h-screen px-4 py-6 md:px-5">
                    {/* Top bar */}
                    <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl font-semibold text-white">
                                {data.fileName || 'Project'}
                            </h1>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative">
                                <input
                                    value={q}
                                    onChange={e => setQ(e.target.value)}
                                    placeholder="Search translations…"
                                    className="w-72 rounded-lg bg-[#0B0B1A] px-3 py-2 text-sm text-gray-100 ring-1 ring-gray-800 focus:ring-2 focus:ring-[#8B5CF6]"
                                />
                            </div>
                            <select
                                value={status}
                                onChange={e =>
                                    setStatus(
                                        e.target.value as
                                            | 'all'
                                            | 'draft'
                                            | 'in_review'
                                            | 'approved'
                                            | 'incomplete',
                                    )
                                }
                                className="rounded-lg bg-[#0B0B1A] px-3 py-2 text-sm ring-1 ring-gray-800 focus:ring-2 focus:ring-[#8B5CF6]"
                            >
                                <option value="all">All statuses</option>
                                <option value="approved">Approved</option>
                                <option value="in_review">In Review</option>
                                <option value="draft">Draft</option>
                                <option value="incomplete">Incomplete</option>
                            </select>
                            <button className="rounded-lg border border-gray-700 px-3 py-2 text-sm hover:bg-gray-800/60">
                                Filters
                            </button>
                            <button
                                onClick={() => setIsAddKeyModalOpen(true)}
                                className="rounded-lg bg-[#8B5CF6] px-3 py-2 text-sm hover:bg-[#7C3AED]"
                            >
                                + Add Key
                            </button>
                        </div>
                    </div>

                    {/* Table (Desktop) */}
                    <div className="hidden md:block overflow-auto rounded-xl ring-1 ring-gray-800">
                        <table className="w-full min-w-[1200px] table-fixed">
                            <thead className="bg-[#12122A] text-left text-xs uppercase text-gray-400">
                                <tr>
                                    <th className="w-64 px-3 py-3">Key</th>
                                    {langs.map(l => (
                                        <th key={l} className="px-3 py-3">
                                            <ColumnHeader code={l} />
                                        </th>
                                    ))}
                                    <th className="w-24 px-3 py-3">Status</th>
                                    <th className="w-20 px-3 py-3">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-800 bg-[#0B0B1A]">
                                {itemsOnCurrentPage.map(row => {
                                    const rowHasPresence = langs.find(
                                        l => presence[`${row.key}::${l}`],
                                    );
                                    const editorName = rowHasPresence
                                        ? presence[`${row.key}::${rowHasPresence}`]?.name
                                        : undefined;

                                    return (
                                        <tr key={row.key} className="align-top hover:bg-[#0f0f24]">
                                            <td className="px-3 py-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono text-xs text-gray-300">
                                                        {row.key}
                                                    </span>
                                                    {rowHasPresence && (
                                                        <PresenceChip
                                                            name={editorName || 'Editor'}
                                                        />
                                                    )}
                                                </div>
                                                <div className="mt-1 text-[11px] text-gray-500">
                                                    {row.updatedAt && row.updatedBy?.name && (
                                                        <>
                                                            {timeAgo(row.updatedAt)} • by{' '}
                                                            <span className="text-gray-300">
                                                                {row.updatedBy.name}
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </td>

                                            {langs.map(l => (
                                                <td key={l} className="px-3 py-2">
                                                    <EditableCell
                                                        value={row.values[l] || ''}
                                                        placeholder={`Edit ${l.toUpperCase()}…`}
                                                        metaAt={row.updatedAt}
                                                        metaBy={row.updatedBy?.name}
                                                        onPresenceChange={active => {
                                                            const presenceId = `${row.key}::${l}`;
                                                            updateUserPresence(
                                                                active ? presenceId : null,
                                                            );
                                                        }}
                                                        onCommit={async val => {
                                                            if (!auth.currentUser) {
                                                                alert(
                                                                    'Please sign in to save changes.',
                                                                );
                                                                return;
                                                            }
                                                            // Optimistic update
                                                            setAllItems(rs =>
                                                                rs.map(r =>
                                                                    r.key === row.key
                                                                        ? {
                                                                              ...r,
                                                                              values: {
                                                                                  ...r.values,
                                                                                  [l]: val,
                                                                              },
                                                                              updatedAt:
                                                                                  new Date().toISOString(),
                                                                              updatedBy: {
                                                                                  uid: auth.currentUser!
                                                                                      .uid,
                                                                                  name: currentName,
                                                                              },
                                                                          }
                                                                        : r,
                                                                ),
                                                            );
                                                            await commitDelta({
                                                                key: row.key,
                                                                lang: l,
                                                                value: val,
                                                            });
                                                        }}
                                                    />
                                                </td>
                                            ))}

                                            <td className="px-3 py-2">
                                                <StatusPill
                                                    status={row.status}
                                                    onClick={async () => {
                                                        const order: Required<Item>['status'][] = [
                                                            'draft',
                                                            'in_review',
                                                            'approved',
                                                            'incomplete',
                                                        ];
                                                        const cur = row.status || 'draft';
                                                        const next =
                                                            order[
                                                                (order.indexOf(cur) + 1) %
                                                                    order.length
                                                            ];
                                                        // Optimistic update
                                                        setAllItems(rs =>
                                                            rs.map(r =>
                                                                r.key === row.key
                                                                    ? { ...r, status: next }
                                                                    : r,
                                                            ),
                                                        );
                                                        await commitDelta({
                                                            key: row.key,
                                                            status: next,
                                                        });
                                                    }}
                                                />
                                            </td>
                                            <td className="px-3 py-2 text-right">
                                                <button
                                                    className="grid h-7 w-7 place-items-center rounded-md bg-gray-800 hover:bg-gray-700"
                                                    title="Row menu"
                                                    onClick={() => setSelected(row)}
                                                >
                                                    ⋮
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {itemsOnCurrentPage.length === 0 && (
                                    <tr>
                                        <td
                                            colSpan={4 + langs.length}
                                            className="px-3 py-12 text-center text-gray-400"
                                        >
                                            No items
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Cards (Mobile) */}
                    <div className="md:hidden space-y-3">
                        {itemsOnCurrentPage.map(row => {
                            const anyP = Object.keys(presence).find(k => k.startsWith(row.key));
                            const editor = anyP ? presence[anyP] : null;
                            return (
                                <div
                                    key={row.key}
                                    className="rounded-lg bg-[#0B0B1A] p-4 ring-1 ring-gray-800"
                                    onClick={() => setSelected(row)}
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-sm text-gray-200">
                                                    {row.key}
                                                </span>
                                                {editor && <PresenceChip name={editor.name} />}
                                            </div>
                                            <span className="text-xs text-gray-500 mt-1">
                                                {row.updatedAt && row.updatedBy?.name
                                                    ? `${timeAgo(row.updatedAt)} • by ${
                                                          row.updatedBy.name
                                                      }`
                                                    : '—'}
                                            </span>
                                        </div>
                                        <StatusPill status={row.status} />
                                    </div>
                                    <div className="space-y-3">
                                        {langs.map(l => (
                                            <div key={l}>
                                                <div className="text-xs text-gray-400 mb-1">
                                                    {l.toUpperCase()}
                                                </div>
                                                <EditableCell
                                                    value={row.values[l] || ''}
                                                    placeholder={`Edit ${l.toUpperCase()}…`}
                                                    metaAt={row.updatedAt}
                                                    metaBy={row.updatedBy?.name}
                                                    onPresenceChange={active => {
                                                        const presenceId = `${row.key}::${l}`;
                                                        updateUserPresence(
                                                            active ? presenceId : null,
                                                        );
                                                    }}
                                                    onCommit={async val => {
                                                        if (!auth.currentUser) {
                                                            alert(
                                                                'Please sign in to save changes.',
                                                            );
                                                            return;
                                                        }
                                                        // Optimistic update
                                                        setAllItems(rs =>
                                                            rs.map(r =>
                                                                r.key === row.key
                                                                    ? {
                                                                          ...r,
                                                                          values: {
                                                                              ...r.values,
                                                                              [l]: val,
                                                                          },
                                                                          updatedAt:
                                                                              new Date().toISOString(),
                                                                          updatedBy: {
                                                                              uid: auth.currentUser!
                                                                                  .uid,
                                                                              name: currentName,
                                                                          },
                                                                      }
                                                                    : r,
                                                            ),
                                                        );
                                                        await commitDelta({
                                                            key: row.key,
                                                            lang: l,
                                                            value: val,
                                                        });
                                                    }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                        {itemsOnCurrentPage.length === 0 && (
                            <div className="px-3 py-12 text-center text-gray-400">No items</div>
                        )}
                    </div>

                    {/* Footer (paging + export) */}
                    <Footer
                        count={itemsOnCurrentPage.length}
                        total={filtered.length}
                        page={page}
                        setPage={setPage}
                        pageSize={pageSize}
                        setPageSize={n => {
                            setPageSize(n);
                            setPage(1);
                        }}
                        hasNextPage={page * pageSize < filtered.length}
                        langs={langs}
                        items={allItems}
                    />
                </main>

                {/* Inspector (right panel) */}
                <aside className="hidden lg:block h-screen sticky top-0 border-l border-gray-800 bg-[#0A0A16] p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-white">Translation Details</h3>
                        <span className="text-xs text-emerald-400">
                            {Math.max(1, uniqueCollaborators.length)} collaborators online
                        </span>
                    </div>

                    {!selected ? (
                        <p className="text-sm text-gray-400">Select a row to see details.</p>
                    ) : (
                        <div className="space-y-5">
                            <div className="text-xs text-gray-400">
                                Currently viewing:{' '}
                                <span className="font-mono text-gray-200">{selected.key}</span>
                            </div>

                            {/* Context */}
                            <section>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Context
                                </h4>
                                <EditableCell
                                    value={selected.context || ''}
                                    placeholder="Add context…"
                                    onPresenceChange={active => {
                                        const presenceId = `${selected.key}::context`;
                                        updateUserPresence(active ? presenceId : null);
                                    }}
                                    onCommit={async val => {
                                        if (!auth.currentUser) {
                                            alert('Please sign in to save changes.');
                                            return;
                                        }
                                        // Optimistic update
                                        setAllItems(rs =>
                                            rs.map(r =>
                                                r.key === selected.key ? { ...r, context: val } : r,
                                            ),
                                        );
                                        setSelected(s => (s ? { ...s, context: val } : s));
                                        await commitDelta({ key: selected.key, context: val });
                                    }}
                                />
                            </section>

                            {/* Character limits */}
                            <section>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Character Limits
                                </h4>
                                <div className="rounded-md border border-gray-800 bg-[#0B0B1A] p-3 text-sm text-gray-300">
                                    <Progress
                                        cur={(selected.values[data.sourceLanguage] || '').length}
                                        max={selected.charLimit}
                                    />
                                </div>
                            </section>

                            {/* Screenshots */}
                            <section>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Screenshots
                                </h4>
                                <div className="rounded-md border border-dashed border-gray-700 p-6 text-center text-xs text-gray-500">
                                    No screenshots available
                                </div>
                            </section>

                            {/* History */}
                            <section>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    History
                                </h4>
                                <ul className="space-y-2 text-xs">
                                    {(selected.history && selected.history.length > 0
                                        ? selected.history
                                        : [
                                              {
                                                  at: new Date().toISOString(),
                                                  by: { uid: 'me', name: currentName },
                                                  action: 'Opened details',
                                              },
                                          ]
                                    )
                                        .slice(0, 8)
                                        .map((h, i) => (
                                            <li
                                                key={i}
                                                className="flex items-start justify-between gap-3 rounded-md border border-gray-800 bg-[#0B0B1A] px-3 py-2"
                                            >
                                                <div className="flex items-start gap-2">
                                                    <Avatar name={h.by?.name || 'User'} />
                                                    <div>
                                                        <div className="font-medium text-gray-200">
                                                            {h.by?.name || 'User'}
                                                        </div>
                                                        <div className="text-gray-400">
                                                            {h.action}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-[10px] text-gray-500">
                                                    {new Date(h.at).toLocaleString()}
                                                </div>
                                            </li>
                                        ))}
                                </ul>
                            </section>

                            {/* Actions */}
                            <section>
                                <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                                    Actions
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    <button
                                        className="rounded-md bg-[#8B5CF6] px-3 py-2 text-xs hover:bg-[#7C3AED]"
                                        onClick={async () => {
                                            if (!auth.currentUser)
                                                return alert('Sign in to update.');
                                            // Optimistic update
                                            setAllItems(rs =>
                                                rs.map(r =>
                                                    r.key === selected.key
                                                        ? { ...r, status: 'approved' }
                                                        : r,
                                                ),
                                            );
                                            setSelected(s =>
                                                s ? { ...s, status: 'approved' } : s,
                                            );
                                            await commitDelta({
                                                key: selected.key,
                                                status: 'approved',
                                            });
                                        }}
                                    >
                                        Approve
                                    </button>
                                    <button className="rounded-md bg-gray-800 px-3 py-2 text-xs hover:bg-gray-700">
                                        Assign
                                    </button>
                                    <button className="rounded-md bg-gray-800 px-3 py-2 text-xs hover:bg-gray-700">
                                        Add Comment
                                    </button>
                                    <button className="rounded-md bg-gray-800 px-3 py-2 text-xs hover:bg-gray-700">
                                        Machine Translate
                                    </button>
                                </div>
                            </section>
                        </div>
                    )}
                </aside>
            </div>
            <AddKeyModal
                isOpen={isAddKeyModalOpen}
                onClose={() => setIsAddKeyModalOpen(false)}
                onAddKey={handleAddKey}
            />
        </div>
    );
}

// ──────────────────────────────────────────────────────────────────────────────
// Footer (paging + export)
// ──────────────────────────────────────────────────────────────────────────────
function Footer({
    count,
    total,
    page,
    setPage,
    pageSize,
    setPageSize,
    hasNextPage,
    langs,
    items,
}: {
    count: number;
    total: number;
    page: number;
    setPage: (p: number) => void;
    pageSize: number;
    setPageSize: (n: number) => void;
    hasNextPage: boolean;
    langs: string[];
    items: Item[];
}) {
    const totalPages = Math.ceil(total / pageSize);

    return (
        <div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row text-xs text-gray-400">
            <div>
                Showing {count} of {total} items
            </div>
            <div className="flex items-center gap-2">
                <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="rounded-md border border-gray-700 px-2 py-1 hover:bg-gray-800 disabled:opacity-40"
                >
                    ‹
                </button>

                {/* Render page number buttons */}
                {totalPages > 1 &&
                    Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNumber => (
                        <button
                            key={pageNumber}
                            onClick={() => setPage(pageNumber)}
                            className={cn(
                                'rounded-md px-3 py-1',
                                pageNumber === page
                                    ? 'bg-[#8B5CF6] text-white'
                                    : 'border border-gray-700 hover:bg-gray-800',
                            )}
                        >
                            {pageNumber}
                        </button>
                    ))}

                <button
                    disabled={!hasNextPage}
                    onClick={() => setPage(page + 1)}
                    className="rounded-md border border-gray-700 px-2 py-1 hover:bg-gray-800 disabled:opacity-40"
                >
                    ›
                </button>
                <select
                    value={pageSize}
                    onChange={e => setPageSize(Number(e.target.value))}
                    className="ml-4 rounded-md border border-gray-700 bg-[#0B0B1A] px-2 py-1"
                >
                    <option value={10}>10 per page</option>
                    <option value={25}>25 per page</option>
                    <option value={50}>50 per page</option>
                </select>
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                        const exportObj: Record<string, Record<string, string>> = {};
                        langs.forEach(l => (exportObj[l] = {}));
                        items.forEach(r =>
                            langs.forEach(l => (exportObj[l][r.key] = r.values[l] || '')),
                        );
                        const txt = JSON.stringify(exportObj, null, 2);

                        if (navigator?.clipboard?.writeText) {
                            navigator.clipboard.writeText(txt).then(() => alert('Copied JSON'));
                        } else {
                            // Fallback: download as a file
                            const blob = new Blob([txt], { type: 'application/json' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'translations.json';
                            document.body.appendChild(a);
                            a.click();
                            a.remove();
                            URL.revokeObjectURL(url);
                        }
                    }}
                    className="rounded-lg bg-gray-700 px-3 py-2 text-gray-100 hover:bg-gray-600"
                >
                    Copy All as JSON
                </button>
            </div>
        </div>
    );
}
