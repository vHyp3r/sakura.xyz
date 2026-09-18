const crypto = require('crypto');
const { getAccountCollection } = require('./accountStore');

const AVATAR_COSMETICS = {
  'rose-crown': { label: 'Rose Crown', emoji: '🌹' },
  'moon-glasses': { label: 'Moon Glasses', emoji: '🌙' },
};

function normalizeUsername(username) {
  return String(username || '').trim().toLowerCase();
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedHash) {
  const [salt, hash] = String(storedHash || '').split(':');
  if (!salt || !hash) return false;
  const expected = Buffer.from(hash, 'hex');
  const actual = crypto.scryptSync(password, salt, expected.length);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function publicAccount(account) {
  if (!account) return null;
  const { passwordHash, ...safeAccount } = account;
  return safeAccount;
}

function publicSearchAccount(account) {
  return {
    username: account.username,
    displayName: account.displayName || account.username,
    bio: account.bio || '',
    equippedCosmetic: account.equippedCosmetic || null,
    cosmetic: AVATAR_COSMETICS[account.equippedCosmetic] || null,
  };
}

async function registerAccount({ username, email, password }) {
  const normalizedUsername = normalizeUsername(username);
  const normalizedEmail = String(email || '').trim().toLowerCase();
  if (!/^[a-z0-9_]{3,24}$/.test(normalizedUsername)) throw new Error('Username must be 3-24 characters using letters, numbers, or underscores.');
  if (!/^\S+@\S+\.\S+$/.test(normalizedEmail)) throw new Error('Enter a valid email address.');
  if (String(password || '').length < 8) throw new Error('Password must be at least 8 characters.');

  const collection = await getAccountCollection();
  const existing = await collection.findOne({ $or: [{ username: normalizedUsername }, { email: normalizedEmail }] });
  if (existing) throw new Error(existing.username === normalizedUsername ? 'That username is already taken.' : 'That email is already registered.');

  const now = new Date();
  const account = {
    username: normalizedUsername,
    email: normalizedEmail,
    passwordHash: hashPassword(password),
    displayName: String(username).trim(),
    bio: '',
    pronouns: '',
    location: '',
    website: '',
    equippedCosmetic: null,
    discoverable: true,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(account);
  account._id = result.insertedId;
  return publicAccount(account);
}

async function authenticateAccount(username, password) {
  const login = String(username || '').trim();
  const normalizedLogin = login.toLowerCase();
  const account = await (await getAccountCollection()).findOne({
    $or: [{ username: normalizedLogin }, { email: normalizedLogin }],
  });
  if (!account || !verifyPassword(password, account.passwordHash)) return null;
  return publicAccount(account);
}

async function resetAccountPassword(identifier, password) {
  const login = String(identifier || '').trim().toLowerCase();
  if (!login) throw new Error('Username or email is required.');
  if (String(password || '').length < 8) throw new Error('Password must be at least 8 characters.');

  const collection = await getAccountCollection();
  const account = await collection.findOne({
    $or: [{ username: login }, { email: login }],
  });

  if (!account) return null;

  await collection.updateOne(
    { _id: account._id },
    { $set: { passwordHash: hashPassword(password), updatedAt: new Date() } }
  );

  return { username: account.username, email: account.email };
}

async function getAccountById(id) {
  const { ObjectId } = require('mongodb');
  if (!ObjectId.isValid(id)) return null;
  return publicAccount(await (await getAccountCollection()).findOne({ _id: new ObjectId(id) }));
}

async function updateAccount(id, updates) {
  const { ObjectId } = require('mongodb');
  if (!ObjectId.isValid(id)) return null;
  const allowed = ['displayName', 'bio', 'pronouns', 'location', 'website', 'discoverable', 'equippedCosmetic'];
  const changes = Object.fromEntries(allowed.filter((key) => updates[key] !== undefined).map((key) => [key, updates[key]]));
  if (changes.equippedCosmetic && !AVATAR_COSMETICS[changes.equippedCosmetic]) throw new Error('That avatar cosmetic is not available.');
  changes.updatedAt = new Date();
  await (await getAccountCollection()).updateOne({ _id: new ObjectId(id) }, { $set: changes });
  return getAccountById(id);
}

async function searchAccounts(query, limit = 20) {
  const normalizedQuery = String(query || '').trim().toLowerCase();
  if (normalizedQuery.length < 2) return [];

  const escapedQuery = normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const records = await (await getAccountCollection()).find({
    discoverable: { $ne: false },
    $or: [
      { username: { $regex: escapedQuery, $options: 'i' } },
      { displayName: { $regex: escapedQuery, $options: 'i' } },
    ],
  }, {
    projection: { _id: 0, username: 1, displayName: 1, bio: 1, equippedCosmetic: 1 },
  }).sort({ username: 1 }).limit(Math.min(Number(limit) || 20, 50)).toArray();

  return records.map(publicSearchAccount);
}

module.exports = { AVATAR_COSMETICS, authenticateAccount, getAccountById, registerAccount, resetAccountPassword, searchAccounts, updateAccount };