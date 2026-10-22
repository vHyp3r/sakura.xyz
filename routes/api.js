const express = require('express');
const multer = require('multer');
const crypto = require('crypto');
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
const { getBalance, listBalances, setBalance, spendCoins } = require('../src/services/coinService');
const { clearAccountSession, getAccountSession, setAccountSession } = require('../src/services/accountAuth');
const { authenticateAccount, getAccountById, registerAccount, resetAccountPassword, searchAccounts, toggleAccountPack, updateAccount, updateAccountRank } = require('../src/services/accountService');
const { addPackComment, getPackById, getPacksByIds, recordPackView, storePackBuffer, togglePackList } = require('../src/services/packService');
const Pack = require('../models/Pack');
const { BADGES, RANKS } = require('../src/services/ranks');
const {
  createShopItem,
  deleteShopItem,
  getPublicShopItems,
  listShopItems,
  updateShopItem,
} = require('../src/services/shopCatalogService');
const {
  approveDonation,
  createDonationRequest,
  getDonationRequest,
  getRankKeyStatus,
  issueRankKey,
  listRankKeys,
  redeemRankKey,
  verifyDonationPayment,
} = require('../src/services/rankKeyService');

const router = express.Router();
const packEditUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 300 * 1024 * 1024 } });

router.patch('/packs/:id', packEditUpload.single('javaFile'), async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    const pack = await getPackById(req.params.id);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    if (!pack) return res.status(404).json({ error: 'Pack not found.' });
    const ownsPack = (pack.uploaderId && String(pack.uploaderId) === String(session.accountId))
      || (!pack.uploaderId && pack.uploader?.toLowerCase() === session.username?.toLowerCase());
    if (!ownsPack) return res.status(403).json({ error: 'Only the pack owner can edit this pack.' });
    const updates = {
      bedrockVersion: String(req.body.bedrockVersion || '').trim().slice(0, 40),
      javaVersion: String(req.body.javaVersion || '').trim().slice(0, 40),
    };
    if (req.file) {
      if (!/\.zip$/i.test(req.file.originalname)) return res.status(400).json({ error: 'Java Edition files must be .zip archives.' });
      updates.javaFileStorageId = await storePackBuffer(req.file.buffer, req.file.originalname, req.file.mimetype || 'application/zip');
      updates.javaFile = `/uploads/java-${Date.now()}-${req.file.originalname.replace(/[^a-z0-9._-]/gi, '-')}`;
      updates.originalJavaFileName = req.file.originalname;
    }
    const updated = await Pack.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
      .select('_id name bedrockVersion javaVersion javaFileStorageId originalJavaFileName')
      .lean();
    res.json({ pack: updated });
  } catch (error) {
    next(error);
  }
});

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

router.get('/shop/catalog', async (req, res, next) => {
  try {
    res.json({ items: await getPublicShopItems() });
  } catch (error) {
    next(error);
  }
});
router.post('/account/logout', (req, res) => {
  clearAccountSession(res);
  res.json({ authenticated: false });
});

router.get('/account/search', async (req, res, next) => {
  try {
    const query = String(req.query.q || '').trim();
    if (query.length < 2) return res.json({ accounts: [] });
    res.json({ accounts: await searchAccounts(query, req.query.limit) });
  } catch (error) {
    next(error);
  }
});

router.patch('/account/profile', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    const updates = { ...req.body };
    if (updates.profilePicture !== undefined) {
      const picture = String(updates.profilePicture || '');
      if (picture && !/^data:image\/(?:jpeg|png|gif);base64,[a-z0-9+/]+=*$/i.test(picture)) {
        return res.status(400).json({ error: 'Profile picture must be a valid image.' });
      }
      if (picture.length > 7 * 1024 * 1024) {
        return res.status(400).json({ error: 'Profile picture is too large.' });
      }
      updates.profilePicture = picture;
    }
    const account = await updateAccount(session.accountId, updates);
    if (!account) return res.status(404).json({ error: 'Account not found.' });
    res.json({ account });
  } catch (error) {
    next(error);
  }
});

router.get('/account/library', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    const account = await getAccountById(session.accountId);
    const packs = await getPacksByIds(account?.savedPacks || []);
    res.json({ packs });
  } catch (error) {
    next(error);
  }
});

router.get('/account/summary', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    const account = await getAccountById(session.accountId);
    if (!account) return res.status(404).json({ error: 'Account not found.' });

    const [packs, likedPacks] = await Promise.all([
      Pack.find({ $or: [{ uploaderId: session.accountId }, { uploader: account.username }] })
        .select('_id name uploader thumbnail downloads views likedBy')
        .sort({ createdAt: -1 })
        .lean(),
      getPacksByIds(account.likedPacks || []).then((records) => records.map(({ _id, name, uploader, thumbnail }) => ({
        _id,
        name,
        uploader,
        thumbnail,
      }))),
    ]);
    const comments = await Pack.find({ 'comments.accountId': session.accountId })
      .select('_id name comments')
      .lean();
    const authoredComments = comments.flatMap((pack) => (pack.comments || [])
      .filter((comment) => String(comment.accountId) === String(session.accountId))
      .map((comment) => ({ ...comment, packId: pack._id, packName: pack.name })));

    res.json({
      packs,
      likedPacks,
      comments: authoredComments,
      stats: {
        packs: packs.length,
        downloads: packs.reduce((total, pack) => total + (pack.downloads || 0), 0),
        views: packs.reduce((total, pack) => total + (pack.views || 0), 0),
        likes: packs.reduce((total, pack) => total + (pack.likedBy || []).length, 0),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/packs/:id/view', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    const visitorSource = session?.accountId
      ? `account:${session.accountId}`
      : `visitor:${req.ip}|${req.get('user-agent') || 'unknown'}`;
    const visitorKey = crypto.createHash('sha256').update(visitorSource).digest('hex');
    const pack = await recordPackView(req.params.id, visitorKey);
    if (!pack) return res.status(404).json({ error: 'Pack not found.' });
    res.json({ views: pack.views, counted: pack.counted });
  } catch (error) {
    next(error);
  }
});

router.post('/packs/:id/library', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Sign in to save packs to your library.' });
    const result = await toggleAccountPack(session.accountId, 'savedPacks', req.params.id);
    if (!result) return res.status(404).json({ error: 'Account not found.' });
    res.json({ saved: result.active });
  } catch (error) {
    next(error);
  }
});

router.post('/packs/:id/like', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Sign in to like packs.' });
    const result = await togglePackList(req.params.id, 'likedBy', session.accountId);
    if (!result) return res.status(404).json({ error: 'Pack not found.' });
    await toggleAccountPack(session.accountId, 'likedPacks', req.params.id);
    res.json({ liked: result.active, likes: result.count });
  } catch (error) {
    next(error);
  }
});

router.post('/packs/:id/super-react', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Sign in to send a super reaction.' });
    const result = await togglePackList(req.params.id, 'superReactedBy', session.accountId);
    if (!result) return res.status(404).json({ error: 'Pack not found.' });
    res.json({ reacted: result.active, reactions: result.count });
  } catch (error) {
    next(error);
  }
});

router.get('/packs/:id/comments', async (req, res, next) => {
  try {
    const pack = await getPackById(req.params.id);
    if (!pack) return res.status(404).json({ error: 'Pack not found.' });
    res.json({ comments: pack.comments || [] });
  } catch (error) {
    next(error);
  }
});

router.post('/packs/:id/comments', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Sign in to comment.' });
    const comment = await addPackComment(req.params.id, session.accountId, session.username, req.body.body);
    if (!comment) return res.status(404).json({ error: 'Pack not found.' });
    res.status(201).json({ comment });
  } catch (error) {
    if (/Comments must/.test(error.message)) return res.status(400).json({ error: error.message });
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

router.post('/ranks/purchase', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    const rank = String(req.body.rank || '').trim().toLowerCase();
    const prices = { vip: 2500, mvp: 5000 };
    if (!prices[rank]) return res.status(400).json({ error: 'That rank is not available for coin purchase.' });
    const balance = await spendCoins(session.username, prices[rank]);
    const issued = await issueRankKey(session.username, rank);
    res.status(201).json({ rank, key: issued.key, balance: balance.balance, redeemUrl: '/redeem' });
  } catch (error) {
    if (/coins|rank|amount|account/.test(error.message)) return res.status(400).json({ error: error.message });
    next(error);
  }
});

router.post('/ranks/redeem', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    const redeemed = await redeemRankKey(req.body.key, session.username);
    const account = await updateAccountRank(session.username, redeemed.rank);
    res.json({ redeemed: true, rank: account.rank });
  } catch (error) {
    if (/valid rank key|invalid|redeemed|account/.test(error.message)) return res.status(400).json({ error: error.message });
    next(error);
  }
});

router.get('/ranks/key-status', async (req, res, next) => {
  try {
    res.json(await getRankKeyStatus(req.query.key));
  } catch (error) {
    next(error);
  }
});

router.get('/ranks/keys', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    res.json({ keys: await listRankKeys(session.username) });
  } catch (error) {
    next(error);
  }
});

router.post('/ranks/donations', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    const donation = await createDonationRequest(session.username, req.body.amount, req.body.transactionId);
    res.status(201).json({ ...donation, message: 'Donation submitted for verification. Your Donator key will appear here after approval.' });
  } catch (error) {
    if (/minimum|transaction|already/.test(error.message)) return res.status(400).json({ error: error.message });
    next(error);
  }
});

router.get('/ranks/donation-info', (req, res) => {
  const addresses = {
    BTC: process.env.DONATION_BTC_ADDRESS || '',
    LTC: process.env.DONATION_LTC_ADDRESS || '',
    ETH: process.env.DONATION_ETH_ADDRESS || '',
    SOL: process.env.DONATION_SOL_ADDRESS || '',
    XMR: process.env.DONATION_XMR_ADDRESS || '',
    USDT: process.env.DONATION_USDT_ETH_ADDRESS || '',
  };
  res.json({
    addresses,
    networks: { USDT: 'Ethereum' },
    minimumUsd: 1,
  });
});

router.post('/ranks/donations/webhook', async (req, res, next) => {
  try {
    const secret = process.env.DONATION_WEBHOOK_SECRET;
    const timestamp = String(req.get('x-donation-timestamp') || '');
    const signature = String(req.get('x-donation-signature') || '');
    if (!secret || !timestamp || !signature) return res.status(401).json({ error: 'Webhook authentication is not configured.' });
    const timestampNumber = Number(timestamp);
    if (!Number.isFinite(timestampNumber) || Math.abs(Date.now() - timestampNumber * 1000) > 5 * 60 * 1000) {
      return res.status(401).json({ error: 'Webhook timestamp is expired.' });
    }
    const payload = `${timestamp}.${JSON.stringify(req.body)}`;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
    if (signature.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return res.status(401).json({ error: 'Invalid webhook signature.' });
    }
    const result = await verifyDonationPayment(req.body);
    res.json(result);
  } catch (error) {
    if (/configured|destination|minimum|transaction|confirmations|processed|requested|not found/.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

router.get('/ranks/donations/:id', async (req, res, next) => {
  try {
    const session = getAccountSession(req);
    if (!session) return res.status(401).json({ error: 'Account authentication required.' });
    const donation = await getDonationRequest(req.params.id, session.username);
    if (!donation) return res.status(404).json({ error: 'Donation request not found.' });
    res.json({ donation });
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

router.post('/admin/accounts/reset-password', requireAdmin, async (req, res, next) => {
  try {
    const account = await resetAccountPassword(req.body.identifier, req.body.password);
    if (!account) return res.status(404).json({ error: 'Account not found.' });
    res.json({ reset: true, account });
  } catch (error) {
    if (/required|at least/.test(error.message)) {
      return res.status(400).json({ error: error.message });
    }
    next(error);
  }
});

router.get('/admin/ranks', requireAdmin, (req, res) => {
  res.json({ ranks: RANKS, badges: BADGES });
});

router.get('/admin/shop/items', requireAdmin, async (req, res, next) => {
  try {
    res.json({ items: await listShopItems() });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/shop/items', requireAdmin, async (req, res, next) => {
  try {
    res.status(201).json({ item: await createShopItem(req.body) });
  } catch (error) {
    if (/required|period|price/.test(error.message)) return res.status(400).json({ error: error.message });
    next(error);
  }
});

router.patch('/admin/shop/items/:id', requireAdmin, async (req, res, next) => {
  try {
    res.json({ item: await updateShopItem(req.params.id, req.body) });
  } catch (error) {
    if (/required|period|price|not found/.test(error.message)) return res.status(400).json({ error: error.message });
    next(error);
  }
});

router.delete('/admin/shop/items/:id', requireAdmin, async (req, res, next) => {
  try {
    if (!await deleteShopItem(req.params.id)) return res.status(404).json({ error: 'Shop item not found.' });
    res.json({ deleted: true });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/accounts/rank', requireAdmin, async (req, res, next) => {
  try {
    const account = await updateAccountRank(req.body.identifier, req.body.rank, req.body.badges);
    if (!account) return res.status(404).json({ error: 'Account not found.' });
    res.json({ updated: true, account });
  } catch (error) {
    next(error);
  }
});

router.post('/admin/rank-donations/:id/approve', requireAdmin, async (req, res, next) => {
  try {
    const session = getAdminSession(req);
    const result = await approveDonation(req.params.id, session.username);
    if (!result) return res.status(404).json({ error: 'Pending donation not found.' });
    res.json(result);
  } catch (error) {
    next(error);
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

  if (!process.env.ADMIN_PASSWORD) {
    return res.status(503).json({ error: 'Admin login is not configured on this server. Set ADMIN_PASSWORD in Render.' });
  }

  if (!isAdminUsername(username) || password !== process.env.ADMIN_PASSWORD) {
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
