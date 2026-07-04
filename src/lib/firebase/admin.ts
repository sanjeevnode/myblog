import "server-only";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const serviceAccount = JSON.parse(
  process.env.FIREBASE_SERVICE_ACCOUNT_JSON ?? "{}"
);

const adminApp =
  getApps()[0] ?? initializeApp({ credential: cert(serviceAccount) });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
