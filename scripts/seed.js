require('dotenv').config();

const mongoose = require('mongoose');
const Movie = require('../models/movieModel');
const Showtime = require('../models/showtimeModel');
const Booking = require('../models/bookingModel');

function buatTanggalMendatang(offsetHari, jam, menit = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetHari);
  d.setHours(jam, menit, 0, 0);
  return d;
}

const daftarFilm = [
  {
    judul: 'Dune: Part Two',
    sinopsis:
      'Paul Atreides bersatu dengan Chani dan kaum Fremen di padang pasir Arrakis dalam perjalanan balas dendam melawan para konspirator yang menghancurkan keluarganya, sembari menghadapi pilihan antara cinta dan takdir alam semesta.',
    genre: 'Sci-Fi',
    durasi: 166,
    ratingUsia: '13+',
    posterUrl:
      'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=800&q=80',
    status: 'now_showing',
    detailProduksi: {
      sutradara: 'Denis Villeneuve',
      bahasa: 'Inggris',
      tahunRilis: 2024,
    },
  },
  {
    judul: 'Sore: Istri dari Masa Depan',
    sinopsis:
      'Seorang fotografer muda yang hidup serampangan di Kroasia dikejutkan oleh kehadiran perempuan misterius bernama Sore yang mengaku sebagai istrinya dari masa depan dengan satu misi menyelamatkan hidupnya.',
    genre: 'Drama',
    durasi: 118,
    ratingUsia: '13+',
    posterUrl:
      'https://images.unsplash.com/photo-1518676590629-3dcbd9c5a5c9?auto=format&fit=crop&w=800&q=80',
    status: 'now_showing',
    detailProduksi: {
      sutradara: 'Yandy Laurens',
      bahasa: 'Indonesia',
      tahunRilis: 2025,
    },
  },
  {
    judul: 'Pengepungan di Bukit Duri',
    sinopsis:
      'Di tengah situasi kota yang memanas pada tahun 2027, seorang guru pengganti di sekolah khusus remaja bermasalah harus bertahan hidup ketika kompleks sekolah terkepung dari luar maupun dalam.',
    genre: 'Action',
    durasi: 124,
    ratingUsia: '17+',
    posterUrl:
      'https://images.unsplash.com/photo-1509347528160-9a9e33742cdb?auto=format&fit=crop&w=800&q=80',
    status: 'now_showing',
    detailProduksi: {
      sutradara: 'Joko Anwar',
      bahasa: 'Indonesia',
      tahunRilis: 2025,
    },
  },
  {
    judul: 'Jumbo',
    sinopsis:
      'Don, anak bertubuh besar yang sering diremehkan teman-temannya, bertekad menampilkan pertunjukan dongeng peninggalan orang tuanya di panggung bakat dengan bantuan sahabat-sahabat barunya.',
    genre: 'Animasi',
    durasi: 102,
    ratingUsia: 'SU',
    posterUrl:
      'https://images.unsplash.com/photo-1513106580091-1d82408b8cd6?auto=format&fit=crop&w=800&q=80',
    status: 'now_showing',
    detailProduksi: {
      sutradara: 'Ryan Adriandhy',
      bahasa: 'Indonesia',
      tahunRilis: 2025,
    },
  },
  {
    judul: 'Pengabdi Setan: Komuni Terakhir',
    sinopsis:
      'Keluarga Suwono kembali dihantui rahasia kelam rumah susun tua di pesisir utara ketika arsip piringan hitam dan sekte kuno membuka tabir perjanjian berdarah puluhan tahun silam.',
    genre: 'Horor',
    durasi: 119,
    ratingUsia: '17+',
    posterUrl:
      'https://images.unsplash.com/photo-1505635552518-3448ff116af3?auto=format&fit=crop&w=800&q=80',
    status: 'now_showing',
    detailProduksi: {
      sutradara: 'Joko Anwar',
      bahasa: 'Indonesia',
      tahunRilis: 2026,
    },
  },
  {
    judul: 'Project Hail Mary',
    sinopsis:
      'Seorang guru sains terbangun sendirian di pesawat antarbintang berjarak tahunan cahaya dari Bumi tanpa ingatan siapa dirinya, namun harus memecahkan teka-teki kosmik demi mencegah kepunahan Matahari.',
    genre: 'Sci-Fi',
    durasi: 148,
    ratingUsia: '13+',
    posterUrl:
      'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=800&q=80',
    status: 'coming_soon',
    detailProduksi: {
      sutradara: 'Phil Lord & Christopher Miller',
      bahasa: 'Inggris',
      tahunRilis: 2026,
    },
  },
];

async function jalankanSeed() {
  if (!process.env.MONGODB_URI) {
    console.error('Galat: MONGODB_URI belum disetel pada berkas .env');
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Terhubung ke MongoDB. Memulai pengisian data awal CinemaTix...');

    await Booking.deleteMany({});
    await Showtime.deleteMany({});
    await Movie.deleteMany({});

    const filmTersimpan = await Movie.insertMany(daftarFilm);
    console.log(`Berhasil menyimpan ${filmTersimpan.length} film.`);

    const STUDIO_1 = { nama: 'Studio 1', tipe: 'Reguler', kapasitas: 48 };
    const STUDIO_2 = { nama: 'Studio 2 Premiere', tipe: 'Premiere', kapasitas: 48 };
    const STUDIO_3 = { nama: 'Studio 3 IMAX', tipe: 'IMAX', kapasitas: 48 };

    const [dune, sore, bukitDuri, jumbo, pengabdi, hailMary] = filmTersimpan;

    const daftarJadwal = [
      {
        movieId: dune._id,
        waktuTayang: buatTanggalMendatang(0, 13, 30),
        harga: 75000,
        studio: STUDIO_3,
        bookedSeats: ['C4', 'C5', 'D4', 'D5', 'D6'],
      },
      {
        movieId: dune._id,
        waktuTayang: buatTanggalMendatang(0, 19, 15),
        harga: 85000,
        studio: STUDIO_3,
        bookedSeats: ['B3', 'B4', 'C3', 'C4', 'C5', 'C6', 'E4', 'E5'],
      },
      {
        movieId: dune._id,
        waktuTayang: buatTanggalMendatang(1, 16, 30),
        harga: 95000,
        studio: STUDIO_2,
        bookedSeats: ['C4', 'C5'],
      },
      {
        movieId: sore._id,
        waktuTayang: buatTanggalMendatang(0, 14, 0),
        harga: 45000,
        studio: STUDIO_1,
        bookedSeats: ['B4', 'B5', 'D3', 'D4'],
      },
      {
        movieId: sore._id,
        waktuTayang: buatTanggalMendatang(0, 18, 45),
        harga: 90000,
        studio: STUDIO_2,
        bookedSeats: ['C3', 'C4', 'C5', 'D5'],
      },
      {
        movieId: bukitDuri._id,
        waktuTayang: buatTanggalMendatang(0, 16, 15),
        harga: 50000,
        studio: STUDIO_1,
        bookedSeats: ['A4', 'A5', 'C4', 'C5', 'E2', 'E3'],
      },
      {
        movieId: bukitDuri._id,
        waktuTayang: buatTanggalMendatang(1, 20, 30),
        harga: 80000,
        studio: STUDIO_3,
        bookedSeats: ['D4', 'D5', 'E4', 'E5'],
      },
      {
        movieId: jumbo._id,
        waktuTayang: buatTanggalMendatang(0, 11, 30),
        harga: 40000,
        studio: STUDIO_1,
        bookedSeats: ['B2', 'B3', 'B4', 'C2', 'C3'],
      },
      {
        movieId: jumbo._id,
        waktuTayang: buatTanggalMendatang(1, 13, 45),
        harga: 85000,
        studio: STUDIO_2,
        bookedSeats: ['C4', 'C5'],
      },
      {
        movieId: pengabdi._id,
        waktuTayang: buatTanggalMendatang(0, 21, 0),
        harga: 50000,
        studio: STUDIO_1,
        bookedSeats: ['C3', 'C4', 'C5', 'C6', 'D4', 'D5', 'F7', 'F8'],
      },
      {
        movieId: pengabdi._id,
        waktuTayang: buatTanggalMendatang(1, 21, 15),
        harga: 85000,
        studio: STUDIO_3,
        bookedSeats: ['E4', 'E5'],
      },
      {
        movieId: hailMary._id,
        waktuTayang: buatTanggalMendatang(3, 19, 0),
        harga: 90000,
        studio: STUDIO_3,
        bookedSeats: ['D4', 'D5'],
      },
    ];

    const jadwalTersimpan = await Showtime.insertMany(daftarJadwal);
    console.log(`Berhasil menyimpan ${jadwalTersimpan.length} jadwal tayang lintas 3 studio.`);
    console.log('Seed CinemaTix selesai dengan sukses.');
  } catch (err) {
    console.error('Gagal menjalankan seed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
}

jalankanSeed();
