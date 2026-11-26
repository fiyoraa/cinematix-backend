const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const verifyToken = require('../middlewares/verifyToken');
const hanyaRole = require('../middlewares/hanyaRole');

router.get('/', verifyToken, hanyaRole('admin'), userController.getAll);
router.patch('/:id/role', verifyToken, hanyaRole('admin'), userController.updateRole);

module.exports = router;
