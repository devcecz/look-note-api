const express = require('express');
const router = express.Router();
const { uploadAudio, deleteAudio, upload } = require('../controllers/audioController');
const verifyToken = require('../middlewares/auth');

router.post('/upload', verifyToken, upload.single('audio'), uploadAudio);
router.delete('/:filename', verifyToken, deleteAudio);

module.exports = router;