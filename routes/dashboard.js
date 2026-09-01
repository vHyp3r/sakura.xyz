const express = require('express');
const { getDashboardSummary: getMongoDashboardSummary, isMongoConfigured } = require('../src/services/dataStore');
const {
  getDashboardSummary,
  getDocuments,
  getCollectionMeta,
} = require('../src/services/firestore');
const { isFirebaseConfigured } = require('../src/config/firebase');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const mongoConfigured = isMongoConfigured();
    const firebaseConfigured = isFirebaseConfigured();

    const summary = mongoConfigured
      ? await getMongoDashboardSummary()
      : firebaseConfigured
        ? await getDashboardSummary()
        : {
            status: {
              connected: false,
              projectId: process.env.FIREBASE_PROJECT_ID || process.env.MONGODB_URI || null,
              message:
                'No database is configured yet. Add MongoDB or Firebase credentials to .env.',
            },
            configuredCollections: [],
            collections: [],
            totalDocuments: 0,
          };

    res.render('dashboard/index', {
      title: 'Dashboard — sakura.xyz',
      summary,
      setupRequired: !(mongoConfigured || firebaseConfigured),
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
