const express = require('express');
const { getPacks, searchPacks, getSearchSuggestions } = require('../src/services/packService');
const router = express.Router();

function escapeRegex(value) {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Search page
router.get('/', async (req, res, next) => {
    const query = String(req.query.q || '').trim();
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = 20;
    const skip = (page - 1) * limit;

    try {
        // Get search suggestions from database (not all packs)
        const searchTerms = await getSearchSuggestions(query);

        let results = [];
        let totalResults = 0;

        if (query) {
            // Use database-level search with pagination
            results = await searchPacks(query, { limit, skip, sort: { createdAt: -1 } });

            // Get total count for pagination (separate query)
            const searchTerm = query.trim();
            const escapedTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(escapedTerm, 'i');
            const Pack = require('../models/Pack');
            totalResults = await Pack.countDocuments({
                $or: [
                    { name: regex },
                    { description: regex },
                    { category: regex },
                    { resolution: regex },
                    { uploader: regex },
                    { tags: regex },
                ],
            });
        }

        res.render('search/results', {
            title: query ? `Search Results for "${query}"` : 'Search',
            query,
            results,
            searchTerms,
            pagination: query ? {
                page,
                limit,
                total: totalResults,
                totalPages: Math.ceil(totalResults / limit),
                hasNext: page * limit < totalResults,
                hasPrev: page > 1,
            } : null,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;