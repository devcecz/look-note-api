const express = require('express');
const router = express.Router();
const verifyToken = require('../middlewares/auth');
const { getFolders, createFolder, updateFolder, deleteFolder } = require('../controllers/foldersController');

router.use(verifyToken);

router.get('/', getFolders);
router.post('/', createFolder);
router.put('/:id', updateFolder);
router.delete('/:id', deleteFolder);

module.exports = router;