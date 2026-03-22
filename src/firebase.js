import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
};

const requiredKeys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];
const missingKeys = requiredKeys.filter((key) => !firebaseConfig[key]);

let auth = null;
if (missingKeys.length > 0) {
  console.error(
    `Firebase configuration is incomplete. Missing environment variable(s): ${missingKeys
      .map((k) => `REACT_APP_FIREBASE_${k.replace(/([A-Z])/g, '_$1').toUpperCase()}`)
      .join(', ')}. ` +
    'Copy .env.example to .env.local and fill in your Firebase project credentials.'
  );
} else {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (e) {
    console.error('Firebase initialization error:', e);
  }
}
export { auth };
