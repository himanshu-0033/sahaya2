import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
// Env vars can't carry real newlines, so the service-account key is pasted
// with literal \n sequences and unescaped here.
const PRIVATE_KEY = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n');

let app = null;

function firebaseApp() {
  if (app) return app;
  if (!PROJECT_ID || !CLIENT_EMAIL || !PRIVATE_KEY) {
    throw new Error('Phone sign-in is not configured on the server (missing FIREBASE_* env vars)');
  }
  // Serverless functions reuse warm instances, so initializing twice throws.
  app =
    getApps()[0] ||
    initializeApp({
      credential: cert({ projectId: PROJECT_ID, clientEmail: CLIENT_EMAIL, privateKey: PRIVATE_KEY }),
    });
  return app;
}

// Firebase does the SMS and the code check; all we trust is the signed ID
// token it hands back, which carries the number it actually verified.
export async function verifyFirebasePhoneToken(idToken) {
  const decoded = await getAuth(firebaseApp()).verifyIdToken(idToken);
  if (!decoded.phone_number) {
    return null;
  }
  return { uid: decoded.uid, phone: decoded.phone_number };
}
