import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { adminAuth, adminDB } = await import('../../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { 
      projectName, 
      translations, 
      sourceLanguage, 
      targetLanguages, 
      description,
      teamId 
    } = await req.json();
    
    // Create new project with translations
    const projectData = {
      name: projectName,
      description: description || '',
      ownerId: decoded.uid,
      teamId: teamId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isPublic: false,
      sourceLanguage,
      targetLanguages,
      translations, // The actual translation data
      savedVersions: [{
        id: '1',
        name: 'Initial Version',
        description: 'First saved version',
        createdAt: new Date().toISOString(),
        createdBy: decoded.uid,
        translations,
        isPublished: true
      }]
    };
    
    const projectRef = await adminDB.collection('projects').add(projectData);
    
    // Update user's project count
    const userRef = adminDB.collection('users').doc(decoded.uid);
    const userDoc = await userRef.get();
    const userData = userDoc.exists ? userDoc.data() : {};
    
    await userRef.set({
      ...userData,
      projectCount: (userData?.projectCount || 0) + 1,
      lastProjectCreated: new Date().toISOString()
    }, { merge: true });
    
    return new Response(JSON.stringify({
      projectId: projectRef.id,
      message: 'Translation project saved successfully',
      ...projectData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error saving translation project:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}