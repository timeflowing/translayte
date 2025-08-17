'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FaChevronDown } from 'react-icons/fa';
import { detectDuplicates, DuplicateAnalysis } from '../utils/duplicateDetection';
import { parseInput } from '../utils/inputParser';

interface LanguageOption {
    code: string;
    name: string;
    emoji: string;
}

interface RealtimeInputSectionProps {
    inputText: string;
    setInputText: (text: string) => void;
    onDuplicatesChange: (analysis: DuplicateAnalysis | null) => void;
    detectedLanguage?: string | null;
    disabled?: boolean;
    onSourceLanguageChange: (code: string) => void;
    sourceLanguageCode: string;
    availableLanguages: LanguageOption[];
}

const RealtimeInputSection: React.FC<RealtimeInputSectionProps> = ({
    inputText,
    setInputText,
    onDuplicatesChange,
    detectedLanguage,
    disabled = false,
    onSourceLanguageChange,
    sourceLanguageCode,
    availableLanguages,
}) => {
    const [duplicateAnalysis, setDuplicateAnalysis] = useState<DuplicateAnalysis | null>(null);
    const [isAnalyzing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!inputText.trim()) {
            setDuplicateAnalysis(null);
            onDuplicatesChange(null);
            return;
        }
        const timeoutId = setTimeout(() => {
            try {
                const parsedTranslations = parseInput(inputText);
                const analysis = detectDuplicates(parsedTranslations);
                setDuplicateAnalysis(analysis);
                onDuplicatesChange(analysis);
            } catch {
                setDuplicateAnalysis(null);
                onDuplicatesChange(null);
            }
        }, 500);
        return () => clearTimeout(timeoutId);
    }, [inputText, onDuplicatesChange]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setInputText(e.target.value);
        const el = textareaRef.current;
        if (el) {
            el.style.height = 'auto';
            el.style.height = `${el.scrollHeight}px`;
        }
    };

    const hasDuplicates = duplicateAnalysis?.hasDuplicates || false;
    const duplicateCount = duplicateAnalysis?.totalDuplicates || 0;
    const selectedLanguageName =
        availableLanguages.find(lang => lang.code === sourceLanguageCode)?.name || 'Auto Detect';

    return (
        <div className="flex flex-col h-[480px] bg-[#1b1b1b] rounded-xl border border-gray-700/80 shadow-lg overflow-hidden">
            <div className="flex-shrink-0 px-5 py-3 border-b border-gray-800 bg-[#0F0F0F]/50 flex justify-between items-center">
                <div>
                    <h3 className="text-base font-semibold text-white">Source Content</h3>
                    <p className="text-sm text-gray-400">
                        Paste your JSON, key-value pairs, or plain text below.
                    </p>
                </div>
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        disabled={disabled}
                        className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/50 border border-gray-700 rounded-md text-sm text-gray-300 hover:bg-gray-700/70 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500"
                    >
                        <span>
                            {sourceLanguageCode === 'auto'
                                ? detectedLanguage || 'Auto Detect'
                                : selectedLanguageName}
                        </span>
                        <FaChevronDown
                            className={`transition-transform duration-200 ${
                                isDropdownOpen ? 'rotate-180' : ''
                            }`}
                        />
                    </button>
                    {isDropdownOpen && (
                        <div className="absolute top-full right-0 mt-2 w-48 bg-[#2a2a2a] border border-gray-700 rounded-md shadow-xl z-20 overflow-hidden">
                            <ul>
                                {availableLanguages.map(lang => (
                                    <li key={lang.code}>
                                        <button
                                            onClick={() => {
                                                onSourceLanguageChange(lang.code);
                                                setIsDropdownOpen(false);
                                            }}
                                            className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-violet-600 flex items-center gap-3"
                                        >
                                            <span className="text-lg">{lang.emoji}</span>
                                            <span>{lang.name}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </div>
            <div className="relative flex-grow">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleTextareaChange}
                    disabled={disabled}
                    spellCheck={false}
                    placeholder={`{\n  "welcome_message": "Hello, World!",\n  "buttons": {\n    "submit": "Submit"\n  }\n}`}
                    className="w-full h-full p-4 bg-transparent text-gray-300 placeholder-gray-500 resize-none focus:outline-none font-mono text-sm leading-relaxed"
                    style={{
                        caretColor: '#8B5CF6',
                        minHeight: '320px',
                    }}
                />
                {/* Real-time Indicators */}
                <div className="absolute top-3 right-3 flex items-center gap-2">
                    {isAnalyzing && (
                        <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full animate-pulse">
                            Scanning...
                        </div>
                    )}

                    {hasDuplicates && !isAnalyzing && (
                        <div className="bg-amber-500 text-white text-xs px-2 py-1 rounded-full">
                            {duplicateCount} duplicates
                        </div>
                    )}

                    {!hasDuplicates && !isAnalyzing && inputText.trim() && (
                        <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                            ✓ Clean
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RealtimeInputSection;
