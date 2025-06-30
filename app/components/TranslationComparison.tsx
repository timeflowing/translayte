'use client';
import React, { useState } from 'react';

interface Props {
    original: Record<string, string>; // base language (Czech in your case)
    translations: Record<string, Record<string, string>>; // langCode => key => value
    languages: { code: string; shortcut: string; name: string }[];
}

const TranslationComparison: React.FC<Props> = ({ original, translations, languages }) => {
    const defaultLang = languages[0]?.code || '';
    const [selectedLang, setSelectedLang] = useState(defaultLang);

    const selectedTranslation = translations?.[selectedLang] ?? {};

    return (
        <div className="flex flex-col gap-6">
            {/* Language Button Selector */}
            <div className="flex flex-wrap gap-2 mb-4">
                {languages.map(lang => (
                    <button
                        key={lang.code}
                        onClick={() => setSelectedLang(lang.code)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedLang === lang.code
                                ? 'bg-[#8B5CF6] text-white'
                                : 'bg-[#1f1f1f] text-gray-300 hover:bg-[#2a2a2a]'
                        }`}
                    >
                        {lang.shortcut}
                    </button>
                ))}
            </div>

            {/* Side-by-side comparison */}
            <div className="grid md:grid-cols-2 gap-6">
                {/* Original (Czech) */}
                <div className="bg-[#0f0f0f] border border-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-2">CS (Original)</h3>
                    <pre className="text-sm text-gray-200 whitespace-pre-wrap">
                        {JSON.stringify(original, null, 2)}
                    </pre>
                </div>

                {/* Selected Translation */}
                <div className="bg-[#0f0f0f] border border-gray-700 p-4 rounded-lg">
                    <h3 className="text-lg font-bold text-white mb-2">
                        {selectedLang} (Translated)
                    </h3>
                    <pre className="text-sm text-purple-200 whitespace-pre-wrap">
                        {JSON.stringify(selectedTranslation, null, 2)}
                    </pre>
                </div>
            </div>
        </div>
    );
};

export default TranslationComparison;
