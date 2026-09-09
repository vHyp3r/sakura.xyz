const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createPack } = require('../src/services/packService');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = path.join(__dirname, '../public/uploads');
        // Create uploads directory if it doesn't exist
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 50 * 1024 * 1024 // 50MB limit
    },
    fileFilter: function (req, file, cb) {
        // Accept .mcpack files and images for thumbnails
        if (path.extname(file.originalname).toLowerCase() === '.mcpack') {
            cb(null, true);
        } else if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only .mcpack files and images are allowed!'), false);
        }
    }
});

// Upload form page
router.get('/', (req, res) => {
    res.render('upload', { title: 'Upload Texture Pack' });
});

// Handle file upload
router.post('/', upload.fields([
    { name: 'packFile', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 }
]), async (req, res) => {
    try {
        if (!req.files || !req.files.packFile) {
            return res.status(400).send('No pack file uploaded.');
        }

        const packFile = req.files.packFile[0];
        const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

        const pack = await createPack({
            name: req.body.packName,
            description: req.body.description,
            category: req.body.category,
            resolution: req.body.resolution,
            uploader: req.body.uploader || 'Anonymous',
            file: `/uploads/${packFile.filename}`,
            originalFileName: packFile.originalname,
            thumbnail: thumbnailFile
                ? `/uploads/${thumbnailFile.filename}`
                : '/images/default-thumbnail.svg',
        });

        res.render('upload-success', {
            title: 'Upload Successful',
            packName: pack.name,
            fileName: packFile.filename,
            originalName: packFile.originalname,
            thumbnail: thumbnailFile ? thumbnailFile.filename : null,
            packId: pack._id,
        });
    } catch (error) {
        const uploadedFiles = req.files
            ? Object.values(req.files).flat()
            : [];
        uploadedFiles.forEach((file) => {
            fs.unlink(file.path, () => {});
        });
        res.status(500).send(`Upload failed: ${error.message}`);
    }
});

module.exports = router;