import { NextRequest } from 'next/server';

interface Params {
  teamId: string;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<Params> } // Changed: params is now a Promise
) {
  try {
    // Await the params
    const { teamId } = await params;
    
    const { adminAuth, adminDB } = await import('../../../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { email, role } = await req.json();
    
    if (!email || !role) {
      return new Response(JSON.stringify({ error: 'Email and role are required' }), { status: 400 });
    }
    
    // Check if user has permission to invite to this team
    const teamDoc = await adminDB.collection('teams').doc(teamId).get();
    
    if (!teamDoc.exists) {
      return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404 });
    }
    
    const teamData = teamDoc.data()!;
    
    // Check if user is team owner or admin
    if (teamData.ownerId !== decoded.uid) {
      const memberDoc = await adminDB
        .collection('team_members')
        .where('teamId', '==', teamId)
        .where('userId', '==', decoded.uid)
        .where('role', 'in', ['admin', 'owner'])
        .get();
      
      if (memberDoc.empty) {
        return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
      }
    }
    
    // Check if user is already a member
    const existingMember = await adminDB
      .collection('team_members')
      .where('teamId', '==', teamId)
      .where('email', '==', email)
      .get();
    
    if (!existingMember.empty) {
      return new Response(JSON.stringify({ error: 'User is already a team member' }), { status: 409 });
    }
    
    // Create invitation
    const invitationData = {
      teamId,
      email,
      role,
      invitedBy: decoded.uid,
      invitedAt: new Date().toISOString(),
      status: 'pending',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
    };
    
    const invitationRef = await adminDB.collection('team_invitations').add(invitationData);
    
    // TODO: Send email invitation
    
    return new Response(JSON.stringify({ 
      message: 'Invitation sent successfully',
      invitationId: invitationRef.id 
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error inviting team member:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { teamId } = await params;
    
    const { adminDB } = await import('../../../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    
    
    // Get all pending invitations for this team
    const invitations = await adminDB
      .collection('team_invitations')
      .where('teamId', '==', teamId)
      .where('status', '==', 'pending')
      .get();
    
    const invitationList = invitations.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return new Response(JSON.stringify({ invitations: invitationList }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching team invitations:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  {  }: { params: Promise<Params> }
) {
  try {
    
    
    const { adminAuth, adminDB } = await import('../../../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const url = new URL(req.url);
    const invitationId = url.searchParams.get('invitationId');
    
    if (!invitationId) {
      return new Response(JSON.stringify({ error: 'Invitation ID is required' }), { status: 400 });
    }
    
    // Cancel invitation
    await adminDB.collection('team_invitations').doc(invitationId).update({
      status: 'cancelled',
      cancelledBy: decoded.uid,
      cancelledAt: new Date().toISOString()
    });
    
    return new Response(JSON.stringify({ message: 'Invitation cancelled' }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error cancelling invitation:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}