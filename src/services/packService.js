const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const Pack = require('../../models/Pack');

function normalizeTags(tags) {
  const values = Array.isArray(tags) ? tags : String(tags || '').split(',');
  return [...new Set(values
    .map((tag) => String(tag).trim().toLowerCase().replace(/\s+/g, '-'))
    .filter((tag) => /^[a-z0-9][a-z0-9-]{0,23}$/.test(tag)))]
    .slice(0, 10);
}

async function getPacks() {
  const packs = await Pack.find().sort({ createdAt: -1 }).lean();
  return packs.filter(hasAvailableFile);
}

async function getPackById(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Pack.findById(id).lean();
}

async function createPack(packData) {
  return Pack.create({ ...packData, tags: normalizeTags(packData.tags) });
}

async function getPopularPacks() {
  const packs = await Pack.find().sort({ downloads: -1, createdAt: -1 }).lean();
  return packs.filter(hasAvailableFile);
}

function hasAvailableFile(pack) {
  if (!pack.file) return false;
  const filePath = path.join(__dirname, '..', '..', 'public', pack.file.replace(/^\//, ''));
  return fs.existsSync(filePath);
}

async function incrementDownloads(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Pack.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true }).lean();
}

module.exports = {
  getPacks,
  getPopularPacks,
  getPackById,
  createPack,
  incrementDownloads,
  normalizeTags,
};