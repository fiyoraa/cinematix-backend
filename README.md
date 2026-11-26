# CinemaTix Backend — RESTful API

Backend sistem pemesanan tiket bioskop dan pemilihan kursi secara daring **CinemaTix** (Kelompok 5, Kelas SI5B, Universitas MDP). Dibangun dengan **Node.js 20+**, **Express 5**, dan **Mongoose 9** mengikuti arsitektur tiga lapis ketat **Route -> Controller -> Model** tanpa layer Service.

## Fitur Utama

- **Arsitektur 3 Lapis Murni**: Pemisahan tanggung jawab antara `routes/`, `controllers/`, dan `models/` dengan CommonJS (`require` / `module.exports`).
- **Pemodelan NoSQL (Embedding & Referencing)**:
  - *Embedding* (`{ _id: false }`): `detailProduksi` pada `movies`, `studio` dan `bookedSeats` pada `showtimes`, serta `pembayaran` pada `bookings`.
  - *Referencing* (`ObjectId` + `populate()`): `movieId` pada `showtimes` serta `userId` dan `showtimeId` pada `bookings`.
- **Query Lanjutan (Sub-CPMK 9)**: Filtering dinamis anti-NoSQL-injection (`String(...)`), filter relasi tidak langsung (`?genre=` / `?judul=` pada jadwal tayang), sorting aman berbasis whitelist + pemutus seri `_id: 1`, pagination tervalidasi `angkaAman`, serta projection (`?fields=`) dengan *conditional populate*.
- **Autentikasi JWT & RBAC (Sub-CPMK 10)**: Hashing kata sandi `bcryptjs`, token `HS256` (`expiresIn: '1h'`), proteksi `verifyToken` & `hanyaRole`, serta penguncian kursi anti-*double-booking* (`409 Conflict`).
- **Siap Serverless Vercel**: Caching koneksi MongoDB di `app.js` dan konfigurasi `vercel.json`.

## Persiapan & Menjalankan di Lokal

1. Salin berkas environment:
   ```bash
   cp .env.example .env
   ```
   Isi `MONGODB_URI`, `JWT_SECRET`, dan `CORS_ORIGIN` (misal `http://localhost:5173`).

2. Instal dependensi:
   ```bash
   npm install
   ```

3. Buat akun admin pertama dan isi data film/jadwal awal:
   ```bash
   npm run buat-admin
   npm run seed
   ```

4. Jalankan server pengembangan:
   ```bash
   npm run dev
   ```
   Server berjalan pada `http://localhost:5000`.

## Pengujian Otomatis (Postman & Newman)

Pastikan `npm run buat-admin` sudah dijalankan dan server aktif, lalu jalankan Newman:

```bash
npx newman run postman/CinemaTix_API.postman_collection.json -e postman/CinemaTix_Env.postman_environment.json
```
