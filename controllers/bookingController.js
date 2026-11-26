const crypto = require('crypto');
const Booking = require('../models/bookingModel');
const Showtime = require('../models/showtimeModel');
const errorHttp = require('../utils/errorHttp');
const angkaAman = require('../utils/angkaAman');

const SORT_WHITELIST = ['createdAt', 'totalPrice'];
const FIELDS_WHITELIST = [
  'bookingCode',
  'userId',
  'showtimeId',
  'seats',
  'totalPrice',
  'status',
  'pembayaran',
  'createdAt',
  'updatedAt',
];

function buatKodeBooking() {
  const kini = new Date();
  const yyyy = kini.getFullYear();
  const mm = String(kini.getMonth() + 1).padStart(2, '0');
  const dd = String(kini.getDate()).padStart(2, '0');
  const acak = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `CTX-${yyyy}${mm}${dd}-${acak}`;
}

function susunSort(sortParam) {
  if (sortParam === undefined || String(sortParam).trim() === '') {
    return { createdAt: -1, _id: 1 };
  }

  if (typeof sortParam !== 'string') {
    throw errorHttp(400, 'Parameter sort tidak valid');
  }

  const sortObj = {};
  const daftarField = sortParam.split(',').map((s) => s.trim()).filter(Boolean);

  for (const item of daftarField) {
    const arah = item.startsWith('-') ? -1 : 1;
    const namaField = item.replace(/^[+-]/, '');

    if (!SORT_WHITELIST.includes(namaField)) {
      throw errorHttp(400, `Field sort '${namaField}' tidak diizinkan`);
    }

    sortObj[namaField] = arah;
  }

  sortObj._id = 1;
  return sortObj;
}

function susunFields(fieldsParam) {
  if (fieldsParam === undefined || fieldsParam === '') {
    return null;
  }

  if (typeof fieldsParam !== 'string') {
    throw errorHttp(400, 'Parameter fields tidak valid');
  }

  const daftarField = fieldsParam.split(',').map((f) => f.trim()).filter(Boolean);
  if (daftarField.length === 0) {
    return null;
  }

  for (const f of daftarField) {
    if (!FIELDS_WHITELIST.includes(f)) {
      throw errorHttp(400, `Field '${f}' tidak diizinkan pada projection`);
    }
  }

  return daftarField;
}

function terapkanPopulateBooking(query, selectedFields) {
  let q = query;

  if (!selectedFields || selectedFields.includes('userId')) {
    q = q.populate('userId', 'username email role');
  }

  if (!selectedFields || selectedFields.includes('showtimeId')) {
    q = q.populate({
      path: 'showtimeId',
      populate: {
        path: 'movieId',
        select: 'judul genre durasi ratingUsia posterUrl status detailProduksi',
      },
    });
  }

  return q;
}

exports.getAll = async (req, res) => {
  const filter = {};

  if (req.user.role === 'admin') {
    if (req.query.userId !== undefined && String(req.query.userId).trim() !== '') {
      filter.userId = String(req.query.userId).trim();
    }
  } else {
    filter.userId = req.user.id;
  }

  if (req.query.status !== undefined && String(req.query.status).trim() !== '') {
    filter.status = String(req.query.status).trim();
  }

  if (
    req.query.showtimeId !== undefined &&
    String(req.query.showtimeId).trim() !== ''
  ) {
    filter.showtimeId = String(req.query.showtimeId).trim();
  }

  if (
    req.query.bookingCode !== undefined &&
    String(req.query.bookingCode).trim() !== ''
  ) {
    filter.bookingCode = String(req.query.bookingCode).trim().toUpperCase();
  }

  const sortObj = susunSort(req.query.sort);
  const selectedFields = susunFields(req.query.fields);

  const page = angkaAman(req.query.page, 1, 1);
  const limit = angkaAman(req.query.limit, 10, 1, 50);
  const skip = (page - 1) * limit;

  const total = await Booking.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  let query = Booking.find(filter).sort(sortObj).skip(skip).limit(limit);
  if (selectedFields) {
    query = query.select(selectedFields.join(' '));
  }

  query = terapkanPopulateBooking(query, selectedFields);

  const data = await query;

  return res.status(200).json({
    data,
    page,
    limit,
    total,
    totalPages,
  });
};

exports.getById = async (req, res, next) => {
  const selectedFields = susunFields(req.query.fields);

  const rawBooking = await Booking.findById(req.params.id);
  if (!rawBooking) {
    return next(errorHttp(404, 'Pesanan tidak ditemukan'));
  }

  if (
    req.user.role !== 'admin' &&
    String(rawBooking.userId) !== String(req.user.id)
  ) {
    return next(errorHttp(403, 'Akses ditolak'));
  }

  let query = Booking.findById(req.params.id);
  if (selectedFields) {
    query = query.select(selectedFields.join(' '));
  }
  query = terapkanPopulateBooking(query, selectedFields);

  const booking = await query;
  return res.status(200).json(booking);
};

exports.create = async (req, res, next) => {
  const { showtimeId, seats } = req.body || {};

  if (!showtimeId || typeof showtimeId !== 'string') {
    return next(errorHttp(400, 'showtimeId wajib diisi dan bertipe string'));
  }

  if (!Array.isArray(seats) || seats.length === 0) {
    return next(errorHttp(400, 'Daftar kursi (seats) wajib berupa array tidak kosong'));
  }

  const seatPattern = /^[A-Z][0-9]{1,2}$/;
  const normalizedList = [];

  for (const item of seats) {
    if (typeof item !== 'string' || !item.trim()) {
      return next(errorHttp(400, 'Setiap kode kursi harus berupa teks yang valid'));
    }
    const kode = item.trim().toUpperCase();
    if (!seatPattern.test(kode)) {
      return next(errorHttp(400, `Format kode kursi '${item}' tidak valid`));
    }
    normalizedList.push(kode);
  }

  const normalizedSeats = [...new Set(normalizedList)];

  const showtime = await Showtime.findById(showtimeId);
  if (!showtime) {
    return next(errorHttp(404, 'Jadwal tayang tidak ditemukan'));
  }

  const existingBookedUpper = new Set(
    (showtime.bookedSeats || []).map((s) => String(s).trim().toUpperCase())
  );

  const kursiBentrok = normalizedSeats.filter((s) => existingBookedUpper.has(s));
  if (kursiBentrok.length > 0) {
    return next(
      errorHttp(409, `Kursi ${kursiBentrok.join(', ')} sudah terisi`)
    );
  }

  const kapasitas = (showtime.studio && showtime.studio.kapasitas) || 48;
  if (existingBookedUpper.size + normalizedSeats.length > kapasitas) {
    return next(errorHttp(409, 'Kapasitas kursi studio sudah penuh'));
  }

  const updatedShowtime = await Showtime.findOneAndUpdate(
    {
      _id: showtime._id,
      bookedSeats: { $nin: normalizedSeats },
    },
    {
      $addToSet: { bookedSeats: { $each: normalizedSeats } },
    },
    {
      returnDocument: 'after',
      runValidators: true,
    }
  );

  if (!updatedShowtime) {
    return next(
      errorHttp(409, `Kursi ${normalizedSeats.join(', ')} sudah terisi`)
    );
  }

  const totalPrice = showtime.harga * normalizedSeats.length;

  let bookingCode = buatKodeBooking();
  while (await Booking.exists({ bookingCode })) {
    bookingCode = buatKodeBooking();
  }

  const bookingBaru = await Booking.create({
    bookingCode,
    userId: req.user.id,
    showtimeId: showtime._id,
    seats: normalizedSeats,
    totalPrice,
    status: 'confirmed',
    pembayaran: {
      metode: 'Simulasi Internal',
      status: 'Lunas',
      dibayarPada: new Date(),
    },
  });

  const populated = await terapkanPopulateBooking(
    Booking.findById(bookingBaru._id),
    null
  );

  return res.status(201).json(populated);
};

exports.updateStatus = async (req, res, next) => {
  const { status } = req.body || {};

  if (typeof status !== 'string' || !['confirmed', 'cancelled'].includes(status)) {
    return next(
      errorHttp(400, 'Status wajib berupa string confirmed atau cancelled')
    );
  }

  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(errorHttp(404, 'Pesanan tidak ditemukan'));
  }

  if (
    req.user.role !== 'admin' &&
    String(booking.userId) !== String(req.user.id)
  ) {
    return next(errorHttp(403, 'Akses ditolak'));
  }

  const updateData = { status };

  if (booking.status === 'confirmed' && status === 'cancelled') {
    await Showtime.findByIdAndUpdate(
      booking.showtimeId,
      { $pull: { bookedSeats: { $in: booking.seats } } },
      { returnDocument: 'after', runValidators: true }
    );
    updateData['pembayaran.status'] = 'Dibatalkan';
  } else if (booking.status === 'cancelled' && status === 'confirmed') {
    const relocked = await Showtime.findOneAndUpdate(
      {
        _id: booking.showtimeId,
        bookedSeats: { $nin: booking.seats },
      },
      {
        $addToSet: { bookedSeats: { $each: booking.seats } },
      },
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    if (!relocked) {
      return next(
        errorHttp(
          409,
          `Kursi ${booking.seats.join(', ')} sudah terisi dan tidak dapat dikunci ulang`
        )
      );
    }
    updateData['pembayaran.status'] = 'Lunas';
  }

  const updated = await terapkanPopulateBooking(
    Booking.findByIdAndUpdate(req.params.id, updateData, {
      returnDocument: 'after',
      runValidators: true,
    }),
    null
  );

  return res.status(200).json(updated);
};

exports.remove = async (req, res, next) => {
  const booking = await Booking.findById(req.params.id);
  if (!booking) {
    return next(errorHttp(404, 'Pesanan tidak ditemukan'));
  }

  if (booking.status === 'confirmed') {
    await Showtime.findByIdAndUpdate(
      booking.showtimeId,
      { $pull: { bookedSeats: { $in: booking.seats } } },
      { returnDocument: 'after', runValidators: true }
    );
  }

  await Booking.findByIdAndDelete(req.params.id);

  return res.status(204).send();
};
