const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { saveToken } = require('../controllers/devicesController');

router.use(verifyToken);
router.post('/token', saveToken);

module.exports = router;