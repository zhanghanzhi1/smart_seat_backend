const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/', userController.getAllUsers);
router.get('/me', userController.getMe);
router.get('/:id', userController.getUserById);
router.put('/:id', userController.updateUser);

module.exports = router;