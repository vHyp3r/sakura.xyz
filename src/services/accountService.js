const crypto = require('crypto');
const { getAccountCollection } = require('./accountStore');

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
    discoverable: true,
    createdAt: now,
    updatedAt: now,
  };
  const result = await collection.insertOne(account);
  account._id = result.insertedId;
  return publicAccount(account);
}

async function authenticateAccount(username, password) {
  const account = await (await getAccountCollection()).findOne({ username: normalizeUsername(username) });
  if (!account || !verifyPassword(password, account.passwordHash)) return null;
  return publicAccount(account);
}

async function getAccountById(id) {
  const { ObjectId } = require('mongodb');
  if (!ObjectId.isValid(id)) return null;
  return publicAccount(await (await getAccountCollection()).findOne({ _id: new ObjectId(id) }));
}

async function updateAccount(id, updates) {
  const { ObjectId } = require('mongodb');
  if (!ObjectId.isValid(id)) return null;
  const allowed = ['displayName', 'bio', 'pronouns', 'location', 'website', 'discoverable'];
  const changes = Object.fromEntries(allowed.filter((key) => updates[key] !== undefined).map((key) => [key, updates[key]]));
  changes.updatedAt = new Date();
  await (await getAccountCollection()).updateOne({ _id: new ObjectId(id) }, { $set: changes });
  return getAccountById(id);
}

module.exports = { authenticateAccount, getAccountById, registerAccount, updateAccount };