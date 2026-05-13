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

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const isPlaceholderValue = (value) => /^your_.*_here$/i.test(value);
const hasValidFirebaseConfig = requiredConfigKeys.every((key) => {
  const value = firebaseConfig[key];
  return typeof value === 'string' && value.trim() !== '' && !isPlaceholderValue(value.trim());
});

let auth = null;
if (hasValidFirebaseConfig) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
  } catch (e) {
    console.error('Firebase initialization error:', e);
  }
} else {
  console.warn('Firebase is disabled: missing or placeholder Firebase environment variables.');
}
export { auth };
