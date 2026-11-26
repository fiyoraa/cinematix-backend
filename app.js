require('dotenv').config();

const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');

const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const movieRoutes = require('./routes/movieRoutes');
const showtimeRoutes = require('./routes/showtimeRoutes');
const bookingRoutes = require('./routes/bookingRoutes');

const app = express();

let cachedConnectionPromise = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI belum dikonfigurasi pada environment variables');
  }

  if (!cachedConnectionPromise) {
    cachedConnectionPromise = mongoose
      .connect(process.env.MONGODB_URI)
      .then((conn) => conn)
      .catch((err) => {
        cachedConnectionPromise = null;
        throw err;
      });
  }

  return cachedConnectionPromise;
}

function getCorsOptions() {
  const rawOrigin = process.env.CORS_ORIGIN || '*';
  if (rawOrigin === '*') {
    return { origin: '*' };
  }
  if (rawOrigin.includes(',')) {
    const allowedOrigins = rawOrigin.split(',').map((o) => o.trim()).filter(Boolean);
    return { origin: allowedOrigins };
  }
  return { origin: rawOrigin.trim() };
}

app.use(logger);
app.use(cors(getCorsOptions()));
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    status: 'active',
    service: 'CinemaTix RESTful API',
    group: 'Kelompok 5 - SI5B - Universitas MDP',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api', async (req, res, next) => {
  await connectDB();
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/showtimes', showtimeRoutes);
app.use('/api/bookings', bookingRoutes);

app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint tidak ditemukan' });
});

app.use(errorHandler);

app.connectDB = connectDB;

module.exports = app;
