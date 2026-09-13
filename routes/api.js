const express = require('express');
const {
  getDashboardSummary: getMongoDashboardSummary,
  getDataStoreStatus,
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

const router = express.Router();

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
    const data = await getDocuments(req.params.collectionName, {
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
    const data = await getDocuments(req.params.collectionName, {
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
