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

const placeholderValues = new Set([
  'your_api_key_here',
  'your_project_id.firebaseapp.com',
  'your_project_id',
  'your_project_id.appspot.com',
  'your_messaging_sender_id',
  'your_app_id',
]);
const isPlaceholderValue = (value) => {
  if (typeof value !== 'string') return false;
  const normalized = value.toLowerCase();
  return placeholderValues.has(normalized) || /^<.+>$/.test(normalized);
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
