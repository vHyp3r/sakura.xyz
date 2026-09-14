const mongoose = require('mongoose');

function getMongoUri() {
  const configuredUri =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    process.env.MONGODB_URL ||
    process.env.DATABASE_URL;

  return configuredUri?.trim() || null;
}

function isMongoConfigured() {
  return Boolean(getMongoUri());
}

async function connectMongo() {
  if (!isMongoConfigured()) {
    return { connected: false, message: 'MongoDB is not configured.' };
  }

  try {
    if (mongoose.connection.readyState === 1) {
      return { connected: true, message: 'Connected to MongoDB.' };
    }

    await mongoose.connect(getMongoUri(), {
      serverSelectionTimeoutMS: 5000,
    });

    return { connected: true, message: 'Connected to MongoDB.' };
  } catch (error) {
    return {
      connected: false,
      message: `MongoDB connection failed: ${error.message}`,
    };
  }
}

async function getDataStoreStatus() {
  if (!isMongoConfigured()) {
    return {
      connected: false,
      configured: false,
      kind: 'mongodb',
      projectId: null,
      message: 'MongoDB is not configured.',
    };
  }

  const status = await connectMongo();

  return {
    connected: status.connected,
    configured: true,
    kind: 'mongodb',
    projectId: status.connected ? mongoose.connection.name : null,
    message: status.message,
  };
}

function serializeMongoValue(value) {
  if (value === null || value === undefined) {
    return value;
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (value.constructor?.name === 'ObjectId') {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map(serializeMongoValue);
  }

  if (typeof value === 'object') {
    return Object.keys(value).reduce((result, key) => {
      result[key] = serializeMongoValue(value[key]);
      return result;
    }, {});
  }

  return value;
}

async function listMongoCollections() {
  const status = await getDataStoreStatus();

  if (!status.connected) {
    return [];
  }

  const collections = await mongoose.connection.db.listCollections().toArray();

  return Promise.all(
    collections.map(async (collection) => ({
      id: collection.name,
      documentCount: await mongoose.connection.db.collection(collection.name).countDocuments(),
    }))
  );
}

async function getMongoCollectionMeta(collectionName) {
  const status = await getDataStoreStatus();

  if (!status.connected) {
    throw new Error(status.message);
  }

  return {
    id: collectionName,
    documentCount: await mongoose.connection.db.collection(collectionName).countDocuments(),
  };
}

async function getMongoDocuments(collectionName, options = {}) {
  const status = await getDataStoreStatus();

  if (!status.connected) {
    throw new Error(status.message);
  }

  const limit = Math.min(Number(options.limit) || 25, 100);
  const documents = await mongoose.connection.db
    .collection(collectionName)
    .find({})
    .limit(limit)
    .toArray();

  return {
    collection: collectionName,
    count: documents.length,
    documents: documents.map(serializeMongoValue),
  };
}

async function getDashboardSummary() {
  const mongoStatus = await getDataStoreStatus();

  if (!mongoStatus.connected) {
    return {
      status: mongoStatus,
      configuredCollections: [],
      collections: [],
      totalDocuments: 0,
    };
  }

  const collections = await listMongoCollections();
  const totalDocuments = collections.reduce(
    (sum, collection) => sum + collection.documentCount,
    0
  );

  return {
    status: mongoStatus,
    configuredCollections: [],
    collections,
    totalDocuments,
  };
}

module.exports = {
  getMongoUri,
  isMongoConfigured,
  connectMongo,
  getDataStoreStatus,
  listMongoCollections,
  getMongoCollectionMeta,
  getMongoDocuments,
  getDashboardSummary,
};
