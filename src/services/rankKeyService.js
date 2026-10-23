const crypto = require('crypto');
const { getAccountConnection } = require('./accountStore');

const RANK_KEY_PATTERN = /^[A-Z0-9]{5}(?:-[A-Z0-9]{5}){2}$/;
const RANKS = new Set(['donator', 'vip', 'mvp']);
const KEY_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

function normalizeRank(rank) {
  const value = String(rank || '').trim().toLowerCase();
  if (!RANKS.has(value)) throw new Error('That rank cannot be purchased.');
  return value;
}

function generateKey() {
  return Array.from({ length: 3 }, () => Array.from({ length: 5 }, () => (
    KEY_CHARACTERS[crypto.randomInt(KEY_CHARACTERS.length)]
  )).join('')).join('-');
}

function hashKey(key) {
  return crypto.createHash('sha256').update(key).digest('hex');
}

function encryptionKey() {
  const secret = process.env.ACCOUNT_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || process.env.DONATION_WEBHOOK_SECRET;
  if (!secret) throw new Error('A key encryption secret is not configured.');
  return crypto.createHash('sha256').update(secret).digest();
}

function encryptKey(key) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(key, 'utf8'), cipher.final()]);
  return `${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${encrypted.toString('base64url')}`;
}

function decryptKey(value) {
  try {
    const [ivValue, tagValue, encryptedValue] = String(value || '').split('.');
    const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivValue, 'base64url'));
    decipher.setAuthTag(Buffer.from(tagValue, 'base64url'));
    return Buffer.concat([decipher.update(Buffer.from(encryptedValue, 'base64url')), decipher.final()]).toString('utf8');
  } catch (_) {
    return null;
  }
}

async function getRankKeyCollection() {
  const collection = (await getAccountConnection()).db.collection('rankKeys');
  await collection.createIndex({ keyHash: 1 }, { unique: true });
  await collection.createIndex({ username: 1, createdAt: -1 });
  return collection;
}

async function issueRankKey(username, rank, source = 'shop') {
  const normalizedRank = normalizeRank(rank);
  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (!normalizedUsername) throw new Error('An account is required to issue a rank key.');

  const key = generateKey();
  await (await getRankKeyCollection()).insertOne({
    keyHash: hashKey(key),
    encryptedKey: encryptKey(key),
    username: normalizedUsername,
    rank: normalizedRank,
    source,
    redeemedAt: null,
    createdAt: new Date(),
  });
  return { key, rank: normalizedRank };
}

async function generateGiveawayKeys(rank, count = 1) {
  const normalizedRank = normalizeRank(rank);
  const quantity = Number(count);
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
    throw new Error('Generate between 1 and 100 keys at a time.');
  }

  const collection = await getRankKeyCollection();
  const records = [];
  const keys = [];
  for (let index = 0; index < quantity; index += 1) {
    const key = generateKey();
    keys.push(key);
    records.push({
      keyHash: hashKey(key),
      encryptedKey: encryptKey(key),
      username: null,
      rank: normalizedRank,
      source: 'admin-giveaway',
      redeemedAt: null,
      createdAt: new Date(),
    });
  }
  await collection.insertMany(records, { ordered: true });
  return { rank: normalizedRank, keys };
}

async function redeemRankKey(key, username) {
  const normalizedKey = String(key || '').trim().toUpperCase();
  if (!RANK_KEY_PATTERN.test(normalizedKey)) throw new Error('Enter a valid rank key.');
  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (!normalizedUsername) throw new Error('An account is required to redeem a rank key.');

  const collection = await getRankKeyCollection();
  const result = await collection.findOneAndUpdate(
    { keyHash: hashKey(normalizedKey), redeemedAt: null },
    { $set: { redeemedAt: new Date(), redeemedBy: normalizedUsername } },
    { returnDocument: 'after' }
  );
  if (!result) throw new Error('That key is invalid or has already been redeemed.');
  const redeemedKey = result.value || result;
  if (!RANKS.has(String(redeemedKey.rank || '').toLowerCase())) {
    throw new Error('That key contains an unsupported rank.');
  }
  return { rank: String(redeemedKey.rank).toLowerCase(), username: normalizedUsername };
}

async function getRankKeyStatus(key) {
  const normalizedKey = String(key || '').trim().toUpperCase();
  if (!RANK_KEY_PATTERN.test(normalizedKey)) return { status: 'invalid' };

  const record = await (await getRankKeyCollection()).findOne(
    { keyHash: hashKey(normalizedKey) },
    { projection: { redeemedAt: 1 } },
  );
  if (!record) return { status: 'invalid' };
  return { status: record.redeemedAt ? 'redeemed' : 'available' };
}

async function listRankKeys(username) {
  const normalizedUsername = String(username || '').trim().toLowerCase();
  if (!normalizedUsername) throw new Error('An account is required to view rank keys.');
  const records = await (await getRankKeyCollection()).find(
    { $or: [{ username: normalizedUsername }, { redeemedBy: normalizedUsername }] },
    { projection: { rank: 1, source: 1, encryptedKey: 1, redeemedAt: 1, redeemedBy: 1, createdAt: 1 } },
  ).sort({ createdAt: -1 }).limit(100).toArray();
  return records.map((record) => ({
    id: record._id.toString(),
    key: decryptKey(record.encryptedKey),
    rank: record.rank,
    source: record.source,
    status: record.redeemedAt ? 'redeemed' : 'available',
    redeemedAt: record.redeemedAt || null,
    createdAt: record.createdAt,
  }));
}

async function createDonationRequest(username, amount, transactionId) {
  const normalizedAmount = Number(amount);
  const normalizedTransactionId = String(transactionId || '').trim().slice(0, 160);
  if (!Number.isFinite(normalizedAmount) || normalizedAmount < 1) {
    throw new Error('The minimum donation is $1 USD.');
  }

  if (!normalizedTransactionId) throw new Error('Enter the crypto transaction ID.');

  const collection = (await getAccountConnection()).db.collection('rankDonations');
  const existing = await collection.findOne({ transactionId: normalizedTransactionId });
  if (existing) throw new Error('That transaction has already been submitted.');
  const donation = {
    username: String(username || '').trim().toLowerCase(),
    amount: normalizedAmount,
    transactionId: normalizedTransactionId,
    status: 'pending',
    createdAt: new Date(),
    key: null,
  };
  const result = await collection.insertOne(donation);
  return { id: result.insertedId.toString(), status: donation.status };
}

async function verifyDonationPayment({ id, currency, destinationAddress, amountUsd, transactionId, confirmations }) {
  const { ObjectId } = require('mongodb');
  if (!ObjectId.isValid(id)) throw new Error('Donation request not found.');
  const normalizedCurrency = String(currency || '').trim().toUpperCase();
  const normalizedTransactionId = String(transactionId || '').trim().slice(0, 160);
  const numericAmount = Number(amountUsd);
  const minimumConfirmations = Number(process.env.DONATION_MIN_CONFIRMATIONS || 1);
  const expectedAddresses = {
    BTC: process.env.DONATION_BTC_ADDRESS,
    LTC: process.env.DONATION_LTC_ADDRESS,
    ETH: process.env.DONATION_ETH_ADDRESS,
    SOL: process.env.DONATION_SOL_ADDRESS,
    XMR: process.env.DONATION_XMR_ADDRESS,
    USDT: process.env.DONATION_USDT_ETH_ADDRESS,
  };

  if (!expectedAddresses[normalizedCurrency]) throw new Error('That currency is not configured.');
  if (String(destinationAddress || '').trim() !== expectedAddresses[normalizedCurrency]) {
    throw new Error('The payment destination does not match the configured wallet.');
  }
  if (!Number.isFinite(numericAmount) || numericAmount < 1) throw new Error('The payment is below the $1 minimum.');
  if (!normalizedTransactionId) throw new Error('A transaction ID is required.');
  if (!Number.isFinite(Number(confirmations)) || Number(confirmations) < minimumConfirmations) {
    throw new Error('The payment does not have enough confirmations.');
  }

  const collection = (await getAccountConnection()).db.collection('rankDonations');
  const donation = await collection.findOne({ _id: new ObjectId(id), status: 'pending' });
  if (!donation) throw new Error('Donation request not found or already processed.');
  if (numericAmount < Number(donation.amount)) throw new Error('The payment is below the requested amount.');

  const duplicate = await collection.findOne({
    transactionId: normalizedTransactionId,
    status: 'verified',
  });
  if (duplicate) throw new Error('That transaction has already been processed.');

  const issued = await issueRankKey(donation.username, 'donator', 'crypto-webhook');
  await collection.updateOne({ _id: donation._id, status: 'pending' }, {
    $set: {
      status: 'verified',
      currency: normalizedCurrency,
      destinationAddress: expectedAddresses[normalizedCurrency],
      paidAmountUsd: numericAmount,
      transactionId: normalizedTransactionId,
      confirmations: Number(confirmations),
      verifiedAt: new Date(),
      key: issued.key,
    },
  });
  return { id, status: 'verified', key: issued.key };
}

async function getDonationRequest(id, username) {
  const { ObjectId } = require('mongodb');
  if (!ObjectId.isValid(id)) return null;
  const donation = await (await getAccountConnection()).db.collection('rankDonations').findOne({
    _id: new ObjectId(id),
    username: String(username || '').trim().toLowerCase(),
  }, { projection: { username: 0 } });
  return donation ? { ...donation, id: donation._id.toString(), _id: undefined } : null;
}

async function approveDonation(id, approvedBy) {
  const { ObjectId } = require('mongodb');
  if (!ObjectId.isValid(id)) return null;
  const collection = (await getAccountConnection()).db.collection('rankDonations');
  const donation = await collection.findOne({ _id: new ObjectId(id), status: 'pending' });
  if (!donation) return null;
  const issued = await issueRankKey(donation.username, 'donator', 'crypto-donation');
  await collection.updateOne({ _id: donation._id, status: 'pending' }, {
    $set: { status: 'approved', approvedBy, approvedAt: new Date(), key: issued.key },
  });
  return { id, status: 'approved', key: issued.key };
}

module.exports = {
  approveDonation,
  createDonationRequest,
  getDonationRequest,
  listRankKeys,
  getRankKeyStatus,
  generateGiveawayKeys,
  issueRankKey,
  redeemRankKey,
  verifyDonationPayment,
};
