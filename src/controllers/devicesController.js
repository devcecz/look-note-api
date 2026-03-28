const pool = require('../config/db');

const saveToken = async (req, res) => {
  const { fcm_token } = req.body;
  if (!fcm_token) return res.status(400).json({ error: 'fcm_token requerido' });

  try {
    await pool.query(
      'UPDATE users SET fcm_token = $1 WHERE id = $2',
      [fcm_token, req.userId]
    );
    res.json({ message: 'Token guardado' });
  } catch (err) {
    res.status(500).json({ error: 'Error guardando token' });
  }
};

module.exports = { saveToken };