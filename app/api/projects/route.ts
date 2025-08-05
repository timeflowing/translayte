import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDB } from '@/app/lib/firebaseAdmin';

// GET /api/projects
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

// POST /api/projects
export async function POST(req: NextRequest) {
    console.log('🔄 Create Project API called');
    
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }
        const idToken = authHeader.replace('Bearer ', '');
        const decodedToken = await adminAuth.verifyIdToken(idToken);
        const userId = decodedToken.uid;

        const { name, translation, orgId } = await req.json();

        const docRef = await adminDB.collection('projects').add({
            owner: userId,
            orgId,
            name,
            translation,
            sharedWith: [],
            permissions: {},
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        });

        return NextResponse.json({ id: docRef.id });
    } catch {
        return NextResponse.json({ error: 'Failed to create project' }, { status: 500 });
    }
}