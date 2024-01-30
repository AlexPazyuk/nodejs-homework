const express = require('express');
const router = express.Router();
const authMiddleware = require('../../middleware/authMiddleware');
const authController = require('../../controllers/authController');
const usersController = require('../../controllers/usersController');


router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/logout', authMiddleware, authController.logout);
router.get('/current', authMiddleware, authController.getCurrentUser);
router.patch('/avatars', authMiddleware, authController.updateAvatar);
router.get('/verify/:verificationToken', usersController.verifyUser);
router.post('/verify', authMiddleware, usersController.resendVerificationEmail);

module.exports = router;