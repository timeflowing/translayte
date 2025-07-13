import { useEffect, useState } from 'react';
import { doc, onSnapshot, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../lib/firebaseClient';
import { Project, EditLock, SavedVersion } from '../types/collaboration';

export function useRealtimeProject(projectId: string) {
  const [project, setProject] = useState<Project | null>(null);
  const [editLocks, ] = useState<EditLock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const projectRef = doc(db, 'projects', projectId);

    // Listen to project changes
    const unsubscribeProject = onSnapshot(projectRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data() as Project;
        // Ensure translations object exists
        if (!data.translations) {
          data.translations = {};
        }
        setProject({ ...data, id: doc.id });
      } else {
        setError('Project not found');
      }
      setLoading(false);
    }, (error) => {
      console.error('Error loading project:', error);
      setError('Failed to load project');
      setLoading(false);
    });

    return () => {
      unsubscribeProject();
    };
  }, [projectId]);

  const updateTranslation = async (key: string, language: string, value: string) => {
    if (!project) return;

    try {
      const projectRef = doc(db, 'projects', projectId);
      
      // Ensure the structure exists before updating
      const updatePath = `translations.${key}.${language}`;
      
      await updateDoc(projectRef, {
        [updatePath]: value,
        updatedAt: new Date().toISOString()
      });
      
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to update translation:', error);
      throw error;
    }
  };

  const saveVersion = async (name: string, description?: string, isPublished: boolean = false) => {
    if (!project) return;

    try {
      const projectRef = doc(db, 'projects', projectId);
      const version: SavedVersion = {
        id: Date.now().toString(),
        name,
        description,
        createdAt: new Date().toISOString(),
        createdBy: 'current-user-id', // Replace with actual user ID
        translations: project.translations || {},
        isPublished
      };

      await updateDoc(projectRef, {
        savedVersions: arrayUnion(version),
        updatedAt: new Date().toISOString()
      });

      setHasUnsavedChanges(false);
      return version;
    } catch (error) {
      console.error('Failed to save version:', error);
      throw error;
    }
  };

  const restoreVersion = async (versionId: string) => {
    if (!project) return;

    const version = project.savedVersions?.find(v => v.id === versionId);
    if (!version) throw new Error('Version not found');

    try {
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        translations: version.translations || {},
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Failed to restore version:', error);
      throw error;
    }
  };

  return {
    project,
    editLocks,
    loading,
    error,
    hasUnsavedChanges,
    updateTranslation,
    saveVersion,
    restoreVersion
  };
}