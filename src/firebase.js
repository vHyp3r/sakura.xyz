import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseFallbackConfig = {
  apiKey: 'AIzaSyCBJKtfJHmUnW5kBhY6HrRG8c1aQK8P2ek',
  authDomain: 'sakura-auth-66415.firebaseapp.com',
  projectId: 'sakura-auth-66415',
  storageBucket: 'sakura-auth-66415.firebasestorage.app',
  messagingSenderId: '589825392559',
  appId: '1:589825392559:web:f8b671e0646669f510395a',
};

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || firebaseFallbackConfig.apiKey,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || firebaseFallbackConfig.authDomain,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || firebaseFallbackConfig.projectId,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || firebaseFallbackConfig.storageBucket,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || firebaseFallbackConfig.messagingSenderId,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || firebaseFallbackConfig.appId,
};

const requiredConfigKeys = [
  'apiKey',
  'authDomain',
  'projectId',
  'storageBucket',
  'messagingSenderId',
  'appId',
];

const isPlaceholderValue = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.toLowerCase();
  return /^your_|^<.+>$/.test(normalized);
};
const getInvalidFirebaseConfigKeys = (config) => requiredConfigKeys.filter((key) => {
  const value = config[key];
  if (typeof value !== 'string') return true;
  const trimmedValue = value.trim();
  return trimmedValue === '' || isPlaceholderValue(trimmedValue);
});

let auth = null;
let firebaseAuthStatus = {
  available: false,
  message: 'Authentication service is unavailable.',
};
const invalidFirebaseConfigKeys = getInvalidFirebaseConfigKeys(firebaseConfig);
if (invalidFirebaseConfigKeys.length === 0) {
  try {
    const app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    firebaseAuthStatus = {
      available: true,
      message: '',
    };
  } catch (e) {
    console.error('Firebase initialization error:', e);
    firebaseAuthStatus = {
      available: false,
      message: `Firebase initialization failed: ${e.message}`,
    };
  }
} else {
  const message = `Firebase is disabled: missing or placeholder Firebase environment variables (${invalidFirebaseConfigKeys.join(', ')}).`;
  console.warn(message);
  firebaseAuthStatus = {
    available: false,
    message,
  };
}
export { auth, firebaseAuthStatus };
