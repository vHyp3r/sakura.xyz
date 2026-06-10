const express = require('express');
const {
  getDashboardSummary,
  getDocuments,
  getCollectionMeta,
} = require('../src/services/firestore');
const { isFirebaseConfigured } = require('../src/config/firebase');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const summary = isFirebaseConfigured()
      ? await getDashboardSummary()
      : {
          status: {
            connected: false,
            projectId: process.env.FIREBASE_PROJECT_ID || null,
            message:
              'Firebase is not configured yet. Add your service account credentials to .env.',
          },
          configuredCollections: [],
          collections: [],
          totalDocuments: 0,
        };

    res.render('dashboard/index', {
      title: 'Dashboard — sakura.xyz',
      summary,
      setupRequired: !isFirebaseConfigured(),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/collections/:collectionName', async (req, res, next) => {
  try {
    const collectionName = req.params.collectionName;
    const [meta, data] = await Promise.all([
      getCollectionMeta(collectionName),
      getDocuments(collectionName, { limit: 50 }),
    ]);

    res.render('dashboard/collection', {
      title: `${collectionName} — Dashboard`,
      meta,
      data,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
