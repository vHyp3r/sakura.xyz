const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

let app = null;
let db = null;
let initError = null;

function loadServiceAccount() {
  const inlineJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (inlineJson) {
    return JSON.parse(inlineJson);
  }

  const credentialsPath =
    process.env.GOOGLE_APPLICATION_CREDENTIALS ||
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!credentialsPath) {
    return null;
  }

  const resolvedPath = path.resolve(credentialsPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Firebase service account file not found: ${resolvedPath}`);
  }

  return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
}

function initFirebase() {
  if (app) {
    return { app, db, initError: null };
  }

  if (initError) {
    return { app: null, db: null, initError };
  }

  try {
    const serviceAccount = loadServiceAccount();

    if (!serviceAccount) {
      initError = new Error(
        'Firebase is not configured. Set GOOGLE_APPLICATION_CREDENTIALS or FIREBASE_SERVICE_ACCOUNT_JSON.'
      );
      return { app: null, db: null, initError };
    }

    app = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });

    db = admin.firestore();
    initError = null;

    return { app, db, initError: null };
  } catch (error) {
    initError = error;
    return { app: null, db: null, initError: error };
  }
}

function getFirestore() {
  const { db: firestore, initError: error } = initFirebase();

  if (error || !firestore) {
    const message = error ? error.message : 'Firebase Firestore is not initialized.';
    throw new Error(message);
  }

  return firestore;
}

function getFirebaseStatus() {
  const { app: firebaseApp, initError: error } = initFirebase();

  if (error || !firebaseApp) {
    return {
      connected: false,
      projectId: process.env.FIREBASE_PROJECT_ID || null,
      message: error ? error.message : 'Firebase is not configured.',
    };
  }

  return {
    connected: true,
    projectId: firebaseApp.options.projectId || process.env.FIREBASE_PROJECT_ID || null,
    message: 'Connected to Firebase.',
  };
}

function isFirebaseConfigured() {
  return Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_JSON ||
      process.env.GOOGLE_APPLICATION_CREDENTIALS ||
      process.env.FIREBASE_SERVICE_ACCOUNT_PATH
  );
}

module.exports = {
  admin,
  initFirebase,
  getFirestore,
  getFirebaseStatus,
  isFirebaseConfigured,
};
