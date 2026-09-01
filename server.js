require('dotenv').config();

const express = require('express');
const path = require('path');
const { initFirebase, getFirebaseStatus, isFirebaseConfigured } = require('./src/config/firebase');
const { isMongoConfigured, getDataStoreStatus } = require('./src/services/dataStore');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

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
