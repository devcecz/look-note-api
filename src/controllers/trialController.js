const pool = require('../config/db');

const activateTrial = async (req, res) => {
  const userId = req.userId;

  try {
    // Verificar si ya usó el trial
    const existing = await pool.query(
      'SELECT * FROM used_trials WHERE user_id = $1',
      [userId]
    );

    if (existing.rows.length > 0) {
      const trial = existing.rows[0];
      const now = new Date();
      const endDate = new Date(trial.end_date);
      const diasRestantes = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

      return res.json({
        active: diasRestantes > 0,
        diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
        mensaje: diasRestantes > 0 ? 'Trial activo' : 'Trial expirado'
      });
    }

    // Activar trial nuevo (30 días)
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 30);

    await pool.query(
      `INSERT INTO used_trials (user_id, start_date, end_date, created_at)
       VALUES ($1, NOW(), $2, NOW())`,
      [userId, endDate]
    );

    // Actualizar usuario
    await pool.query(
      `UPDATE users SET trial_terms_accepted = true, trial_terms_accepted_at = NOW()
       WHERE id = $1`,
      [userId]
    );

    res.json({
      active: true,
      diasRestantes: 30,
      mensaje: 'Trial activado exitosamente'
    });

  } catch (error) {
    console.error('Error en activateTrial:', error);
    res.status(500).json({ error: 'Error al activar trial' });
  }
};

const getTrialStatus = async (req, res) => {
  const userId = req.userId;

  try {
    const result = await pool.query(
      'SELECT * FROM used_trials WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.json({ active: false, diasRestantes: 0, mensaje: 'Sin trial' });
    }

    const trial = result.rows[0];
    const now = new Date();
    const endDate = new Date(trial.end_date);
    const diasRestantes = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));

    res.json({
      active: diasRestantes > 0,
      diasRestantes: diasRestantes > 0 ? diasRestantes : 0,
      mensaje: diasRestantes > 0 ? 'Trial activo' : 'Trial expirado'
    });

  } catch (error) {
    console.error('Error en getTrialStatus:', error);
    res.status(500).json({ error: 'Error al obtener estado del trial' });
  }
};

module.exports = { activateTrial, getTrialStatus };