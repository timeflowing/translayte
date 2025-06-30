import { initializeApp, cert, getApps, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

const sa: ServiceAccount = {
  projectId:    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  clientEmail:  process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL!,
  privateKey:   process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY!,
};

if (!getApps().length) {
  initializeApp({
    credential: cert(sa),
    // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,  // if using RTDB
  });
}

export const adminAuth = getAuth();
export const adminDB   = getFirestore();