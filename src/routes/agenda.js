const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { getEvents, createEvent, updateEvent, deleteEvent } = require('../controllers/agendaController');

router.use(verifyToken);

router.get('/', getEvents);
router.post('/', createEvent);
router.put('/:id', updateEvent);
router.delete('/:id', deleteEvent);

module.exports = router;