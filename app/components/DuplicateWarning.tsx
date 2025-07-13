'use client';

import { useState } from 'react';
import { DuplicateAnalysis, applyDuplicateUnification } from '../utils/duplicateDetection';

interface DuplicateWarningProps {
    analysis: DuplicateAnalysis;
    onUnify: (unifiedTranslations: Record<string, string>) => void;
    onDismiss: () => void;
    originalTranslations: Record<string, string>;
}

export default function DuplicateWarning({
    analysis,
    onUnify,
    onDismiss,
    originalTranslations,
}: DuplicateWarningProps) {
    const [selectedGroups, setSelectedGroups] = useState<Set<number>>(new Set());
    const [showDetails, setShowDetails] = useState(false);

    if (!analysis.hasDuplicates) return null;

    const handleGroupToggle = (groupIndex: number) => {
        const newSelected = new Set(selectedGroups);
        if (newSelected.has(groupIndex)) {
            newSelected.delete(groupIndex);
        } else {
            newSelected.add(groupIndex);
        }
        setSelectedGroups(newSelected);
    };

    const handleUnifySelected = () => {
        const unificationPlan: Record<string, string> = {};

        selectedGroups.forEach(groupIndex => {
            const group = analysis.duplicateGroups[groupIndex];
            const unifiedKey = group.suggestions.unifiedKey;

            group.keys.forEach((key, index) => {
                if (index > 0) {
                    unificationPlan[key] = unifiedKey;
                } else if (key !== unifiedKey) {
                    unificationPlan[key] = unifiedKey;
                }
            });
        });

        const unifiedTranslations = applyDuplicateUnification(
            originalTranslations,
            unificationPlan,
        );
        onUnify(unifiedTranslations);
    };

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                    <i className="fa-solid fa-exclamation-triangle text-amber-600" />
                    <div>
                        <h3 className="font-semibold text-amber-800">
                            Duplicate Translations Detected
                        </h3>
                        <p className="text-sm text-amber-700">
                            Found {analysis.duplicateGroups.length} groups with duplicate content.
                            You could save ~{analysis.potentialSavings} API calls by unifying them.
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="text-amber-600 hover:text-amber-800 text-sm font-medium"
                    >
                        {showDetails ? 'Hide' : 'Show'} Details
                    </button>
                    <button onClick={onDismiss} className="text-amber-500 hover:text-amber-700">
                        <i className="fa-solid fa-times" />
                    </button>
                </div>
            </div>

            {showDetails && (
                <div className="mt-4 space-y-4">
                    <div className="text-sm text-amber-700 mb-3">Select groups to unify:</div>

                    {analysis.duplicateGroups.map((group, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg border border-amber-200 p-3"
                        >
                            <div className="flex items-start gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedGroups.has(index)}
                                    onChange={() => handleGroupToggle(index)}
                                    className="mt-1"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-gray-900 mb-2">
                                        "{group.originalText}"
                                    </div>
                                    <div className="text-sm text-gray-600 mb-2">
                                        Found in {group.count} keys: {group.keys.join(', ')}
                                    </div>
                                </div>
                                <div className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded">
                                    -{group.count - 1} calls
                                </div>
                            </div>
                        </div>
                    ))}

                    {selectedGroups.size > 0 && (
                        <div className="flex gap-2 pt-3 border-t border-amber-200">
                            <button
                                onClick={handleUnifySelected}
                                className="bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700 text-sm font-medium"
                            >
                                Unify {selectedGroups.size} Group
                                {selectedGroups.size !== 1 ? 's' : ''}
                            </button>
                            <button
                                onClick={() => setSelectedGroups(new Set())}
                                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300 text-sm"
                            >
                                Clear Selection
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
