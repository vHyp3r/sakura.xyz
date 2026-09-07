const mongoose = require('mongoose');
require('dotenv').config();

async function seedDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;

    // Create and insert test data
    const packsCollection = db.collection('packs');
    await packsCollection.deleteMany({}); // Clear existing data

    const testPacks = [
      { title: 'PvP Clips', description: 'Popular pvp moments', category: '2b2e', clips: [] },
      { title: '2b2e Highlights', description: '2b2e clips', category: 'gaming', clips: [] },
      { title: 'Sneak Peaks', description: 'wips', category: 'wips', clips: [] }
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