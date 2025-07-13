'use client';

import { useState } from 'react';
import { SavedVersion } from '../types/collaboration';

interface VersionHistoryProps {
    versions: SavedVersion[];
    onRestore: (versionId: string) => void;
    onSave: (name: string, description?: string, isPublished?: boolean) => void;
    hasUnsavedChanges: boolean;
}

export default function VersionHistory({
    versions,
    onRestore,
    onSave,
    hasUnsavedChanges,
}: VersionHistoryProps) {
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [saveName, setSaveName] = useState('');
    const [saveDescription, setSaveDescription] = useState('');
    const [isPublished, setIsPublished] = useState(false);

    const handleSave = () => {
        if (!saveName.trim()) return;

        onSave(saveName, saveDescription, isPublished);
        setSaveName('');
        setSaveDescription('');
        setIsPublished(false);
        setShowSaveModal(false);
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Version History</h3>
                <div className="flex items-center gap-2">
                    {hasUnsavedChanges && (
                        <span className="text-sm text-amber-600 font-medium">
                            • Unsaved changes
                        </span>
                    )}
                    <button
                        onClick={() => setShowSaveModal(true)}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 text-sm"
                    >
                        Save Version
                    </button>
                </div>
            </div>

            <div className="space-y-3">
                {versions?.length === 0 ? (
                    <p className="text-gray-500 text-sm">No saved versions yet.</p>
                ) : (
                    versions?.map(version => (
                        <div key={version.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-900">
                                            {version.name}
                                        </h4>
                                        {version.isPublished && (
                                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                                Published
                                            </span>
                                        )}
                                    </div>
                                    {version.description && (
                                        <p className="text-gray-600 text-sm mt-1">
                                            {version.description}
                                        </p>
                                    )}
                                    <p className="text-gray-400 text-xs mt-2">
                                        {new Date(version.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                <button
                                    onClick={() => onRestore(version.id)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    Restore
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Save Version Modal */}
            {showSaveModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-semibold mb-4">Save New Version</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Version Name *
                                </label>
                                <input
                                    type="text"
                                    value={saveName}
                                    onChange={e => setSaveName(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="e.g., v1.0, Beta Release"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    value={saveDescription}
                                    onChange={e => setSaveDescription(e.target.value)}
                                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    rows={3}
                                    placeholder="Describe the changes in this version"
                                />
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isPublished"
                                    checked={isPublished}
                                    onChange={e => setIsPublished(e.target.checked)}
                                    className="mr-2"
                                />
                                <label htmlFor="isPublished" className="text-sm text-gray-700">
                                    Mark as published version
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowSaveModal(false)}
                                className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={!saveName.trim()}
                                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Save Version
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
