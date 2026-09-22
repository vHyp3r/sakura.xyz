const express = require('express');
const path = require('path');
const fs = require('fs');
const { getPacks, getPackById, incrementDownloads } = require('../src/services/packService');
const router = express.Router();

router.get('/', async (req, res, next) => {
    try {
        const packs = await getPacks();

        res.render('packs/index', {
        title: 'All Texture Packs',
                packs,
    });
    } catch (error) {
        next(error);
    }
});

router.get('/:id', async (req, res, next) => {
    try {
        const pack = await getPackById(req.params.id);
        if (!pack) {
        return res.status(404).render('error', {
            title: 'Pack Not Found',
            message: 'The requested texture pack could not be found.'
        });
    }
    const filePath = pack.file
        ? path.join(__dirname, '..', 'public', pack.file.replace(/^\//, ''))
        : null;

    res.render('packs/detail', {
        title: pack.name,
                pack,
        fileAvailable: Boolean(filePath && fs.existsSync(filePath)),
    });
    } catch (error) {
        next(error);
    }
});

router.get('/:id/download', async (req, res, next) => {
    try {
        const pack = await getPackById(req.params.id);
        if (!pack || !pack.file) {
        return res.status(404).send('Pack file not found.');
    }

        const filePath = path.join(__dirname, '..', 'public', pack.file.replace(/^\//, ''));
        if (!fs.existsSync(filePath)) {
            return res.status(404).render('error', {
                title: 'Pack File Unavailable',
                message: 'This pack is listed in the gallery, but its download file is no longer available.',
            });
        }

        await incrementDownloads(pack._id);
        res.download(filePath, path.basename(filePath), (error) => {
            if (error && !res.headersSent) {
                next(error);
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;