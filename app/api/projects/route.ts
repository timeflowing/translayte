import { NextRequest } from 'next/server';

export async function GET(req: NextRequest) {
  console.log('🔄 Projects API called');
  
  try {
    // Import Firebase Admin
    console.log('📥 Importing Firebase Admin...');
    const { adminAuth, adminDB } = await import('../../lib/firebaseAdmin');
    console.log('✅ Firebase Admin imported successfully');
    
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    console.log('🔑 Auth header check:', authHeader ? 'Present' : 'Missing');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('❌ Missing or malformed authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const idToken = authHeader.replace('Bearer ', '');
    console.log('🎫 Token extracted, length:', idToken.length);
    
    // Verify the token
    let decoded;
    try {
      console.log('🔍 Verifying token...');
      decoded = await adminAuth.verifyIdToken(idToken);
      console.log('✅ Token verified for user:', decoded.uid);
    } catch (tokenError: unknown) {
      console.error('❌ Token verification failed:', tokenError);
      return new Response(
        JSON.stringify({ 
          error: 'Invalid authorization token',
          details: typeof tokenError === 'object' && tokenError !== null && 'message' in tokenError ? (tokenError as { message?: string }).message : 'Token verification failed'
        }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Get user's owned projects
    console.log('📁 Fetching owned projects...');
    const ownedProjectsQuery = await adminDB
      .collection('projects')
      .where('ownerId', '==', decoded.uid)
      .orderBy('updatedAt', 'desc')
      .get();
    
    const ownedProjects = ownedProjectsQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Get projects shared with user
    console.log('🤝 Fetching shared projects...');
    const sharedProjectsQuery = await adminDB
      .collection('project_members')
      .where('userId', '==', decoded.uid)
      .get();
    
    const sharedProjectIds = sharedProjectsQuery.docs.map(doc => doc.data().projectId);
    
    let sharedProjects: unknown[] = [];
    if (sharedProjectIds.length > 0) {
      // Get the actual project data for shared projects
      const sharedProjectsData = await Promise.all(
        sharedProjectIds.map(async (projectId) => {
          const projectDoc = await adminDB.collection('projects').doc(projectId).get();
          if (projectDoc.exists) {
            return {
              id: projectDoc.id,
              ...projectDoc.data()
            };
          }
          return null;
        })
      );
      
      sharedProjects = sharedProjectsData.filter(project => project !== null);
    }
    
    console.log('📊 Projects loaded:', {
      owned: ownedProjects.length,
      shared: sharedProjects.length
    });
    
    return new Response(JSON.stringify({
      owned: ownedProjects,
      shared: sharedProjects
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    console.error('💥 Unexpected API error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : String(error),
        stack: process.env.NODE_ENV === 'development' && typeof error === 'object' && error !== null && 'stack' in error ? (error as Error).stack : undefined
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function POST(req: NextRequest) {
  console.log('🔄 Create Project API called');
  
  try {
    // Import Firebase Admin
    const { adminAuth, adminDB } = await import('../../lib/firebaseAdmin');
    
    // Get authorization header
    const authHeader = req.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization token' }), 
        { 
          status: 401,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    const idToken = authHeader.replace('Bearer ', '');
    
    // Verify the token
    const decoded = await adminAuth.verifyIdToken(idToken);
    
    // Get request body
    const { name, description, sourceLanguage, targetLanguages } = await req.json();
    
    if (!name || !sourceLanguage || !targetLanguages || targetLanguages.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }), 
        { 
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Create new project
    const projectData = {
      name,
      description: description || '',
      sourceLanguage,
      targetLanguages,
      ownerId: decoded.uid,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      translations: {},
      settings: {
        allowSharing: true,
        requireApproval: false
      }
    };
    
    const projectRef = await adminDB.collection('projects').add(projectData);
    
    console.log('✅ Project created:', projectRef.id);
    
    return new Response(JSON.stringify({
      id: projectRef.id,
      ...projectData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    console.error('💥 Create project error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: typeof error === 'object' && error !== null && 'message' in error ? (error as { message?: string }).message : String(error)
      }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}