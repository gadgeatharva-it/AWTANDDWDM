const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env');
if (process.env.NODE_ENV !== 'production' && fs.existsSync(envPath)) {
  require('dotenv').config({ path: envPath });
}

const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = 'gadgeatharva@gmail.com';
const ADMIN_PASSWORD = '123456';

async function main() {
  if (!process.env.MONGO_URI) {
    throw new Error('Missing MONGO_URI env var (set it in backend/.env or your shell).');
  }

  await mongoose.connect(process.env.MONGO_URI);

  let user = await User.findOne({ email: ADMIN_EMAIL }).select('+password');
  if (!user) {
    user = await User.create({
      name: 'Gadge Atharva',
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      role: 'admin',
      isActive: true,
    });
    console.log(`Created admin: ${user.email}`);
    return;
  }

  user.name = user.name || 'Gadge Atharva';
  user.role = 'admin';
  user.isActive = true;
  user.password = ADMIN_PASSWORD;
  await user.save();
  console.log(`Updated admin: ${user.email}`);
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
