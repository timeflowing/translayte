'use client';

import { useState, useEffect } from 'react';

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';

interface Project {
    id: string;
    name: string;
    description: string;
    sourceLanguage: string;
    targetLanguages: string[];
    createdAt: string;
    updatedAt: string;
}

export default function ProjectsPage() {
    const [projects, setProjects] = useState<{ owned: Project[]; shared: Project[] }>({
        owned: [],
        shared: [],
    });
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    useEffect(() => {
        if (user) {
            loadProjects();
        }
    }, [user]);

    const loadProjects = async () => {
        if (!user) return;

        try {
            const token = await user.getIdToken();
            const response = await fetch('/api/projects', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setProjects(data);
            }
        } catch (error) {
            console.error('Failed to load projects:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-2xl font-bold text-gray-900">Translation Projects</h1>
                    <Link
                        href="/"
                        className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                    >
                        New Translation
                    </Link>
                </div>

                {/* Owned Projects */}
                <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Projects</h2>
                    {projects.owned.length === 0 ? (
                        <div className="bg-white rounded-lg border p-8 text-center">
                            <p className="text-gray-500">
                                No projects yet. Create your first translation project!
                            </p>
                        </div>
                    ) : (
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {projects.owned.map(project => (
                                <ProjectCard key={project.id} project={project} />
                            ))}
                        </div>
                    )}
                </div>

                {/* Shared Projects */}
                {projects.shared.length > 0 && (
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Shared with You
                        </h2>
                        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                            {projects.shared.map(project => (
                                <ProjectCard key={project.id} project={project} isShared />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ProjectCard({ project, isShared = false }: { project: Project; isShared?: boolean }) {
    return (
        <Link href={`/projects/${project.id}`}>
            <div className="bg-white rounded-lg border p-6 hover:shadow-md transition-shadow cursor-pointer">
                <div className="flex items-start justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                    {isShared && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                            Shared
                        </span>
                    )}
                </div>

                {project.description && (
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{project.description}</p>
                )}

                <div className="text-xs text-gray-500 space-y-1">
                    <p>Source: {project.sourceLanguage}</p>
                    <p>Targets: {project.targetLanguages.join(', ')}</p>
                    <p>Updated: {new Date(project.updatedAt).toLocaleDateString()}</p>
                </div>
            </div>
        </Link>
    );
}
