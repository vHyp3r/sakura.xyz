const express = require('express');
const { getPacks } = require('../src/services/packService');
const router = express.Router();

// Home page
router.get('/', async (req, res, next) => {
  try {
    const packs = await getPacks();
    res.render('index', {
      title: 'Sakura.xyz — Minecraft Texture Pack Gallery',
      packs: packs.slice(0, 6),
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;