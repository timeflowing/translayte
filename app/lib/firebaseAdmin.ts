import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

console.log('🔧 Initializing Firebase Admin...');

// More robust private key handling
const privateKey = process.env.FIREBASE_PRIVATE_KEY;
console.log('🔑 Private key exists:', !!privateKey);
console.log('🔑 Private key length:', privateKey?.length || 0);

if (!privateKey) {
  throw new Error('FIREBASE_PRIVATE_KEY environment variable is not set');
}

const sa: ServiceAccount = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: privateKey.replace(/\\n/g, '\n'),
};

console.log('📋 Service Account Config:', {
  projectId: sa.projectId,
  clientEmail: sa.clientEmail,
  privateKeyLength: sa.privateKey?.length || 0,
  privateKeyStarts: sa.privateKey?.substring(0, 30) + '...',
});

// Validate all required fields before initialization
if (!sa.projectId || !sa.clientEmail || !sa.privateKey) {
  throw new Error('Missing required Firebase Admin SDK credentials');
}

console.log('🚀 Attempting to initialize Firebase Admin...');

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(sa),
    });
    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    throw error;
  }
} else {
  console.log('ℹ️  Firebase Admin already initialized');
}

export const adminAuth = getAuth();
export const adminDB = getFirestore();

console.log('🔧 Firebase Admin setup complete');