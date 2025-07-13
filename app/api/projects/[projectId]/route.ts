import { NextRequest } from 'next/server';

interface Params {
  projectId: string;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> } // Changed: params is now a Promise
) {
  try {
    // Await the params
    const { projectId } = await params;
    
    const { adminAuth, adminDB } = await import('../../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const projectDoc = await adminDB.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 });
    }
    
    const projectData = projectDoc.data()!;
    
    // Check permissions
    const hasAccess = projectData.ownerId === decoded.uid || 
      projectData.isPublic ||
      // Check if user is collaborator
      await adminDB
        .collection('project_collaborators')
        .where('projectId', '==', projectId)
        .where('userId', '==', decoded.uid)
        .where('status', '==', 'accepted')
        .get()
        .then(snap => !snap.empty);
    
    if (!hasAccess) {
      return new Response(JSON.stringify({ error: 'Access denied' }), { status: 403 });
    }
    
    // Ensure translations structure exists
    if (!projectData.translations) {
      projectData.translations = {};
    }
    
    return new Response(JSON.stringify({
      id: projectDoc.id,
      ...projectData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching project:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { projectId } = await params;
    const body = await req.json();
    
    // Your PUT logic here
    console.log('Updating project:', projectId, body);
    
    return new Response(
      JSON.stringify({ 
        message: 'Updated',
        projectId 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in PUT /api/projects/[projectId]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { projectId } = await params;
    
    // Your DELETE logic here
    console.log('Deleting project:', projectId);
    
    return new Response(
      JSON.stringify({ 
        message: 'Deleted',
        projectId 
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Error in DELETE /api/projects/[projectId]:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}