const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.render('index', { title: 'Sakura.xyz — Fast & Secure Minecraft Utilities' });
});

module.exports = router;