/**
 * seed.js — Populate the EventFlow database with ~1000 demo records
 *   • 100 Users  (attendees + organisers + 1 admin)
 *   • 200 Events (spread across categories, statuses, dates)
 *   • 700 Registrations (linking attendees to events)
 *
 * Usage:  node seed.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const Event = require('./models/Event');
const Registration = require('./models/Registration');

// ──────────────────────────── Helpers ────────────────────────────

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));

// ──────────────────────────── Data pools ────────────────────────────

const firstNames = [
  'Aarav','Aditi','Amit','Ananya','Arjun','Bhavya','Chirag','Diya','Esha','Farhan',
  'Gaurav','Harini','Ishaan','Jaya','Karan','Lavanya','Manish','Neha','Omkar','Pallavi',
  'Rahul','Riya','Sahil','Tanvi','Uday','Varun','Waris','Yash','Zara','Aisha',
  'Nikhil','Pooja','Rohan','Shreya','Vivek','Meera','Akash','Kavya','Pranav','Sana',
  'Dev','Anita','Kunal','Priya','Rajesh','Sneha','Tarun','Uma','Vikram','Deepa',
];

const lastNames = [
  'Sharma','Patel','Gupta','Singh','Kumar','Verma','Joshi','Mishra','Reddy','Nair',
  'Iyer','Rao','Desai','Kulkarni','Menon','Chauhan','Pillai','Agarwal','Bhat','Saxena',
  'Gadge','Patil','Jadhav','Shinde','Pawar','Deshpande','Kadam','Kale','More','Thakur',
];

const eventPrefixes = [
  'Annual','International','National','Regional','Virtual','Hybrid','Premier','Grand',
  'Exclusive','Community','Open','Pro','Advanced','Beginner','Elite','Global','Tech',
  'Creative','Innovation','Future',
];

const eventTopics = [
  'AI & Machine Learning Summit','Web Development Bootcamp','Data Science Conference',
  'Cloud Computing Workshop','Cybersecurity Forum','Blockchain Expo','DevOps Days',
  'Mobile App Hackathon','UX Design Sprint','Digital Marketing Masterclass',
  'Startup Pitch Night','IoT Innovation Lab','AR/VR Experience','Python Deep Dive',
  'JavaScript Conference','React Native Workshop','Full Stack Meetup','Database Optimization',
  'Agile Leadership Forum','Open Source Celebration','Product Management Talk',
  'Game Development Jam','Robotics Challenge','Quantum Computing Intro',
  'Green Tech Symposium','FinTech Roundtable','HealthTech Summit','EdTech Showcase',
  'Music Production Workshop','Photography Masterclass','Creative Writing Retreat',
  'Fitness & Wellness Expo','Cooking Competition','Travel Meetup','Art Exhibition',
  'Film Screening Night','Podcast Launch Party','Book Club Gathering','Networking Mixer',
  'Career Fair','Volunteer Drive','Charity Gala','Cultural Festival',
  'Sports Analytics Meet','E-Sports Tournament','Marathon Training Camp',
  'Yoga & Meditation Retreat','Dance Workshop','Public Speaking Bootcamp','Leadership Summit',
];

const locations = [
  'Mumbai Convention Center','Delhi Tech Hub','Bangalore IT Park','Pune Innovation Hall',
  'Hyderabad Digital Arena','Chennai Trade Center','Kolkata Science City','Ahmedabad Expo',
  'Jaipur Palace Grounds','Goa Beach Resort','Online','Zoom Virtual','Google Meet',
  'Microsoft Teams','Hybrid — Mumbai + Online','Hybrid — Delhi + Online',
  'Coworking Space, Andheri','University Auditorium, Pune','IIT Bombay Campus',
  'BITS Pilani Auditorium',
];

const categories = ['conference','workshop','webinar','meetup','concert','sports','other'];
const statuses = ['draft','published','cancelled','completed'];
const statusWeights = [0.05, 0.55, 0.05, 0.35]; // mostly published & completed

const regStatuses = ['confirmed','cancelled','waitlisted'];
const regStatusWeights = [0.80, 0.10, 0.10];

const tagPool = [
  'tech','ai','ml','web','mobile','cloud','devops','security','blockchain','iot',
  'data','python','javascript','react','node','design','ux','ui','startup','marketing',
  'health','fitness','music','art','film','education','career','networking','culture','sports',
];

const notePool = [
  'Looking forward to this event!','Excited to attend.','Will bring a friend.',
  'Registered early for front seats.','Hope to network with speakers.',
  'Interested in the workshop section.','Planning to volunteer too.',
  'First time attending — can\'t wait!','Recommended by a colleague.',
  'Will need vegetarian meal option.','Bringing my laptop for the Hackathon.',
  'Hope there are good parking facilities.','Registered for the full-day pass.',
  'Interested in the keynote speaker.','Want to learn about new trends.',
  '','','','','', // empty notes are common
];

function weightedPick(arr, weights) {
  const r = Math.random();
  let cum = 0;
  for (let i = 0; i < arr.length; i++) {
    cum += weights[i];
    if (r <= cum) return arr[i];
  }
  return arr[arr.length - 1];
}

function generateTags() {
  const count = randInt(1, 5);
  const tags = new Set();
  while (tags.size < count) tags.add(pick(tagPool));
  return [...tags];
}

function generateDescription(title) {
  const intros = [
    `Join us for the ${title}, an incredible opportunity to learn and grow.`,
    `${title} brings together industry experts and enthusiasts for an unforgettable experience.`,
    `Don't miss the ${title}! Connect, learn, and innovate with the best minds.`,
    `The ${title} is designed for professionals and students alike who want to stay ahead.`,
    `Experience the future at ${title}. Hands-on sessions, keynotes, and networking await.`,
  ];
  return pick(intros);
}

// ──────────────────────────── Seed logic ────────────────────────────

async function seed() {
  console.log('🌱 Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await Promise.all([User.deleteMany({}), Event.deleteMany({}), Registration.deleteMany({})]);

  // ─── 1. Create 100 Users ───
  console.log('👤 Creating 100 users...');
  const hashedPassword = await bcrypt.hash('password123', 12);

  const userDocs = [];

  // 1 admin
  userDocs.push({
    name: 'Admin User',
    email: 'admin@eventflow.com',
    password: hashedPassword,
    role: 'admin',
  });

  // 30 organisers
  for (let i = 0; i < 30; i++) {
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    userDocs.push({
      name: `${fn} ${ln}`,
      email: `organiser.${fn.toLowerCase()}${i}@eventflow.com`,
      password: hashedPassword,
      role: 'organiser',
    });
  }

  // 69 attendees
  for (let i = 0; i < 69; i++) {
    const fn = pick(firstNames);
    const ln = pick(lastNames);
    userDocs.push({
      name: `${fn} ${ln}`,
      email: `${fn.toLowerCase()}.${ln.toLowerCase()}${i}@gmail.com`,
      password: hashedPassword,
      role: 'attendee',
    });
  }

  // Insert users directly (bypass pre-save hook since we already hashed)
  const users = await User.insertMany(userDocs);
  const organisers = users.filter((u) => u.role === 'organiser');
  const attendees = users.filter((u) => u.role === 'attendee');
  console.log(`   ✅ ${users.length} users created (1 admin, ${organisers.length} organisers, ${attendees.length} attendees)\n`);

  // ─── 2. Create 200 Events ───
  console.log('🎪 Creating 200 events...');
  const now = new Date();
  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const sixMonthsLater = new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000);

  const eventDocs = [];
  for (let i = 0; i < 200; i++) {
    const title = `${pick(eventPrefixes)} ${pick(eventTopics)}`;
    const startDate = randDate(sixMonthsAgo, sixMonthsLater);
    const durationHours = randInt(2, 48);
    const endDate = new Date(startDate.getTime() + durationHours * 60 * 60 * 1000);
    const capacity = randInt(20, 500);
    const status = weightedPick(statuses, statusWeights);

    // If event is in the past, make it completed; if cancelled, keep cancelled
    let finalStatus = status;
    if (endDate < now && status === 'published') finalStatus = 'completed';
    if (startDate > now && status === 'completed') finalStatus = 'published';

    eventDocs.push({
      title,
      description: generateDescription(title),
      category: pick(categories),
      status: finalStatus,
      location: pick(locations),
      startDate,
      endDate,
      capacity,
      registeredCount: 0, // will update after registrations
      price: pick([0, 0, 0, 99, 199, 299, 499, 999, 1499, 2499]),
      tags: generateTags(),
      organiser: pick(organisers)._id,
    });
  }

  const events = await Event.insertMany(eventDocs);
  console.log(`   ✅ ${events.length} events created\n`);

  // ─── 3. Create 700 Registrations ───
  console.log('📝 Creating 700 registrations...');
  const regDocs = [];
  const regSet = new Set(); // track unique (event, attendee) pairs

  let attempts = 0;
  while (regDocs.length < 700 && attempts < 5000) {
    attempts++;
    const event = pick(events);
    const attendee = pick(attendees);
    const key = `${event._id}_${attendee._id}`;

    if (regSet.has(key)) continue;
    regSet.add(key);

    // Registration date should be before event start (or around it)
    const regDate = randDate(
      new Date(event.startDate.getTime() - 60 * 24 * 60 * 60 * 1000), // 60 days before
      event.startDate
    );

    regDocs.push({
      event: event._id,
      attendee: attendee._id,
      status: weightedPick(regStatuses, regStatusWeights),
      notes: pick(notePool),
      createdAt: regDate,
      updatedAt: regDate,
    });
  }

  const registrations = await Registration.insertMany(regDocs);
  console.log(`   ✅ ${registrations.length} registrations created\n`);

  // ─── 4. Update registeredCount on events ───
  console.log('🔄 Updating event registration counts...');
  const regCounts = {};
  registrations.forEach((r) => {
    if (r.status === 'confirmed') {
      const eid = r.event.toString();
      regCounts[eid] = (regCounts[eid] || 0) + 1;
    }
  });

  const bulkOps = Object.entries(regCounts).map(([eventId, count]) => ({
    updateOne: {
      filter: { _id: new mongoose.Types.ObjectId(eventId) },
      update: { $set: { registeredCount: count } },
    },
  }));

  if (bulkOps.length > 0) await Event.bulkWrite(bulkOps);
  console.log(`   ✅ Updated counts for ${bulkOps.length} events\n`);

  // ─── Summary ───
  console.log('═══════════════════════════════════════');
  console.log('  🎉 SEED COMPLETE — Database Summary');
  console.log('═══════════════════════════════════════');
  console.log(`  👤 Users:          ${users.length}`);
  console.log(`  🎪 Events:         ${events.length}`);
  console.log(`  📝 Registrations:  ${registrations.length}`);
  console.log(`  📊 Total records:  ${users.length + events.length + registrations.length}`);
  console.log('═══════════════════════════════════════');
  console.log('\n  🔑 Login credentials for all users:');
  console.log('     Password: password123');
  console.log('     Admin:    admin@eventflow.com');
  console.log(`     Sample:   ${users[1].email}`);
  console.log(`     Sample:   ${users[35].email}\n`);

  await mongoose.disconnect();
  console.log('🔌 Disconnected from MongoDB. Done!');
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
