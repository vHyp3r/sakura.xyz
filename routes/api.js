const express = require('express');
const { getDashboardSummary: getMongoDashboardSummary, getDataStoreStatus, isMongoConfigured } = require('../src/services/dataStore');
const {
  getDashboardSummary,
  getDocuments,
  listCollections,
} = require('../src/services/firestore');
const { getFirebaseStatus, isFirebaseConfigured } = require('../src/config/firebase');

const router = express.Router();

router.get('/firebase/status', async (req, res) => {
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
