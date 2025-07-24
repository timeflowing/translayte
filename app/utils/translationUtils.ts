import { toast } from 'react-toastify';

type TranslationResult = Record<string, Record<string, string>>;

/**
 * Transforms standard translation data into a format suitable for Unity.
 * @param result - The translation data.
 * @returns The transformed data.
 */
export const transformToUnityFormat = (result: TranslationResult | null): Record<string, Record<string, string>> => {
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

/**
 * Merges translations from all languages into a single object for the table view.
 * @param translations - The translation data.
 * @returns A single merged object.
 */
export function mergeAllTranslations(translations: TranslationResult): Record<string, string> {
    const merged: Record<string, string> = {};
    for (const [lang, entries] of Object.entries(translations)) {
        for (const [key, value] of Object.entries(entries)) {
            const newKey = `${lang.slice(0, 2)}:${key}`;
            merged[newKey] = value;
        }
    }
    return merged;
}

/**
 * Gets the data for the currently selected view and language tab.
 * @param result - The full translation result.
 * @param selectedLang - The currently selected language tab ('ALL' or a specific code).
 * @param outputFormat - The selected output format ('standard' or 'unity').
 * @returns The data object to be displayed.
 */
export const getDataForView = (
    result: TranslationResult | null,
    selectedLang: string | null,
    outputFormat: 'standard' | 'unity'
): Record<string, unknown> => {
    if (!result || !selectedLang) return {};

    if (outputFormat === 'unity') {
        const dataToTransform = selectedLang === 'ALL' ? result : { [selectedLang]: result[selectedLang] ?? {} };
        return transformToUnityFormat(dataToTransform);
    }

    if (selectedLang === 'ALL') {
        return mergeAllTranslations(result);
    }

    return result[selectedLang] ?? {};
};


/**
 * Copies the currently displayed data to the clipboard.
 * @param data - The data object to copy.
 */
export const copyDataToClipboard = (data: Record<string, unknown>) => {
    if (Object.keys(data).length === 0) return;
    navigator.clipboard.writeText(JSON.stringify(data, null, 2));
    toast.success('Copied to clipboard!');
};

/**
 * Triggers a download for the currently displayed data.
 * @param data - The data object to download.
 * @param fileName - The base name for the downloaded file.
 */
export const downloadDataAsJson = (data: Record<string, unknown>, fileName: string) => {
    if (Object.keys(data).length === 0) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
};