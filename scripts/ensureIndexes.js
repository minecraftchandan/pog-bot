// one-off script to ensure database indexes for faster lookups
// Usage: node scripts/ensureIndexes.js
// reads MONGO_URI from environment or .env file (dotenv is loaded automatically)

require('dotenv').config();
const mongoose = require('mongoose');
const Series = require('../models/Series');

async function run() {
  if (!process.env.MONGO_URI) {
    console.error('MONGO_URI environment variable is required (set in .env or shell)');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Connected to MongoDB');

    // ensure an index on the `series` field for case-insensitive lookups
    // this is helpful if the collection grows large
    await Series.collection.createIndex({ series: 1 }, { name: 'series_idx' });
    console.log('✅ Created/ensured index on series field');
  } catch (err) {
    console.error('❌ Index creation failed:', err);
  } finally {
    mongoose.disconnect();
  }
}

run();