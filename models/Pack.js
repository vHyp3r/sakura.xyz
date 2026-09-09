const mongoose = require('mongoose');

const packSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    resolution: { type: String, default: '' },
    category: { type: String, default: '' },
    uploader: { type: String, default: 'Anonymous' },
    thumbnail: { type: String, default: '/images/default-thumbnail.svg' },
    file: { type: String, required: true },
    originalFileName: { type: String, default: '' },
    downloads: { type: Number, default: 0 },
    isPort: { type: Boolean, default: false },
    isRecolor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pack', packSchema);