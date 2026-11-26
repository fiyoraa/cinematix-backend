function angkaAman(nilai, bawaan, min, maks) {
  const angka = parseInt(nilai, 10);
  if (Number.isNaN(angka)) return bawaan;
  if (min !== undefined && angka < min) return min;
  if (maks !== undefined && angka > maks) return maks;
  return angka;
}

module.exports = angkaAman;
