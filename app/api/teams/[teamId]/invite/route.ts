import { NextRequest } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { teamId: string } }) {
  try {
    const { adminAuth, adminDB } = await import('../../../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    const { emails, role = 'member' } = await req.json();
    
    if (!Array.isArray(emails) || emails.length === 0) {
      return new Response(JSON.stringify({ error: 'Email addresses are required' }), { status: 400 });
    }
    
    // Check if user has permission to invite
    const teamDoc = await adminDB.collection('teams').doc(params.teamId).get();
    if (!teamDoc.exists) {
      return new Response(JSON.stringify({ error: 'Team not found' }), { status: 404 });
    }
    
    const membershipDoc = await adminDB
      .collection('team_members')
      .where('teamId', '==', params.teamId)
      .where('userId', '==', decoded.uid)
      .where('role', 'in', ['owner', 'admin'])
      .get();
    
    if (membershipDoc.empty) {
      return new Response(JSON.stringify({ error: 'Insufficient permissions' }), { status: 403 });
    }
    
    // Check team member limits
    const teamData = teamDoc.data()!;
    const currentMembersSnapshot = await adminDB
      .collection('team_members')
      .where('teamId', '==', params.teamId)
      .where('status', '==', 'accepted')
      .get();
    
    if (teamData.settings.maxMembers !== -1 && 
        currentMembersSnapshot.size + emails.length > teamData.settings.maxMembers) {
      return new Response(JSON.stringify({ 
        error: `Team member limit exceeded. Current plan allows ${teamData.settings.maxMembers} members.` 
      }), { status: 400 });
    }
    
    const invitations = [];
    
    for (const email of emails) {
      // Check if user is already a member
      const existingMember = await adminDB
        .collection('team_members')
        .where('teamId', '==', params.teamId)
        .where('email', '==', email)
        .get();
      
      if (!existingMember.empty) {
        continue; // Skip if already invited/member
      }
      
      const invitationData = {
        teamId: params.teamId,
        userId: '', // Will be filled when user accepts
        email,
        role,
        invitedBy: decoded.uid,
        invitedAt: new Date().toISOString(),
        status: 'pending'
      };
      
      const invitationRef = await adminDB.collection('team_members').add(invitationData);
      
      // TODO: Send email invitation
      
      invitations.push({
        id: invitationRef.id,
        email,
        role
      });
    }
    
    return new Response(JSON.stringify({ invitations }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error inviting team members:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}