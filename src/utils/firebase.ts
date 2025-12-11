// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

// Validate minimal required config values before initializing Firebase.
const hasFirebaseConfig =
  typeof firebaseConfig.apiKey === "string" && firebaseConfig.apiKey?.length > 0 &&
  typeof firebaseConfig.projectId === "string" && firebaseConfig.projectId?.length > 0 &&
  typeof firebaseConfig.appId === "string" && firebaseConfig.appId?.length > 0;

let app: any = null;
let _auth: any = null;
let _db: any = null;

if (hasFirebaseConfig) {
  try {
    app = initializeApp(firebaseConfig as any);
    _auth = getAuth(app);
    _db = getFirestore(app);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Firebase initialization error:", err);
  }
} else {
  // eslint-disable-next-line no-console
  console.warn(
    "Firebase config incomplete — skipping initialization. Set REACT_APP_FIREBASE_* env vars to enable Firebase."
  );
}

export const auth = _auth;
export const db = _db;

export default app;
