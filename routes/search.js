const express = require('express');
const { getPacks } = require('../src/services/packService');
const router = express.Router();

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Search page
router.get('/', async (req, res, next) => {
    const query = String(req.query.q || '').trim();
    let results = [];
    let searchTerms = ['pvp', 'bedwars', '16x', '32x', 'vanilla', 'low-fire'];

    try {
        const packs = await getPacks();
        const catalogTerms = packs.flatMap((pack) => [
            pack.category,
            pack.resolution,
            ...(pack.tags || []),
        ])
            .map((term) => String(term || '').trim().toLowerCase())
            .filter(Boolean);
        searchTerms = [...new Set([...searchTerms, ...catalogTerms])]
            .sort((left, right) => left.localeCompare(right))
            .slice(0, 18);

        if (query) {
            const searchTerm = new RegExp(escapeRegex(query), 'i');
            results = packs.filter((pack) => [pack.name, pack.category, pack.resolution, pack.uploader, pack.description, ...(pack.tags || [])]
                .some((field) => searchTerm.test(String(field || ''))));
        }

        res.render('search/results', {
            title: `Search Results for "${query}"`,
            query,
            results,
            searchTerms,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;