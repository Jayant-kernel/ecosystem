
import * as firebaseApp from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager
} from 'firebase/firestore';

// Cast to any to avoid TS errors in some environments where firebase/app exports are not correctly detected
const { initializeApp, getApps, getApp } = firebaseApp as any;

// Your web app's Firebase configuration
// Use (import.meta as any).env to avoid TypeScript errors if Vite types aren't strictly loaded.
const firebaseConfig = {
    apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || "AIzaSyAvm8zqNl0FiEPxGrybLzrJCTxKvuQPi7M",
    authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "swasth-setu-39630.firebaseapp.com",
    databaseURL: (import.meta as any).env?.VITE_FIREBASE_DATABASE_URL || "https://swasth-setu-39630-default-rtdb.firebaseio.com",
    projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "swasth-setu-39630",
    storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "swasth-setu-39630.firebasestorage.app",
    messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "544366084422",
    appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || "1:544366084422:web:a36ab4a527776f210be547",
    measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || "G-PKKF93P2BE"
};

// Initialize Firebase singleton.
// Prevents re-initialization errors during hot-reloads in development.
const app = (getApps().length > 0) 
    ? getApp() 
    : initializeApp(firebaseConfig);

// Initialize and export services
export const auth = getAuth(app);

// Initialize Firestore with persistent local cache for offline support
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager()
  })
});

export const googleProvider = new GoogleAuthProvider();
