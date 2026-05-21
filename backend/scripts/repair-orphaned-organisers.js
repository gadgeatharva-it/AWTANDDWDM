const fs = require('fs');
const path = require('path');

// Local dev convenience: load `backend/.env` if present.
const envPath = path.join(__dirname, '..', '.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const mongoose = require('mongoose');
const User = require('../models/User');
const Event = require('../models/Event');
const Question = require('../models/Question');

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    apply: args.has('--apply'),
    email: process.env.REPAIR_ORGANISER_EMAIL || '',
  };
}

async function main() {
  const { apply, email } = parseArgs(process.argv);

  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI env var (set it in backend/.env or your shell).');
  }

  await mongoose.connect(process.env.MONGO_URI);

  let fallback = null;
  if (email) {
    fallback = await User.findOne({ email: String(email).trim().toLowerCase() }).select('_id email role').lean();
  }
  if (!fallback) {
    fallback = await User.findOne({ role: 'organiser' }).select('_id email role').lean();
  }

  if (!fallback) {
    throw new Error('No organiser user found to reassign orphaned records to.');
  }

  const userIds = await User.find({}).distinct('_id');

  const orphanEventCount = await Event.countDocuments({ organiser: { $nin: userIds } });
  const orphanQuestionCount = await Question.countDocuments({ organiser: { $nin: userIds } });

  console.log(`Fallback organiser: ${fallback.email || fallback._id} (${fallback.role})`);
  console.log(`Orphaned events: ${orphanEventCount}`);
  console.log(`Orphaned questions: ${orphanQuestionCount}`);

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to update documents.');
    return;
  }

  const [eventRes, questionRes] = await Promise.all([
    Event.updateMany(
      { organiser: { $nin: userIds } },
      { $set: { organiser: fallback._id } }
    ),
    Question.updateMany(
      { organiser: { $nin: userIds } },
      { $set: { organiser: fallback._id } }
    ),
  ]);

  console.log(`Updated events: ${eventRes.modifiedCount}`);
  console.log(`Updated questions: ${questionRes.modifiedCount}`);
}

main()
  .catch((err) => {
    console.error('ERROR:', err.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

