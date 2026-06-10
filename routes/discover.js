const express = require('express');
const router = express.Router();

// Mock data for discover/popular packs
const mockPacks = [
    { id: 1, name: "PvP Pack 32x", resolution: "32x", category: "PvP", downloads: 1240, uploader: "PackCreator123", thumbnail: "/images/default-thumbnail.png", isPort: true },
    { id: 2, name: "Bedwars Dreams", resolution: "64x", category: "Bedwars", downloads: 890, uploader: "TextureArtist", thumbnail: "/images/default-thumbnail.png", isPort: false },
    { id: 3, name: "Skywars Supreme", resolution: "16x", category: "Skywars", downloads: 2100, uploader: "SkyGod420", thumbnail: "/images/default-thumbnail.png", isPort: true },
    { id: 4, name: "Vanilla Plus", resolution: "32x", category: "Vanilla", downloads: 560, uploader: "VanillaLover", thumbnail: "/images/default-thumbnail.png", isPort: false },
    { id: 5, name: "Ultimate PvP Bundle", resolution: "64x", category: "PvP", downloads: 3200, uploader: "PvPMaster", thumbnail: "/images/default-thumbnail.png", isPort: true }
];

// Discover page - show popular/trending packs
router.get('/', (req, res) => {
    // Sort by downloads (most popular first)
    const popularPacks = [...mockPacks].sort((a, b) => b.downloads - a.downloads);

    res.render('discover/index', {
        title: 'Discover Popular Texture Packs',
        packs: popularPacks
    });
});

module.exports = router;