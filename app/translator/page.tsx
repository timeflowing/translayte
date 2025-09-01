'use client';
// Simple modal for selecting a project from history
function SelectProjectModal({
    history,
    onSelect,
    onClose,
}: {
    history: HistoryItem[];
    onSelect: (id: string) => void;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
            <div className="bg-[#18132a] border-2 border-[#8B5CF6] rounded-2xl p-7 w-full max-w-md shadow-2xl relative animate-fadeIn">
                <h2 className="text-2xl font-extrabold text-white mb-5 flex items-center gap-2">
                    <span className="inline-block w-2 h-6 rounded bg-gradient-to-b from-[#8B5CF6] to-[#7C3AED] mr-2" />
                    Select a Project to Share
                </h2>
                <div className="max-h-64 overflow-y-auto divide-y divide-[#2a1e4a] rounded-lg bg-[#19132a]/60 border border-[#2a1e4a] mb-2">
                    {history.length === 0 ? (
                        <div className="text-gray-400 text-center py-10">
                            <i className="fa-regular fa-folder-open text-3xl text-[#8B5CF6] mb-3" />
                            <div>No projects found in your history.</div>
                        </div>
                    ) : (
                        history.map(item => (
                            <button
                                key={item.id}
                                className="w-full text-left px-4 py-3 transition-all rounded-lg flex flex-col mb-1 border-2 border-transparent hover:border-[#8B5CF6] hover:bg-[#22184a]/80 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] group"
                                onClick={() => onSelect(item.id)}
                            >
                                <span className="font-semibold text-white group-hover:text-[#a78bfa] transition-colors">
                                    {item.fileName || 'Untitled'}
                                </span>
                                <span className="text-xs text-gray-400 group-hover:text-[#c4b5fd] transition-colors">
                                    {item.id}
                                </span>
                            </button>
                        ))
                    )}
                </div>
                <button
                    className="mt-6 w-full px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-lg font-bold shadow-lg hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] transition-all text-lg"
                    onClick={onClose}
                >
                    Cancel
                </button>
                <style jsx>{`
                    @keyframes fadeIn {
                        from {
                            opacity: 0;
                            transform: scale(0.97);
                        }
                        to {
                            opacity: 1;
                            transform: scale(1);
                        }
                    }
                    .animate-fadeIn {
                        animation: fadeIn 0.25s cubic-bezier(0.4, 0, 0.2, 1);
                    }
                `}</style>
            </div>
        </div>
    );
}
import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'; // <-- Add this import
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
    getDoc,
    deleteDoc,
    updateDoc,
    query,
    where,
} from 'firebase/firestore';
import 'react-toastify/dist/ReactToastify.css';

import Link from 'next/link';
import KeyValueContextInput from '../components/KeyValueContextInput';
import { LANGUAGE_OPTIONS } from '../languages'; // Import language options
import { DuplicateAnalysis } from '../utils/duplicateDetection';
import DuplicateWarning from '../components/DuplicateWarning';
import RealtimeInputSection from '../components/RealtimeInputSection';
import { LanguageGrid } from '../components/LanguageGrid';
import { HistoryAside } from '../components/HistoryAside'; // Import the new component
import { toast } from 'react-toastify';
import ModeSwitcher from '../components/ModeSwitcher';
import NewProjectModal from '../components/NewProjectModal';
import { DropZone } from '../components/DropZone';
import { parseInput } from '../utils/inputParser';
import SimpleLinkShareModal from '../components/SimpleLinkShareModal';
import { usePresence } from '../hooks/usePresence';
import { CollaboratorsCard } from '../components/CollaboratorsCards';

type HistoryItem = {
    id: string;
    userId?: string;
    fileName?: string;
    targetLanguages?: string[];
    translationResult?: Record<string, Record<string, string>>;
    createdAt?: { seconds: number; nanoseconds: number };
};

const FREE_TIER_KEY_LIMIT = 69;

export default function TranslatorPage() {
    const { user, authUser, loading: authLoading } = useAuth();
    const router = useRouter(); // <-- Add this line
    const [keysThisMonth, setKeysThisMonth] = useState(0);
    const [charsThisMonth, setCharsThisMonth] = useState(0);
    const [showPaywall, setShowPaywall] = useState(false);

    // ADD THIS STATE:
    const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);

    // Add this state for the create project modal

    // ...inside TranslatorPage component...
    const [showShareModal, setShowShareModal] = useState(false);
    // Profile dropdown state
    const [profileOpen, setProfileOpen] = useState(false);

    // UPDATE THIS LINE:
    const isPro = subscriptionStatus === 'active' || subscriptionStatus === 'trialing';
    const [translationId, setTranslationId] = useState<string | null>(null);
    const { collaborators } = usePresence(translationId || undefined);
    const [showSelectProjectModal, setShowSelectProjectModal] = useState(false);
    const [showNewProjectModal, setShowNewProjectModal] = useState(false);

    // Sharing state
    const [isPubliclyShared, setIsPubliclyShared] = useState(false);

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
    const [dontSave, setDontSave] = useState(false);
    const [isDropZoneMinimized, setIsDropZoneMinimized] = useState(false);
    const [sourceLanguageCode, setSourceLanguageCode] = useState('auto'); // Default to auto-detect
    const [detectedLanguageName, setDetectedLanguageName] = useState<string | null>(null);

    // Define the languages for the dropdown
    const sourceLanguageOptions = [
        LANGUAGE_OPTIONS.find(l => l.code === 'auto'),
        LANGUAGE_OPTIONS.find(l => l.code === 'en_XX'),
        LANGUAGE_OPTIONS.find(l => l.code === 'cs_CZ'),
        LANGUAGE_OPTIONS.find(l => l.code === 'de_DE'),
        LANGUAGE_OPTIONS.find(l => l.code === 'es_XX'),
        LANGUAGE_OPTIONS.find(l => l.code === 'fr_XX'),
    ].filter(Boolean) as typeof LANGUAGE_OPTIONS;

    const detectLanguage = useCallback(async (text: string) => {
        try {
            const response = await fetch('/api/detect-language', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text }),
            });
            if (!response.ok) throw new Error('Detection failed');
            const data = await response.json();
            if (data.languageName) {
                setDetectedLanguageName(data.languageName);
            }
        } catch (error) {
            console.error('Language detection error:', error);
            setDetectedLanguageName(null);
        }
    }, []);

    useEffect(() => {
        // Only run auto-detection if the mode is 'auto' and there is text
        if (sourceLanguageCode !== 'auto' || !jsonInput.trim()) {
            if (sourceLanguageCode === 'auto') setDetectedLanguageName(null);
            return;
        }

        const handler = setTimeout(() => {
            detectLanguage(jsonInput);
        }, 500); // Debounce detection

        return () => clearTimeout(handler);
    }, [jsonInput, sourceLanguageCode, detectLanguage]);

    const handleSourceLanguageChange = (code: string) => {
        setSourceLanguageCode(code);
        if (code !== 'auto') {
            const langName = sourceLanguageOptions.find(l => l.code === code)?.name;
            setDetectedLanguageName(langName || null);
        } else {
            setDetectedLanguageName(null);
            if (jsonInput.trim()) {
                detectLanguage(jsonInput);
            }
        }
    };

    // Real-time language detection as the user types
    useEffect(() => {
        const textToDetect = mode === 'file' ? jsonInput : rows.map(r => r.value).join(' ');

        if (!textToDetect.trim()) {
            setDetectedLanguageName(null);
            setSourceLanguageCode('auto');
            return;
        }

        const handler = setTimeout(async () => {
            try {
                const response = await fetch('/api/detect-language', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text: textToDetect }),
                });

                if (response.ok) {
                    const data = await response.json();
                    setDetectedLanguageName(data.language || null);
                    setSourceLanguageCode(data.code || 'auto');
                }
            } catch (error) {
                console.error('Language detection failed:', error);
            }
        }, 500); // Debounce for 500ms

        return () => {
            clearTimeout(handler);
        };
    }, [jsonInput, rows, mode]);

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
            !dontSave && // <-- Add this line
            isPro &&
            translationResult &&
            user &&
            user.uid &&
            Object.keys(translationResult).length > 0 &&
            isUserTranslation
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

    /* ---------------- translate ---------------- */
    const handleTranslate = async () => {
        setIsTranslating(true);

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

        if (!user) {
            alert('Please log in to translate');
            window.location.href = '/login';
            return;
        }

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
            await new Promise(resolve => setTimeout(resolve, 100));

            const { translations } = await translateBatch(payload, targetCodes, sourceLanguageCode);

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

            // Calculate character count from input text
            const allValues = Object.values(payload);
            const charCount = allValues.reduce((total: number, value: unknown) => {
                return total + (typeof value === 'string' ? value.length : String(value).length);
            }, 0);

            await updateDoc(doc(db, 'users', user.uid), {
                keys_month: keysThisMonth + allKeys.length,
                chars_month: charsThisMonth + charCount,
            });
            if (!dontSave) {
                if (translationId) {
                    // Update current project
                    await updateDoc(doc(db, 'translations', translationId), {
                        fileName: fileName ?? 'Untitled',
                        sourceLanguage: sourceLanguageCode,
                        targetLanguages: Array.from(selectedShortcuts),
                        translationResult: finalResult,
                        updatedAt: serverTimestamp(),
                    });
                } else {
                    // Create new project
                    const docRef = await addDoc(collection(db, 'translations'), {
                        userId: user.uid,
                        fileName: fileName ?? 'Untitled',
                        sourceLanguage: sourceLanguageCode,
                        targetLanguages: Array.from(selectedShortcuts),
                        translationResult: finalResult,
                        createdAt: serverTimestamp(),
                    });
                    setTranslationId(docRef.id);
                }
            }
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
        // Prevent translation if input area is empty
        if (
            (mode === 'file' && (!jsonInput || jsonInput.trim() === '')) ||
            (mode === 'keys' && rows.filter(r => r.key && r.value).length === 0)
        ) {
            toast.error('Please enter text or key-value pairs to translate.');
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
        // Ensure displayName is never undefined for Firestore
        const safeDisplayName =
            user.displayName || (user.email ? user.email.split('@')[0] : 'User');
        setDoc(presenceRef, {
            uid: user.uid,
            displayName: safeDisplayName,
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
            setCharsThisMonth(0);
            setHistory([]);
            return;
        }

        // Listener for user-specific data (keys_month and chars_month)
        const userUnsub = onSnapshot(doc(db, 'users', user.uid), snap => {
            const userData = snap.data();
            setKeysThisMonth(userData?.keys_month || 0);
            setCharsThisMonth(userData?.chars_month || 0);
        });

        // FIX: Listen to the correct collection for subscription status
        const subscriptionsQuery = query(
            collection(db, 'customers', user.uid, 'subscriptions'),
            where('status', 'in', ['trialing', 'active']),
        );

        const subscriptionsUnsub = onSnapshot(subscriptionsQuery, snapshot => {
            if (snapshot.empty) {
                setSubscriptionStatus(null);
                return;
            }
            // We only expect one active subscription
            const sub = snapshot.docs[0].data();
            setSubscriptionStatus(sub.status);
        });

        // Listener for translations history - include both owned and shared
        setHistoryLoading(true);

        // Combine results from both queries
        let ownedHistory: (HistoryItem & { isOwner: boolean })[] = [];
        let sharedHistory: (HistoryItem & { isOwner: boolean })[] = [];

        const updateHistory = (
            items: (HistoryItem & { isOwner: boolean })[],
            type: 'owned' | 'shared',
        ) => {
            if (type === 'owned') {
                ownedHistory = items;
            } else {
                sharedHistory = items;
            }

            const allItems = [...ownedHistory, ...sharedHistory].sort(
                (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
            );

            setHistory(allItems);
            setHistoryLoading(false);
        };

        // Query for translations owned by the user
        const ownedTranslationsUnsub = onSnapshot(
            query(collection(db, 'translations'), where('userId', '==', user.uid)),
            snap => {
                const ownedItems = snap.docs.map(doc => {
                    const raw = doc.data() as HistoryItem & { title?: string };
                    let name = undefined;
                    if (typeof raw.title === 'string' && raw.title.length > 0) {
                        name = raw.title;
                    } else if (typeof raw.fileName === 'string' && raw.fileName.length > 0) {
                        name = raw.fileName;
                    }
                    return {
                        ...raw,
                        id: doc.id,
                        fileName: name,
                        isOwner: true,
                    } as HistoryItem & { isOwner: boolean };
                });
                updateHistory(ownedItems, 'owned');
            },
            error => {
                console.error('Error loading owned translations:', error);
                setHistoryLoading(false);
            },
        );

        // Query for translations shared with the user
        const sharedTranslationsUnsub = onSnapshot(
            query(collection(db, 'translations'), where(`sharedWith.${user.uid}`, '!=', null)),
            snap => {
                const sharedItems = snap.docs.map(doc => {
                    const raw = doc.data() as HistoryItem & { title?: string };
                    let name = undefined;
                    if (typeof raw.title === 'string' && raw.title.length > 0) {
                        name = raw.title;
                    } else if (typeof raw.fileName === 'string' && raw.fileName.length > 0) {
                        name = raw.fileName;
                    }
                    return {
                        ...raw,
                        id: doc.id,
                        fileName: name,
                        isOwner: false,
                    } as HistoryItem & { isOwner: boolean };
                });
                updateHistory(sharedItems, 'shared');
            },
            error => {
                console.error('Error loading shared translations:', error);
                setHistoryLoading(false);
            },
        );

        // Cleanup all listeners on unmount or user change
        return () => {
            userUnsub();
            subscriptionsUnsub();
            ownedTranslationsUnsub();
            sharedTranslationsUnsub();
        };
    }, [user]);

    // Fetch sharing status when translation ID changes
    useEffect(() => {
        if (!translationId || !user) {
            setIsPubliclyShared(false);
            return;
        }

        const fetchSharingStatus = async () => {
            try {
                // Check if translation has sharing info in Firestore
                const translationRef = doc(db, 'translations', translationId);
                const translationDoc = await getDoc(translationRef);

                if (translationDoc.exists()) {
                    const data = translationDoc.data();
                    setIsPubliclyShared(data?.isPubliclyShared || false);
                } else {
                    setIsPubliclyShared(false);
                }
            } catch (error) {
                console.error('Failed to check sharing status:', error);
                setIsPubliclyShared(false);
            }
        };

        fetchSharingStatus();
    }, [translationId, user]);

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

    type ViewTabKey = 'json' | 'table' | 'original' | 'all';
    const VIEW_TABS: { key: ViewTabKey; label: string }[] = [
        { key: 'json', label: 'JSON' },
        { key: 'table', label: 'Table' },
        { key: 'original', label: 'Original' },
    ];
    // Handler for creating a new project
    const handleCreateProject = async (name: string, users: string[]) => {
        if (!user) {
            toast.error('You must be logged in to create a project.');
            return;
        }
        try {
            const docRef = await addDoc(collection(db, 'translations'), {
                userId: user.uid,
                fileName: name,
                createdAt: serverTimestamp(),
                sharedWith: users,
            });
            setTranslationId(docRef.id);
            setIsUserTranslation(true); // ✅ Mark project as active
            setFileName(name);
            setRows([{ key: '', value: '', context: '' }]);
            setJsonInput('');
            setTranslationResult(null);
            setShowNewProjectModal(false);
            toast.success('Project created!');
        } catch {
            toast.error('Failed to create project.');
        }
    };
    const handleFileRead = (content: string, name: string) => {
        setJsonInput(content);
        setFileName(name);
    };
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
                    {user && (
                        <div className="text-sm text-gray-300 flex items-center gap-4">
                            <div className="flex items-center gap-2">
                                <i className="fa-solid fa-key text-yellow-400" />
                                {isPro && `${keysThisMonth} / ${FREE_TIER_KEY_LIMIT} keys`}
                            </div>
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
                        <ModeSwitcher
                            mode={mode}
                            setMode={setMode}
                            onCreateProject={() => setShowNewProjectModal(true)}
                        />

                        <div className="relative mt-4">
                            {/* This div blurs and disables inputs for logged-out users */}
                            <div
                                className={
                                    !user && !authLoading
                                        ? 'opacity-50 blur-sm pointer-events-none'
                                        : ''
                                }
                            >
                                {/* -----  file mode  ----- */}
                                {mode === 'file' && (
                                    <>
                                        {!translationResult ? (
                                            <div
                                                className="flex flex-col"
                                                style={{ minHeight: 'calc(100vh - 30rem)' }}
                                            >
                                                {/* The button is now part of the animated container */}
                                                <div
                                                    className={`relative transition-all duration-300 ease-in-out overflow-visible ${
                                                        isDropZoneMinimized
                                                            ? 'max-h-8' // Height for the button
                                                            : 'max-h-60'
                                                    }`}
                                                >
                                                    {/* The button is positioned absolutely within this container */}
                                                    <button
                                                        onClick={() =>
                                                            setIsDropZoneMinimized(prev => !prev)
                                                        }
                                                        className="absolute top-0 right-0 z-20 flex items-center gap-2 text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-700/50"
                                                        title={
                                                            isDropZoneMinimized
                                                                ? 'Show Dropzone'
                                                                : 'Hide Dropzone'
                                                        }
                                                    >
                                                        <span>
                                                            {isDropZoneMinimized ? 'Show' : 'Hide'}
                                                        </span>
                                                        <i
                                                            className={`fa-solid fa-chevron-up transition-transform duration-200 ${
                                                                isDropZoneMinimized
                                                                    ? 'rotate-180'
                                                                    : ''
                                                            }`}
                                                        />
                                                    </button>

                                                    {/* The DropZone itself fades out */}
                                                    <div
                                                        className={`transition-opacity duration-200 ${
                                                            isDropZoneMinimized
                                                                ? 'opacity-0 pointer-events-none'
                                                                : 'opacity-100'
                                                        }`}
                                                    >
                                                        <DropZone
                                                            onFileRead={handleFileRead}
                                                            fileName={fileName}
                                                            translationResult={translationResult}
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex-grow">
                                                    <RealtimeInputSection
                                                        inputText={jsonInput}
                                                        setInputText={setJsonInput}
                                                        onDuplicatesChange={setRealtimeDuplicates}
                                                        detectedLanguage={detectedLanguageName}
                                                        onSourceLanguageChange={
                                                            handleSourceLanguageChange
                                                        }
                                                        sourceLanguageCode={sourceLanguageCode}
                                                        availableLanguages={sourceLanguageOptions}
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
                                                            onDismiss={() =>
                                                                setRealtimeDuplicates(null)
                                                            }
                                                            originalTranslations={(() => {
                                                                try {
                                                                    const parsed =
                                                                        JSON.parse(jsonInput);
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
                                                                onClick={() =>
                                                                    setSelectedLangTab(code)
                                                                }
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
                                                                onClick={() =>
                                                                    setSelectedView(tab.key)
                                                                }
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
                                                                    colorized
                                                                        ? 'fa-eye-slash'
                                                                        : 'fa-eye'
                                                                }`}
                                                            />
                                                        </button>
                                                        <button
                                                            onClick={copyCurrent}
                                                            className="px-3 py-1.5 rounded-md bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] text-sm font-medium"
                                                        >
                                                            <i className="fa-solid fa-copy mr-1" />{' '}
                                                            Copy
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
                                                                                ? mergeAllTranslations(
                                                                                      translationResult ??
                                                                                          {},
                                                                                  )
                                                                                : translationResult?.[
                                                                                      selectedLangTab
                                                                                  ] ?? {},
                                                                        ).map(([key, value]) => (
                                                                            <tr
                                                                                key={key}
                                                                                className="group"
                                                                            >
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
                                                                    style={{
                                                                        verticalAlign: 'top',
                                                                    }}
                                                                />
                                                                {isTranslating && (
                                                                    <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg">
                                                                        <div className="flex flex-col items-center text-center">
                                                                            <i className="fa-solid fa-spinner fa-spin text-3xl text-[#8B5CF6]"></i>
                                                                            <span className="mt-3 text-white font-medium">
                                                                                Translating...
                                                                            </span>
                                                                            <span className="mt-1 text-xs text-gray-300">
                                                                                This may take a
                                                                                moment.
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 text-xs text-gray-500">
                                                                You can edit the original source
                                                                here before re-translating.
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}
                                {mode === 'keys' ? (
                                    <>
                                        <KeyValueContextInput
                                            rows={rows}
                                            onChange={newRows => {
                                                setRows(newRows);
                                            }}
                                            disableDeleteFirstRow
                                        />
                                    </>
                                ) : null}
                            </div>

                            {/* This overlay blocks the inputs and prompts login */}
                            {!user && !authLoading && (
                                <div
                                    className="absolute inset-0 z-20 flex items-center justify-center cursor-pointer"
                                    onClick={() => router.push('/login')}
                                >
                                    <div className="bg-[#191919]/90 p-8 rounded-xl text-white text-center border border-gray-700 shadow-2xl">
                                        <i className="fa-solid fa-lock text-3xl text-[#8B5CF6] mb-4"></i>
                                        <h3 className="font-bold text-xl">Log In to Translate</h3>
                                        <p className="text-sm text-gray-300 mt-2">
                                            Create an account or log in to use the translator.
                                        </p>
                                        <button className="mt-6 w-full px-4 py-2 bg-[#8B5CF6] text-white rounded-lg font-semibold hover:opacity-90 transition-opacity">
                                            Continue
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
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
                            <label className="flex items-center cursor-pointer select-none">
                                <span className="text-sm text-gray-300">Don’t Save</span>
                                <span className="flex-1" />
                                <span
                                    className={`relative inline-block w-10 h-6 transition rounded-full ${
                                        dontSave ? 'bg-[#8B5CF6]' : 'bg-gray-700'
                                    }`}
                                    onClick={() => setDontSave(v => !v)}
                                >
                                    <span
                                        className={`absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                                            dontSave ? 'translate-x-4' : ''
                                        }`}
                                    />
                                </span>
                            </label>
                        </div>
                        {showPaywall && (
                            <div className="p-4 mt-4 mb-4 bg-yellow-800 text-yellow-100 rounded-lg">
                                You’ve reached your free‐tier limit of 69 keys this month.{' '}
                                <button onClick={goPro} className="underline">
                                    Upgrade to Pro
                                </button>{' '}
                                to continue translating.
                            </div>
                        )}
                        <div className="flex flex-col sm:flex-row gap-4 mt-4">
                            <TranslateButton
                                onClick={tryTranslate}
                                loading={isTranslating}
                                isRetranslate={!!translationResult}
                            />
                        </div>
                        {isPro && (
                            <>
                                <button
                                    className="w-full mt-4 group relative inline-flex items-center justify-center font-semibold px-4 py-2 rounded-lg border border-gray-800 bg-[#232323]/60 backdrop-blur-sm text-gray-400 hover:bg-[#232323]/80 hover:text-white transition"
                                    onClick={() => {
                                        if (translationId) {
                                            setShowShareModal(true);
                                        } else {
                                            setShowSelectProjectModal(true);
                                        }
                                    }}
                                >
                                    <span className="absolute inset-0 rounded-lg pointer-events-none" />
                                    <span className="relative z-10 flex items-center gap-2">
                                        <i className="fa-solid fa-share-nodes text-gray-500 group-hover:text-white transition-colors text-sm" />
                                        Share Project
                                    </span>
                                </button>
                                <div className="mt-4">
                                    {translationId && (
                                        <CollaboratorsCard
                                            collaborators={collaborators}
                                            onInviteClick={() => {
                                                if (translationId) setShowShareModal(true);
                                            }}
                                        />
                                    )}
                                </div>
                            </>
                        )}
                        {/* --- Translation History Section --- */}
                        {isPro && (
                            <div className="bg-[#191919]/70 backdrop-blur-sm rounded-lg p-4 mt-4">
                                <h3 className="text-base font-semibold text-white mb-3 flex items-center gap-2">
                                    <i className="fa-solid fa-clock-rotate-left text-[#8B5CF6]" />
                                    Project History
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

            {/* New Project Modal */}
            <NewProjectModal
                open={showNewProjectModal}
                onClose={() => setShowNewProjectModal(false)}
                onCreate={handleCreateProject}
            />
            {/* Select Project Modal */}
            {showSelectProjectModal && isPro && (
                <SelectProjectModal
                    history={history}
                    onSelect={id => {
                        setTranslationId(id);
                        setShowSelectProjectModal(false);
                        setShowShareModal(true);
                    }}
                    onClose={() => setShowSelectProjectModal(false)}
                />
            )}
            {/* Share Project Modal */}
            {showShareModal && isPro && translationId && (
                <SimpleLinkShareModal
                    link={`${window.location.origin}/share/${translationId}`}
                    onClose={() => setShowShareModal(false)}
                    isPubliclyShared={isPubliclyShared}
                    onTogglePublicSharing={async () => {
                        if (!user || !authUser) return;
                        try {
                            const token = await authUser.getIdToken();
                            const newSharingState = !isPubliclyShared;

                            const response = await fetch(`/api/share/${translationId}`, {
                                method: 'POST',
                                headers: {
                                    Authorization: `Bearer ${token}`,
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({
                                    isPubliclyShared: newSharingState,
                                }),
                            });

                            if (!response.ok) {
                                throw new Error(`Failed to update sharing: ${response.statusText}`);
                            }

                            const result = await response.json();
                            setIsPubliclyShared(result.isPubliclyShared);
                            toast.success(
                                result.isPubliclyShared
                                    ? 'Project is now publicly shareable!'
                                    : 'Project sharing disabled',
                            );
                        } catch (error) {
                            console.error('Failed to update sharing:', error);
                            toast.error('Failed to update sharing settings');
                        }
                    }}
                />
            )}
        </>
    );
}

const TranslateButton = ({
    onClick,
    loading,
    isRetranslate,
}: {
    onClick: () => void;
    loading: boolean;
    isRetranslate?: boolean;
}) => (
    <button
        onClick={onClick}
        disabled={loading}
        className="btn-primary w-full group relative inline-flex items-center justify-center"
    >
        <span className="absolute inset-0 rounded-lg" />
        <span className="relative z-10">
            {loading ? (
                <>
                    <i className="fa-solid fa-spinner fa-spin mr-2" />{' '}
                    {isRetranslate ? 'Retranslating…' : 'Translating…'}
                </>
            ) : isRetranslate ? (
                'Retranslate Text'
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
