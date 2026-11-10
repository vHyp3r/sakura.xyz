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
  const now = new Date();
  const cooldownMs = getCooldownMs();

  // Atomic cooldown check + update using findOneAndUpdate with conditional query
  // Only updates if: no existing record (upsert) OR existing record's updatedAt is older than cooldown
  const cooldownCutoff = new Date(now.getTime() - cooldownMs);
  const result = await collection.findOneAndUpdate(
    {
      username: normalizedUsername,
      $or: [
        { updatedAt: { $exists: false } }, // new record (upsert)
        { updatedAt: { $lt: cooldownCutoff } } // old enough to update
      ]
    },
    {
      $set: { username: normalizedUsername, balance: numericBalance, updatedAt: now, updatedBy: normalizeUsername(updatedBy) }
    },
    { returnDocument: 'after', upsert: true }
  );

  if (!result) {
    // Check if record exists to give proper error
    const existing = await collection.findOne({ username: normalizedUsername });
    if (existing) {
      const error = new Error('This user balance was updated recently.');
      error.code = 'COOLDOWN';
      error.retryAfterSeconds = Math.ceil((new Date(existing.updatedAt).getTime() + cooldownMs - now.getTime()) / 1000);
      throw error;
    }
    // Should not happen with upsert, but handle gracefully
    throw new Error('Failed to update balance.');
  }

  return { username: normalizedUsername, balance: numericBalance, updatedAt: now.toISOString() };
}

async function spendCoins(username, amount) {
  const normalizedUsername = normalizeUsername(username);
  const numericAmount = Number(amount);
  if (!normalizedUsername || !Number.isInteger(numericAmount) || numericAmount < 1) {
    throw new Error('A valid coin amount is required.');
  }
  const status = await getDataStoreStatus();
  if (!status.connected) throw new Error(status.message);
  const result = await mongoose.connection.db.collection(COLLECTION_NAME).findOneAndUpdate(
    { username: normalizedUsername, balance: { $gte: numericAmount } },
    { $inc: { balance: -numericAmount }, $set: { updatedAt: new Date(), updatedBy: 'rank-shop' } },
    { returnDocument: 'after' }
  );
  if (!result) throw new Error('You do not have enough Sakura coins.');
  return result;
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
  spendCoins,
};
