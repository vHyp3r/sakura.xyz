const express = require('express');
const router = express.Router();

// Home page
router.get('/', (req, res) => {
  res.render('index', { title: 'Sakura.xyz — Minecraft Texture Pack Gallery' });
});

module.exports = router;