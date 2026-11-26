const User = require('../models/userModel');
const errorHttp = require('../utils/errorHttp');
const angkaAman = require('../utils/angkaAman');

function escapeRegex(teks) {
  return teks.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

exports.getAll = async (req, res) => {
  const filter = {};

  if (req.query.role !== undefined && String(req.query.role).trim() !== '') {
    filter.role = String(req.query.role).trim();
  }

  if (req.query.search !== undefined && String(req.query.search).trim() !== '') {
    const pola = new RegExp(escapeRegex(String(req.query.search).trim()), 'i');
    filter.$or = [{ username: pola }, { email: pola }];
  }

  const page = angkaAman(req.query.page, 1, 1);
  const limit = angkaAman(req.query.limit, 10, 1, 50);
  const skip = (page - 1) * limit;

  const total = await User.countDocuments(filter);
  const totalPages = Math.ceil(total / limit);

  const data = await User.find(filter)
    .sort({ createdAt: -1, _id: 1 })
    .skip(skip)
    .limit(limit);

  return res.status(200).json({
    data,
    page,
    limit,
    total,
    totalPages,
  });
};

exports.updateRole = async (req, res, next) => {
  const { role } = req.body || {};

  if (typeof role !== 'string' || !['user', 'admin'].includes(role)) {
    return next(errorHttp(400, 'Role wajib berupa string dengan nilai user atau admin'));
  }

  if (String(req.params.id) === String(req.user.id) && role !== 'admin') {
    return next(errorHttp(400, 'Admin aktif tidak dapat menurunkan perannya sendiri'));
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    { role },
    { returnDocument: 'after', runValidators: true }
  );

  if (!user) {
    return next(errorHttp(404, 'Pengguna tidak ditemukan'));
  }

  return res.status(200).json(user);
};
