'use client';

import React, { useEffect, useState, useRef } from 'react';
import { detectDuplicates, DuplicateAnalysis } from '../utils/duplicateDetection';
import { parseInput } from '../utils/inputParser';

interface RealtimeInputSectionProps {
    inputText: string;
    setInputText: (text: string) => void;
    onDuplicatesChange: (analysis: DuplicateAnalysis | null) => void;
    disabled?: boolean;
}

const RealtimeInputSection: React.FC<RealtimeInputSectionProps> = ({
    inputText,
    setInputText,
    onDuplicatesChange,
    disabled = false,
}) => {
    const [duplicateAnalysis, setDuplicateAnalysis] = useState<DuplicateAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!inputText.trim()) {
            setDuplicateAnalysis(null);
            setIsAnalyzing(false);
            onDuplicatesChange(null);
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
                    onDuplicatesChange(analysis);
                } else {
                    setDuplicateAnalysis(null);
                    onDuplicatesChange(null);
                }
            } catch (error) {
                console.error('Error analyzing duplicates:', error);
                setDuplicateAnalysis(null);
                onDuplicatesChange(null);
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

    return (
        <div className="flex flex-col h-[480px] bg-[#1b1b1b] rounded-xl border border-gray-700/80 shadow-lg overflow-hidden">
            <div className="flex-shrink-0 px-5 py-3 border-b border-gray-800 bg-[#0F0F0F]/50">
                <h3 className="text-base font-semibold text-white">Source Content</h3>
                <p className="text-sm text-gray-400">
                    Paste your JSON, key-value pairs, or plain text below.
                </p>
            </div>
            <div className="relative flex-grow">
                <textarea
                    ref={textareaRef}
                    value={inputText}
                    onChange={handleTextareaChange}
                    disabled={disabled}
                    spellCheck={false}
                    placeholder={`{\n  "welcome_message": "Hello, World!",\n  "buttons": {\n    "submit": "Submit"\n  }\n}`}
                    className={`w-full h-full p-4 bg-transparent text-gray-300 placeholder-gray-500 resize-none focus:outline-none font-mono text-sm leading-relaxed ${
                        hasDuplicates ? 'border-amber-400' : 'border-[#312e81]'
                    }`}
                    style={{
                        caretColor: '#8B5CF6',
                        minHeight: '320px',
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
};

export default RealtimeInputSection;
