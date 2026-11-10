const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const AdmZip = require('adm-zip');
const { createPack, storePackFile } = require('../src/services/packService');
const { getAccountSession } = require('../src/services/accountAuth');

// Zip bomb protection limits for .mcpack uploads
const MAX_MCPACK_ENTRIES = 5000;
const MAX_MCPACK_UNCOMPRESSED = 200 * 1024 * 1024; // 200 MB
const MAX_MCPACK_COMPRESSION_RATIO = 100;

// Validate .mcpack file structure (must be a valid Bedrock pack with manifest.json)
function validateMcpack(buffer) {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    // Check entry count
    if (entries.length > MAX_MCPACK_ENTRIES) {
      return { valid: false, error: `Pack contains too many files (max ${MAX_MCPACK_ENTRIES}).` };
    }

    // Check total uncompressed size and compression ratio
    let totalUncompressed = 0;
    let totalCompressed = 0;
    let hasManifest = false;

    for (const entry of entries) {
      if (!entry.isDirectory) {
        totalUncompressed += entry.header.size || 0;
        totalCompressed += entry.header.compressedSize || 0;
        if (entry.entryName === 'manifest.json') hasManifest = true;
      }
    }

    if (totalUncompressed > MAX_MCPACK_UNCOMPRESSED) {
      return { valid: false, error: `Pack uncompressed size exceeds ${MAX_MCPACK_UNCOMPRESSED / 1024 / 1024} MB limit.` };
    }
    if (totalCompressed > 0 && totalUncompressed / totalCompressed > MAX_MCPACK_COMPRESSION_RATIO) {
      return { valid: false, error: `Pack compression ratio exceeds ${MAX_MCPACK_COMPRESSION_RATIO}:1 limit (possible zip bomb).` };
    }

    if (!hasManifest) {
      return { valid: false, error: 'Invalid .mcpack: missing manifest.json.' };
    }

    // Validate manifest.json structure
    const manifestEntry = zip.getEntry('manifest.json');
    if (manifestEntry) {
      const manifest = JSON.parse(manifestEntry.getData().toString('utf8'));
      if (!manifest.header || !manifest.modules) {
        return { valid: false, error: 'Invalid manifest.json structure.' };
      }
      if (!manifest.modules.some(m => m.type === 'resources')) {
        return { valid: false, error: 'Pack must contain a resources module.' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid .mcpack file: not a valid zip archive.' };
  }
}

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
        const accountSession = getAccountSession(req);

        // Validate .mcpack file content (not just extension)
        const packBuffer = fs.readFileSync(packFile.path);
        const validation = validateMcpack(packBuffer);
        if (!validation.valid) {
            fs.unlink(packFile.path, () => {});
            if (thumbnailFile) fs.unlink(thumbnailFile.path, () => {});
            return res.status(400).send(`Invalid pack file: ${validation.error}`);
        }

        const thumbnailData = thumbnailFile
            ? `data:${thumbnailFile.mimetype};base64,${fs.readFileSync(thumbnailFile.path).toString('base64')}`
            : '';
        const fileStorageId = await storePackFile(packFile.path, packFile.originalname, packFile.mimetype);

        const pack = await createPack({
            name: req.body.packName,
            description: req.body.description,
            category: req.body.category,
            tags: req.body.tags,
            resolution: req.body.resolution,
            uploader: accountSession?.username || 'Anonymous',
            uploaderId: accountSession?.accountId || '',
            file: `/uploads/${packFile.filename}`,
            fileStorageId,
            originalFileName: packFile.originalname,
            thumbnail: thumbnailFile
                ? `/uploads/${thumbnailFile.filename}`
                : '/images/default-thumbnail.svg',
            thumbnailData,
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