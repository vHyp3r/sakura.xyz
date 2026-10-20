const express = require('express');
const path = require('path');
const fs = require('fs');
const { getPacks, getPackById, getPackFileStream, incrementDownloads } = require('../src/services/packService');
const { getAccountSession } = require('../src/services/accountAuth');
const { getAccountById } = require('../src/services/accountService');
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
    const owner = pack.uploaderId ? await getAccountById(pack.uploaderId) : null;
    const session = getAccountSession(req);
    const isOwner = Boolean(session && (
        (pack.uploaderId && session.accountId === String(pack.uploaderId))
        || (!pack.uploaderId && session.username?.toLowerCase() === pack.uploader?.toLowerCase())
    ));

    res.render('packs/detail', {
        title: pack.name,
                pack,
        owner,
        isOwner,
        fileAvailable: Boolean((filePath && fs.existsSync(filePath)) || pack.fileStorageId),
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
        if (fs.existsSync(filePath)) {
            await incrementDownloads(pack._id);
            return res.download(filePath, path.basename(filePath), (error) => {
                if (error && !res.headersSent) next(error);
            });
        }

        const storedFile = await getPackFileStream(pack.fileStorageId);
        if (!storedFile) {
            return res.status(404).render('error', {
                title: 'Pack File Unavailable',
                message: 'This pack is listed in the gallery, but its download file is no longer available.',
            });
        }

        await incrementDownloads(pack._id);
        res.setHeader('Content-Type', storedFile.file.contentType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `attachment; filename="${path.basename(pack.originalFileName || storedFile.file.filename)}"`);
        storedFile.bucket.openDownloadStream(storedFile.file._id).on('error', next).pipe(res);
    } catch (error) {
        next(error);
    }
});

module.exports = router;