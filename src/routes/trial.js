const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { activateTrial, getTrialStatus } = require('../controllers/trialController');

router.use(verifyToken);

router.post('/activate', activateTrial);
router.get('/status', getTrialStatus);

module.exports = router;