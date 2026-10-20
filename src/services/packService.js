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

async function getPacksByIds(ids) {
  const validIds = (Array.isArray(ids) ? ids : [])
    .filter((id) => mongoose.isValidObjectId(id));
  if (!validIds.length) return [];
  const packs = await Pack.find({ _id: { $in: validIds } }).sort({ createdAt: -1 }).lean();
  return packs.filter(hasAvailableFile);
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

async function incrementViews(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Pack.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();
}

async function togglePackList(id, field, accountId) {
  if (!mongoose.isValidObjectId(id) || !['likedBy', 'superReactedBy'].includes(field)) return null;
  const pack = await Pack.findById(id).select(field).lean();
  if (!pack) return null;
  const values = Array.isArray(pack[field]) ? pack[field].map(String) : [];
  const value = String(accountId);
  const included = values.includes(value);
  const update = included ? { $pull: { [field]: value } } : { $addToSet: { [field]: value } };
  const updated = await Pack.findByIdAndUpdate(id, update, { new: true }).lean();
  return { active: !included, count: updated[field].length };
}

async function addPackComment(id, accountId, username, body) {
  if (!mongoose.isValidObjectId(id)) return null;
  const text = String(body || '').trim();
  if (!text || text.length > 500) throw new Error('Comments must be between 1 and 500 characters.');
  const comment = { accountId: String(accountId), username: String(username), body: text, createdAt: new Date() };
  const updated = await Pack.findByIdAndUpdate(id, { $push: { comments: comment } }, { new: true }).lean();
  return updated ? comment : null;
}

module.exports = {
  getPacks,
  getPopularPacks,
  getPackById,
  getPacksByIds,
  createPack,
  incrementDownloads,
  incrementViews,
  togglePackList,
  addPackComment,
  normalizeTags,
};