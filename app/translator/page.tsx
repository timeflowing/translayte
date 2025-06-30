'use client';
import React, { useRef, useState, ChangeEvent, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../translayte.css';
import { translateBatch } from '../utils/translator';
import { auth, db } from '../lib/firebaseClient';
import { highlightJson, prettyJson } from '../utils/prettyJson';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';

import Link from 'next/link';
import KeyValueContextInput from '../components/KeyValueContextInput';

/* ---------------------------------------------------------------- data */
const LANGUAGE_OPTIONS = [
    { code: 'en_XX', name: 'English', shortcut: 'EN' },
    { code: 'cs_CZ', name: 'Czech', shortcut: 'CS' },
    { code: 'it_IT', name: 'Italian', shortcut: 'IT' },
    { code: 'fr_XX', name: 'French', shortcut: 'FR' },
    { code: 'de_DE', name: 'German', shortcut: 'DE' },
    { code: 'es_XX', name: 'Spanish', shortcut: 'ES' },
    { code: 'ru_RU', name: 'Russian', shortcut: 'RU' },
    { code: 'zh_CN', name: 'Chinese', shortcut: 'ZH' },
    { code: 'ar_AR', name: 'Arabic', shortcut: 'AR' },
    { code: 'hi_IN', name: 'Hindi', shortcut: 'HI' },
    { code: 'pl_PL', name: 'Polish', shortcut: 'PL' },
    { code: 'pt_XX', name: 'Portuguese', shortcut: 'PT' },
    { code: 'tr_TR', name: 'Turkish', shortcut: 'TR' },
    { code: 'vi_VN', name: 'Vietnamese', shortcut: 'VI' },
] as const;
/* ---------------------------------------------------------------- page */
export default function TranslatorPage() {
    /* ---------------- state */
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setJsonInput(e.target.value);
        const el = textAreaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };
    const [profileOpen, setProfileOpen] = useState(false);
    const { user, loading: authLoading } = useAuth();
    console.log(user);
    const [keysThisMonth, setKeysThisMonth] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);
    const isPro = user?.subscription?.status === 'active';
    const [selectedShortcuts, setSelectedShortcuts] = useState<Set<string>>(
        new Set(['EN', 'IT', 'CS']),
    );
    const [rows] = useState<{ key: string; value: string; context?: string }[]>([
        { key: '', value: '', context: '' },
    ]);
    const [mode, setMode] = useState<'file' | 'keys'>('file');
    const [keepOrder, setKeepOrder] = useState(true);
    const [minify, setMinify] = useState(false);
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
    /* misc */
    const [isTranslating, setIsTranslating] = useState(false);
    const [langLimitInfo, setLangLimitInfo] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [selectedPreviewLang, setSelectedPreviewLang] = React.useState<string | null>(null);
    /* ---------- translation result (⚠️ FLAT) ---------- */
    const [translationResult, setTranslationResult] = useState<Record<
        string,
        Record<string, string>
    > | null>(null);
    /* ------------- helpers */
    const toggleLanguage = (shortcut: string) => {
        setSelectedShortcuts(prev => {
            const next = new Set(prev);
            if (next.has(shortcut)) {
                next.delete(shortcut);
                setLangLimitInfo(null);
            } else {
                if (!isPro && next.size >= 2) {
                    setLangLimitInfo('Upgrade to Pro to select more than 2 languages.');
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
            try {
                const json = JSON.parse(reader.result as string);
                setJsonInput(JSON.stringify(json, null, 2));
                setMode('file');
            } catch {
                alert('Invalid JSON file');
            }
        };
        reader.readAsText(file);
    };
    type JsonValue = string | { [key: string]: JsonValue };

    function flattenJson(obj: JsonValue, res: Record<string, string> = {}): Record<string, string> {
        if (typeof obj !== 'object' || obj === null) {
            return res;
        }

        for (const key in obj) {
            const val = obj[key];
            if (typeof val === 'string') {
                res[key] = val;
            } else {
                flattenJson(val, res); // no prefix nesting
            }
        }

        return res;
    }
    /* ---------------------------------------------------------------- copy / download */
    const copyCurrent = () => {
        if (!translationResult || !selectedLangTab) return;

        /* JSON object we are currently looking at */
        const data =
            selectedLangTab === 'ALL'
                ? Object.fromEntries(
                      Object.entries(translationResult).map(([code, obj]) => [
                          code.slice(0, 2),
                          obj,
                      ]),
                  )
                : translationResult[selectedLangTab] ?? {};

        navigator.clipboard.writeText(JSON.stringify(data, null, minify ? 0 : 2));
    };

    const downloadCurrent = () => {
        if (!translationResult || !selectedLangTab) return;

        const data =
            selectedLangTab === 'ALL'
                ? Object.fromEntries(
                      Object.entries(translationResult).map(([code, obj]) => [
                          code.slice(0, 2),
                          obj,
                      ]),
                  )
                : translationResult[selectedLangTab] ?? {};

        const blob = new Blob([JSON.stringify(data, null, minify ? 0 : 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = selectedLangTab === 'ALL' ? 'translations.json' : `translations.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    /* ---------------- translate ---------------- */
    const handleTranslate = async () => {
        const targetCodes = LANGUAGE_OPTIONS.filter(l => selectedShortcuts.has(l.shortcut)).map(
            l => l.code,
        );

        if (targetCodes.length === 0) return;

        /* ---- build payload ---- */
        const payload =
            mode === 'file'
                ? (() => {
                      try {
                          return flattenJson(JSON.parse(jsonInput || '{}'));
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

        setIsTranslating(true);
        try {
            const translationsArr = await Promise.all(
                targetCodes.map(async code => {
                    try {
                        const data = await translateBatch(payload, code, 'en_XX');

                        /* ▼ flatten the nested object we get back from the server          */
                        const flatData = flattenJson(data);

                        return [code, flatData] as const;
                    } catch (e) {
                        console.error(`[Translayte] ${code} failed:`, e);
                        return [code, {}] as const;
                    }
                }),
            );
            setTranslationResult(Object.fromEntries(translationsArr));
            // setLastPayload(payload);
            setLastTargetCodes(targetCodes);
            setSelectedLangTab(targetCodes[0] ?? null);
            setSelectedPreviewLang(targetCodes[0] ?? null);
        } catch (e) {
            console.error('[Translayte] Unexpected failure:', e);
        } finally {
            setIsTranslating(false);
        }
    };

    // const handleReset = () => {
    //     setSelectedShortcuts(new Set());
    //     setRows([{ key: '', value: '', context: '' }]);
    //     setJsonInput('');
    //     setTranslationResult(null);
    // };
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
        if (!isPro && keysThisMonth >= 200) {
            setShowPaywall(true);
            return;
        }
        handleTranslate();
    };

    const goPro = async () => {
        const user = auth.currentUser;
        if (!user) {
            // router.push('/login');
            return;
        }
        const token = await user.getIdToken();
        const res = await fetch('/api/stripe/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token }),
        });
        const { url } = await res.json();
        window.location.href = url;
    };
    useEffect(() => {
        if (!user || !user.uid) return; // ⬅️ wait for user

        const unsub = onSnapshot(doc(db, 'users', user.uid), snap => {
            setKeysThisMonth(snap.data()?.keys_month || 0);
        });
        return () => unsub();
    }, [user]);
    type ViewTabKey = 'json' | 'table' | 'original' | 'all';
    const VIEW_TABS: { key: ViewTabKey; label: string }[] = [
        { key: 'json', label: 'JSON' },
        { key: 'table', label: 'Table' },
        { key: 'original', label: 'Original' },
        { key: 'all', label: 'All' },
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
                            {user.subscription?.status === 'active'
                                ? 'Pro Plan — Unlimited'
                                : `Free — ${keysThisMonth} / 200 keys`}
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
                                <DropZone
                                    onSelect={handleFileUpload}
                                    fileName={fileName}
                                    translationResult={translationResult}
                                />

                                {!translationResult && (
                                    <textarea
                                        ref={textAreaRef}
                                        value={jsonInput}
                                        onChange={handleTextareaChange}
                                        spellCheck={false}
                                        placeholder="Paste or edit your text here…"
                                        className="w-full resize-none bg-[#18181b]/90 border border-[#312e81] rounded-xl px-4 py-4 font-mono text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] placeholder-gray-500 shadow-lg transition selection:bg-violet-500 selection:text-white"
                                        style={{
                                            caretColor: '#8B5CF6',
                                            minHeight: '144px',
                                            boxShadow: '0 2px 12px 0 rgba(139,92,246,0.06)',
                                            backdropFilter: 'blur(4px)',
                                            transition: 'box-shadow 0.2s',
                                        }}
                                    />
                                )}
                                {translationResult && (
                                    <div className="mt-[-1px] rounded-t-none rounded-b-xl border border-gray-700 bg-[#1b1b1b] shadow-lg overflow-hidden">
                                        <div className="flex flex-col md:flex-row">
                                            {/* Main: view content */}
                                            <div className="flex flex-wrap items-center gap-2 mb-4">
                                                {/* View mode tabs */}
                                                <div className="flex gap-2 mb-4">
                                                    {VIEW_TABS.map(tab => (
                                                        <button
                                                            key={tab.key}
                                                            onClick={() => setSelectedView(tab.key)}
                                                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                                selectedView === tab.key
                                                                    ? 'bg-[#8B5CF6] text-white'
                                                                    : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]'
                                                            }`}
                                                        >
                                                            {tab.label}
                                                        </button>
                                                    ))}
                                                </div>
                                                <div className="flex justify-end mb-2">
                                                    <button
                                                        onClick={() => setColorized(v => !v)}
                                                        className="text-sm text-gray-300 hover:text-white bg-[#1f1f1f] border border-gray-700 px-3 py-1 rounded-md"
                                                    >
                                                        {colorized
                                                            ? 'Disable Coloring'
                                                            : 'Enable Coloring'}
                                                    </button>
                                                </div>

                                                {translationResult && selectedLangTab && (
                                                    <div className="flex gap-2 mb-4">
                                                        <button
                                                            onClick={copyCurrent}
                                                            className="px-3 py-1.5 rounded-md bg-[#1f1f1f] text-gray-200 hover:bg-[#2a2a2a] text-sm font-medium"
                                                        >
                                                            <i className="fa-solid fa-copy mr-1" />{' '}
                                                            Copy
                                                        </button>
                                                        <button
                                                            onClick={downloadCurrent}
                                                            className="px-3 py-1.5 rounded-md bg-[#1f1f1f] text-gray-200 hover:bg-[#2a2a2a] text-sm font-medium"
                                                        >
                                                            <i className="fa-solid fa-download mr-1" />{' '}
                                                            Download
                                                        </button>
                                                    </div>
                                                )}
                                                {/* Display selected translation view */}
                                                <div className="flex flex-col w-full min-h-[400px]">
                                                    <div className="flex-1 w-full">
                                                        {selectedView === 'json' &&
                                                            selectedLangTab && (
                                                                <div className="bg-[#111111] p-4 rounded-lg border border-gray-700 overflow-auto">
                                                                    <pre
                                                                        className="font-mono whitespace-pre text-sm leading-relaxed"
                                                                        dangerouslySetInnerHTML={{
                                                                            __html: colorized
                                                                                ? highlightJson(
                                                                                      prettyJson(
                                                                                          selectedLangTab ===
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
                                                                                              : translationResult[
                                                                                                    selectedLangTab
                                                                                                ] ??
                                                                                                    {},
                                                                                      ),
                                                                                  )
                                                                                : prettyJson(
                                                                                      selectedLangTab ===
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
                                                                                          : translationResult[
                                                                                                selectedLangTab
                                                                                            ] ?? {},
                                                                                  ),
                                                                        }}
                                                                    />
                                                                </div>
                                                            )}

                                                        {selectedView === 'table' &&
                                                            selectedLangTab && (
                                                                <div className="overflow-x-auto bg-[#111111] p-4 rounded-lg border border-gray-700">
                                                                    <table className="w-full text-left text-sm text-gray-300">
                                                                        <thead>
                                                                            <tr>
                                                                                <th className="py-2 px-4 border-b border-gray-600">
                                                                                    Key
                                                                                </th>
                                                                                <th className="py-2 px-4 border-b border-gray-600">
                                                                                    {
                                                                                        selectedLangTab
                                                                                    }
                                                                                </th>
                                                                            </tr>
                                                                        </thead>
                                                                        <tbody>
                                                                            {Object.entries(
                                                                                selectedLangTab ===
                                                                                    'ALL'
                                                                                    ? mergeAllTranslations(
                                                                                          translationResult ??
                                                                                              {},
                                                                                      )
                                                                                    : translationResult[
                                                                                          selectedLangTab
                                                                                      ] ?? {},
                                                                            ).map(
                                                                                ([key, value]) => (
                                                                                    <tr key={key}>
                                                                                        <td className="py-1 px-4 border-b border-gray-800 text-orange-400">
                                                                                            {key}
                                                                                        </td>
                                                                                        <td className="py-1 px-4 border-b border-gray-800 text-green-400">
                                                                                            {value}
                                                                                        </td>
                                                                                    </tr>
                                                                                ),
                                                                            )}
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            )}
                                                        {selectedView === 'original' && (
                                                            <div className="bg-[#111111] p-4 rounded-lg border border-gray-700">
                                                                <textarea
                                                                    value={jsonInput}
                                                                    onChange={e =>
                                                                        setJsonInput(e.target.value)
                                                                    }
                                                                    spellCheck={false}
                                                                    className="w-full bg-transparent font-mono text-sm text-gray-200 focus:outline-none resize-none"
                                                                    style={{
                                                                        minHeight: '200px',
                                                                        color: '#e5e7eb', // text-gray-200
                                                                        // No blue, just your neutrals
                                                                    }}
                                                                />
                                                                <div className="mt-2 text-xs text-gray-500">
                                                                    You can edit the original source
                                                                    here before re-translating.
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Vertical language tabs */}
                                            <div className="flex flex-col gap-2 p-4 border-l border-gray-800">
                                                <button
                                                    onClick={() => setSelectedLangTab('ALL')}
                                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                        selectedLangTab === 'ALL'
                                                            ? 'bg-[#8B5CF6] text-white'
                                                            : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]'
                                                    }`}
                                                >
                                                    ALL
                                                </button>

                                                {LANGUAGE_OPTIONS.filter(lang =>
                                                    Object.keys(translationResult || {}).includes(
                                                        lang.code,
                                                    ),
                                                ).map(lang => (
                                                    <button
                                                        key={lang.code}
                                                        onClick={() =>
                                                            setSelectedLangTab(lang.code)
                                                        }
                                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                                            selectedLangTab === lang.code
                                                                ? 'bg-[#8B5CF6] text-white'
                                                                : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]'
                                                        }`}
                                                    >
                                                        {lang.shortcut}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                        {mode === 'keys' ? (
                            <KeyValueContextInput
                                onChange={rows => {
                                    // convert rows into your internal format if needed
                                    console.log('Updated:', rows);
                                }}
                            />
                        ) : null}
                        {/* toggles */}

                        {/* Language selection info */}
                    </section>

                    {/* ------------ picker ------------ */}
                    <aside className="w-full lg:w-3/12 h-fit">
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
                                            to translate into more than 2 languages at once.
                                        </div>
                                    </div>
                                    <a
                                        href="/pricing"
                                        className="ml-2 px-4 py-2 rounded-full bg-yellow-400 text-gray-900 font-semibold shadow hover:bg-yellow-300 transition"
                                    >
                                        Upgrade
                                    </a>
                                </div>
                            )}
                        </div>
                        {/* buttons */}
                        <div className="bg-[#191919]/70 backdrop-blur-sm rounded-lg p-4 mt-4 flex flex-col  gap-4">
                            <Toggle
                                label="Save translation"
                                checked={minify}
                                onChange={setMinify}
                            />
                            <Toggle
                                label="Pro translayte"
                                checked={keepOrder}
                                onChange={setKeepOrder}
                            />
                        </div>
                        {showPaywall && (
                            <div className="p-4 mb-4 bg-yellow-800 text-yellow-100 rounded">
                                You’ve reached your free‐tier limit of 200 keys this month.{' '}
                                <button onClick={goPro} className="underline">
                                    Upgrade to Pro
                                </button>{' '}
                                to continue translating.
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <TranslateButton onClick={tryTranslate} loading={isTranslating} />
                            {/* <button
                                onClick={handleReset}
                                disabled={isTranslating}
                                className="inline-flex items-center justify-center px-8 py-4 rounded-lg font-semibold text-gray-200 bg-[#191919]/80"
                            >
                                <i className="fa-solid fa-rotate-left mr-2" />
                            </button> */}
                        </div>
                        {/* Success message */}
                    </aside>
                </div>
            </main>
        </>
    );
}

/* ---------------------------------------------------------------- small ui helpers (unstyled) */
const ModeSwitcher = ({
    mode,
    setMode,
}: {
    mode: 'file' | 'keys';
    setMode: React.Dispatch<React.SetStateAction<'file' | 'keys'>>;
}) => (
    <div className="flex justify-center mb-10">
        <div className="inline-flex w-full max-w-xl gap-2 rounded-xl p-2 bg-[#0F0F0F] shadow-lg">
            {(['file', 'keys'] as const).map(m => {
                const active = mode === m;
                return (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        className={`flex flex-col items-center justify-center flex-1 px-3 py-3 rounded-lg border transition-all
                            border-gray-700/50
                            ${active ? 'bg-[#8B5CF6]/10 ring-2 ring-[#8B5CF6]' : 'bg-primary/50'}
                            cursor-pointer
                        `}
                    >
                        <i
                            className={`${
                                m === 'file' ? 'fa-solid fa-file-arrow-up' : 'fa-solid fa-key'
                            } text-lg mb-1 ${active ? 'text-[#8B5CF6]' : 'text-gray-400'}`}
                        />
                        <span
                            className="font-bold text-sm"
                            style={{
                                color: active ? '#8B5CF6' : '#d1d5db',
                                fontWeight: active ? 800 : 600,
                            }}
                        >
                            {m === 'file' ? 'File Upload' : 'Key Input'}
                        </span>
                    </button>
                );
            })}
        </div>
    </div>
);

interface DZProps {
    onSelect: (e: ChangeEvent<HTMLInputElement>) => void;
    fileName?: string | null;
    translationResult?: Record<string, Record<string, string>> | null;
}
const DropZone: React.FC<DZProps> = ({ onSelect, fileName, translationResult }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [drag, setDrag] = useState(false);
    const dragRef = useRef(false);
    const pointer = useRef<{ x: number; y: number } | null>(null);

    // Keep drag state in a ref for animation
    useEffect(() => {
        dragRef.current = drag;
    }, [drag]);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const DPR = window.devicePixelRatio || 1;
        const resize = () => {
            canvas.width = canvas.offsetWidth * DPR;
            canvas.height = canvas.offsetHeight * DPR;
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.scale(DPR, DPR);
        };
        resize();
        window.addEventListener('resize', resize);

        // Only create particles once
        const N = 120;
        const particles = Array.from({ length: N }, () => ({
            x: Math.random() * canvas.offsetWidth,
            y: Math.random() * canvas.offsetHeight,
            vx: (Math.random() - 0.5) * 0.35,
            vy: (Math.random() - 0.5) * 0.35,
        }));

        let frame: number;
        const loop = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            // Add opacity to the background fill (e.g. 0.85)
            ctx.globalAlpha = 0.85;
            ctx.fillStyle = '#0F0F0F';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.globalAlpha = 1;

            // move
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;

                // Wrap horizontally
                if (p.x < 0) p.x = canvas.offsetWidth;
                if (p.x > canvas.offsetWidth) p.x = 0;

                // Wrap vertically
                if (p.y < 0) p.y = canvas.offsetHeight;
                if (p.y > canvas.offsetHeight) p.y = 0;
            });

            // More synapses: lower the distance threshold
            ctx.strokeStyle = dragRef.current ? '#8B5CF6' : '#5034b5';
            ctx.lineWidth = 0.6;
            for (let i = 0; i < N; i++) {
                for (let j = i + 1; j < N; j++) {
                    const a = particles[i];
                    const b = particles[j];
                    const dx = a.x - b.x;
                    const dy = a.y - b.y;
                    const dist2 = dx * dx + dy * dy;
                    if (dist2 < 120 * 120) {
                        ctx.globalAlpha = 1 - dist2 / (120 * 120);
                        ctx.beginPath();
                        ctx.moveTo(a.x, a.y);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();
                    }
                }
            }
            ctx.globalAlpha = 1;

            // synapse lines to cursor while dragging
            if (dragRef.current && pointer.current) {
                ctx.strokeStyle = '#8B5CF6';
                particles.forEach(p => {
                    const dx = p.x - pointer.current!.x;
                    const dy = p.y - pointer.current!.y;
                    const d2 = dx * dx + dy * dy;
                    if (d2 < 180 * 180) {
                        ctx.globalAlpha = 1 - d2 / (180 * 180);
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(pointer.current!.x, pointer.current!.y);
                        ctx.stroke();
                    }
                });
                ctx.globalAlpha = 1;
            }

            // particles
            ctx.fillStyle = '#8B5CF6';
            particles.forEach(p => {
                ctx.beginPath();
                ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
                ctx.fill();
            });

            frame = requestAnimationFrame(loop);
        };
        loop();

        return () => {
            cancelAnimationFrame(frame);
            window.removeEventListener('resize', resize);
        };
    }, []);

    /* ---------------- render */
    return (
        <label
            onDragEnter={e => {
                e.preventDefault();
                setDrag(true);
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }}
            onDragOver={e => {
                e.preventDefault();
                const rect = (e.target as HTMLElement).getBoundingClientRect();
                pointer.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
            }}
            onDragLeave={() => {
                setDrag(false);
                pointer.current = null;
            }}
            onDrop={e => {
                e.preventDefault();
                setDrag(false);
                pointer.current = null;
                const file = e.dataTransfer.files?.[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            JSON.parse(reader.result as string);
                            // Create a mock FileList with the required 'item' method
                            const files: FileList = {
                                0: file,
                                length: 1,
                                item: (index: number) => (index === 0 ? file : null),
                                [Symbol.iterator]: function* () {
                                    yield file;
                                },
                            } as unknown as FileList;
                            onSelect({ target: { files } } as ChangeEvent<HTMLInputElement>);
                        } catch {
                            alert('Invalid JSON');
                        }
                    };
                    reader.readAsText(file);
                }
            }}
            htmlFor="file-upload"
            className={`relative flex flex-col items-center justify-center ${
                translationResult ? 'h-20' : 'h-60'
            } mb-8 border-dashed rounded-xl cursor-pointer overflow-hidden transition-colors duration-200 ${
                drag
                    ? 'border-[#8B5CF6] bg-[#1a1333]/80'
                    : fileName
                    ? 'border-[#a78bfa] bg-[#a78bfa]/20'
                    : 'border-[#8B5CF633] bg-transparent'
            }`}
            style={
                {
                    // Remove background color from label, let canvas handle it
                }
            }
        >
            {/* Canvas for animation */}
            <canvas
                ref={canvasRef}
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ zIndex: 0 }}
            />
            {/* Content always above the canvas */}
            <div className="relative z-10 flex flex-col items-center text-center px-4 pointer-events-none select-none">
                <i
                    className={`fa-solid ${
                        fileName ? 'fa-file-circle-check' : 'fa-cloud-arrow-up'
                    } text-4xl mb-4`}
                    style={{ color: fileName ? '#a78bfa' : '#8B5CF6' }}
                />
                {fileName ? (
                    <>
                        <p className="text-lg font-semibold" style={{ color: '#a78bfa' }}>
                            File loaded!
                        </p>
                        <p className="text-sm mt-1" style={{ color: '#a78bfa' }}>
                            {fileName}
                        </p>
                        <span
                            className="mt-4 relative inline-flex items-center justify-center px-6 py-2
                        rounded-lg font-bold text-base border"
                            style={{
                                color: '#fff',
                                background: '#a78bfa',
                                borderColor: '#a78bfa',
                            }}
                        >
                            Change file
                        </span>
                    </>
                ) : (
                    <>
                        <p className="text-lg font-semibold">Drop your JSON file here</p>
                        <p className="text-gray-400 text-sm">or click to browse</p>
                        {translationResult && (
                            <span
                                className="mt-4 relative inline-flex items-center justify-center px-6 py-2
                        bg-[#8B5CF6]/50 rounded-lg font-bold text-base border"
                                style={{ color: '#8B5CF6', borderColor: '#a78bfa', borderWidth: 1 }}
                            >
                                Browse files
                            </span>
                        )}
                    </>
                )}
            </div>
            <input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={onSelect}
                className="sr-only"
            />
        </label>
    );
};

// const KeyTable = ({
//     rows,
//     setRows,
// }: {
//     rows: { key: string; value: string; context?: string }[];
//     setRows: React.Dispatch<
//         React.SetStateAction<{ key: string; value: string; context?: string }[]>
//     >;
// }) => {
//     const handleChange = (idx: number, field: 'key' | 'value' | 'context', val: string) => {
//         setRows(r => {
//             const nxt = [...r];
//             nxt[idx] = { ...nxt[idx], [field]: val };
//             return nxt;
//         });
//     };

//     const addRow = () => setRows(r => [...r, { key: '', value: '', context: '' }]);

//     const removeRow = (idx: number) => setRows(r => r.filter((_, i) => i !== idx));

//     return (
//         <div className="bg-[#18103a]/80 border border-[#2d2250] rounded-2xl p-6 shadow-lg">
//             <table className="w-full text-sm">
//                 <thead>
//                     <tr className="text-gray-400 border-b border-[#2d2250]">
//                         {['Key', 'Value', 'Context (opt.)', ''].map(h => (
//                             <th key={h} className="text-left pb-3 font-semibold">
//                                 {h}
//                             </th>
//                         ))}
//                     </tr>
//                 </thead>
//                 <tbody>
//                     {rows.map((row, i) => (
//                         <tr key={i}>
//                             {(['key', 'value', 'context'] as const).map(col => (
//                                 <td key={col} className="pr-2 py-2 align-top">
//                                     <input
//                                         value={row[col] ?? ''}
//                                         onChange={e => handleChange(i, col, e.target.value)}
//                                         className="w-full bg-[#221a3e] border border-[#3a2c67] rounded-lg px-3 py-2 text-gray-100 focus:border-[#8B5CF6] focus:ring-2 focus:ring-secondary/30 focus:outline-none placeholder-gray-500 shadow-sm"
//                                     />
//                                 </td>
//                             ))}
//                             <td className="py-2 align-top">
//                                 {rows.length > 1 && (
//                                     <button
//                                         onClick={() => removeRow(i)}
//                                         className="text-gray-500 hover:text-red-500 cursor-pointer"
//                                         title="Remove row"
//                                     >
//                                         <i className="fa-solid fa-xmark" />
//                                     </button>
//                                 )}
//                             </td>
//                         </tr>
//                     ))}
//                 </tbody>
//             </table>

//             <div className="flex justify-end mt-6">
//                 <button
//                     onClick={addRow}
//                     className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-gradient-to-r from-secondary to-accent text-white font-semibold shadow-lg hover:opacity-90 transition cursor-pointer"
//                 >
//                     <i className="fa-solid fa-plus" /> Add new key
//                 </button>
//             </div>
//         </div>
//     );
// };
const LanguageGrid = ({
    selected,
    toggle,
    availableLangCodes,
    selectedPreviewLang,
    setSelectedPreviewLang,
}: {
    selected: Set<string>;
    toggle: (sc: string) => void;
    availableLangCodes?: string[];
    selectedPreviewLang?: string | null;
    setSelectedPreviewLang?: (code: string) => void;
}) => {
    const [expanded, setExpanded] = useState(false);
    const [perRow, setPerRow] = useState(2);

    useEffect(() => {
        if (window.innerWidth >= 640) setPerRow(3);
        else setPerRow(2);
    }, []);

    const visibleCount = expanded ? LANGUAGE_OPTIONS.length : perRow;

    return (
        <div>
            <div
                className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] pr-2 p-2 overflow-y-scroll"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {LANGUAGE_OPTIONS.slice(0, visibleCount).map(lang => {
                    const isSelected = selected.has(lang.shortcut);
                    const isTranslated = availableLangCodes?.includes(lang.code);
                    const isActive = selectedPreviewLang === lang.code;

                    return (
                        <button
                            key={lang.code}
                            onClick={() => {
                                toggle(lang.shortcut);
                                if (isTranslated && setSelectedPreviewLang) {
                                    setSelectedPreviewLang(lang.code);
                                }
                            }}
                            className={`flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all
    border-gray-700/50
    cursor-pointer
    ${isSelected ? 'bg-[#8B5CF6]/10 ring-2 ring-[#8B5CF6]' : 'bg-primary/50'}
    ${isActive ? 'ring-2 ring-[#8B5CF6]' : ''}
`}
                        >
                            <span
                                className="font-bold"
                                style={{
                                    color: isSelected ? '#8B5CF6' : '#d1d5db',
                                    fontWeight: isSelected ? 800 : 600,
                                }}
                            >
                                {lang.shortcut}
                            </span>
                            <span className="text-xs text-gray-400">{lang.name}</span>
                        </button>
                    );
                })}
            </div>

            <div className="flex flex-col items-end">
                {!expanded && LANGUAGE_OPTIONS.length > visibleCount && (
                    <div className="mt-4">
                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] font-medium hover:bg-[#221a3e] transition text-sm cursor-pointer"
                            onClick={() => setExpanded(true)}
                        >
                            <i className="fa-solid fa-chevron-down" /> More languages
                        </button>
                    </div>
                )}
                {expanded && LANGUAGE_OPTIONS.length > perRow && (
                    <div className="mt-4">
                        <button
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] font-medium hover:bg-[#221a3e] transition text-sm cursor-pointer"
                            onClick={() => setExpanded(false)}
                        >
                            <i className="fa-solid fa-chevron-up" /> Hide
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

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

/* toggle */
interface ToggleProps {
    label: string;
    checked: boolean;
    onChange: (next: boolean) => void;
}
const Toggle: React.FC<ToggleProps> = ({ label, checked, onChange }) => (
    <label className="flex w-full items-center justify-between gap-4 cursor-pointer select-none">
        <span className="text-sm text-gray-300">{label}</span>
        <span className="relative inline-block w-12 h-6">
            <input
                type="checkbox"
                className="sr-only peer"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
            />
            <span className="absolute inset-0 rounded-full transition bg-gray-700 peer-checked:bg-[#8B5CF6]" />
            <span
                className="absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition
          peer-checked:translate-x-6"
            />
        </span>
    </label>
);
