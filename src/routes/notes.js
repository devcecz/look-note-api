const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { getNotes, createNote, updateNote, deleteNote } = require('../controllers/notesController');

router.use(verifyToken);

router.get('/', getNotes);
router.post('/', createNote);
router.put('/:id', updateNote);
router.delete('/:id', deleteNote);

module.exports = router;