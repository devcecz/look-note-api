const express = require('express');
const router = express.Router();
const { googleLogin, appleLogin, saveFolderOrder, getFolderOrder } = require('../controllers/authController');
const verifyToken = require('../middlewares/auth');

router.post('/google', googleLogin);
router.post('/folder-order', verifyToken, saveFolderOrder);
router.get('/folder-order', verifyToken, getFolderOrder);
router.post('/apple', appleLogin);

module.exports = router;