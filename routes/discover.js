const express = require('express');
const { getPopularPacks } = require('../src/services/packService');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const packs = await getPopularPacks();
        res.render('discover/index', {
            title: 'Discover Popular Texture Packs',
            packs,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;