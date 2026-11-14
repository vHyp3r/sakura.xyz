const mongoose = require('mongoose');
require('dotenv').config();
const { getMongoUri } = require('./src/services/dataStore');

async function seedDatabase() {
  try {
    const mongoUri = getMongoUri();
    if (!mongoUri) {
      throw new Error('MongoDB is not configured. Set MONGODB_URI in the environment.');
    }

    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create and insert test data matching Pack schema
    const packsCollection = db.collection('packs');
    await packsCollection.deleteMany({}); // Clear existing data

    const testPacks = [
      {
        name: 'PvP Pack Pro',
        description: 'High-quality PvP texture pack with custom animations',
        category: 'pvp',
        tags: ['pvp', 'combat', '1.21'],
        resolution: '64x',
        uploader: 'Admin',
        uploaderId: '',
        file: '/uploads/pvp-pack-pro.mcpack',
        originalFileName: 'pvp-pack-pro.mcpack',
        thumbnail: '/images/default-thumbnail.svg',
        thumbnailData: '',
        downloads: 1250,
        views: 3400,
        likedBy: [],
        superReactedBy: [],
        comments: [],
        isPort: false,
        isRecolor: false,
        bedrockVersion: '1.21.11',
        javaVersion: '',
      },
      {
        name: 'Faithful 32x',
        description: 'Faithful recreation of default textures at 32x resolution',
        category: 'faithful',
        tags: ['faithful', 'vanilla', '32x'],
        resolution: '32x',
        uploader: 'Admin',
        uploaderId: '',
        file: '/uploads/faithful-32x.mcpack',
        originalFileName: 'faithful-32x.mcpack',
        thumbnail: '/images/default-thumbnail.svg',
        thumbnailData: '',
        downloads: 2100,
        views: 5200,
        likedBy: [],
        superReactedBy: [],
        comments: [],
        isPort: false,
        isRecolor: false,
        bedrockVersion: '1.21.11',
        javaVersion: '',
      },
      {
        name: 'Modern UI Pack',
        description: 'Clean modern UI redesign for Bedrock Edition',
        category: 'ui',
        tags: ['ui', 'modern', 'clean'],
        resolution: '16x',
        uploader: 'Admin',
        uploaderId: '',
        file: '/uploads/modern-ui.mcpack',
        originalFileName: 'modern-ui.mcpack',
        thumbnail: '/images/default-thumbnail.svg',
        thumbnailData: '',
        downloads: 890,
        views: 2100,
        likedBy: [],
        superReactedBy: [],
        comments: [],
        isPort: false,
        isRecolor: false,
        bedrockVersion: '1.21.11',
        javaVersion: '',
      },
    ];

    const result = await packsCollection.insertMany(testPacks);
    console.log(`✅ Inserted ${result.insertedIds.length} test packs`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  }
}

seedDatabase();