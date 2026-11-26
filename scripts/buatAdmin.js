require('dotenv').config();

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/userModel');

async function buatAdmin() {
  if (!process.env.MONGODB_URI) {
    console.error('Galat: MONGODB_URI belum disetel pada berkas .env');
    process.exit(1);
  }

  const username = (process.env.ADMIN_USERNAME || 'admin').trim();
  const email = (process.env.ADMIN_EMAIL || 'admin@cinematix.id').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin123!';

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Terhubung ke MongoDB.');

    const existing = await User.findOne({
      $or: [{ email }, { username }],
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (existing) {
      const updated = await User.findByIdAndUpdate(
        existing._id,
        {
          username,
          email,
          password: hashedPassword,
          role: 'admin',
        },
        { returnDocument: 'after', runValidators: true }
      );

      console.log('Akun admin sudah ada dan diperbarui secara idempoten:');
      console.log(`- ID       : ${updated._id}`);
      console.log(`- Username : ${updated.username}`);
      console.log(`- Email    : ${updated.email}`);
      console.log(`- Role     : ${updated.role}`);
    } else {
      const created = await User.create({
        username,
        email,
        password: hashedPassword,
        role: 'admin',
      });

      console.log('Akun admin pertama berhasil dibuat:');
      console.log(`- ID       : ${created._id}`);
      console.log(`- Username : ${created.username}`);
      console.log(`- Email    : ${created.email}`);
      console.log(`- Role     : ${created.role}`);
    }
  } catch (err) {
    console.error('Gagal membuat akun admin:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

buatAdmin();
