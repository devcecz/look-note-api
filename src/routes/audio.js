const express = require('express');
const router = express.Router();
const { uploadAudio, deleteAudio, upload } = require('../controllers/audioController');
const { authenticate } = require('../middlewares/auth');

router.post('/upload', authenticate, upload.single('audio'), uploadAudio);
router.delete('/:filename(*)', authenticate, deleteAudio);

module.exports = router;