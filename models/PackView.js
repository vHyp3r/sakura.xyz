const mongoose = require('mongoose');

const packViewSchema = new mongoose.Schema(
  {
    packId: { type: mongoose.Schema.Types.ObjectId, required: true },
    visitorKey: { type: String, required: true },
    expiresAt: { type: Date, required: true, expires: 0 },
  },
  { timestamps: true }
);

packViewSchema.index({ packId: 1, visitorKey: 1 }, { unique: true });

module.exports = mongoose.model('PackView', packViewSchema);
