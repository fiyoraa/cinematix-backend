const express = require('express');
const router = express.Router();
const showtimeController = require('../controllers/showtimeController');
const verifyToken = require('../middlewares/verifyToken');
const hanyaRole = require('../middlewares/hanyaRole');

router.get('/', showtimeController.getAll);
router.get('/:id', showtimeController.getById);
router.post('/', verifyToken, hanyaRole('admin'), showtimeController.create);
router.put('/:id', verifyToken, hanyaRole('admin'), showtimeController.update);
router.delete('/:id', verifyToken, hanyaRole('admin'), showtimeController.remove);

module.exports = router;
