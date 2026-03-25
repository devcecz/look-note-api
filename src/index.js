const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const foldersRoutes = require('./routes/folders');
const trialRoutes = require('./routes/trial');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'Look Note API running 🚀' });
});

app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
app.use('/folders', foldersRoutes);
app.use('/trial', trialRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});