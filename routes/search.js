const express = require('express');
const router = express.Router();

// Mock data for search results
const mockPacks = [
    { id: 1, name: "PvP Pack 32x", resolution: "32x", category: "PvP", downloads: 1240, uploader: "PackCreator123", thumbnail: "/images/default-thumbnail.svg", isPort: true },
    { id: 2, name: "Bedwars Dreams", resolution: "64x", category: "Bedwars", downloads: 890, uploader: "TextureArtist", thumbnail: "/images/default-thumbnail.svg", isPort: false },
    { id: 3, name: "Skywars Supreme", resolution: "16x", category: "Skywars", downloads: 2100, uploader: "SkyGod420", thumbnail: "/images/default-thumbnail.svg", isPort: true },
    { id: 4, name: "Vanilla Plus", resolution: "32x", category: "Vanilla", downloads: 560, uploader: "VanillaLover", thumbnail: "/images/default-thumbnail.svg", isPort: false }
];

// Search page
router.get('/', (req, res) => {
    const query = req.query.q || '';
    let results = [];

    if (query) {
        // Simple search functionality
        const searchTerm = query.toLowerCase();
        results = mockPacks.filter(pack =>
            pack.name.toLowerCase().includes(searchTerm) ||
            pack.category.toLowerCase().includes(searchTerm) ||
            pack.resolution.toLowerCase().includes(searchTerm)
        );
    }

    res.render('search/results', {
        title: `Search Results for "${query}"`,
        query: query,
        results: results
    });
});

module.exports = router;