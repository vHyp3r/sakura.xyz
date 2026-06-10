const { getFirestore, getFirebaseStatus } = require('../config/firebase');

function getConfiguredCollections() {
  const raw = process.env.FIREBASE_DASHBOARD_COLLECTIONS || '';

  return raw
    .split(',')
    .map((name) => name.trim())
    .filter(Boolean);
}

function serializeValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value.toDate === 'function') {
    return value.toDate().toISOString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((result, key) => {
      result[key] = serializeValue(value[key]);
      return result;
    }, {});
  }

  return value;
}

function serializeDocument(doc) {
  return {
    id: doc.id,
    ...serializeValue(doc.data()),
  };
}

async function getDocumentCount(collectionRef) {
  try {
    if (typeof collectionRef.count === 'function') {
      const snapshot = await collectionRef.count().get();
      return snapshot.data().count;
    }
  } catch (error) {
    // Fall back below for older Firestore runtimes.
  }

  const snapshot = await collectionRef.get();
  return snapshot.size;
}

async function listCollections() {
  const db = getFirestore();
  const collections = await db.listCollections();

  return Promise.all(
    collections.map(async (collection) => ({
      id: collection.id,
      documentCount: await getDocumentCount(collection),
    }))
  );
}

async function getCollectionMeta(collectionName) {
  const db = getFirestore();
  const collectionRef = db.collection(collectionName);

  return {
    id: collectionName,
    documentCount: await getDocumentCount(collectionRef),
  };
}

async function getDocuments(collectionName, options = {}) {
  const db = getFirestore();
  const limit = Math.min(Number(options.limit) || 25, 100);

  let query = db.collection(collectionName).limit(limit);

  if (options.orderBy) {
    query = query.orderBy(options.orderBy, options.orderDirection || 'desc');
  }

  const snapshot = await query.get();

  return {
    collection: collectionName,
    count: snapshot.size,
    documents: snapshot.docs.map(serializeDocument),
  };
}

async function getDashboardSummary() {
  const status = getFirebaseStatus();
  const configuredCollections = getConfiguredCollections();

  if (!status.connected) {
    return {
      status,
      configuredCollections,
      collections: [],
      totalDocuments: 0,
    };
  }

  let collections;

  if (configuredCollections.length) {
    collections = await Promise.all(
      configuredCollections.map((collectionName) => getCollectionMeta(collectionName))
    );
  } else {
    collections = await listCollections();
  }

  const totalDocuments = collections.reduce(
    (sum, collection) => sum + collection.documentCount,
    0
  );

  return {
    status,
    configuredCollections,
    collections,
    totalDocuments,
  };
}

module.exports = {
  getConfiguredCollections,
  listCollections,
  getCollectionMeta,
  getDocuments,
  getDashboardSummary,
  serializeDocument,
};
