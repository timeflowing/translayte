

export async function GET() {
  try {
    console.log('🔍 Testing Firebase Admin configuration...');
    
    // Log environment variables (without sensitive data)
    console.log('Environment variables check:', {
      hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
      hasNextPublicFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      hasOpenaiApiKey: !!process.env.OPENAI_API_KEY,
      nodeEnv: process.env.NODE_ENV,
      
      // Show values (first few chars only for security)
      projectIdValue: process.env.FIREBASE_PROJECT_ID?.substring(0, 10) || 'MISSING',
      publicProjectIdValue: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.substring(0, 10) || 'MISSING',
      clientEmailValue: process.env.FIREBASE_CLIENT_EMAIL?.substring(0, 20) || 'MISSING',
      privateKeyStart: process.env.FIREBASE_PRIVATE_KEY?.substring(0, 30) || 'MISSING',
    });

    // Try to import Firebase Admin
    const { adminAuth } = await import('../../lib/firebaseAdmin');
    
    console.log('✅ Firebase Admin imported successfully');
    
    // Try to get a simple admin operation (list first user or something non-sensitive)
    const listUsers = await adminAuth.listUsers(1);
    
    return new Response(JSON.stringify({
      success: true,
      message: 'Firebase Admin is working correctly',
      userCount: listUsers.users.length,
      projectId: process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
    
  } catch (error: unknown) {
    console.error('❌ Firebase Admin test failed:', error);

    let errorMessage = 'Unknown error';
    let errorStack = undefined;
    if (error instanceof Error) {
      errorMessage = error.message;
      errorStack = error.stack;
    }

    return new Response(JSON.stringify({
      success: false,
      error: errorMessage,
      details: errorStack,
      environmentCheck: {
        hasFirebaseProjectId: !!process.env.FIREBASE_PROJECT_ID,
        hasNextPublicFirebaseProjectId: !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        hasFirebaseClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
        hasFirebasePrivateKey: !!process.env.FIREBASE_PRIVATE_KEY,
      }
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}