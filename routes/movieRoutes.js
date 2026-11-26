const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const verifyToken = require('../middlewares/verifyToken');
const hanyaRole = require('../middlewares/hanyaRole');

router.get('/', movieController.getAll);
router.get('/:id', movieController.getById);
router.post('/', verifyToken, hanyaRole('admin'), movieController.create);
router.put('/:id', verifyToken, hanyaRole('admin'), movieController.update);
router.delete('/:id', verifyToken, hanyaRole('admin'), movieController.remove);

module.exports = router;
