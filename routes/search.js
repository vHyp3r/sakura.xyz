const express = require('express');
const { getPacks } = require('../src/services/packService');
const router = express.Router();

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Search page
router.get('/', async (req, res, next) => {
    const query = req.query.q || '';
    let results = [];

    try {
        if (query.trim()) {
            const searchTerm = new RegExp(escapeRegex(query.trim()), 'i');
            const packs = await getPacks();
            results = packs.filter((pack) => [pack.name, pack.category, pack.resolution, pack.uploader, pack.description]
                .some((field) => searchTerm.test(String(field || ''))));
        }

        res.render('search/results', {
            title: `Search Results for "${query}"`,
            query,
            results,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;