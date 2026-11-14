const express = require('express');
const multer = require('multer');
const path = require('node:path');
const AdmZip = require('adm-zip');
const { convertPack } = require('../src/services/packConverter');
const { CONVERTER } = require('../src/config/limits');

const router = express.Router();

// Zip bomb protection limits for converter
const { MAX_ENTRIES: MAX_CONVERTER_ENTRIES, MAX_UNCOMPRESSED_BYTES: MAX_CONVERTER_UNCOMPRESSED, MAX_COMPRESSION_RATIO: MAX_CONVERTER_COMPRESSION_RATIO } = CONVERTER;

function validateConverterInput(buffer, filename) {
  try {
    const zip = new AdmZip(buffer);
    const entries = zip.getEntries();

    if (entries.length > MAX_CONVERTER_ENTRIES) {
      return { valid: false, error: `Archive contains too many entries (max ${MAX_CONVERTER_ENTRIES}).` };
    }

    let totalUncompressed = 0;
    let totalCompressed = 0;
    for (const entry of entries) {
      if (!entry.isDirectory) {
        totalUncompressed += entry.header.size || 0;
        totalCompressed += entry.header.compressedSize || 0;
      }
    }
    if (totalUncompressed > MAX_CONVERTER_UNCOMPRESSED) {
      return { valid: false, error: `Archive uncompressed size exceeds ${MAX_CONVERTER_UNCOMPRESSED / 1024 / 1024} MB limit.` };
    }
    if (totalCompressed > 0 && totalUncompressed / totalCompressed > MAX_CONVERTER_COMPRESSION_RATIO) {
      return { valid: false, error: `Archive compression ratio exceeds ${MAX_CONVERTER_COMPRESSION_RATIO}:1 limit (possible zip bomb).` };
    }

    // Validate expected structure based on direction
    const isMcpack = path.extname(filename).toLowerCase() === '.mcpack';
    if (isMcpack) {
      const manifestEntry = zip.getEntry('manifest.json');
      if (!manifestEntry) {
        return { valid: false, error: 'Invalid .mcpack: missing manifest.json.' };
      }
    } else {
      // Java pack should have pack.mcmeta or assets/
      const hasMcmeta = zip.getEntry('pack.mcmeta');
      const hasAssets = entries.some(e => e.entryName.startsWith('assets/'));
      if (!hasMcmeta && !hasAssets) {
        return { valid: false, error: 'Invalid Java pack: missing pack.mcmeta or assets/ directory.' };
      }
    }

    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid archive: not a valid zip file.' };
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    callback(null, /\.(zip|mcpack)$/i.test(file.originalname));
  },
});

router.post(['/convert', '/conversion'], (req, res, next) => {
  upload.single('pack')(req, res, (error) => {
    if (!error) return next();
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'That file is larger than the 300 MB limit.' });
    }
    return res.status(400).json({ error: error.message || 'The selected file could not be uploaded.' });
  });
}, async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Choose a .zip or .mcpack file first.' });

    // Validate zip content
    const validation = validateConverterInput(req.file.buffer, req.file.originalname);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const targetVersion = String(req.body.targetVersion || '').trim();
    if (!targetVersion) return res.status(400).json({ error: 'Choose a target version.' });
    const direction = path.extname(req.file.originalname).toLowerCase() === '.mcpack'
      ? 'bedrock-to-java'
      : 'java-to-bedrock';
    const preserveFormat = req.body.preserveFormat === 'true';
    const converted = await convertPack(req.file.buffer, req.file.originalname, direction, targetVersion, { preserveFormat });
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${converted.filename.replace(/["\\]/g, '')}"`);
    res.setHeader('Content-Length', converted.buffer.length);
    // Stream the buffer to avoid memory pressure for large files
    const { Readable } = require('stream');
    Readable.from(converted.buffer).pipe(res);
  } catch (error) {
    console.error('Pack conversion failed:', error);
    // Don't expose internal error details
    res.status(422).json({ error: 'The selected pack could not be converted. Make sure it is a valid .zip or .mcpack archive.' });
  }
});

module.exports = router;
