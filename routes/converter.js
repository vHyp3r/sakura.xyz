const express = require('express');
const multer = require('multer');
const path = require('node:path');
const { convertPack } = require('../src/services/packConverter');

const router = express.Router();
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
    const targetVersion = String(req.body.targetVersion || '').trim();
    if (!targetVersion) return res.status(400).json({ error: 'Choose a target version.' });
    const direction = path.extname(req.file.originalname).toLowerCase() === '.mcpack'
      ? 'bedrock-to-java'
      : 'java-to-bedrock';
    const converted = await convertPack(req.file.buffer, req.file.originalname, direction, targetVersion);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${converted.filename.replace(/["\\]/g, '')}"`);
    res.send(converted.buffer);
  } catch (error) {
    console.error('Pack conversion failed:', error);
    res.status(422).json({ error: 'The selected pack could not be converted. Make sure it is a valid .zip or .mcpack archive.' });
  }
});

module.exports = router;
