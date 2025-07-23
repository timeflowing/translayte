'use client';
import React, { useState, useRef, useEffect } from 'react';
import { LANGUAGE_OPTIONS } from '../languages';

export const LanguageGrid = ({
    selected,
    toggle,
    availableLangCodes = [],
    selectedPreviewLang = null,
    setSelectedPreviewLang = () => {},
}: {
    selected: Set<string>;
    toggle: (shortcut: string) => void;
    availableLangCodes?: string[];
    selectedPreviewLang?: string | null;
    setSelectedPreviewLang?: (code: string | null) => void;
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
            {/* Language Grid Controls */}
            <div className="flex flex-col items-end">
                <div
                    className={`w-full transition-all duration-300 ease-in-out ${
                        expanded ? 'max-h-32 opacity-100' : 'max-h-12 opacity-100'
                    }`}
                >
                    {expanded ? (
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
                                    className="w-full pl-10 pr-10 py-2 bg-[#1f1f1f] border border-gray-600 rounded-lg text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] focus:border-[#8B5CF6] transition-all duration-200"
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
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                    style={{ color: '#9ca3af', textShadow: '0 2px 8px #9ca3af' }}
                                    onClick={handleToggleExpanded}
                                    title="Collapse"
                                >
                                    <i className="fa-solid fa-chevron-up text-sm" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        LANGUAGE_OPTIONS.length > perRow && (
                            <div className="flex items-center justify-between w-full">
                                <button
                                    className="flex items-center gap-2 px-4 py-2 text-[#8B5CF6] font-medium transition-all duration-200 text-sm cursor-pointer rounded-lg group ml-auto"
                                    onClick={handleToggleExpanded}
                                >
                                    <span>Show more</span>
                                    <i
                                        className="fa-solid fa-chevron-down transition-transform duration-200 group-hover:translate-y-0.5"
                                        style={{ color: '#8B5CF6' }}
                                    />
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

                {expanded && filteredLanguages.length === 0 && searchQuery ? (
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
                    (expanded ? filteredLanguages : visibleLanguages).map(lang => {
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
                                onMouseEnter={() =>
                                    isTranslated &&
                                    setSelectedPreviewLang &&
                                    setSelectedPreviewLang(lang.code)
                                }
                                onMouseLeave={() =>
                                    setSelectedPreviewLang && setSelectedPreviewLang(null)
                                }
                                className={`relative flex flex-col items-start px-3 py-2 rounded-lg border text-left transition-all duration-200 
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
        </div>
    );
};
