const express = require('express');
const {
  getDashboardSummary: getMongoDashboardSummary,
  getDataStoreStatus,
  getMongoDocuments,
  isMongoConfigured,
} = require('../src/services/dataStore');
const {
  getDashboardSummary,
  getDocuments,
  listCollections,
} = require('../src/services/firestore');
const { getFirebaseStatus, isFirebaseConfigured } = require('../src/config/firebase');
const {
  clearAdminSession,
  getAdminSession,
  isAdminUsername,
  requireAdmin,
  setAdminSession,
} = require('../src/services/adminAuth');
const { getBalance, listBalances, setBalance } = require('../src/services/coinService');
const { clearAccountSession, getAccountSession, setAccountSession } = require('../src/services/accountAuth');
const { authenticateAccount, getAccountById, registerAccount, updateAccount } = require('../src/services/accountService');

const router = express.Router();

router.post('/account/register', async (req, res, next) => {
  try {
    const account = await registerAccount(req.body);
    setAccountSession(res, req, account);
    res.status(201).json({ authenticated: true, account });
  } catch (error) {
    if (/Username|email|Password|already/.test(error.message)) return res.status(400).json({ error: error.message });
    next(error);
  }
});

router.post('/account/login', async (req, res, next) => {
  try {
    const account = await authenticateAccount(req.body.username, req.body.password);
    if (!account) return res.status(401).json({ error: 'Invalid username or password.' });
    setAccountSession(res, req, account);
    res.json({ authenticated: true, account });
  } catch (error) {
    next(error);
  }
});

router.get('/account/me', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    const account = session ? await getAccountById(session.accountId) : null;
    res.json({ authenticated: Boolean(account), account });
  } catch (error) {
    next(error);
  }
});

router.post('/account/logout', (req, res) => {
  clearAccountSession(res);
  res.json({ authenticated: false });
});

router.patch('/account/profile', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    const account = await updateAccount(session.accountId, req.body);
    if (!account) return res.status(404).json({ error: 'Account not found.' });
    res.json({ account });
  } catch (error) {
    next(error);
  }
});

router.get('/coins', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    const username = String(session?.username || req.query.username || '').trim();
    const balance = await getBalance(username);
    res.json({ username, balance: balance?.balance ?? null, source: balance ? 'server' : 'local' });
  } catch (error) {
    next(error);
  }
});

router.get('/admin/balances', requireAdmin, async (req, res, next) => {
  try {
    res.json({ balances: await listBalances(req.query.limit) });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/balances', requireAdmin, async (req, res, next) => {
  try {
    const session = getAdminSession(req);
    const result = await setBalance(req.body.username, req.body.balance, session.username);
    res.json(result);
  } catch (error) {
    if (error.code === 'COOLDOWN') {
      return res.status(429).json({ error: error.message, retryAfterSeconds: error.retryAfterSeconds });
    }
    if (/required|whole number|between/.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    return next(error);
  }
});

router.get('/admin/access', (req, res) => {
  res.json({ isAdmin: isAdminUsername(req.query.username) });
});

router.get('/admin/session', (req, res) => {
  const session = getAdminSession(req);
  res.json({ authenticated: Boolean(session), username: session?.username || null });
});

router.post('/admin/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!isAdminUsername(username) || !process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Invalid admin credentials.' });
  }

  setAdminSession(res, req, username);
  return res.json({ authenticated: true, username });
});

router.post('/admin/logout', (req, res) => {
  clearAdminSession(res);
  res.json({ authenticated: false });
});

router.get('/admin/summary', requireAdmin, async (req, res, next) => {
  try {
    const summary = isMongoConfigured()
      ? await getMongoDashboardSummary()
      : await getDashboardSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

router.get('/admin/collections/:collectionName', requireAdmin, async (req, res, next) => {
  try {
    const data = isMongoConfigured()
      ? await getMongoDocuments(req.params.collectionName, { limit: req.query.limit })
      : await getDocuments(req.params.collectionName, {
          limit: req.query.limit,
          orderBy: req.query.orderBy,
          orderDirection: req.query.orderDirection,
        });
    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/firebase/status', async (req, res) => {
  if (isMongoConfigured()) {
    const mongoStatus = await getDataStoreStatus();
    return res.json({
      ...mongoStatus,
      configured: true,
      kind: 'mongodb',
    });
  }

  if (!isFirebaseConfigured()) {
    return res.status(503).json({
      connected: false,
      configured: false,
      message: 'No database credentials are configured.',
    });
  }

  const status = getFirebaseStatus();
  return res.json({
    ...status,
    configured: true,
    kind: 'firebase',
  });
});

router.get('/firebase/collections', async (req, res, next) => {
  try {
    const collections = await listCollections();
    res.json({ collections });
  } catch (error) {
    next(error);
  }
});

router.get('/firebase/collections/:collectionName', async (req, res, next) => {
  try {
    const data = isMongoConfigured()
      ? await getMongoDocuments(req.params.collectionName, { limit: req.query.limit })
      : await getDocuments(req.params.collectionName, {
          limit: req.query.limit,
          orderBy: req.query.orderBy,
          orderDirection: req.query.orderDirection,
        });

    res.json(data);
  } catch (error) {
    next(error);
  }
});

router.get('/firebase/summary', async (req, res, next) => {
  try {
    const summary = isMongoConfigured()
      ? await getMongoDashboardSummary()
      : await getDashboardSummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
