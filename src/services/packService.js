const mongoose = require('mongoose');
const Pack = require('../../models/Pack');

async function getPacks() {
  return Pack.find().sort({ createdAt: -1 }).lean();
}

async function getPackById(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Pack.findById(id).lean();
}

async function createPack(packData) {
  return Pack.create(packData);
}

async function incrementDownloads(id) {
  if (!mongoose.isValidObjectId(id)) {
    return null;
  }

  return Pack.findByIdAndUpdate(id, { $inc: { downloads: 1 } }, { new: true }).lean();
}

module.exports = {
  getPacks,
  getPackById,
  createPack,
  incrementDownloads,
};