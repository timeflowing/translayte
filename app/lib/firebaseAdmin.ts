import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminAuth: ReturnType<typeof getAuth>;
let adminDB: ReturnType<typeof getFirestore>;

function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    console.log('ℹ️ Firebase Admin already initialized');
    adminAuth = getAuth();
    adminDB = getFirestore();
    return;
  }

  try {
    console.log('🔧 Initializing Firebase Admin...');
    
    // Get environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    console.log('🔧 Environment check:', {
      hasProjectId: !!projectId,
      projectId: projectId || 'MISSING',
      hasClientEmail: !!clientEmail,
      clientEmailPrefix: clientEmail ? clientEmail.substring(0, 30) + '...' : 'MISSING',
      hasPrivateKey: !!privateKey,
      privateKeyLength: privateKey?.length || 0,
      nodeEnv: process.env.NODE_ENV,
      platform: process.platform,
    });

    // Validate required environment variables
    if (!projectId) {
      throw new Error('Missing FIREBASE_PROJECT_ID or NEXT_PUBLIC_FIREBASE_PROJECT_ID environment variable');
    }

    if (!clientEmail) {
      throw new Error('Missing FIREBASE_CLIENT_EMAIL environment variable');
    }

    if (!privateKey) {
      throw new Error('Missing FIREBASE_PRIVATE_KEY environment variable');
    }

    // Process the private key
    const processedPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    // Validate private key format
    if (!processedPrivateKey.includes('-----BEGIN PRIVATE KEY-----')) {
      throw new Error('Invalid FIREBASE_PRIVATE_KEY format - must start with -----BEGIN PRIVATE KEY-----');
    }

    // Create service account credentials
    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: processedPrivateKey,
    };

    console.log('🔧 Initializing Firebase Admin with project:', projectId);

    // Initialize Firebase Admin
    const app = initializeApp({
      credential: cert(serviceAccount),
      projectId: projectId, // Explicitly set project ID
    });

    // Initialize services
    adminAuth = getAuth(app);
    adminDB = getFirestore(app);

    console.log('✅ Firebase Admin initialized successfully');
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    
    // Log detailed error info
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
    }
    
    throw error;
  }
}

// Initialize immediately
initializeFirebaseAdmin();

// Export the initialized services
export { adminAuth, adminDB };