import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const { adminAuth, adminDB } = await import('../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    
    // Get user's own projects
    const ownedProjectsSnapshot = await adminDB
      .collection('projects')
      .where('ownerId', '==', decoded.uid)
      .get();
    
    // Get projects where user is a collaborator
    const collaboratorSnapshot = await adminDB
      .collection('project_collaborators')
      .where('userId', '==', decoded.uid)
      .where('status', '==', 'accepted')
      .get();
    
    const collaboratorProjectIds = collaboratorSnapshot.docs.map(doc => doc.data().projectId);
    
    let sharedProjects: unknown[] = [];
    if (collaboratorProjectIds.length > 0) {
      const sharedProjectsSnapshot = await adminDB
        .collection('projects')
        .where('__name__', 'in', collaboratorProjectIds)
        .get();
      
      sharedProjects = sharedProjectsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    const ownedProjects = ownedProjectsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return new Response(JSON.stringify({
      owned: ownedProjects,
      shared: sharedProjects
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching projects:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { adminAuth, adminDB } = await import('../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { name, description, sourceLanguage, targetLanguages, initialTranslations } = await req.json();
    
    const projectData = {
      name,
      description: description || '',
      ownerId: decoded.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      sourceLanguage,
      targetLanguages,
      translations: initialTranslations || {}
    };
    
    const projectRef = await adminDB.collection('projects').add(projectData);
    
    return new Response(JSON.stringify({
      id: projectRef.id,
      ...projectData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error creating project:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}