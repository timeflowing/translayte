'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

interface SaveTranslationModalProps {
    isOpen: boolean;
    onClose: () => void;
    translations: unknown;
    sourceLanguage: string;
    targetLanguages: string[];
    onSaveSuccess: (projectId: string) => void;
}

interface Team {
    id: string;
    name: string;
    role: string;
}

export default function SaveTranslationModal({
    isOpen,
    onClose,
    translations,
    sourceLanguage,
    targetLanguages,
    onSaveSuccess,
}: SaveTranslationModalProps) {
    const [projectName, setProjectName] = useState('');
    const [description, setDescription] = useState('');
    const [selectedTeamId, setSelectedTeamId] = useState<string>('');
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen && user) {
            loadTeams();
        }
    }, [isOpen, user]);

    const loadTeams = async () => {
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/teams', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setTeams(data.teams || []);
            }
        } catch (err) {
            console.error('Failed to load teams:', err);
        }
    };

    const handleSave = async () => {
        if (!user || !projectName.trim()) {
            setError('Project name is required');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/translations/save', {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    projectName: projectName.trim(),
                    description: description.trim(),
                    translations,
                    sourceLanguage,
                    targetLanguages,
                    teamId: selectedTeamId || null,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to save project');
            }

            const result = await response.json();
            onSaveSuccess(result.projectId);
            handleClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save project');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setProjectName('');
        setDescription('');
        setSelectedTeamId('');
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                        Save Translation Project
                    </h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">
                        ×
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Project Name *
                        </label>
                        <input
                            type="text"
                            value={projectName}
                            onChange={e => setProjectName(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="My Translation Project"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            placeholder="Describe your translation project..."
                        />
                    </div>

                    {teams.length > 0 && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Save to Team (Optional)
                            </label>
                            <select
                                value={selectedTeamId}
                                onChange={e => setSelectedTeamId(e.target.value)}
                                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Personal Project</option>
                                {teams.map(team => (
                                    <option key={team.id} value={team.id}>
                                        {team.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    <div className="bg-gray-50 rounded-md p-3">
                        <h4 className="font-medium text-gray-900 mb-2">Project Summary</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>
                                Source: <span className="font-medium">{sourceLanguage}</span>
                            </p>
                            <p>
                                Targets:{' '}
                                <span className="font-medium">{targetLanguages.join(', ')}</span>
                            </p>
                            <p>
                                Keys:{' '}
                                <span className="font-medium">
                                    {Object.keys(translations || {}).length}
                                </span>
                            </p>
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">{error}</div>
                    )}
                </div>

                <div className="flex gap-3 mt-6">
                    <button
                        onClick={handleClose}
                        className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300"
                        disabled={loading}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !projectName.trim()}
                        className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Saving...' : 'Save Project'}
                    </button>
                </div>
            </div>
        </div>
    );
}
