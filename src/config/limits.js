// Centralized zip bomb protection limits
// Used by upload, converter, and packConverter

module.exports = {
  // .mcpack upload limits (routes/upload.js)
  MCPACK: {
    MAX_ENTRIES: 5000,
    MAX_UNCOMPRESSED_BYTES: 200 * 1024 * 1024, // 200 MB
    MAX_COMPRESSION_RATIO: 100,
  },

  // Converter API limits (routes/converter.js)
  CONVERTER: {
    MAX_ENTRIES: 10000,
    MAX_UNCOMPRESSED_BYTES: 300 * 1024 * 1024, // 300 MB
    MAX_COMPRESSION_RATIO: 100,
  },

  // Pack converter service limits (src/services/packConverter.js)
  PACK_CONVERTER: {
    MAX_ENTRIES: 1000,
    MAX_UNCOMPRESSED_BYTES: 100 * 1024 * 1024, // 100 MB
    MAX_COMPRESSION_RATIO: 100,
  },
};