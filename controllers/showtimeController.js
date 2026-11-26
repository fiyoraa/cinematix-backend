const Showtime = require('../models/showtimeModel');
const Movie = require('../models/movieModel');
const errorHttp = require('../utils/errorHttp');
const angkaAman = require('../utils/angkaAman');

const SORT_WHITELIST = ['waktuTayang', 'harga', 'createdAt'];
const FIELDS_WHITELIST = [
  'movieId',
  'waktuTayang',
  'harga',
  'studio',
  'bookedSeats',
  'createdAt',
  'updatedAt',
];

function escapeRegex(teks) {
  return teks.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function susunSort(sortParam) {
  if (sortParam === undefined || String(sortParam).trim() === '') {
    return { waktuTayang: 1, _id: 1 };
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

exports.getAll = async (req, res) => {
  const filter = {};

  if (req.query.movieId !== undefined && String(req.query.movieId).trim() !== '') {
    filter.movieId = String(req.query.movieId).trim();
  }

  const adaFilterGenre =
    req.query.genre !== undefined && String(req.query.genre).trim() !== '';
  const kataKunciJudul =
    req.query.judul !== undefined ? req.query.judul : req.query.search;
  const adaFilterJudul =
    kataKunciJudul !== undefined && String(kataKunciJudul).trim() !== '';

  if (adaFilterGenre || adaFilterJudul) {
    const movieFilter = {};

    if (adaFilterGenre) {
      const genreAman = escapeRegex(String(req.query.genre).trim());
      movieFilter.genre = new RegExp(`^${genreAman}$`, 'i');
    }

    if (adaFilterJudul) {
      const judulAman = escapeRegex(String(kataKunciJudul).trim());
      movieFilter.judul = new RegExp(judulAman, 'i');
    }

    const filmCocok = await Movie.find(movieFilter).select('_id');
    const daftarIdFilm = filmCocok.map((m) => m._id);

    if (filter.movieId) {
      const cocokDenganMovieId = daftarIdFilm.some(
        (id) => String(id) === String(filter.movieId)
      );
      if (!cocokDenganMovieId) {
        filter.movieId = { $in: [] };
      }
    } else {
      filter.movieId = { $in: daftarIdFilm };
    }
  }

  if (req.query.studio !== undefined && String(req.query.studio).trim() !== '') {
    const studioAman = escapeRegex(String(req.query.studio).trim());
    filter['studio.nama'] = new RegExp(studioAman, 'i');
  }

  if (req.query.tanggal !== undefined && String(req.query.tanggal).trim() !== '') {
    const tglTeks = String(req.query.tanggal).trim();
    const awalHari = new Date(`${tglTeks}T00:00:00.000Z`);
    const akhirHari = new Date(`${tglTeks}T23:59:59.999Z`);
    if (!Number.isNaN(awalHari.getTime())) {
      filter.waktuTayang = { $gte: awalHari, $lte: akhirHari };
    }
  }

  const sortObj = susunSort(req.query.sort);
  const selectedFields = susunFields(req.query.fields);

  const page = angkaAman(req.query.page, 1, 1);
  const limit = angkaAman(req.query.limit, 10, 1, 50);
  const skip = (page - 1) * limit;

  const total = await Showtime.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  let query = Showtime.find(filter).sort(sortObj).skip(skip).limit(limit);
  if (selectedFields) {
    query = query.select(selectedFields.join(' '));
  }

  if (!selectedFields || selectedFields.includes('movieId')) {
    query = query.populate(
      'movieId',
      'judul sinopsis genre durasi ratingUsia posterUrl status detailProduksi'
    );
  }

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
  let query = Showtime.findById(req.params.id);

  if (selectedFields) {
    query = query.select(selectedFields.join(' '));
  }

  if (!selectedFields || selectedFields.includes('movieId')) {
    query = query.populate(
      'movieId',
      'judul sinopsis genre durasi ratingUsia posterUrl status detailProduksi'
    );
  }

  const showtime = await query;
  if (!showtime) {
    return next(errorHttp(404, 'Jadwal tayang tidak ditemukan'));
  }

  return res.status(200).json(showtime);
};

exports.create = async (req, res, next) => {
  const { movieId, waktuTayang, harga, studio, bookedSeats } = req.body || {};

  if (!movieId || typeof movieId !== 'string') {
    return next(errorHttp(400, 'movieId wajib diisi dan bertipe string'));
  }

  const movie = await Movie.findById(movieId);
  if (!movie) {
    return next(errorHttp(404, 'Film (movieId) tidak ditemukan'));
  }

  const created = await Showtime.create({
    movieId,
    waktuTayang,
    harga,
    studio,
    bookedSeats: Array.isArray(bookedSeats)
      ? bookedSeats.map((s) => String(s).trim().toUpperCase()).filter(Boolean)
      : [],
  });

  const populated = await Showtime.findById(created._id).populate(
    'movieId',
    'judul sinopsis genre durasi ratingUsia posterUrl status detailProduksi'
  );

  return res.status(201).json(populated);
};

exports.update = async (req, res, next) => {
  const body = req.body || {};
  const allowedKeys = ['movieId', 'waktuTayang', 'harga', 'studio', 'bookedSeats'];
  const payload = {};

  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      payload[key] = body[key];
    }
  }

  if (payload.movieId !== undefined) {
    if (typeof payload.movieId !== 'string' || !payload.movieId.trim()) {
      return next(errorHttp(400, 'movieId wajib berupa string yang valid'));
    }
    const movie = await Movie.findById(payload.movieId);
    if (!movie) {
      return next(errorHttp(404, 'Film (movieId) tidak ditemukan'));
    }
  }

  if (Array.isArray(payload.bookedSeats)) {
    payload.bookedSeats = payload.bookedSeats
      .map((s) => String(s).trim().toUpperCase())
      .filter(Boolean);
  }

  const updated = await Showtime.findByIdAndUpdate(req.params.id, payload, {
    returnDocument: 'after',
    runValidators: true,
  }).populate(
    'movieId',
    'judul sinopsis genre durasi ratingUsia posterUrl status detailProduksi'
  );

  if (!updated) {
    return next(errorHttp(404, 'Jadwal tayang tidak ditemukan'));
  }

  return res.status(200).json(updated);
};

exports.remove = async (req, res, next) => {
  const deleted = await Showtime.findByIdAndDelete(req.params.id);
  if (!deleted) {
    return next(errorHttp(404, 'Jadwal tayang tidak ditemukan'));
  }

  return res.status(204).send();
};
