'use client';

import { useState } from 'react';
import { DuplicateAnalysis } from '../utils/duplicateDetection';

interface LiveDuplicateVisualizationProps {
    analysis: DuplicateAnalysis | null;
    isVisible: boolean;
}

export default function LiveDuplicateVisualization({
    analysis,
    isVisible,
}: LiveDuplicateVisualizationProps) {
    const [expandedGroups, setExpandedGroups] = useState<Set<number>>(new Set());

    if (!isVisible || !analysis?.hasDuplicates) return null;

    const toggleGroup = (index: number) => {
        const newExpanded = new Set(expandedGroups);
        if (newExpanded.has(index)) {
            newExpanded.delete(index);
        } else {
            newExpanded.add(index);
        }
        setExpandedGroups(newExpanded);
    };

    return (
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 mt-3">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-amber-800 flex items-center gap-2">
                    <i className="fa-solid fa-eye" />
                    Live Duplicate Analysis
                </h4>
                <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    {analysis.duplicateGroups.length} groups • {analysis.totalDuplicates} duplicates
                </div>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
                {analysis.duplicateGroups.map((group, index) => (
                    <div key={index} className="bg-white rounded border border-amber-200">
                        <button
                            onClick={() => toggleGroup(index)}
                            className="w-full p-3 text-left hover:bg-amber-50 transition-colors"
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 truncate">
                                        &quot;{group.originalText}&quot;
                                    </div>
                                    <div className="text-xs text-gray-500 mt-1">
                                        {group.count} occurrences:{' '}
                                        {group.keys.slice(0, 2).join(', ')}
                                        {group.keys.length > 2 &&
                                            `, +${group.keys.length - 2} more`}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 ml-2">
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                                        -{group.count - 1} calls
                                    </span>
                                    <i
                                        className={`fa-solid fa-chevron-${
                                            expandedGroups.has(index) ? 'up' : 'down'
                                        } text-amber-600`}
                                    />
                                </div>
                            </div>
                        </button>

                        {expandedGroups.has(index) && (
                            <div className="border-t border-amber-200 p-3 bg-amber-25">
                                <div className="text-sm">
                                    <div className="font-medium text-gray-700 mb-2">
                                        All occurrences:
                                    </div>
                                    <div className="space-y-1">
                                        {group.keys.map((key, keyIndex) => (
                                            <div
                                                key={keyIndex}
                                                className="flex items-center gap-2 text-xs"
                                            >
                                                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                    {key}
                                                </span>
                                                {keyIndex === 0 && (
                                                    <span className="text-green-600 bg-green-100 px-1 py-0.5 rounded text-xs">
                                                        Keep
                                                    </span>
                                                )}
                                                {keyIndex > 0 && (
                                                    <span className="text-red-600 bg-red-100 px-1 py-0.5 rounded text-xs">
                                                        Merge
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-2 text-xs text-gray-600">
                                        → Suggested unified key:{' '}
                                        <span className="font-mono font-medium">
                                            {group.suggestions.unifiedKey}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}
