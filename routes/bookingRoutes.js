const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const verifyToken = require('../middlewares/verifyToken');
const hanyaRole = require('../middlewares/hanyaRole');

router.get('/', verifyToken, bookingController.getAll);
router.get('/:id', verifyToken, bookingController.getById);
router.post('/', verifyToken, bookingController.create);
router.patch('/:id/status', verifyToken, bookingController.updateStatus);
router.delete('/:id', verifyToken, hanyaRole('admin'), bookingController.remove);

module.exports = router;
