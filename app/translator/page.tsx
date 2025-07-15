'use client';
import React, { useRef, useState, ChangeEvent, useEffect } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';
import '../translayte.css';
import { translateBatch } from '../utils/translator';
import { auth, db } from '../lib/firebaseClient';
import { highlightJson, prettyJson } from '../utils/prettyJson';
import { useAuth } from '../context/AuthContext';
import { doc, onSnapshot } from 'firebase/firestore';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Link from 'next/link';
import KeyValueContextInput from '../components/KeyValueContextInput';
import { LANGUAGE_OPTIONS } from '../languages';
import { detectDuplicates, DuplicateAnalysis } from '../utils/duplicateDetection';
import DuplicateWarning from '../components/DuplicateWarning';
import RealtimeInputSection from '../components/RealtimeInputSection';

export default function TranslatorPage() {
    /* ---------------- state */

    const [profileOpen, setProfileOpen] = useState(false);
    const { user, loading: authLoading } = useAuth();
    console.log(user);
    const [keysThisMonth, setKeysThisMonth] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);
    const isPro = user?.subscription?.status === 'active';
    const [selectedShortcuts, setSelectedShortcuts] = useState<Set<string>>(
        new Set(['EN', 'IT', 'CS']),
    );
    const [rows, setRows] = useState<{ key: string; value: string; context: string }[]>([
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
    const [outputFormat, setOutputFormat] = useState<'standard' | 'unity'>('standard');
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
    const [duplicateAnalysis] = useState<DuplicateAnalysis | null>(null);
    const [showDuplicateWarning] = useState(false);
    const [processedTranslations] = useState<Record<string, string> | null>(null);
    const [realtimeDuplicates, setRealtimeDuplicates] = useState<DuplicateAnalysis | null>(null);
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

    /* ---------------- translate ---------------- */
    const handleTranslate = async () => {
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
            // Wait a moment to ensure Firebase auth is ready
            await new Promise(resolve => setTimeout(resolve, 100));

            // Make a single API call for all languages
            const translations = await translateBatch(payload, targetCodes, 'en_XX');

            // The result is already in the format { langCode: { key: value } }
            // We just need to flatten each language's result for display
            const finalResult: Record<string, Record<string, string>> = {};
            for (const langCode in translations) {
                finalResult[langCode] = flattenJson(translations[langCode]);
            }

            setTranslationResult(finalResult);
            setLastTargetCodes(targetCodes);
            setSelectedLangTab(targetCodes[0] ?? null);
            setSelectedPreviewLang(targetCodes[0] ?? null);
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
                                    <>
                                        <RealtimeInputSection
                                            inputText={jsonInput}
                                            setInputText={setJsonInput}
                                            onDuplicatesChange={setRealtimeDuplicates}
                                        />

                                        {/* Show duplicate warning */}
                                        {realtimeDuplicates?.hasDuplicates && (
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
                                        )}
                                    </>
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
                                                                                          outputFormat ===
                                                                                              'unity'
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
                                                                                                ] ??
                                                                                                {},
                                                                                      ),
                                                                                  )
                                                                                : prettyJson(
                                                                                      outputFormat ===
                                                                                          'unity'
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

                                                        {selectedView === 'table' &&
                                                            selectedLangTab && (
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
                                                                                outputFormat ===
                                                                                    'unity'
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
                                                                                    ? mergeAllTranslations(
                                                                                          translationResult ??
                                                                                              {},
                                                                                      )
                                                                                    : translationResult?.[
                                                                                          selectedLangTab
                                                                                      ] ?? {},
                                                                            ).map(
                                                                                ([key, value]) => (
                                                                                    <tr key={key}>
                                                                                        <td className="py-1 px-4 border-b border-gray-800 text-orange-400">
                                                                                            {key}
                                                                                        </td>
                                                                                        <td className="py-1 px-4 border-b border-gray-800 text-green-400">
                                                                                            {typeof value ===
                                                                                            'object'
                                                                                                ? JSON.stringify(
                                                                                                      value,
                                                                                                  )
                                                                                                : value}
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
                                rows={rows}
                                onChange={newRows => {
                                    setRows(newRows);
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
                            <div className="flex w-full items-center justify-between gap-4">
                                <span className="text-sm text-gray-300">Output Format</span>
                                <div className="flex items-center bg-[#0F0F0F] rounded-lg p-1 border border-gray-700">
                                    <button
                                        onClick={() => setOutputFormat('standard')}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                            outputFormat === 'standard'
                                                ? 'bg-purple-600 text-white'
                                                : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                    >
                                        Standard
                                    </button>
                                    <button
                                        onClick={() => setOutputFormat('unity')}
                                        className={`px-3 py-1 text-xs rounded-md transition-colors ${
                                            outputFormat === 'unity'
                                                ? 'bg-purple-600 text-white'
                                                : 'text-gray-400 hover:bg-gray-800'
                                        }`}
                                    >
                                        Unity
                                    </button>
                                </div>
                            </div>
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
            {/* Duplicate Warning */}
            {showDuplicateWarning && duplicateAnalysis && (
                <DuplicateWarning
                    analysis={duplicateAnalysis}
                    onUnify={handleUnifyDuplicates}
                    onDismiss={handleDismissDuplicateWarning}
                    originalTranslations={processedTranslations || parseInput(jsonInput)}
                />
            )}
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
    const [searchQuery, setSearchQuery] = useState('');
    const [perRow, setPerRow] = useState(2);
    const searchInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (window.innerWidth >= 640) setPerRow(3);
        else setPerRow(2);
    }, []);

    // Filter languages based on search query
    const filteredLanguages = LANGUAGE_OPTIONS.filter(
        lang =>
            lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lang.shortcut.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const visibleLanguages = expanded ? filteredLanguages : LANGUAGE_OPTIONS.slice(0, perRow);

    const handleToggleExpanded = () => {
        if (!expanded) {
            setExpanded(true);
            // Focus the search input after animation completes
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 300);
        } else {
            setExpanded(false);
            setSearchQuery('');
        }
    };

    const clearSearch = () => {
        setSearchQuery('');
        searchInputRef.current?.focus();
    };

    return (
        <div>
            {/* Language Grid */}
            <div className="flex flex-col items-end">
                <div
                    className={`w-full transition-all duration-300 ease-in-out ${
                        expanded ? 'max-h-32 opacity-100' : 'max-h-12 opacity-100'
                    }`}
                >
                    {expanded ? (
                        /* Search Bar Mode */
                        <div className="space-y-3">
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <i className="fa-solid fa-search text-gray-400 text-sm" />
                                </div>
                                <input
                                    ref={searchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search languages..."
                                    className="w-full pl-10 pr-10 py-2 bg-[#1f1f1f] border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-transparent transition-all duration-200"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={clearSearch}
                                        className="absolute inset-y-0 right-10 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                                    >
                                        <i className="fa-solid fa-times text-sm" />
                                    </button>
                                )}
                                <button
                                    onClick={handleToggleExpanded}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-200 transition-colors"
                                    title="Collapse"
                                >
                                    <i className="fa-solid fa-chevron-up text-sm" />
                                </button>
                            </div>

                            {/* Search Results Info & Selected Count */}

                            {/* Quick Filter Badges */}
                            {searchQuery === '' && (
                                <div className="flex flex-wrap gap-2">
                                    <span className="text-xs text-gray-400 mr-1">Quick:</span>
                                    {['Popular', 'European', 'Asian', 'African'].map(filter => (
                                        <button
                                            key={filter}
                                            onClick={() => {
                                                // Simple filter implementation - you can enhance this
                                                const filterMap: { [key: string]: string } = {
                                                    Popular: 'en',
                                                    European: 'de',
                                                    Asian: 'ja',
                                                    African: 'ar',
                                                };
                                                setSearchQuery(filterMap[filter] || '');
                                            }}
                                            className="px-2 py-1 text-xs bg-gray-700 text-gray-300 rounded-full hover:bg-gray-600 transition-colors duration-200"
                                        >
                                            {filter}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Show More Button Mode */
                        LANGUAGE_OPTIONS.length > perRow && (
                            <div className="flex items-center justify-between w-full">
                                <button
                                    className="flex items-center gap-2 px-4 py-2 text-[#8B5CF6] font-medium transition-all duration-200 text-sm cursor-pointer  rounded-lg group ml-auto"
                                    onClick={handleToggleExpanded}
                                >
                                    <span>Show more</span>
                                    <i className="fa-solid fa-chevron-down transition-transform duration-200 group-hover:translate-y-0.5" />
                                </button>
                            </div>
                        )
                    )}
                </div>
            </div>
            <div
                className={`grid grid-cols-2 sm:grid-cols-3 gap-3 pr-2 p-2 transition-all duration-300 ${
                    expanded
                        ? 'max-h-[400px] overflow-y-scroll mb-4'
                        : 'max-h-none overflow-visible mb-0'
                }`}
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                <style jsx>{`
                    div::-webkit-scrollbar {
                        display: none;
                    }
                `}</style>

                {visibleLanguages.length === 0 && searchQuery ? (
                    <div className="col-span-full text-center py-8 text-gray-400">
                        <i className="fa-solid fa-search text-2xl mb-2 block" />
                        <p>No languages match &quot;{searchQuery}&quot;</p>
                        <button
                            onClick={clearSearch}
                            className="mt-2 text-[#8B5CF6] hover:text-[#9333ea] text-sm font-medium"
                        >
                            Clear search
                        </button>
                    </div>
                ) : (
                    visibleLanguages.map(lang => {
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
                                className={`relative flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all duration-200 transform hover:scale-105
                                    border-gray-700/50 cursor-pointer
                                    ${
                                        isSelected
                                            ? 'bg-[#8B5CF6]/10 ring-2 ring-[#8B5CF6] shadow-lg'
                                            : 'bg-primary/50 hover:bg-primary/70'
                                    }
                                    ${isActive ? 'ring-2 ring-[#8B5CF6]' : ''}
                                `}
                            >
                                <span
                                    className="font-bold transition-colors duration-200"
                                    style={{
                                        color: isSelected ? '#8B5CF6' : '#d1d5db',
                                        fontWeight: isSelected ? 800 : 600,
                                    }}
                                >
                                    {lang.shortcut}
                                </span>
                                <span className="text-xs text-gray-400 transition-colors duration-200">
                                    {lang.name}
                                </span>
                                {isTranslated && (
                                    <div className="absolute top-1 right-1">
                                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                    </div>
                                )}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Animated Search Bar / Toggle Area */}
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

/* --------------------- Duplicate Detection Logic --------------------- */
// function to analyze duplicates after parsing input
const analyzeDuplicates = (translations: Record<string, string>) => {
    const analysis = detectDuplicates(translations);

    return analysis;
};

// flattenJson utility for parseInput
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

// update parseInput function to include duplicate detection
const parseInput = (input: string): Record<string, string> => {
    const trimmedInput = input.trim();

    if (!trimmedInput) {
        return {};
    }

    try {
        // Try parsing as JSON first
        const parsed = JSON.parse(trimmedInput);

        if (typeof parsed === 'object' && parsed !== null) {
            const flattened = flattenJson(parsed);
            // Analyze duplicates after parsing
            analyzeDuplicates(flattened);
            return flattened;
        }
    } catch {
        // Not valid JSON, try other formats
    }

    // Handle line-by-line format
    const lines = trimmedInput.split('\n').filter(line => line.trim());
    const result: Record<string, string> = {};

    lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        const colonIndex = trimmedLine.indexOf(':');
        const equalIndex = trimmedLine.indexOf('=');

        if (colonIndex > 0 && (equalIndex === -1 || colonIndex < equalIndex)) {
            const key = trimmedLine.substring(0, colonIndex).trim().replace(/['"]/g, '');
            const value = trimmedLine
                .substring(colonIndex + 1)
                .trim()
                .replace(/['"]/g, '');
            result[key] = value;
        } else if (equalIndex > 0) {
            const key = trimmedLine.substring(0, equalIndex).trim().replace(/['"]/g, '');
            const value = trimmedLine
                .substring(equalIndex + 1)
                .trim()
                .replace(/['"]/g, '');
            result[key] = value;
        } else {
            result[`text_${index + 1}`] = trimmedLine;
        }
    });

    // Analyze duplicates
    analyzeDuplicates(result);
    return result;
};

// handlers for duplicate warning
const handleUnifyDuplicates = () => {
    // Update the input text area with unified content
    // Show success message
};

const handleDismissDuplicateWarning = () => {};
