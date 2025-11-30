// Utility and helper functions for TranslatorPage

import { deleteDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebaseClient";
import { toast } from "react-toastify";

export function transformToUnityFormat(result: Record<string, Record<string, string>> | null) {
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
}

export function mergeAllTranslations(translations: Record<string, Record<string, string>>): Record<string, string> {
  const merged: Record<string, string> = {};
  for (const [lang, entries] of Object.entries(translations)) {
    for (const [key, value] of Object.entries(entries)) {
      const newKey = `${lang}:${key}`;
      merged[newKey] = value;
    }
  }
  return merged;
}

export function safeParseJsonInput(input: string): object | null {
  try {
    let text = input.trim();
    text = text.replace(/,\s*}/g, '}');
    text = text.replace(/,\s*$/g, '');
    if (!text.startsWith('{')) {
      text = `{${text}}`;
    }
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function tryTranslate({
  authLoading,
  user,
  isPro,
  keyCount,
  keysThisMonth,
  FREE_TIER_KEY_LIMIT,
  mode,
  jsonInput,
  rows,
  handleTranslate,
  toast,
  setShowPaywall
}: {
  authLoading: boolean;
  user: { id: string; email: string } | null;
  isPro: boolean;
  keyCount: number;
  keysThisMonth: number;
  FREE_TIER_KEY_LIMIT: number;
  mode: string;
  jsonInput: string;
  rows: { key: string; value: string }[];
  handleTranslate: () => void;
  toast: { error: (message: string) => void };
  setShowPaywall: (v: boolean) => void;
}) {
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
}

export async function deleteTranslation(id: string) {
    try {
        await deleteDoc(doc(db, 'translations', id));
        toast.success('Translation deleted!');
    } catch {
        toast.error('Failed to delete translation.');
    }
}
