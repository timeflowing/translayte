import { NextRequest } from 'next/server';
import { randomBytes } from 'crypto';

interface Params {
  projectId: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> } // Changed: params is now a Promise
) {
  try {
    // Await the params
    const { projectId } = await params;
    
    const { adminAuth, adminDB } = await import('../../../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { permissions, expiresInHours, inviteEmails } = await req.json();
    
    // Check if user has permission to share this project
    const projectDoc = await adminDB.collection('projects').doc(projectId).get();
    
    if (!projectDoc.exists) {
      return new Response(JSON.stringify({ error: 'Project not found' }), { status: 404 });
    }
    
    const projectData = projectDoc.data()!;
    
    if (projectData.ownerId !== decoded.uid) {
      // Check if user is admin collaborator
      const collaboratorDoc = await adminDB
        .collection('project_collaborators')
        .where('projectId', '==', projectId)
        .where('userId', '==', decoded.uid)
        .where('role', 'in', ['admin', 'owner'])
        .get();
      
      if (collaboratorDoc.empty) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
      }
    }
    
    const results = [];
    
    // Create shareable link
    if (!inviteEmails || inviteEmails.length === 0) {
      const shareToken = randomBytes(32).toString('hex');
      const expiresAt = expiresInHours 
        ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000).toISOString()
        : undefined;
      
      const shareData = {
        projectId,
        shareToken,
        permissions: permissions || 'view',
        expiresAt,
        createdBy: decoded.uid,
        createdAt: new Date().toISOString(),
        isActive: true
      };
      
      const shareRef = await adminDB.collection('project_shares').add(shareData);
      
      results.push({
        type: 'link',
        shareId: shareRef.id,
        shareToken,
        url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/share/${shareToken}`,
        expiresAt
      });
    }
    
    // Send email invitations
    if (inviteEmails && inviteEmails.length > 0) {
      for (const email of inviteEmails) {
        const collaboratorData = {
          projectId,
          userId: '', // Will be filled when user accepts
          email,
          role: permissions === 'edit' ? 'editor' : 'viewer',
          invitedBy: decoded.uid,
          invitedAt: new Date().toISOString(),
          status: 'pending'
        };
        
        const collaboratorRef = await adminDB.collection('project_collaborators').add(collaboratorData);
        
        // TODO: Send email invitation
        
        results.push({
          type: 'invitation',
          email,
          invitationId: collaboratorRef.id
        });
      }
    }
    
    return new Response(JSON.stringify({ results }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error sharing project:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

// If you have other methods (GET, PUT, DELETE) in this file, fix them too:
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { projectId } = await params;
    
    // Your GET logic here
    return new Response(
      JSON.stringify({ projectId }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}