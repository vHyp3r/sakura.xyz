const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
        if (file.mimetype === 'application/octet-stream' &&
            file.originalname.endsWith('.mcpack')) {
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
]), (req, res) => {
    try {
        if (!req.files.packFile) {
            return res.status(400).send('No pack file uploaded.');
        }

        const packFile = req.files.packFile[0];
        const thumbnailFile = req.files.thumbnail ? req.files.thumbnail[0] : null;

        // Here you would typically save pack metadata to a database
        // For now, we'll just return success
        res.render('upload-success', {
            title: 'Upload Successful',
            packName: req.body.packName || 'Unknown Pack',
            fileName: packFile.filename,
            originalName: packFile.originalname,
            thumbnail: thumbnailFile ? thumbnailFile.filename : null
        });
    } catch (error) {
        res.status(500).send(`Upload failed: ${error.message}`);
    }
});

module.exports = router;