'use client';

import React, { useState } from 'react';
import { LANGUAGE_OPTIONS } from '../../languages';
import { highlightJson, prettyJson } from '../../utils/prettyJson';
import {
    getDataForView,
    copyDataToClipboard,
    downloadDataAsJson,
} from '../../utils/translationUtils';
import RealtimeInputSection from '../RealtimeInputSection';
import { DuplicateAnalysis } from '@/app/utils/duplicateDetection';

type TranslationResult = Record<string, Record<string, string>>;
type ViewTabKey = 'json' | 'table' | 'original';

const VIEW_TABS: { key: ViewTabKey; label: string }[] = [
    { key: 'json', label: 'JSON' },
    { key: 'table', label: 'Table' },
    { key: 'original', label: 'Original' },
];

interface ResultsViewProps {
    translationResult: TranslationResult;
    lastTargetCodes: string[];
    outputFormat: 'standard' | 'unity';
    jsonInput: string;
    setJsonInput: (value: string) => void;
    isTranslating: boolean;
}

export const ResultsView: React.FC<ResultsViewProps> = ({
    translationResult,
    lastTargetCodes,
    outputFormat,
    jsonInput,
    setJsonInput,
    isTranslating,
}) => {
    const [selectedLangTab, setSelectedLangTab] = useState<string | null>(
        lastTargetCodes[0] ?? 'ALL',
    );
    const [selectedView, setSelectedView] = useState<ViewTabKey>('json');
    const [colorized, setColorized] = useState(true);
    const [realtimeDuplicates, setRealtimeDuplicates] = useState<DuplicateAnalysis | null>(null);

    const dataForView = getDataForView(translationResult, selectedLangTab, outputFormat);

    const handleCopy = () => copyDataToClipboard(dataForView);
    const handleDownload = () => {
        const langPart = selectedLangTab === 'ALL' ? 'all' : selectedLangTab?.slice(0, 2);
        const formatPart = outputFormat === 'unity' ? '_unity' : '';
        downloadDataAsJson(dataForView, `translation_${langPart}${formatPart}.json`);
    };

    return (
        <div className="mt-[-1px] rounded-t-none rounded-b-xl border border-gray-700 bg-[#1b1b1b] shadow-lg overflow-hidden">
            {/* Language Selection Toolbar */}
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
                {lastTargetCodes.map(code => (
                    <button
                        key={code}
                        onClick={() => setSelectedLangTab(code)}
                        className={`px-4 py-2 rounded-t-md text-sm font-medium transition-colors whitespace-nowrap ${
                            selectedLangTab === code
                                ? 'bg-[#1b1b1b] text-white'
                                : 'text-gray-400 hover:bg-[#2a2a2a]/50'
                        }`}
                    >
                        {LANGUAGE_OPTIONS.find(l => l.code === code)?.name ?? code}
                    </button>
                ))}
            </div>

            {/* Controls Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 p-4">
                <div className="flex items-center gap-2">
                    {VIEW_TABS.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setSelectedView(tab.key)}
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
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setColorized(v => !v)}
                        className="px-3 py-1.5 rounded-md bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] text-sm"
                        title={colorized ? 'Disable Coloring' : 'Enable Coloring'}
                    >
                        <i
                            className={`fa-solid fa-palette text-base transition-all ${
                                colorized ? 'gradient-text' : 'text-gray-500'
                            }`}
                        />
                    </button>
                    <button
                        onClick={handleCopy}
                        className="px-3 py-1.5 rounded-md bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] text-sm"
                    >
                        <i className="fa-solid fa-copy mr-1" /> Copy
                    </button>
                    <button
                        onClick={handleDownload}
                        className="px-3 py-1.5 rounded-md bg-[#2a2a2a] text-gray-300 hover:bg-[#3a3a3a] text-sm"
                    >
                        <i className="fa-solid fa-download mr-1" /> Download
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="px-4 pb-4 min-h-[400px]">
                {selectedView === 'json' && (
                    <div className="bg-[#111111] p-4 rounded-lg border border-gray-700 overflow-auto">
                        <pre
                            className="font-mono whitespace-pre text-sm leading-relaxed"
                            dangerouslySetInnerHTML={{
                                __html: colorized
                                    ? highlightJson(prettyJson(dataForView))
                                    : prettyJson(dataForView),
                            }}
                        />
                    </div>
                )}
                {selectedView === 'table' && (
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
                                {Object.entries(dataForView).map(([key, value]) => (
                                    <tr key={key} className="group">
                                        <td className="py-1 px-4 border-b border-gray-800 text-orange-400 relative">
                                            <span className="pr-6">{key}</span>
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(key);
                                                    toast.success('Key copied!');
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white"
                                                title="Copy key"
                                            >
                                                <i className="fa-solid fa-copy text-xs" />
                                            </button>
                                        </td>
                                        <td className="py-1 px-4 border-b border-gray-800 text-green-400 relative">
                                            <span className="pr-6">
                                                {typeof value === 'object'
                                                    ? JSON.stringify(value)
                                                    : String(value)}
                                            </span>
                                            <button
                                                onClick={() => {
                                                    const textToCopy =
                                                        typeof value === 'object'
                                                            ? JSON.stringify(value)
                                                            : String(value);
                                                    navigator.clipboard.writeText(textToCopy);
                                                    toast.success('Value copied!');
                                                }}
                                                className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-white"
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
                    <div className="h-full">
                        <RealtimeInputSection
                            inputText={jsonInput}
                            setInputText={setJsonInput}
                            onDuplicatesChange={setRealtimeDuplicates}
                            disabled={isTranslating}
                        />
                        {isTranslating && (
                            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
                                <div className="flex flex-col items-center text-center">
                                    <i className="fa-solid fa-spinner fa-spin text-3xl text-[#8B5CF6]"></i>
                                    <span className="mt-3 text-white font-medium">
                                        Translating...
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};
