const mongoose = require('mongoose');

let accountConnection;
let indexesReady;

function getAccountMongoUri() {
  return (
    process.env.ACCOUNTINFO_MONGODB_URI ||
    process.env.MONGODB_ACCOUNTINFO_URI ||
    process.env.ACCOUNTINFO_URI ||
    process.env.MONGODB_URI
  )?.trim() || null;
}

function isAccountStoreConfigured() {
  return Boolean(getAccountMongoUri());
}

async function getAccountConnection() {
  const uri = getAccountMongoUri();
  if (!uri) throw new Error('Account database is not configured. Set MONGODB_URI.');

  if (!accountConnection) {
    accountConnection = mongoose.createConnection(uri, {
      dbName: process.env.ACCOUNTINFO_DB_NAME || 'accountInfo',
      serverSelectionTimeoutMS: 5000,
    });
  }
  if (accountConnection.readyState !== 1) await accountConnection.asPromise();
  return accountConnection;
}

async function getAccountCollection() {
  const connection = await getAccountConnection();
  const collection = connection.db.collection('accounts');
  indexesReady ||= Promise.all([
    collection.createIndex({ username: 1 }, { unique: true }),
    collection.createIndex({ email: 1 }, { unique: true }),
  ]);
  await indexesReady;
  return collection;
}

module.exports = {
  getAccountCollection,
  getAccountMongoUri,
  isAccountStoreConfigured,
};