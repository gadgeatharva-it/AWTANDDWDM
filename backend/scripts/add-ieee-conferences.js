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

function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function parseArgs(argv) {
  const out = { count: 25 };
  const args = argv.slice(2);
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--count') {
      out.count = Number(args[i + 1]);
      i += 1;
    }
  }
  if (process.env.IEEE_EVENTS_COUNT) out.count = Number(process.env.IEEE_EVENTS_COUNT);
  out.count = clamp(Number(out.count) || 25, 20, 30);
  return out;
}

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function withTime(date, hour, minute = 0) {
  const d = new Date(date);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function buildIeeeEvents(count) {
  const topics = [
    { short: 'ICAI', name: 'International Conference on Artificial Intelligence', tags: ['ai', 'ml'] },
    { short: 'ICCS', name: 'International Conference on Cyber Security', tags: ['cybersecurity', 'networking'] },
    { short: 'ICSP', name: 'International Conference on Signal Processing', tags: ['signal-processing', 'dsp'] },
    { short: 'ICCV', name: 'International Conference on Computer Vision', tags: ['computer-vision', 'ai'] },
    { short: 'ICN', name: 'International Conference on Networking', tags: ['networking', 'cloud'] },
    { short: 'ICIoT', name: 'International Conference on Internet of Things', tags: ['iot', 'embedded'] },
    { short: 'ICRE', name: 'International Conference on Renewable Energy', tags: ['renewable-energy', 'power'] },
    { short: 'ICRob', name: 'International Conference on Robotics and Automation', tags: ['robotics', 'automation'] },
    { short: 'ICQC', name: 'International Conference on Quantum Computing', tags: ['quantum', 'computing'] },
    { short: 'ICVLSI', name: 'International Conference on VLSI and Microelectronics', tags: ['vlsi', 'hardware'] },
    { short: 'IC5G', name: 'International Conference on 5G and Beyond', tags: ['5g', 'telecom'] },
    { short: 'ICDS', name: 'International Conference on Data Science', tags: ['data-science', 'analytics'] },
    { short: 'ICSE', name: 'International Conference on Software Engineering Practices', tags: ['software', 'engineering'] },
    { short: 'ICBME', name: 'International Conference on Biomedical Engineering', tags: ['biomed', 'healthtech'] },
    { short: 'ICEV', name: 'International Conference on Electric Vehicles', tags: ['ev', 'mobility'] },
  ];

  const venues = [
    { location: 'Bombay Exhibition Centre, Mumbai, India', tzHint: 'IST' },
    { location: 'BIEC, Bengaluru, India', tzHint: 'IST' },
    { location: 'Hyderabad International Convention Centre, Hyderabad, India', tzHint: 'IST' },
    { location: 'India Habitat Centre, New Delhi, India', tzHint: 'IST' },
    { location: 'Chennai Trade Centre, Chennai, India', tzHint: 'IST' },
    { location: 'Pune International Exhibition & Convention Centre, Pune, India', tzHint: 'IST' },
    { location: 'IICC, Dwarka, New Delhi, India', tzHint: 'IST' },
    { location: 'MIT World Peace University Auditorium, Pune, India', tzHint: 'IST' },
    { location: 'International Convention Centre Sydney, Sydney, Australia', tzHint: 'AET' },
    { location: 'Singapore EXPO, Singapore', tzHint: 'SGT' },
    { location: 'Kuala Lumpur Convention Centre, Kuala Lumpur, Malaysia', tzHint: 'MYT' },
    { location: 'Dubai World Trade Centre, Dubai, UAE', tzHint: 'GST' },
    { location: 'HKTDC Exhibition Centre, Hong Kong', tzHint: 'HKT' },
    { location: 'Japan Convention Center (Makuhari Messe), Chiba, Japan', tzHint: 'JST' },
    { location: 'Messe Berlin, Berlin, Germany', tzHint: 'CET' },
    { location: 'RAI Amsterdam, Amsterdam, Netherlands', tzHint: 'CET' },
    { location: 'Fira Barcelona, Barcelona, Spain', tzHint: 'CET' },
    { location: 'Moscone Center, San Francisco, CA, USA', tzHint: 'PST' },
    { location: 'Javits Center, New York, NY, USA', tzHint: 'EST' },
    { location: 'Metro Toronto Convention Centre, Toronto, Canada', tzHint: 'EST' },
    { location: 'Cape Town International Convention Centre, Cape Town, South Africa', tzHint: 'SAST' },
  ];

  const now = new Date();
  const base = addDays(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())), 7);

  const durations = [2, 2, 3, 3, 4, 5]; // days

  const events = [];
  for (let i = 0; i < count; i += 1) {
    const topic = topics[i % topics.length];
    const venue = venues[i % venues.length];
    const durationDays = durations[i % durations.length];

    // Spread across the next ~14 months, with different weekdays.
    const start = addDays(base, i * 17);
    const startDate = withTime(start, 9, 30);
    const endDate = withTime(addDays(start, durationDays - 1), 17, 30);

    const year = startDate.getUTCFullYear();
    const title = `IEEE ${topic.short} ${year} • ${venue.location.split(',')[0]}`;

    const description = [
      `${topic.name} (IEEE ${topic.short} ${year}) brings together researchers, engineers, and industry leaders for keynotes, peer sessions, and applied workshops.`,
      `Tracks include ${topic.tags.join(', ')}, best-paper awards, student poster sessions, and an industry expo.`,
      `Venue: ${venue.location}. Sessions run ${durationDays} day${durationDays === 1 ? '' : 's'} with networking events and panel discussions.`,
    ].join(' ');

    const capacity = 150 + (i % 8) * 50; // 150..500
    const price = i % 5 === 0 ? 0 : 499 + (i % 6) * 250; // some free, some paid

    events.push({
      title,
      description: description.slice(0, 1000),
      category: 'conference',
      status: 'published',
      location: venue.location,
      startDate,
      endDate,
      capacity,
      registeredCount: 0,
      price,
      tags: ['ieee', 'conference', topic.short.toLowerCase(), ...topic.tags],
    });
  }

  return events;
}

async function main() {
  const { count } = parseArgs(process.argv);

  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI env var (set it in backend/.env or your shell).');
  }

  await mongoose.connect(process.env.MONGO_URI);

  const organiser =
    (await User.findOne({ email: 'gadge@gmail.com' }).select('_id email role').lean())
    || (await User.findOne({ role: 'organiser' }).select('_id email role').lean());

  if (!organiser) {
    throw new Error('No organiser user found. Create an organiser account first.');
  }

  const docs = buildIeeeEvents(count).map((e) => ({ ...e, organiser: organiser._id }));
  const titles = docs.map((d) => d.title);
  const existingTitles = new Set(await Event.find({ title: { $in: titles } }).distinct('title'));
  const toInsert = docs.filter((d) => !existingTitles.has(d.title));

  console.log(`Target insert: ${docs.length}`);
  console.log(`Already exist: ${docs.length - toInsert.length}`);
  console.log(`Will insert:   ${toInsert.length}`);

  if (toInsert.length === 0) return;

  const res = await Event.insertMany(toInsert, { ordered: true });
  console.log(`Inserted: ${res.length}`);
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

