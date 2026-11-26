function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Format JSON tidak valid' });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Format ID tidak valid' });
  }

  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Data tidak valid',
      detail: Object.values(err.errors).map((e) => e.message),
    });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Data sudah terdaftar (duplikat)' });
  }

  if (err.status) {
    return res.status(err.status).json({ message: err.message });
  }

  console.error(err.stack || err);
  return res.status(500).json({ message: 'Terjadi kesalahan pada server' });
}

module.exports = errorHandler;
