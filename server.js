require('dotenv').config();

const app = require('./app');

const PORT = process.env.PORT || 5000;

app
  .connectDB()
  .then(() => {
    console.log('Terhubung ke MongoDB');
    app.listen(PORT, () => {
      console.log(`Server CinemaTix berjalan di http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Gagal terhubung ke MongoDB:', err.message);
    process.exit(1);
  });
