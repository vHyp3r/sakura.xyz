const mongoose = require('mongoose');
const fs = require('fs');
const Pack = require('../../models/Pack');
const PackView = require('../../models/PackView');

function normalizeTags(tags) {
  const values = Array.isArray(tags) ? tags : String(tags || '').split(',');
  return [...new Set(values
    .map((tag) => String(tag).trim().toLowerCase().replace(/\s+/g, '-'))
    .filter((tag) => /^[a-z0-9][a-z0-9-]{0,23}$/.test(tag)))]
    .slice(0, 10);
}

async function getPacks() {
  return Pack.find().sort({ createdAt: -1 }).lean();
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
  return Pack.find({ _id: { $in: validIds } }).sort({ createdAt: -1 }).lean();
}

async function createPack(packData) {
  return Pack.create({ ...packData, tags: normalizeTags(packData.tags) });
}

async function storePackFile(filePath, filename, contentType = 'application/octet-stream') {
  if (mongoose.connection.readyState !== 1) throw new Error('MongoDB must be connected to store pack files.');
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'packFiles' });
  return new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, { contentType });
    fs.createReadStream(filePath)
      .on('error', reject)
      .pipe(upload)
      .on('error', reject)
      .on('finish', () => resolve(upload.id));
  });
}

async function storePackBuffer(buffer, filename, contentType = 'application/octet-stream') {
  if (mongoose.connection.readyState !== 1) throw new Error('MongoDB must be connected to store pack files.');
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'packFiles' });
  return new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, { contentType });
    upload.on('error', reject).on('finish', () => resolve(upload.id));
    upload.end(buffer);
  });
}

async function getPackFileStream(fileStorageId) {
  if (!fileStorageId || mongoose.connection.readyState !== 1) return null;
  if (!mongoose.isValidObjectId(fileStorageId)) return null;
  const bucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'packFiles' });
  const id = new mongoose.Types.ObjectId(String(fileStorageId));
  const files = await bucket.find({ _id: id }).toArray();
  return files[0] ? { bucket, file: files[0] } : null;
}

async function getPopularPacks() {
  return Pack.find().sort({ downloads: -1, createdAt: -1 }).lean();
}

async function incrementDownloads(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Pack.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true }).lean();
}

async function incrementViews(id) {
  if (!mongoose.isValidObjectId(id)) return null;
  return Pack.findById(id).select('_id views').lean();
}

async function recordPackView(id, visitorKey) {
  if (!mongoose.isValidObjectId(id) || !visitorKey) return null;
  const pack = await Pack.findById(id).select('_id views').lean();
  if (!pack) return null;

  try {
    await PackView.create({
      packId: id,
      visitorKey: String(visitorKey),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });
  } catch (error) {
    if (error?.code === 11000) return { ...pack, counted: false };
    throw error;
  }

  const updated = await Pack.findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true }).lean();
  return updated ? { ...updated, counted: true } : null;
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
  storePackFile,
  storePackBuffer,
  getPackFileStream,
  createPack,
  incrementDownloads,
  incrementViews,
  recordPackView,
  togglePackList,
  addPackComment,
  normalizeTags,
};