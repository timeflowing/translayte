// app/lib/firebaseAdmin.ts
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth }                     from 'firebase-admin/auth';
import { getFirestore }                from 'firebase-admin/firestore';

// pull in **all** the required service-account fields from env
const sa = {
  type:                        'service_account',
  project_id:                  process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  private_key_id:              process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY_ID!,
  private_key:                 process.env.NEXT_PUBLIC_FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
  client_email:                process.env.NEXT_PUBLIC_FIREBASE_CLIENT_EMAIL!,
  client_id:                   process.env.NEXT_PUBLIC_FIREBASE_CLIENT_ID!,
  auth_uri:                    'https://accounts.google.com/o/oauth2/auth',
  token_uri:                   'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url:        process.env.NEXT_PUBLIC_FIREBASE_CLIENT_CERT_URL!,
};

if (!getApps().length) {
  initializeApp({
    credential: cert(sa),
    // databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,  // if you need RTDB
  });
}

export const adminAuth = getAuth();
export const adminDB   = getFirestore();