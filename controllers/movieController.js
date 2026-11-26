const Movie = require('../models/movieModel');
const errorHttp = require('../utils/errorHttp');
const angkaAman = require('../utils/angkaAman');

const SORT_WHITELIST = ['judul', 'durasi', 'ratingUsia', 'createdAt'];
const FIELDS_WHITELIST = [
  'judul',
  'sinopsis',
  'genre',
  'durasi',
  'ratingUsia',
  'posterUrl',
  'status',
  'detailProduksi',
  'createdAt',
  'updatedAt',
];

function escapeRegex(teks) {
  return teks.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
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

exports.getAll = async (req, res) => {
  const filter = {};

  if (req.query.genre !== undefined && String(req.query.genre).trim() !== '') {
    const genreAman = escapeRegex(String(req.query.genre).trim());
    filter.genre = new RegExp(`^${genreAman}$`, 'i');
  }

  if (req.query.status !== undefined && String(req.query.status).trim() !== '') {
    filter.status = String(req.query.status).trim();
  }

  if (req.query.ratingUsia !== undefined && String(req.query.ratingUsia).trim() !== '') {
    filter.ratingUsia = String(req.query.ratingUsia).trim();
  }

  const kataKunci = req.query.search !== undefined ? req.query.search : req.query.judul;
  if (kataKunci !== undefined && String(kataKunci).trim() !== '') {
    const judulAman = escapeRegex(String(kataKunci).trim());
    filter.judul = new RegExp(judulAman, 'i');
  }

  const sortObj = susunSort(req.query.sort);
  const selectedFields = susunFields(req.query.fields);

  const page = angkaAman(req.query.page, 1, 1);
  const limit = angkaAman(req.query.limit, 10, 1, 50);
  const skip = (page - 1) * limit;

  const total = await Movie.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  let query = Movie.find(filter).sort(sortObj).skip(skip).limit(limit);
  if (selectedFields) {
    query = query.select(selectedFields.join(' '));
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
  let query = Movie.findById(req.params.id);
  if (selectedFields) {
    query = query.select(selectedFields.join(' '));
  }

  const movie = await query;
  if (!movie) {
    return next(errorHttp(404, 'Film tidak ditemukan'));
  }

  return res.status(200).json(movie);
};

exports.create = async (req, res) => {
  const {
    judul,
    sinopsis,
    genre,
    durasi,
    ratingUsia,
    posterUrl,
    status,
    detailProduksi,
  } = req.body || {};

  const movie = await Movie.create({
    judul,
    sinopsis,
    genre,
    durasi,
    ratingUsia,
    posterUrl,
    status,
    detailProduksi,
  });

  return res.status(201).json(movie);
};

exports.update = async (req, res, next) => {
  const allowedKeys = [
    'judul',
    'sinopsis',
    'genre',
    'durasi',
    'ratingUsia',
    'posterUrl',
    'status',
    'detailProduksi',
  ];

  const payload = {};
  const body = req.body || {};
  for (const key of allowedKeys) {
    if (body[key] !== undefined) {
      payload[key] = body[key];
    }
  }

  const movie = await Movie.findByIdAndUpdate(req.params.id, payload, {
    returnDocument: 'after',
    runValidators: true,
  });

  if (!movie) {
    return next(errorHttp(404, 'Film tidak ditemukan'));
  }

  return res.status(200).json(movie);
};

exports.remove = async (req, res, next) => {
  const movie = await Movie.findByIdAndDelete(req.params.id);
  if (!movie) {
    return next(errorHttp(404, 'Film tidak ditemukan'));
  }

  return res.status(204).send();
};
