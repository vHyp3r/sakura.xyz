const mongoose = require('mongoose');
const { getDataStoreStatus } = require('./dataStore');

const COLLECTION_NAME = 'userBalances';
const DEFAULT_BALANCE = 1200;
const DEFAULT_COOLDOWN_SECONDS = 300;

function getCooldownMs() {
  const seconds = Number(process.env.ADMIN_COIN_UPDATE_COOLDOWN_SECONDS);
  return (Number.isFinite(seconds) && seconds >= 0 ? seconds : DEFAULT_COOLDOWN_SECONDS) * 1000;
}

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

async function getBalance(username) {
  const normalizedUsername = normalizeUsername(username);
  if (!normalizedUsername) return null;

  const status = await getDataStoreStatus();
  if (!status.connected) return null;

  const record = await mongoose.connection.db.collection(COLLECTION_NAME).findOne({ username: normalizedUsername });
  return record ? { username: record.username, balance: record.balance, updatedAt: record.updatedAt } : null;
}

async function setBalance(username, balance, updatedBy) {
  const normalizedUsername = normalizeUsername(username);
  const numericBalance = Number(balance);

  if (!normalizedUsername) throw new Error('A username is required.');
  if (!Number.isInteger(numericBalance) || numericBalance < 0 || numericBalance > 1000000000) {
    throw new Error('Balance must be a whole number between 0 and 1,000,000,000.');
  }

  const status = await getDataStoreStatus();
  if (!status.connected) throw new Error(status.message);

  const collection = mongoose.connection.db.collection(COLLECTION_NAME);
  const existing = await collection.findOne({ username: normalizedUsername });
  const now = new Date();
  const cooldownUntil = existing?.updatedAt ? new Date(existing.updatedAt).getTime() + getCooldownMs() : 0;

  if (cooldownUntil > now.getTime()) {
    const error = new Error('This user balance was updated recently.');
    error.code = 'COOLDOWN';
    error.retryAfterSeconds = Math.ceil((cooldownUntil - now.getTime()) / 1000);
    throw error;
  }

  await collection.updateOne(
    { username: normalizedUsername },
    { $set: { username: normalizedUsername, balance: numericBalance, updatedAt: now, updatedBy: normalizeUsername(updatedBy) } },
    { upsert: true }
  );

  return { username: normalizedUsername, balance: numericBalance, updatedAt: now.toISOString() };
}

async function listBalances(limit = 50) {
  const status = await getDataStoreStatus();
  if (!status.connected) throw new Error(status.message);

  const records = await mongoose.connection.db.collection(COLLECTION_NAME)
    .find({}, { projection: { _id: 0, username: 1, balance: 1, updatedAt: 1, updatedBy: 1 } })
    .sort({ updatedAt: -1 })
    .limit(Math.min(Number(limit) || 50, 100))
    .toArray();

  return records;
}

module.exports = {
  DEFAULT_BALANCE,
  getBalance,
  getCooldownMs,
  listBalances,
  setBalance,
};
