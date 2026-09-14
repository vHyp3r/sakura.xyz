const express = require('express');
const { getPacks } = require('../src/services/packService');
const router = express.Router();

// Random page - redirect to a random pack
router.get('/', async (req, res, next) => {
    try {
        const packs = await getPacks();
        if (!packs.length) {
            return res.status(404).render('error', {
                title: 'No Packs Available',
                message: 'Upload a texture pack before opening a random pack.',
            });
        }

        const randomPack = packs[Math.floor(Math.random() * packs.length)];
        return res.redirect(`/packs/${randomPack._id}`);
    } catch (error) {
        return next(error);
    }
});

module.exports = router;