const mongoose = require('mongoose');

const detailProduksiSchema = new mongoose.Schema(
  {
    sutradara: {
      type: String,
      trim: true,
      default: '',
    },
    bahasa: {
      type: String,
      trim: true,
      default: 'Indonesia',
    },
    tahunRilis: {
      type: Number,
      default: new Date().getFullYear(),
    },
  },
  { _id: false }
);

const movieSchema = new mongoose.Schema(
  {
    judul: {
      type: String,
      required: [true, 'Judul film wajib diisi'],
      trim: true,
    },
    sinopsis: {
      type: String,
      required: [true, 'Sinopsis film wajib diisi'],
      trim: true,
    },
    genre: {
      type: String,
      required: [true, 'Genre film wajib diisi'],
      trim: true,
    },
    durasi: {
      type: Number,
      required: [true, 'Durasi film (menit) wajib diisi'],
      min: [1, 'Durasi film minimal 1 menit'],
    },
    ratingUsia: {
      type: String,
      enum: {
        values: ['SU', '13+', '17+', '21+'],
        message: 'Rating usia harus salah satu dari SU, 13+, 17+, atau 21+',
      },
      default: '13+',
    },
    posterUrl: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: {
        values: ['now_showing', 'coming_soon'],
        message: 'Status film harus now_showing atau coming_soon',
      },
      default: 'now_showing',
    },
    detailProduksi: {
      type: detailProduksiSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const Movie = mongoose.model('Movie', movieSchema);

module.exports = Movie;
