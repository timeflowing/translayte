'use client';

import { useState, useRef, useEffect } from 'react';
import { detectDuplicates, DuplicateAnalysis } from '../utils/duplicateDetection';

interface RealtimeInputSectionProps {
    inputText: string;
    setInputText: (text: string) => void;
    onDuplicatesChange?: (analysis: DuplicateAnalysis | null) => void;
}

export default function RealtimeInputSection({
    inputText,
    setInputText,
    onDuplicatesChange,
}: RealtimeInputSectionProps) {
    const [duplicateAnalysis, setDuplicateAnalysis] = useState<DuplicateAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const parseInput = (input: string): Record<string, string> => {
        const trimmedInput = input.trim();

        if (!trimmedInput) {
            return {};
        }

        try {
            const parsed = JSON.parse(trimmedInput);

            if (typeof parsed === 'object' && parsed !== null) {
                const flattened: Record<string, string> = {};
                const flatten = (obj: any, prefix = '') => {
                    Object.keys(obj).forEach(key => {
                        const fullKey = prefix ? `${prefix}.${key}` : key;
                        if (typeof obj[key] === 'object' && obj[key] !== null) {
                            flatten(obj[key], fullKey);
                        } else {
                            flattened[fullKey] = String(obj[key]);
                        }
                    });
                };
                flatten(parsed);
                return flattened;
            }
        } catch (e) {
            // Not valid JSON
        }

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
                if (key && value) {
                    result[key] = value;
                }
            } else if (equalIndex > 0) {
                const key = trimmedLine.substring(0, equalIndex).trim().replace(/['"]/g, '');
                const value = trimmedLine
                    .substring(equalIndex + 1)
                    .trim()
                    .replace(/['"]/g, '');
                if (key && value) {
                    result[key] = value;
                }
            } else {
                result[`text_${index + 1}`] = trimmedLine;
            }
        });

        return result;
    };

    useEffect(() => {
        if (!inputText.trim()) {
            setDuplicateAnalysis(null);
            setIsAnalyzing(false);
            onDuplicatesChange?.(null);
            return;
        }

        setIsAnalyzing(true);

        const timeoutId = setTimeout(() => {
            try {
                const parsedTranslations = parseInput(inputText);
                const keyCount = Object.keys(parsedTranslations).length;

                if (keyCount >= 2) {
                    const analysis = detectDuplicates(parsedTranslations);
                    setDuplicateAnalysis(analysis);
                    onDuplicatesChange?.(analysis);
                } else {
                    setDuplicateAnalysis(null);
                    onDuplicatesChange?.(null);
                }
            } catch (error) {
                console.error('Error analyzing duplicates:', error);
                setDuplicateAnalysis(null);
                onDuplicatesChange?.(null);
            } finally {
                setIsAnalyzing(false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [inputText, onDuplicatesChange]);

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
    const potentialSavings = duplicateAnalysis?.potentialSavings || 0;

    return (
        <div className="relative">
            {/* Real-time Status Bar */}
            <div className="flex items-center justify-between mb-2 text-xs">
                <div className="flex items-center gap-3">
                    {isAnalyzing && (
                        <div className="flex items-center gap-1 text-blue-400">
                            <div className="animate-spin w-3 h-3 border border-blue-400 border-t-transparent rounded-full"></div>
                            <span>Analyzing...</span>
                        </div>
                    )}

                    {hasDuplicates && !isAnalyzing && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 text-amber-500">
                                <i className="fa-solid fa-exclamation-triangle" />
                                <span>
                                    {duplicateCount} duplicate{duplicateCount !== 1 ? 's' : ''}
                                </span>
                            </div>
                            <div className="text-green-400">
                                ~{potentialSavings} API calls could be saved
                            </div>
                        </div>
                    )}

                    {!hasDuplicates && !isAnalyzing && inputText.trim() && (
                        <div className="text-green-400 flex items-center gap-1">
                            <i className="fa-solid fa-check-circle" />
                            <span>No duplicates detected</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Text Input */}
            <div className="relative">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleTextareaChange}
                    spellCheck={false}
                    placeholder="Paste or edit your text here…"
                    className={`w-full resize-none bg-[#18181b]/90 border rounded-xl px-4 py-4 font-mono text-sm text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#8B5CF6] placeholder-gray-500 shadow-lg transition selection:bg-violet-500 selection:text-white ${
                        hasDuplicates ? 'border-amber-400' : 'border-[#312e81]'
                    }`}
                    style={{
                        caretColor: '#8B5CF6',
                        minHeight: '144px',
                        boxShadow: '0 2px 12px 0 rgba(139,92,246,0.06)',
                        backdropFilter: 'blur(4px)',
                        transition: 'box-shadow 0.2s, border-color 0.2s',
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

                {/* Character Count */}
                <div className="absolute bottom-3 right-3 text-xs text-gray-400">
                    {inputText.length} chars
                </div>
            </div>
        </div>
    );
}
