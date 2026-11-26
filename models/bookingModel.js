const mongoose = require('mongoose');

const pembayaranSchema = new mongoose.Schema(
  {
    metode: {
      type: String,
      default: 'Simulasi Internal',
    },
    status: {
      type: String,
      default: 'Lunas',
    },
    dibayarPada: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: {
      type: String,
      required: [true, 'Kode booking wajib diisi'],
      unique: true,
      trim: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'userId wajib diisi'],
    },
    showtimeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Showtime',
      required: [true, 'showtimeId wajib diisi'],
    },
    seats: {
      type: [String],
      required: [true, 'Kursi wajib dipilih'],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length >= 1,
        message: 'Minimal harus memilih 1 kursi',
      },
    },
    totalPrice: {
      type: Number,
      required: [true, 'Total harga wajib diisi'],
      min: [0, 'Total harga tidak boleh negatif'],
    },
    status: {
      type: String,
      enum: {
        values: ['confirmed', 'cancelled'],
        message: 'Status booking harus confirmed atau cancelled',
      },
      default: 'confirmed',
    },
    pembayaran: {
      type: pembayaranSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
