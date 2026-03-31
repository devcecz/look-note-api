const express = require('express');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const notesRoutes = require('./routes/notes');
const foldersRoutes = require('./routes/folders');
const trialRoutes = require('./routes/trial');
const agendaRoutes = require('./routes/agenda');
const devicesRoutes = require('./routes/devices');
const pool = require('./config/db');
const { startReminderCron } = require('./cron/reminderCron');
const audioRoutes = require('./routes/audio');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/audio', audioRoutes);

app.get('/app-config', async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM app_config');
    const config = {};
    result.rows.forEach(row => config[row.key] = row.value);
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener config' });
  }
});

app.get('/', (req, res) => {
  res.json({ message: 'Look Note API running 🚀' });
});

app.use('/auth', authRoutes);
app.use('/notes', notesRoutes);
app.use('/folders', foldersRoutes);
app.use('/trial', trialRoutes);
app.use('/agenda', agendaRoutes);
app.use('/devices', devicesRoutes);

startReminderCron();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});