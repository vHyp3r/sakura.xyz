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
      { title: 'Anime Clips', description: 'Popular anime moments', category: 'anime', clips: [] },
      { title: 'Gaming Highlights', description: 'Video game clips', category: 'gaming', clips: [] },
      { title: 'Movie Scenes', description: 'Iconic film moments', category: 'movies', clips: [] }
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