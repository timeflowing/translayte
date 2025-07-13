import { initializeApp, getApps, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

let adminAuth: ReturnType<typeof getAuth>;
let adminDB: ReturnType<typeof getFirestore>;

// This function runs only once
function initializeFirebaseAdmin() {
  if (getApps().length > 0) {
    adminAuth = getAuth();
    adminDB = getFirestore();
    return;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error('Missing required Firebase Admin environment variables (ID, Email, or Key).');
    }

    const processedPrivateKey = privateKey.replace(/\\n/g, '\n');

    const serviceAccount: ServiceAccount = {
      projectId,
      clientEmail,
      privateKey: processedPrivateKey,
    };

    const app = initializeApp({
      credential: cert(serviceAccount),
      // Explicitly setting the projectId here is crucial for fixing your error
      projectId: projectId,
    });

    adminAuth = getAuth(app);
    adminDB = getFirestore(app);

  } catch (error) {
    console.error("CRITICAL: Firebase Admin SDK initialization failed.", error);
    // In a real app, you might want to throw this to stop the serverless function from running incorrectly.
    throw new Error("Could not initialize Firebase Admin SDK.");
  }
}

// Initialize on module load
initializeFirebaseAdmin();

export { adminAuth, adminDB };