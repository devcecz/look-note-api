const pool = require('../config/db');

const getEvents = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM agenda_events WHERE user_id = $1 ORDER BY start_date ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

const createEvent = async (req, res) => {
  const { title, description, start_date, end_date, color } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO agenda_events (user_id, title, description, start_date, end_date, color)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [req.userId, title, description, start_date, end_date, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, start_date, end_date, color } = req.body;
  try {
    const result = await pool.query(
      `UPDATE agenda_events
       SET title=$1, description=$2, start_date=$3, end_date=$4, color=$5, updated_at=NOW()
       WHERE id=$6 AND user_id=$7 RETURNING *`,
      [title, description, start_date, end_date, color, id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};

const deleteEvent = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM agenda_events WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };