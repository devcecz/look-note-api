const pool = require('../config/db');

const getEvents = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM agenda_events WHERE user_id = $1 AND is_deleted = false ORDER BY start_date ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener eventos' });
  }
};

const createEvent = async (req, res) => {
  const { id, title, description, start_date, end_date, color, is_all_day, category, reminder_interval, repeat, repeat_end_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO agenda_events 
        (id, user_id, title, description, start_date, end_date, color, is_all_day, category, reminder_interval, repeat, repeat_end_date)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [id, req.userId, title, description, start_date, end_date, color, is_all_day ?? false, category ?? 'personal', reminder_interval ?? 'none', repeat ?? 'none', repeat_end_date ?? null]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

const updateEvent = async (req, res) => {
  const { id } = req.params;
  const { title, description, start_date, end_date, color, is_all_day, category, reminder_interval, repeat, repeat_end_date } = req.body;
  try {
    const result = await pool.query(
      `UPDATE agenda_events
       SET title=$1, description=$2, start_date=$3, end_date=$4, color=$5,
           is_all_day=$6, category=$7, reminder_interval=$8, repeat=$9, repeat_end_date=$10,
           updated_at=NOW()
       WHERE id=$11 AND user_id=$12 RETURNING *`,
      [title, description, start_date, end_date, color, is_all_day, category, reminder_interval, repeat, repeat_end_date ?? null, id, req.userId]
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
      'UPDATE agenda_events SET is_deleted=true, updated_at=NOW() WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Evento no encontrado' });
    res.json({ message: 'Evento eliminado' });
  } catch (err) {
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};

module.exports = { getEvents, createEvent, updateEvent, deleteEvent };