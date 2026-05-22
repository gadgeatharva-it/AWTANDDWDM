const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const mongoose = require('mongoose');
const User = require('../models/User');

async function dropIndexIfExists(collection, indexName) {
  try {
    await collection.dropIndex(indexName);
    console.log(`Dropped index: ${indexName}`);
  } catch (err) {
    const msg = String(err?.message || err);
    if (msg.includes('index not found') || msg.includes('IndexNotFound')) return;
    throw err;
  }
}

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI in environment');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const result = await User.updateMany(
    {},
    {
      $unset: {
        isVerified: 1,
        emailVerificationToken: 1,
        emailVerificationExpires: 1,
      },
    }
  );

  const modified = result.modifiedCount ?? result.nModified ?? 0;
  const matched = result.matchedCount ?? result.n ?? 0;
  console.log(`Unset fields complete. matched=${matched} modified=${modified}`);

  // These are the common default names for single-field indexes created by MongoDB/Mongoose.
  await dropIndexIfExists(User.collection, 'isVerified_1');
  await dropIndexIfExists(User.collection, 'emailVerificationToken_1');
  await dropIndexIfExists(User.collection, 'emailVerificationExpires_1');

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err.message || err);
  try {
    await mongoose.disconnect();
  } catch {
    // ignore
  }
  process.exit(1);
});

