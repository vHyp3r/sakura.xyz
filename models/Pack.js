const mongoose = require('mongoose');

const packSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    resolution: { type: String, default: '' },
    category: { type: String, default: '' },
    tags: { type: [String], default: [] },
    uploader: { type: String, default: 'Anonymous' },
    uploaderId: { type: String, default: '' },
    thumbnail: { type: String, default: '/images/default-thumbnail.svg' },
    thumbnailData: { type: String, default: '' },
    file: { type: String, required: true },
    originalFileName: { type: String, default: '' },
    downloads: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
    likedBy: { type: [String], default: [] },
    superReactedBy: { type: [String], default: [] },
    comments: {
      type: [{
        accountId: String,
        username: String,
        body: String,
        createdAt: { type: Date, default: Date.now },
      }],
      default: [],
    },
    isPort: { type: Boolean, default: false },
    isRecolor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pack', packSchema);