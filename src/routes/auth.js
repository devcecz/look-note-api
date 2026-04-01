const express = require('express');
const router = express.Router();
const { googleLogin, saveFolderOrder, getFolderOrder } = require('../controllers/authController');
const verifyToken = require('../middlewares/auth');

router.post('/google', googleLogin);
router.post('/folder-order', verifyToken, saveFolderOrder);
router.get('/folder-order', verifyToken, getFolderOrder);

module.exports = router;