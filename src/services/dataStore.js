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
      message: 'MongoDB is not configured.',
    };
  }

  const status = await connectMongo();

  return {
    connected: status.connected,
    configured: true,
    kind: 'mongodb',
    message: status.message,
  };
}

async function getDashboardSummary() {
  const mongoStatus = await getDataStoreStatus();

  return {
    status: mongoStatus,
    configuredCollections: [],
    collections: [],
    totalDocuments: 0,
  };
}

module.exports = {
  getMongoUri,
  isMongoConfigured,
  connectMongo,
  getDataStoreStatus,
  getDashboardSummary,
};
