require('dotenv').config();

const express = require('express');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const { initFirebase, getFirebaseStatus, isFirebaseConfigured } = require('./src/config/firebase');
const { isMongoConfigured, getDataStoreStatus } = require('./src/services/dataStore');
const { requireAdmin } = require('./src/services/adminAuth');
const { requireAccount } = require('./src/services/accountAuth');

const app = express();
app.set('trust proxy', 1); // Trust first proxy for rate limiting and secure cookies behind proxy
const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Security: Fail fast if critical secrets missing in production
if (IS_PRODUCTION) {
  const requiredSecrets = ['ADMIN_SESSION_SECRET', 'ACCOUNT_SESSION_SECRET', 'ADMIN_PASSWORD'];
  const missing = requiredSecrets.filter(s => !process.env[s]);
  if (missing.length) {
    console.error(`FATAL: Missing required environment variables: ${missing.join(', ')}`);
    process.exit(1);
  }
  const shortSecrets = ['ADMIN_SESSION_SECRET', 'ACCOUNT_SESSION_SECRET']
    .filter((name) => process.env[name].length < 32);
  if (shortSecrets.length) {
    console.error(`FATAL: Session secrets must be at least 32 characters: ${shortSecrets.join(', ')}`);
    process.exit(1);
  }
  // Ensure session secrets are different (security isolation)
  if (process.env.ADMIN_SESSION_SECRET === process.env.ACCOUNT_SESSION_SECRET) {
    console.error('FATAL: ADMIN_SESSION_SECRET and ACCOUNT_SESSION_SECRET must be different values');
    process.exit(1);
  }
}

// Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: IS_PRODUCTION ? { maxAge: 31536000, includeSubDomains: true, preload: true } : false,
}));

// Rate limiting - global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // limit each IP to 300 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});
app.use(globalLimiter);

// Stricter rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 attempts per 15 minutes
  message: { error: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Session middleware (required for CSRF)
// Use a dedicated secret for CSRF session (can be either admin or account secret, but not a fallback chain)
const csrfSessionSecret = process.env.ADMIN_SESSION_SECRET || process.env.ACCOUNT_SESSION_SECRET || 'dev-csrf-secret-change-in-production';
app.use(session({
  secret: csrfSessionSecret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
}));

// Cookie parser (required for CSRF cookie-based protection)
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin-assets', express.static(path.join(__dirname, 'css')));
app.use('/admin-assets', express.static(path.join(__dirname, 'js')));
app.use('/profile-assets', express.static(path.join(__dirname, 'js')));
app.get('/shop-assets/shop.js', (req, res) => res.sendFile(path.join(__dirname, 'shop.js')));

// CSRF protection middleware - applied selectively to routes that need it
// (HTML form submissions). API endpoints use token auth and get CSRF via /api/csrf-token.
const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax', secure: IS_PRODUCTION } });

// CSRF wrapper that skips the donation webhook (external service callback)
const apiCsrfProtection = (req, res, next) => {
  if (req.path === '/api/ranks/donations/webhook') {
    return next();
  }
  csrfProtection(req, res, next);
};

// Public pages that don't need CSRF (GET only)
app.get('/admin/login', authLimiter, (req, res) => res.sendFile(path.join(__dirname, 'html', 'adminLogin.html')));
app.get('/login', authLimiter, (req, res) => res.sendFile(path.join(__dirname, 'html', 'accountLogin.html')));
app.get('/privacy', (req, res) => res.sendFile(path.join(__dirname, 'html', 'privacypolicy.html')));
app.get('/validate', (req, res) => res.sendFile(path.join(__dirname, 'html', 'validate.html')));
app.get('/shop', (req, res) => res.sendFile(path.join(__dirname, 'html', 'shop.html')));
app.get('/banner-maker', (req, res) => res.sendFile(path.join(__dirname, 'html', 'banner-maker.html')));
app.get('/mobile-ui', (req, res) => res.sendFile(path.join(__dirname, 'html', 'mobile-ui.html')));
app.get('/redeem', (req, res) => res.sendFile(path.join(__dirname, 'html', 'redeem.html')));
app.get('/donate', (req, res) => res.sendFile(path.join(__dirname, 'html', 'donate.html')));

// Protected pages that serve HTML (need CSRF for forms)
app.get(['/admin', '/admin/overview', '/admin/collections', '/admin/activity', '/admin/balances', '/admin/shop'], requireAdmin, csrfProtection, (req, res) => res.sendFile(path.join(__dirname, 'html', 'adminPanel.html')));
app.get('/profile', requireAccount, csrfProtection, (req, res) => res.sendFile(path.join(__dirname, 'html', 'profile.html')));

// Expose CSRF token to templates for routes that have CSRF protection
app.use((req, res, next) => {
  if (req.csrfToken) {
    res.locals.csrfToken = req.csrfToken();
  }
  next();
});

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const mongoConfigured = isMongoConfigured();
const firebaseConfigured = isFirebaseConfigured();

if (mongoConfigured) {
  getDataStoreStatus().then((status) => {
    if (status.connected) {
      console.log('MongoDB connected');
    } else {
      console.warn(`MongoDB setup issue: ${status.message}`);
    }
  });
}
if (firebaseConfigured) {
  initFirebase();
  const status = getFirebaseStatus();
  if (status.connected) {
    console.log(`Firebase connected: ${status.projectId}`);
  } else {
    console.warn(`Firebase setup issue: ${status.message}`);
  }
}
if (!mongoConfigured && !firebaseConfigured) {
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
const converterRouter = require('./routes/converter');

app.use('/', indexRouter);
app.use('/packs', packsRouter);
app.use('/upload', csrfProtection, uploadRouter);
app.use('/search', searchRouter);
app.use('/discover', discoverRouter);
app.use('/random', randomRouter);
app.use('/dashboard', dashboardRouter);
app.use('/api', converterRouter);
// Apply CSRF to API routes that need it (csrf-token, login, register), but skip webhook
app.use('/api', apiCsrfProtection, apiRouter);

app.use((err, req, res, next) => {
  console.error(err.stack);

  if (err.code === 'EBADCSRFTOKEN') {
    if (req.path.startsWith('/api/')) {
      return res.status(403).json({ error: 'Invalid CSRF token.' });
    }
    return res.status(403).render('error', {
      title: 'Forbidden',
      message: 'Invalid CSRF token.',
    });
  }

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
