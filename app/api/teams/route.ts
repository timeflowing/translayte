import { NextRequest } from 'next/server';
import { TEAM_PLANS } from '../../types/collaboration';

export async function GET(req: NextRequest) {
  try {
    const { adminAuth, adminDB } = await import('../../lib/firebaseAdmin');
    
    const authHeader = req.headers.get('authorization') || '';
    const idToken = authHeader.replace(/^Bearer\s+/i, '');
    
    if (!idToken) {
      return new Response(JSON.stringify({ error: 'Missing authorization token' }), { status: 401 });
    }
    
    const decoded = await adminAuth.verifyIdToken(idToken);
    
    // Get teams where user is a member
    const membershipSnapshot = await adminDB
      .collection('team_members')
      .where('userId', '==', decoded.uid)
      .where('status', '==', 'accepted')
      .get();
    
    const teamIds = membershipSnapshot.docs.map(doc => doc.data().teamId);
    
    let teams: any[] = [];
    if (teamIds.length > 0) {
      const teamsSnapshot = await adminDB
        .collection('teams')
        .where('__name__', 'in', teamIds)
        .get();
      
      teams = teamsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    }
    
    return new Response(JSON.stringify({ teams }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error fetching teams:', error);
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
    const { name, description, plan = 'free' } = await req.json();
    
    if (!TEAM_PLANS[plan as keyof typeof TEAM_PLANS]) {
      return new Response(JSON.stringify({ error: 'Invalid plan' }), { status: 400 });
    }
    
    const planConfig = TEAM_PLANS[plan as keyof typeof TEAM_PLANS];
    
    const teamData = {
      name,
      description: description || '',
      ownerId: decoded.uid,
      plan,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      settings: {
        maxMembers: planConfig.maxMembers,
        maxProjects: planConfig.maxProjects,
        features: planConfig.features
      }
    };
    
    const teamRef = await adminDB.collection('teams').add(teamData);
    
    // Add creator as owner
    await adminDB.collection('team_members').add({
      teamId: teamRef.id,
      userId: decoded.uid,
      email: decoded.email,
      role: 'owner',
      invitedBy: decoded.uid,
      invitedAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
      status: 'accepted'
    });
    
    return new Response(JSON.stringify({
      id: teamRef.id,
      ...teamData
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error creating team:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
}