const fs = require('fs');
const path = require('path');

// Local dev convenience: load `backend/.env` if present.
const envPath = path.join(__dirname, '..', '.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const mongoose = require('mongoose');
const Event = require('../models/Event');
const Registration = require('../models/Registration');
const Question = require('../models/Question');

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    apply: args.has('--apply'),
    keep: Number(process.env.TRIM_EVENTS_KEEP || 100),
  };
}

async function main() {
  const { apply, keep } = parseArgs(process.argv);

  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI env var (set it in backend/.env or your shell).');
  }
  if (!Number.isFinite(keep) || keep < 0) {
    throw new Error(`Invalid keep value: ${keep}`);
  }

  await mongoose.connect(process.env.MONGO_URI);

  const total = await Event.countDocuments({});
  console.log(`Total events: ${total}`);
  console.log(`Keep newest: ${keep}`);

  if (total <= keep) {
    console.log('Nothing to trim.');
    return;
  }

  const idsToDelete = await Event.find({}, { _id: 1 })
    .sort({ createdAt: -1, _id: -1 })
    .skip(keep)
    .lean()
    .then((docs) => docs.map((d) => d._id));

  console.log(`Events to delete: ${idsToDelete.length}`);

  if (!apply) {
    console.log('Dry run only. Re-run with --apply to delete.');
    return;
  }

  const [eventRes, regRes, qRes] = await Promise.all([
    Event.deleteMany({ _id: { $in: idsToDelete } }),
    Registration.deleteMany({ event: { $in: idsToDelete } }),
    Question.deleteMany({ event: { $in: idsToDelete } }),
  ]);

  console.log(`Deleted events: ${eventRes.deletedCount}`);
  console.log(`Deleted registrations: ${regRes.deletedCount}`);
  console.log(`Deleted questions: ${qRes.deletedCount}`);

  const after = await Event.countDocuments({});
  console.log(`Events after: ${after}`);
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

