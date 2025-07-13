'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

import { useRealtimeProject } from '../../hooks/useRealtimeProject';
import VersionHistory from '../../components/VersionHistory';

export default function ProjectPage() {
    const params = useParams();
    const projectId = params.id as string;

    const {
        project,
        loading,
        error,
        hasUnsavedChanges,
        updateTranslation,
        saveVersion,
        restoreVersion,
    } = useRealtimeProject(projectId);

    const [selectedLang, setSelectedLang] = useState<string>('');
    const [editingKey, setEditingKey] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');

    // Set default selected language when project loads
    useEffect(() => {
        if (project && project.targetLanguages.length > 0 && !selectedLang) {
            setSelectedLang(project.targetLanguages[0]);
        }
    }, [project, selectedLang]);

    const handleEditStart = (key: string, currentValue: string) => {
        setEditingKey(key);
        setEditValue(currentValue || '');
    };

    const handleEditSave = async () => {
        if (!editingKey || !selectedLang || !project) return;

        try {
            await updateTranslation(editingKey, selectedLang, editValue);
            setEditingKey(null);
            setEditValue('');
        } catch (error) {
            console.error('Failed to update translation:', error);
            alert('Failed to save translation');
        }
    };

    const handleEditCancel = () => {
        setEditingKey(null);
        setEditValue('');
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (error || !project) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600 mb-4">
                        {error || 'Project not found'}
                    </h1>
                    <button
                        onClick={() => window.history.back()}
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        Go Back
                    </button>
                </div>
            </div>
        );
    }

    // Safely get translations for selected language
    const currentTranslations = project.translations || {};
    const translationKeys = Object.keys(currentTranslations);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 mb-2">
                                {project.name}
                            </h1>
                            {project.description && (
                                <p className="text-gray-600">{project.description}</p>
                            )}
                            <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                                <span>Source: {project.sourceLanguage}</span>
                                <span>•</span>
                                <span>Keys: {translationKeys.length}</span>
                                <span>•</span>
                                <span>
                                    Updated: {new Date(project.updatedAt).toLocaleDateString()}
                                </span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {hasUnsavedChanges && (
                                <span className="text-amber-600 text-sm font-medium">
                                    • Unsaved changes
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Translation Editor */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-lg shadow-sm border">
                            {/* Language Selector */}
                            <div className="border-b p-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Translations
                                    </h2>
                                    <select
                                        value={selectedLang}
                                        onChange={e => setSelectedLang(e.target.value)}
                                        className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {project.targetLanguages.map(lang => (
                                            <option key={lang} value={lang}>
                                                {lang}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Translation List */}
                            <div className="p-4">
                                {translationKeys.length === 0 ? (
                                    <p className="text-gray-500 text-center py-8">
                                        No translations found
                                    </p>
                                ) : (
                                    <div className="space-y-4">
                                        {translationKeys.map(key => {
                                            const isEditing = editingKey === key;
                                            const translationValue =
                                                currentTranslations[key]?.[selectedLang] || '';

                                            return (
                                                <div
                                                    key={key}
                                                    className="border rounded-lg p-4 hover:bg-gray-50"
                                                >
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <div className="font-mono text-sm text-gray-600 mb-2">
                                                                {key}
                                                            </div>
                                                            {isEditing ? (
                                                                <div className="space-y-2">
                                                                    <textarea
                                                                        value={editValue}
                                                                        onChange={e =>
                                                                            setEditValue(
                                                                                e.target.value,
                                                                            )
                                                                        }
                                                                        className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                        rows={3}
                                                                        autoFocus
                                                                    />
                                                                    <div className="flex gap-2">
                                                                        <button
                                                                            onClick={handleEditSave}
                                                                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
                                                                        >
                                                                            Save
                                                                        </button>
                                                                        <button
                                                                            onClick={
                                                                                handleEditCancel
                                                                            }
                                                                            className="bg-gray-300 text-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-400"
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            ) : (
                                                                <div
                                                                    className="text-gray-900 cursor-pointer hover:bg-blue-50 p-2 rounded"
                                                                    onClick={() =>
                                                                        handleEditStart(
                                                                            key,
                                                                            translationValue,
                                                                        )
                                                                    }
                                                                >
                                                                    {translationValue || (
                                                                        <span className="text-gray-400 italic">
                                                                            Click to add translation
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Version History Sidebar */}
                    <div className="lg:col-span-1">
                        <VersionHistory
                            versions={project.savedVersions || []}
                            onRestore={restoreVersion}
                            onSave={saveVersion}
                            hasUnsavedChanges={hasUnsavedChanges}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
