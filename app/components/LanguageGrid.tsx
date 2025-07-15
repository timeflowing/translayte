'use client';
import React from 'react';
import { LANGUAGE_OPTIONS } from '../languages';

export const LanguageGrid = ({
    selected,
    toggle,
    availableLangCodes,
    selectedPreviewLang,
    setSelectedPreviewLang,
}: {
    selected: Set<string>;
    toggle: (shortcut: string) => void;
    availableLangCodes: string[];
    selectedPreviewLang: string | null;
    setSelectedPreviewLang: (code: string | null) => void;
}) => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-3 gap-3">
        {LANGUAGE_OPTIONS.map(lang => {
            const isSelected = selected.has(lang.shortcut);
            const isAvailable = availableLangCodes.includes(lang.code);
            const isPreviewing = selectedPreviewLang === lang.code;

            return (
                <button
                    key={lang.shortcut}
                    onClick={() => toggle(lang.shortcut)}
                    onMouseEnter={() => isAvailable && setSelectedPreviewLang(lang.code)}
                    onMouseLeave={() => setSelectedPreviewLang(null)}
                    className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all duration-200
            ${
                isSelected
                    ? 'bg-purple-600/20 border-purple-500 ring-2 ring-purple-500'
                    : 'bg-[#2a2a2a]/50 border-gray-700 hover:border-purple-500/50'
            }
            ${isPreviewing ? 'bg-purple-500/30' : ''}
          `}
                >
                    <span className="text-2xl mb-1">{lang.emoji}</span>
                    <span
                        className={`font-semibold text-sm ${
                            isSelected ? 'text-white' : 'text-gray-300'
                        }`}
                    >
                        {lang.name}
                    </span>
                    <span className={`text-xs ${isSelected ? 'text-purple-300' : 'text-gray-500'}`}>
                        {lang.shortcut}
                    </span>
                </button>
            );
        })}
    </div>
);
