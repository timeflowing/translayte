import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🔧 Initializing Firebase Admin...');

// Initialize Firebase Admin
if (!getApps().length) {
  try {
    // Parse the private key properly for production
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    // Use NEXT_PUBLIC_FIREBASE_PROJECT_ID as fallback
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

    console.log('🔧 Environment check:', {
      hasPrivateKey: !!privateKey,
      hasClientEmail: !!process.env.FIREBASE_CLIENT_EMAIL,
      hasProjectId: !!projectId,
      projectId: projectId,
      privateKeyLength: privateKey?.length,
    });

    if (!privateKey || !process.env.FIREBASE_CLIENT_EMAIL || !projectId) {
      console.error('❌ Missing required Firebase Admin environment variables');
      throw new Error('Missing required Firebase Admin environment variables');
    }

    initializeApp({
      credential: cert({
        projectId: projectId,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: privateKey,
      }),
    });

    console.log('✅ Firebase Admin initialized successfully with project:', projectId);
  } catch (error) {
    console.error('❌ Firebase Admin initialization error:', error);
    throw error;
  }
} else {
  console.log('ℹ️  Firebase Admin already initialized');
}

export const adminAuth = getAuth();
export const adminDB = getFirestore();

console.log('🔧 Firebase Admin setup complete');