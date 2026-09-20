import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';

dotenv.config();

const email = process.argv[2];

if (!email) {
  console.log('----------------------------------------------------');
  console.log('SkillSwap Admin Role Utility');
  console.log('Usage: npm run make-admin <user-email>');
  console.log('Example: npm run make-admin admin@example.com');
  console.log('----------------------------------------------------');
  process.exit(1);
}

async function makeAdmin() {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is not defined in backend .env');
    }
    await mongoose.connect(process.env.MONGO_URI);
    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      console.error(`❌ User with email "${email}" not found.`);
      console.log('Tip: Register this user first via the web app (/register), then run this script.');
      process.exit(1);
    }

    user.role = 'admin';
    await user.save();

    console.log('----------------------------------------------------');
    console.log(`✅ SUCCESS: ${user.name} (${user.email}) is now an ADMIN!`);
    console.log('You can now log in at /login and navigate to /admin.');
    console.log('----------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error updating user role:', err.message);
    process.exit(1);
  }
}

makeAdmin();
