const mongoose = require('mongoose');

const studioSchema = new mongoose.Schema(
  {
    nama: {
      type: String,
      required: [true, 'Nama studio wajib diisi'],
      trim: true,
    },
    tipe: {
      type: String,
      trim: true,
      default: 'Reguler',
    },
    kapasitas: {
      type: Number,
      default: 48,
      min: [1, 'Kapasitas studio minimal 1 kursi'],
    },
  },
  { _id: false }
);

const showtimeSchema = new mongoose.Schema(
  {
    movieId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Movie',
      required: [true, 'movieId wajib diisi'],
    },
    waktuTayang: {
      type: Date,
      required: [true, 'Waktu tayang wajib diisi'],
    },
    harga: {
      type: Number,
      required: [true, 'Harga tiket wajib diisi'],
      min: [0, 'Harga tiket tidak boleh negatif'],
    },
    studio: {
      type: studioSchema,
      required: [true, 'Informasi studio wajib diisi'],
    },
    bookedSeats: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Showtime = mongoose.model('Showtime', showtimeSchema);

module.exports = Showtime;
