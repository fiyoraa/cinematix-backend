const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const errorHttp = require('../utils/errorHttp');

exports.register = async (req, res, next) => {
  const { username, email, password } = req.body || {};

  if (
    typeof username !== 'string' ||
    typeof email !== 'string' ||
    typeof password !== 'string'
  ) {
    return next(
      errorHttp(400, 'Username, email, dan password wajib diisi dan bertipe string')
    );
  }

  const cleanUsername = username.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanUsername || !cleanEmail || !password.trim()) {
    return next(errorHttp(400, 'Username, email, dan password wajib diisi'));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return next(errorHttp(400, 'Format email tidak valid'));
  }

  if (password.length < 6) {
    return next(errorHttp(400, 'Password minimal terdiri dari 6 karakter'));
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username: cleanUsername,
    email: cleanEmail,
    password: hashedPassword,
    role: 'user',
  });

  return res.status(201).json({
    id: user._id,
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
  });
};

exports.login = async (req, res, next) => {
  const { username, email, password } = req.body || {};

  if (
    (username !== undefined && typeof username !== 'string') ||
    (email !== undefined && typeof email !== 'string') ||
    typeof password !== 'string'
  ) {
    return next(
      errorHttp(400, 'Username dan password wajib bertipe teks (string)')
    );
  }

  const identitas = (username || email || '').trim();
  if (!identitas || !password) {
    return next(errorHttp(400, 'Username dan password wajib diisi'));
  }

  const user = await User.findOne({
    $or: [
      { username: String(identitas) },
      { email: String(identitas).toLowerCase() },
    ],
  }).select('+password');

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return next(errorHttp(401, 'Username atau password salah'));
  }

  const token = jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      algorithm: 'HS256',
      expiresIn: '1h',
    }
  );

  return res.status(200).json({
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
    },
  });
};

exports.me = async (req, res, next) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return next(errorHttp(404, 'Pengguna tidak ditemukan'));
  }

  return res.status(200).json({
    id: user._id,
    _id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  });
};
