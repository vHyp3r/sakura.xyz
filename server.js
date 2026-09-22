require('dotenv').config();

const express = require('express');
const path = require('path');
const { initFirebase, getFirebaseStatus, isFirebaseConfigured } = require('./src/config/firebase');
const { isMongoConfigured, getDataStoreStatus } = require('./src/services/dataStore');
const { requireAdmin } = require('./src/services/adminAuth');
const { requireAccount } = require('./src/services/accountAuth');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin-assets', express.static(path.join(__dirname, 'css')));
app.use('/admin-assets', express.static(path.join(__dirname, 'js')));
app.use('/profile-assets', express.static(path.join(__dirname, 'js')));
app.get('/shop-assets/shop.js', (req, res) => res.sendFile(path.join(__dirname, 'shop.js')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'html', 'adminLogin.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, 'html', 'accountLogin.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'html', 'privacypolicy.html')));
app.get('/validate', (req, res) => res.sendFile(path.join(__dirname, 'html', 'validate.html')));
app.get(['/admin', '/admin/overview', '/admin/collections', '/admin/activity', '/admin/balances'], requireAdmin, (req, res) => res.sendFile(path.join(__dirname, 'html', 'adminPanel.html')));
app.get('/profile', requireAccount, (req, res) => res.sendFile(path.join(__dirname, 'html', 'profile.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'html', 'shop.html')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

if (isMongoConfigured()) {
  getDataStoreStatus().then((status) => {
    if (status.connected) {
      console.log('MongoDB connected');
    } else {
      console.warn(`MongoDB setup issue: ${status.message}`);
    }
  });
} else if (isFirebaseConfigured()) {
  initFirebase();
  const status = getFirebaseStatus();
  if (status.connected) {
    console.log(`Firebase connected: ${status.projectId}`);
  } else {
    console.warn(`Firebase setup issue: ${status.message}`);
  }
} else {
  console.warn('No database configured. Add MONGODB_URI or Firebase credentials.');
}

const indexRouter = require('./routes/index');
const packsRouter = require('./routes/packs');
const uploadRouter = require('./routes/upload');
const searchRouter = require('./routes/search');
const discoverRouter = require('./routes/discover');
const randomRouter = require('./routes/random');
const dashboardRouter = require('./routes/dashboard');
const apiRouter = require('./routes/api');

app.use('/', indexRouter);
app.use('/packs', packsRouter);
app.use('/upload', uploadRouter);
app.use('/search', searchRouter);
app.use('/discover', discoverRouter);
app.use('/random', randomRouter);
app.use('/dashboard', dashboardRouter);
app.use('/api', apiRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);

  if (req.path.startsWith('/api/')) {
    return res.status(500).json({
      error: err.message || 'Something went wrong.',
    });
  }

  res.status(500).render('error', {
    title: 'Error',
    message: err.message || 'Something went wrong.',
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or run with PORT=3001 npm start`);
    process.exit(1);
  }

  throw err;
});

module.exports = app;
