const express = require('express');
const router = express.Router();

// In a real application, this would come from a database
// For now, we'll use mock data
const mockPacks = [
    {
        id: 1,
        name: "PvP Pack 32x",
        resolution: "32x",
        category: "PvP",
        downloads: 1240,
        uploader: "PackCreator123",
        thumbnail: "/images/default-thumbnail.svg",
        file: "/uploads/pvp-pack-32x.mcpack",
        isPort: true
    },
    {
        id: 2,
        name: "Bedwars Dreams",
        resolution: "64x",
        category: "Bedwars",
        downloads: 890,
        uploader: "TextureArtist",
        thumbnail: "/images/default-thumbnail.svg",
        file: "/uploads/bedwars-dreams.mcpack",
        isPort: false
    },
    {
        id: 3,
        name: "Skywars Supreme",
        resolution: "16x",
        category: "Skywars",
        downloads: 2100,
        uploader: "SkyGod420",
        thumbnail: "/images/default-thumbnail.svg",
        file: "/uploads/skywars-supreme.mcpack",
        isPort: true
    }
];

// Get all packs
router.get('/', (req, res) => {
    res.render('packs/index', {
        title: 'All Texture Packs',
        packs: mockPacks
    });
});

// Get pack by ID
router.get('/:id', (req, res) => {
    const pack = mockPacks.find(p => p.id === parseInt(req.params.id));
    if (!pack) {
        return res.status(404).render('error', {
            title: 'Pack Not Found',
            message: 'The requested texture pack could not be found.'
        });
    }
    res.render('packs/detail', {
        title: pack.name,
        pack: pack
    });
});

// Download pack
router.get('/:id/download', (req, res) => {
    const pack = mockPacks.find(p => p.id === parseInt(req.params.id));
    if (!pack || !pack.file) {
        return res.status(404).send('Pack file not found.');
    }

    const filePath = path.join(__dirname, '..', pack.file);
    res.download(filePath, path.basename(pack.file), (err) => {
        if (err) {
            res.status(500).send('Error downloading file.');
        }
    });
});

module.exports = router;