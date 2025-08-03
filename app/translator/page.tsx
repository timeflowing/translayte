'use client';
import React, { useState, ChangeEvent, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../translayte.css';
import { translateBatch } from '../utils/translator';
import { auth, db } from '../lib/firebaseClient';
import { highlightJson, prettyJson } from '../utils/prettyJson';
import { useAuth } from '../context/AuthContext';
import {
    doc,
    onSnapshot,
    addDoc,
    collection,
    serverTimestamp,
    setDoc,
    deleteDoc,
    updateDoc,
} from 'firebase/firestore';
import 'react-toastify/dist/ReactToastify.css';

import Link from 'next/link';
import KeyValueContextInput from '../components/KeyValueContextInput';
import { LANGUAGE_OPTIONS } from '../languages';
import { DuplicateAnalysis } from '../utils/duplicateDetection';
import DuplicateWarning from '../components/DuplicateWarning';
import RealtimeInputSection from '../components/RealtimeInputSection';
import { LanguageGrid } from '../components/LanguageGrid';
import { HistoryAside } from '../components/HistoryAside'; // Import the new component
import { toast } from 'react-toastify';
import ModeSwitcher from '../components/ModeSwitcher';
import { DropZone } from '../components/DropZone';
import { parseInput } from '../utils/inputParser';

type HistoryItem = {
    id: string;
    userId?: string;
    fileName?: string;
    targetLanguages?: string[];
    translationResult?: Record<string, Record<string, string>>;
    createdAt?: { seconds: number; nanoseconds: number };
};

const FREE_TIER_KEY_LIMIT = 100;

export default function TranslatorPage() {
    const { user, loading: authLoading } = useAuth();
    const [keysThisMonth, setKeysThisMonth] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);

    // ADD THIS STATE:
    const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

    // Profile dropdown state
    const [profileOpen, setProfileOpen] = useState(false);

    // UPDATE THIS LINE:
    const isPro = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';

    const [translationId] = useState<string | null>(null);

    console.log(user?.uid);
    const [selectedShortcuts, setSelectedShortcuts] = useState<Set<string>>(new Set(['IT', 'CS']));
    const [rows, setRows] = useState<{ key: string; value: string; context: string }[]>([
        { key: '', value: '', context: '' },
    ]);
    const [mode, setMode] = useState<'file' | 'keys'>('file');

    const [minify] = useState(false);
    // const [lastPayload, setLastPayload] = useState<Record<string, string> | null>(null);
    const [lastTargetCodes, setLastTargetCodes] = useState<string[]>([]);
    /* key-value mode */
    // const [rows, setRows] = useState<{ key: string; value: string; context?: string }[]>([
    //     { key: '', value: '', context: '' },
    // ]);
    const [colorized, setColorized] = useState(true);

    /* JSON-file mode */
    const [jsonInput, setJsonInput] = useState('');
    // const [selectedTab, setSelectedTab] = useState<'json' | 'table'>('json');
    const [selectedView, setSelectedView] = useState<'json' | 'table' | 'all' | 'original'>('json');
    const [selectedLangTab, setSelectedLangTab] = useState<string | null>(null);
    const [outputFormat, setOutputFormat] = useState<'standard' | 'unity'>('standard');
    /* misc */
    const [isTranslating, setIsTranslating] = useState(false);
    const [langLimitInfo, setLangLimitInfo] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [, setTranslationTitle] = useState<string>('Untitled Translation');
    const [selectedPreviewLang, setSelectedPreviewLang] = React.useState<string | null>(null);
    /* ---------- translation result (⚠️ FLAT) ---------- */
    const [translationResult, setTranslationResult] = useState<Record<
        string,
        Record<string, string>
    > | null>(null);
    const [realtimeDuplicates, setRealtimeDuplicates] = useState<DuplicateAnalysis | null>(null);
    /* ------------- history */
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [isUserTranslation, setIsUserTranslation] = useState(false);
    const [keyCount, setKeyCount] = useState(0);
    const [, setCharCount] = useState(0);

    const handleUpdateTitle = async (id: string, newTitle: string) => {
        try {
            const docRef = doc(db, 'translations', id);
            await updateDoc(docRef, { fileName: newTitle });
            toast.success('Translation renamed!');
        } catch {
            toast.error('Failed to rename translation.');
        }
    };

    const handleLoadFromHistory = (item: HistoryItem) => {
        if (!item || !item.translationResult) return;

        setTranslationResult(item.translationResult);
        setKeyCount(
            Object.keys(
                item.translationResult?.[Object.keys(item.translationResult)[0] ?? ''] ?? {},
            ).length,
        );

        // Get all available language codes from the translation result
        const availableCodes = Object.keys(item.translationResult);

        // Use availableCodes for tabs and selection
        setLastTargetCodes(availableCodes);

        // Pick the first valid language as default tab/preview
        const firstLang = availableCodes[0] ?? null;
        setSelectedLangTab(firstLang);
        setSelectedPreviewLang(firstLang);

        setFileName(item.fileName ?? 'Untitled');
        setTranslationTitle(item.fileName ?? 'Untitled Translation');
        setIsUserTranslation(false);

        toast.success('Loaded translation from history!');
    };

    /* ------------- helpers */
    const toggleLanguage = (shortcut: string) => {
        setSelectedShortcuts(prev => {
            const next = new Set(prev);
            if (next.has(shortcut)) {
                next.delete(shortcut);
                setLangLimitInfo(null);
            } else {
                if (!isPro && next.size >= 3) {
                    setLangLimitInfo('Upgrade to Pro to select more than 3 languages.');
                    return prev;
                }
                next.add(shortcut);
                setLangLimitInfo(null);
            }
            return next;
        });
    };

    const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFileName(file.name);
        const reader = new FileReader();
        reader.onload = () => {
            let text = reader.result as string;
            // If not wrapped in { }, wrap it
            const trimmed = text.trim();
            if (trimmed.length && !trimmed.startsWith('{') && !trimmed.endsWith('}')) {
                text = `{${trimmed}}`;
            }
            const json = safeParseJsonInput(text);
            if (!json) {
                alert('Invalid JSON file');
                return;
            }
            setJsonInput(JSON.stringify(json, null, 2));
            setMode('file');
        };
        reader.readAsText(file);
    };

    const transformToUnityFormat = (result: Record<string, Record<string, string>> | null) => {
        if (!result) return {};
        const unityData: Record<string, Record<string, string>> = {};
        Object.entries(result).forEach(([langCode, translations]) => {
            const shortCode = langCode.slice(0, 2);
            Object.entries(translations).forEach(([key, value]) => {
                if (!unityData[key]) {
                    unityData[key] = {};
                }
                unityData[key][shortCode] = value;
            });
        });
        return unityData;
    };
    /* ---------------------------------------------------------------- copy / download */
    const copyCurrent = () => {
        if (!translationResult || !selectedLangTab) return;

        let data: unknown;
        if (outputFormat === 'unity') {
            const dataToTransform =
                selectedLangTab === 'ALL'
                    ? translationResult
                    : { [selectedLangTab]: translationResult[selectedLangTab] ?? {} };
            data = transformToUnityFormat(dataToTransform);
        } else {
            data =
                selectedLangTab === 'ALL'
                    ? Object.fromEntries(
                          Object.entries(translationResult).map(([code, obj]) => [
                              code.slice(0, 2),
                              obj,
                          ]),
                      )
                    : translationResult[selectedLangTab] ?? {};
        }

        navigator.clipboard.writeText(JSON.stringify(data, null, minify ? 0 : 2));
        toast.success('Copied to clipboard!');
    };

    const downloadCurrent = () => {
        if (!translationResult || !selectedLangTab) return;

        let data: unknown;
        let downloadName: string;

        if (outputFormat === 'unity') {
            const dataToTransform =
                selectedLangTab === 'ALL'
                    ? translationResult
                    : { [selectedLangTab]: translationResult[selectedLangTab] ?? {} };
            data = transformToUnityFormat(dataToTransform);
            downloadName =
                selectedLangTab === 'ALL'
                    ? 'translations_unity.json'
                    : `translations_unity_${selectedLangTab.slice(0, 2)}.json`;
        } else {
            if (selectedLangTab === 'ALL') {
                data = Object.fromEntries(
                    Object.entries(translationResult).map(([code, obj]) => [code.slice(0, 2), obj]),
                );
                downloadName = 'translations.json';
            } else {
                data = translationResult[selectedLangTab] ?? {};
                downloadName = `translations_${selectedLangTab.slice(0, 2)}.json`;
            }
        }

        const blob = new Blob([JSON.stringify(data, null, minify ? 0 : 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = downloadName;
        a.click();
        URL.revokeObjectURL(url);
    };
    useEffect(() => {
        if (
            isPro &&
            translationResult &&
            user &&
            user.uid &&
            Object.keys(translationResult).length > 0 &&
            isUserTranslation // <-- Only save if user-generated
        ) {
            const saveHistory = async () => {
                try {
                    await addDoc(collection(db, 'translations'), {
                        userId: user?.uid,
                        fileName: fileName ?? 'Untitled',
                        sourceLanguage: 'EN',
                        targetLanguages: Array.from(selectedShortcuts),
                        translationResult,
                        createdAt: serverTimestamp(),
                    });
                } catch {
                    // Optionally handle error
                }
            };
            saveHistory();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [translationResult]);
    useEffect(() => {
        console.log('User:', user);
    }, [user]);
    /* ---------------- translate ---------------- */
    const handleTranslate = async () => {
        console.log(isTranslating);

        setIsTranslating(true); // <-- Start loading effect

        if (mode === 'keys') {
            const kv = Object.fromEntries(
                rows.filter(r => r.key && r.value).map(r => [r.key, r.value]),
            );
            if (Object.keys(kv).length === 0) {
                toast.error('No keys found for translation.');
                return;
            }
        }

        const targetCodes = LANGUAGE_OPTIONS.filter(l => selectedShortcuts.has(l.shortcut)).map(
            l => l.code,
        );

        if (targetCodes.length === 0) return;

        // Check if user is authenticated
        if (!user) {
            alert('Please log in to translate');
            window.location.href = '/login';
            return;
        }

        /* ---- build payload ---- */
        const payload =
            mode === 'file'
                ? (() => {
                      try {
                          return parseInput(jsonInput || '{}');
                      } catch {
                          alert('❌ Invalid JSON payload');
                          return null;
                      }
                  })()
                : (() => {
                      const kv = Object.fromEntries(
                          rows.filter(r => r.key && r.value).map(r => [r.key, r.value]),
                      );
                      return Object.keys(kv).length ? kv : null;
                  })();

        if (!payload) return;

        try {
            // Wait a moment to ensure Firebase auth is ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Make a single API call for all languages
            const translations = await translateBatch(payload, targetCodes, 'en_XX');

            // The result is already in the format { langCode: { key: value } }
            // We just need to flatten each language's result for display
            const finalResult: Record<string, Record<string, string>> = {};
            for (const langCode in translations) {
                finalResult[langCode] = translations[langCode];
            }

            setTranslationResult(finalResult);
            const allKeys = Object.keys(finalResult[targetCodes[0]] ?? {});
            setKeyCount(allKeys.length);
            setLastTargetCodes(targetCodes);
            setSelectedLangTab(targetCodes[0] ?? null);
            setSelectedPreviewLang(targetCodes[0] ?? null);
            setIsUserTranslation(true);

            // Update keys_month in user's Firestore doc
            await updateDoc(doc(db, 'users', user.uid), {
                keys_month: keysThisMonth + allKeys.length,
            });
        } catch (e) {
            console.error('[Translayte] Translation error:', e);

            if (e instanceof Error) {
                if (e.message.includes('Quota exceeded') || e.message.includes('429')) {
                    setShowPaywall(true);
                } else if (
                    e.message.includes('Invalid authorization token') ||
                    e.message.includes('401')
                ) {
                    alert('Authentication error. Please log out and log back in.');
                    auth.signOut();
                } else {
                    alert(`Translation failed: ${e.message}`);
                }
            } else {
                alert('Translation failed. Please try again.');
            }
        } finally {
            setIsTranslating(false); // <-- Stop loading effect
        }
    };

    function mergeAllTranslations(
        translations: Record<string, Record<string, string>>,
    ): Record<string, string> {
        const merged: Record<string, string> = {};
        for (const [lang, entries] of Object.entries(translations)) {
            for (const [key, value] of Object.entries(entries)) {
                const newKey = `${lang}:${key}`;
                merged[newKey] = value;
            }
        }
        return merged;
    }
    const tryTranslate = () => {
        if (authLoading) return;
        if (!user) {
            window.location.href = '/login';
            return;
        }
        if (!isPro && keyCount + keysThisMonth > FREE_TIER_KEY_LIMIT) {
            setShowPaywall(true);
            toast.error(`Free plan limit: ${FREE_TIER_KEY_LIMIT} keys per month.`);
            return;
        }
        handleTranslate();
    };

    // Stripe Firebase Extension checkout
    const goPro = async () => {
        if (!user) return;
        // Call the Stripe extension's checkout function
        const response = await fetch('/api/stripe/extension-checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uid: user.uid, email: user.email }),
        });
        const { url } = await response.json();
        if (url) {
            window.location.href = url;
        } else {
            toast.error('Failed to start checkout.');
        }
    };

    const [, setPresentUsers] = useState<
        { uid: string; displayName: string; isEditing: boolean }[]
    >([]);

    useEffect(() => {
        if (!translationId || !user) return;
        const presenceRef = doc(db, 'translations', translationId, 'presence', user.uid);
        setDoc(presenceRef, {
            uid: user.uid,
            displayName: user.displayName,
            isEditing: false,
            lastActive: Date.now(),
        });
        interface PresenceUser {
            uid: string;
            displayName: string;
            isEditing: boolean;
            lastActive: number;
        }
        const unsub = onSnapshot(
            collection(db, 'translations', translationId, 'presence'),
            snap => {
                setPresentUsers(snap.docs.map(d => d.data() as PresenceUser));
            },
        );
        window.addEventListener('beforeunload', () => deleteDoc(presenceRef));
        return () => {
            deleteDoc(presenceRef);
            unsub();
        };
    }, [translationId, user]);

    // This single useEffect now handles user data (keys, subscription) and history
    useEffect(() => {
        if (!user || !user.uid) {
            // Clear data if user logs out
            setSubscriptionStatus(null);
            setKeysThisMonth(0);
            setHistory([]);
            return;
        }

        // Listener for user-specific data (keys_month, subscription)
        const userUnsub = onSnapshot(doc(db, 'users', user.uid), snap => {
            const userData = snap.data();
            setKeysThisMonth(userData?.keys_month || 0);

            const sub = userData?.stripe_subscription;
            // Correctly update the subscription status state
            if (sub?.status) {
                setSubscriptionStatus(sub.status);
            } else {
                setSubscriptionStatus(null);
            }
        });

        // Listener for translations history
        setHistoryLoading(true);
        const translationsUnsub = onSnapshot(
            collection(db, 'translations'),
            snap => {
                const items = snap.docs
                    .map(doc => {
                        const data = doc.data() as HistoryItem;
                        return {
                            ...data,
                            id: doc.id,
                            fileName: typeof data.fileName === 'string' ? data.fileName : undefined,
                        };
                    })
                    .filter(item => item.userId === user.uid)
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setHistory(items);
                setHistoryLoading(false);
            },
            () => {
                setHistoryLoading(false);
                toast.error('Failed to load translation history.');
            },
        );

        // Cleanup both listeners on unmount or user change
        return () => {
            userUnsub();
            translationsUnsub();
        };
    }, [user]);

    useEffect(() => {
        if (mode === 'file') {
            try {
                const obj = safeParseJsonInput(jsonInput);
                setKeyCount(obj ? Object.keys(obj).length : 0);
                setCharCount(jsonInput.length);
            } catch {
                setKeyCount(0);
                setCharCount(jsonInput.length);
            }
        } else if (mode === 'keys') {
            const validRows = rows.filter(r => r.key && r.value);
            setKeyCount(validRows.length);
            setCharCount(validRows.reduce((acc, row) => acc + row.value.length, 0));
        }
    }, [jsonInput, rows, mode]);

    useEffect(() => {
        if (!user || !user.uid) return;

        // Listen for keys_this_month
        const userUnsub = onSnapshot(doc(db, 'users', user.uid), snap => {
            setKeysThisMonth(snap.data()?.keys_month || 0);
        });

        // Listen for translations history
        setHistoryLoading(true);
        const translationsUnsub = onSnapshot(
            collection(db, 'translations'),
            snap => {
                const items = snap.docs
                    .map(doc => {
                        const data = doc.data() as HistoryItem;
                        return {
                            ...data,
                            id: doc.id,
                            fileName: typeof data.fileName === 'string' ? data.fileName : undefined,
                        };
                    })
                    .filter(item => item.userId === user.uid)
                    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
                setHistory(items);
                setHistoryLoading(false);
            },
            () => {
                setHistoryLoading(false);
                toast.error('Failed to load translation history.');
            },
        );

        // Cleanup both listeners on unmount or user changeconsole
        console.log('ąaa');
        console.log(history);
        return () => {
            userUnsub();
            translationsUnsub();
        };
    }, [user]);

    type ViewTabKey = 'json' | 'table' | 'original' | 'all';
    const VIEW_TABS: { key: ViewTabKey; label: string }[] = [
        { key: 'json', label: 'JSON' },
        { key: 'table', label: 'Table' },
        { key: 'original', label: 'Original' },
    ];
    return (
        <>
            {/* background layer */}
            <div className="fixed inset-0 -z-10" />

            {/* header */}
            <header className="fixed w-full z-50 bg-[#0F0F0F]/80 backdrop-blur-md border-b border-gray-800">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    {/* Logo/Home */}
                    <Link href="/" className="text-xl font-bold gradient-text">
                        Translayte
                    </Link>

                    {/* Usage pill */}
                    {user && (
                        <div className="text-sm text-gray-300 flex items-center gap-2">
                            <i className="fa-solid fa-key text-yellow-400" />
                            {isPro
                                ? 'Pro Plan — Unlimited'
                                : `Free — ${keysThisMonth} / ${FREE_TIER_KEY_LIMIT} keys`}
                        </div>
                    )}

                    {/* Auth nav */}
                    {user ? (
                        <div className="relative">
                            <button
                                onClick={() => setProfileOpen(o => !o)}
                                className="px-3 py-1 rounded hover:bg-gray-700 flex items-center gap-1"
                            >
                                Hello there, {user.email ? user.email.split('@')[0] : 'User'}
                                <i className="fa-solid fa-chevron-down text-xs" />
                            </button>
                            {profileOpen && (
                                <div className="absolute right-0 mt-2 w-40 bg-[#1f1f1f] border border-gray-700 rounded shadow-lg">
                                    <Link
                                        href="/profile"
                                        className="block px-4 py-2 hover:bg-gray-800"
                                    >
                                        Profile
                                    </Link>
                                    <Link
                                        href="/billing"
                                        className="block px-4 py-2 hover:bg-gray-800"
                                    >
                                        Billing & Plan
                                    </Link>
                                    <button
                                        onClick={() => auth.signOut()}
                                        className="w-full text-left px-4 py-2 hover:bg-gray-800"
                                    >
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="px-4 py-2 bg-[#8B5CF6] text-white rounded hover:opacity-90"
                        >
                            Log In
                        </Link>
                    )}
                </div>
            </header>

            {/* main */}
            <main className="pt-24 pb-20 mx-auto px-4 md:px-6 max-w-[1600px]">
                <div className="flex flex-col lg:flex-row lg:space-x-6">
                    {/* ------------ upload / keys column ------------ */}
                    <section className="w-full lg:w-9/12 mb-10 lg:mb-0">
                        {/* mode switch */}
                        <ModeSwitcher mode={mode} setMode={setMode} />

                        {/* -----  file mode  ----- */}
                        {mode === 'file' && (
                            <>
                                {!translationResult ? (
                                    <div
                                        className="flex flex-col"
                                        style={{ minHeight: 'calc(100vh - 30rem)' }}
                                    >
                                        <DropZone
                                            onSelect={handleFileUpload}
                                            fileName={fileName}
                                            translationResult={translationResult}
                                        />
                                        <div className="flex-grow">
                                            <RealtimeInputSection
                                                inputText={jsonInput}
                                                setInputText={setJsonInput}
                                                onDuplicatesChange={setRealtimeDuplicates}
                                            />
                                        </div>

                                        {/* Show duplicate warning */}
                                        {realtimeDuplicates?.hasDuplicates && (
                                            <div className="mt-4 flex-shrink-0">
                                                <DuplicateWarning
                                                    analysis={realtimeDuplicates}
                                                    onUnify={unifiedTranslations => {
                                                        const unifiedJson = JSON.stringify(
                                                            unifiedTranslations,
                                                            null,
                                                            2,
                                                        );
                                                        setJsonInput(unifiedJson);
                                                        setRealtimeDuplicates(null);
                                                    }}
                                                    onDismiss={() => setRealtimeDuplicates(null)}
                                                    originalTranslations={(() => {
                                                        try {
                                                            const parsed = JSON.parse(jsonInput);
                                                            return parsed;
                                                        } catch {
                                                            return {};
                                                        }
                                                    })()}
                                                />
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="mt-[-1px] rounded-t-none rounded-b-xl border border-gray-700 bg-[#1b1b1b] shadow-lg overflow-hidden">
                                        {/* --- Top Toolbar: Language Selection --- */}
                                        <div className="flex items-center border-b border-gray-800 bg-[#0F0F0F]/50 px-4 pt-2 space-x-1 overflow-x-auto">
                                            <button
                                                onClick={() => setSelectedLangTab('ALL')}
                                                className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors whitespace-nowrap ${
                                                    selectedLangTab === 'ALL'
                                                        ? 'bg-[#1b1b1b] text-white'
                                                        : 'text-gray-400 hover:bg-[#2a2a2a]/50'
                                                }`}
                                            >
                                                All Languages
                                            </button>
                                            {lastTargetCodes.map(code => {
                                                const lang = LANGUAGE_OPTIONS.find(
                                                    l => l.code === code,
                                                );
                                                return (
                                                    <button
                                                        key={code}
                                                        onClick={() => setSelectedLangTab(code)}
                                                        className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors whitespace-nowrap ${
                                                            selectedLangTab === code
                                                                ? 'bg-[#1b1b1b] text-white'
                                                                : 'text-gray-400 hover:bg-[#2a2a2a]/50'
                                                        }`}
                                                    >
                                                        {lang?.name ?? code}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {/* --- Sub-Toolbar: View Controls & Actions --- */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                                            {/* Left: View Mode Tabs */}
                                            <div className="flex items-center gap-2">
                                                {VIEW_TABS.map(tab => (
                                                    <button
                                                        key={tab.key}
                                                        onClick={() => setSelectedView(tab.key)}
                                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                            selectedView === tab.key
                                                                ? 'bg-[#8B5CF6] text-white'
                                                                : 'bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a]'
                                                        }`}
                                                    >
                                                        {tab.label}
                                                    </button>
                                                ))}
                                            </div>

                                            {/* Right: Action Buttons */}
                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setColorized(v => !v)}
                                                    className="px-3 py-1.5 rounded-md bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] text-sm font-medium"
                                                    title={
                                                        colorized
                                                            ? 'Disable Coloring'
                                                            : 'Enable Coloring'
                                                    }
                                                >
                                                    <i
                                                        className={`fa-solid ${
                                                            colorized ? 'fa-eye-slash' : 'fa-eye'
                                                        }`}
                                                    />
                                                </button>
                                                <button
                                                    onClick={copyCurrent}
                                                    className="px-3 py-1.5 rounded-md bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] text-sm font-medium"
                                                >
                                                    <i className="fa-solid fa-copy mr-1" /> Copy
                                                </button>
                                                <button
                                                    onClick={downloadCurrent}
                                                    className="px-3 py-1.5 rounded-md bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] text-sm font-medium"
                                                >
                                                    <i className="fa-solid fa-download mr-1" />{' '}
                                                    Download
                                                </button>
                                            </div>
                                        </div>

                                        {/* --- Main Content Area --- */}
                                        <div className="px-4 pb-4 min-h-[400px]">
                                            {/* The content rendering logic remains the same */}
                                            {selectedView === 'json' && selectedLangTab && (
                                                <div className="bg-[#111111] p-4 rounded-lg border border-gray-700 overflow-auto">
                                                    <pre
                                                        className="font-mono whitespace-pre text-sm leading-relaxed"
                                                        dangerouslySetInnerHTML={{
                                                            __html: colorized
                                                                ? highlightJson(
                                                                      prettyJson(
                                                                          outputFormat === 'unity'
                                                                              ? transformToUnityFormat(
                                                                                    selectedLangTab ===
                                                                                        'ALL'
                                                                                        ? translationResult
                                                                                        : {
                                                                                              [selectedLangTab]:
                                                                                                  translationResult?.[
                                                                                                      selectedLangTab
                                                                                                  ] ??
                                                                                                  {},
                                                                                          },
                                                                                )
                                                                              : selectedLangTab ===
                                                                                'ALL'
                                                                              ? Object.fromEntries(
                                                                                    Object.entries(
                                                                                        translationResult ??
                                                                                            {},
                                                                                    ).map(
                                                                                        ([
                                                                                            langCode,
                                                                                            entries,
                                                                                        ]) => [
                                                                                            langCode.slice(
                                                                                                0,
                                                                                                2,
                                                                                            ),
                                                                                            entries,
                                                                                        ],
                                                                                    ),
                                                                                )
                                                                              : translationResult?.[
                                                                                    selectedLangTab
                                                                                ] ?? {},
                                                                      ),
                                                                  )
                                                                : prettyJson(
                                                                      outputFormat === 'unity'
                                                                          ? transformToUnityFormat(
                                                                                selectedLangTab ===
                                                                                    'ALL'
                                                                                    ? translationResult
                                                                                    : {
                                                                                          [selectedLangTab]:
                                                                                              translationResult?.[
                                                                                                  selectedLangTab
                                                                                              ] ??
                                                                                              {},
                                                                                      },
                                                                            )
                                                                          : selectedLangTab ===
                                                                            'ALL'
                                                                          ? Object.fromEntries(
                                                                                Object.entries(
                                                                                    translationResult ??
                                                                                        {},
                                                                                ).map(
                                                                                    ([
                                                                                        langCode,
                                                                                        entries,
                                                                                    ]) => [
                                                                                        langCode.slice(
                                                                                            0,
                                                                                            2,
                                                                                        ),
                                                                                        entries,
                                                                                    ],
                                                                                ),
                                                                            )
                                                                          : translationResult?.[
                                                                                selectedLangTab
                                                                            ] ?? {},
                                                                  ),
                                                        }}
                                                    />
                                                </div>
                                            )}
                                            {selectedView === 'table' && selectedLangTab && (
                                                <div className="overflow-x-auto bg-[#111111] p-4 rounded-lg border border-gray-700">
                                                    <table className="w-full text-left text-sm text-gray-300">
                                                        <thead>
                                                            <tr>
                                                                <th className="py-2 px-4 border-b border-gray-800 font-semibold">
                                                                    Key
                                                                </th>
                                                                <th className="py-2 px-4 border-b border-gray-800 font-semibold">
                                                                    Translation
                                                                </th>
                                                            </tr>
                                                        </thead>
                                                        <tbody>
                                                            {Object.entries(
                                                                outputFormat === 'unity'
                                                                    ? transformToUnityFormat(
                                                                          selectedLangTab === 'ALL'
                                                                              ? translationResult
                                                                              : {
                                                                                    [selectedLangTab]:
                                                                                        translationResult?.[
                                                                                            selectedLangTab
                                                                                        ] ?? {},
                                                                                },
                                                                      )
                                                                    : selectedLangTab === 'ALL'
                                                                    ? mergeAllTranslations(
                                                                          translationResult ?? {},
                                                                      )
                                                                    : translationResult?.[
                                                                          selectedLangTab
                                                                      ] ?? {},
                                                            ).map(([key, value]) => (
                                                                <tr key={key} className="group">
                                                                    <td className="py-2 px-4 border-b border-gray-800 text-orange-400 relative">
                                                                        <span className="pr-6">
                                                                            {key}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => {
                                                                                navigator.clipboard.writeText(
                                                                                    key,
                                                                                );
                                                                                toast.success(
                                                                                    'Key copied!',
                                                                                );
                                                                            }}
                                                                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white"
                                                                            title="Copy key"
                                                                        >
                                                                            <i className="fa-solid fa-copy text-xs" />
                                                                        </button>
                                                                    </td>
                                                                    <td className="py-2 px-4 border-b border-gray-800 text-green-400 relative">
                                                                        <span className="pr-6">
                                                                            {typeof value ===
                                                                            'object'
                                                                                ? JSON.stringify(
                                                                                      value,
                                                                                  )
                                                                                : value}
                                                                        </span>
                                                                        <button
                                                                            onClick={() => {
                                                                                const textToCopy =
                                                                                    typeof value ===
                                                                                    'object'
                                                                                        ? JSON.stringify(
                                                                                              value,
                                                                                          )
                                                                                        : String(
                                                                                              value,
                                                                                          );
                                                                                navigator.clipboard.writeText(
                                                                                    textToCopy,
                                                                                );
                                                                                toast.success(
                                                                                    'Value copied!',
                                                                                );
                                                                            }}
                                                                            className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white"
                                                                            title="Copy value"
                                                                        >
                                                                            <i className="fa-solid fa-copy text-xs" />
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                            {selectedView === 'original' && (
                                                <div className="bg-[#111111] p-4 rounded-lg border border-gray-700">
                                                    <div className="relative w-full">
                                                        <textarea
                                                            value={jsonInput}
                                                            onChange={e =>
                                                                setJsonInput(e.target.value)
                                                            }
                                                            disabled={isTranslating}
                                                            className={`w-full h-64 p-4 rounded-lg bg-[#0F0F0F] border resize-none text-gray-300 
                                                                border-gray-700 focus:border-[#8B5CF6] focus:ring-2 focus:ring-[#8B5CF6] focus:outline-none`}
                                                            placeholder="Paste your JSON, key-value pairs, or plain text here..."
                                                            style={{ verticalAlign: 'top' }}
                                                        />
                                                        {isTranslating && (
                                                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                                                <div className="flex flex-col items-center text-center">
                                                                    <i className="fa-solid fa-spinner fa-spin text-3xl text-[#8B5CF6]"></i>
                                                                    <span className="mt-3 text-white font-medium">
                                                                        Translating...
                                                                    </span>
                                                                    <span className="mt-1 text-xs text-gray-300">
                                                                        This may take a moment.
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="mt-2 text-xs text-gray-500">
                                                        You can edit the original source here before
                                                        re-translating.
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {mode === 'keys' ? (
                            <KeyValueContextInput
                                rows={rows}
                                onChange={newRows => {
                                    setRows(newRows);
                                }}
                            />
                        ) : null}
                        {/* toggles */}

                        {/* Language selection info */}
                    </section>

                    {/* ------------ sidebar column ------------ */}
                    <aside className="w-full lg:w-3/12">
                        <div className="bg-[#191919]/80 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
                            {/* Lang limit info as a tab on top */}
                            <header className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-medium">Choose target languages</h3>
                                <span className="text-base text-gray-200 font-semibold">
                                    <span className="font-semibold" style={{ color: '#a78bfa' }}>
                                        {selectedShortcuts.size}
                                    </span>{' '}
                                    / {LANGUAGE_OPTIONS.length}
                                </span>
                            </header>

                            <LanguageGrid
                                selected={selectedShortcuts}
                                toggle={toggleLanguage}
                                availableLangCodes={lastTargetCodes}
                                selectedPreviewLang={selectedPreviewLang}
                                setSelectedPreviewLang={setSelectedPreviewLang}
                            />

                            {langLimitInfo && (
                                <div
                                    className=" top-20 left-6 right-6 flex items-center gap-3 px-4 py-3 rounded-t-lg bg-gradient-to-r from-[#8B5CF6]/90 to-[#7C3AED]/90 border border-[#8B5CF6] shadow-lg z-10"
                                    style={{ marginBottom: '-1.5rem' }}
                                >
                                    <i className="fa-solid fa-crown text-yellow-300 text-xl drop-shadow mr-2" />
                                    <div className="flex-1">
                                        <div className="font-semibold text-white text-base mb-0.5">
                                            Pro plan required
                                        </div>
                                        <div className="text-sm text-gray-200 opacity-80">
                                            Upgrade to{' '}
                                            <span className="font-semibold text-yellow-200">
                                                Translayte Pro
                                            </span>{' '}
                                            to translate into more than 3 languages at once.
                                        </div>
                                    </div>
                                    <button
                                        onClick={goPro}
                                        className="ml-2 px-4 py-2 rounded-full bg-yellow-400 text-gray-900 font-semibold shadow hover:bg-yellow-300 transition"
                                    >
                                        Upgrade
                                    </button>
                                </div>
                            )}
                        </div>
                        {/* buttons */}
                        <div className="bg-[#191919]/70 backdrop-blur-sm rounded-lg p-4 mt-4 flex flex-col  gap-4">
                            <div className="flex w-full items-center justify-between gap-4">
                                <span className="text-sm text-gray-300">Output format</span>
                                <div className="flex items-center bg-[#0F0F0F] rounded-lg p-1 border border-gray-700">
                                    <button
                                        onClick={() => setOutputFormat('standard')}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                            outputFormat === 'standard'
                                                ? 'bg-[#8B5CF6] text-white'
                                                : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                    >
                                        Standard
                                    </button>
                                    <button
                                        onClick={() => setOutputFormat('unity')}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                            outputFormat === 'unity'
                                                ? 'bg-[#8B5CF6] text-white'
                                                : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                    >
                                        Unity
                                    </button>
                                </div>
                            </div>
                        </div>
                        {showPaywall && (
                            <div className="p-4 mt-4 mb-4 bg-yellow-800 text-yellow-100 rounded-lg">
                                You’ve reached your free‐tier limit of 100 keys this month.{' '}
                                <button onClick={goPro} className="underline">
                                    Upgrade to Pro
                                </button>{' '}
                                to continue translating.
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <TranslateButton onClick={tryTranslate} loading={isTranslating} />
                        </div>

                        {/* --- Translation History Section --- */}
                        {isPro && (
                            <div className="bg-[#191919]/70 backdrop-blur-sm rounded-lg p-4 mt-4">
                                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-clock-rotate-left text-[#8B5CF6]" />
                                    History
                                </h3>
                                <HistoryAside
                                    history={history}
                                    loading={historyLoading}
                                    onLoad={handleLoadFromHistory}
                                    onDelete={deleteTranslation}
                                    onUpdateTitle={handleUpdateTitle}
                                />
                            </div>
                        )}
                    </aside>
                </div>
            </main>
        </>
    );
}

const TranslateButton = ({ onClick, loading }: { onClick: () => void; loading: boolean }) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="btn-primary w-full group relative inline-flex items-center justify-center"
    >
        <span className="absolute inset-0 rounded-lg" />
        <span className="relative z-10">
            {loading ? (
                <>
                    <i className="fa-solid fa-spinner fa-spin mr-2" /> Translating…
                </>
            ) : (
                'Translate'
            )}
        </span>
    </button>
);
async function deleteTranslation(id: string) {
    try {
        await deleteDoc(doc(db, 'translations', id));
        toast.success('Translation deleted!');
    } catch {
        toast.error('Failed to delete translation.');
    }
}

function safeParseJsonInput(input: string): object | null {
    let text = input.trim();

    // Remove trailing commas before wrapping
    text = text.replace(/,(\s*})?$/gm, '$1');

    // If not wrapped in { }, wrap it
    if (text.length && !text.startsWith('{') && !text.endsWith('}')) {
        text = `{${text}}`;
    }
    try {
        return JSON.parse(text);
    } catch {
        return null;
    }
}
