import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const sa: ServiceAccount = {
  projectId:    process.env.FIREBASE_PROJECT_ID!,
  clientEmail:  process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(sa),
    // databaseURL: process.env._FIREBASE_DATABASE_URL,  // if using RTDB
  });
}

export const adminAuth = getAuth();
export const adminDB   = getFirestore();