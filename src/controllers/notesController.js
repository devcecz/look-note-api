const pool = require('../config/db');

const getNotes = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notes WHERE user_id = $1 AND is_deleted = false ORDER BY updated_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error en getNotes:', error);
    res.status(500).json({ error: 'Error al obtener notas' });
  }
};

const createNote = async (req, res) => {
  const {
    id, title, content, theme_id, is_checklist, checklist_items,
    checklist_checked, audio_path, is_transcribed, show_on_lock_screen,
    reminder_date_time, reminder_interval, reminder_end_date, folder_id
  } = req.body;

  try {
    const result = await pool.query(
      `INSERT INTO notes (
        id, user_id, title, content, theme_id, is_checklist, checklist_items,
        checklist_checked, audio_path, is_transcribed, show_on_lock_screen,
        reminder_date_time, reminder_interval, reminder_end_date, folder_id,
        is_archived, is_deleted, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,false,false,NOW(),NOW())
      RETURNING *`,
      [
        id, req.userId, title, content, theme_id, is_checklist,
        JSON.stringify(checklist_items), JSON.stringify(checklist_checked),
        audio_path, is_transcribed, show_on_lock_screen,
        reminder_date_time, reminder_interval, reminder_end_date, folder_id
      ]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en createNote:', error);
    res.status(500).json({ error: 'Error al crear nota' });
  }
};

const updateNote = async (req, res) => {
  const { id } = req.params;
  const {
    title, content, theme_id, is_checklist, checklist_items,
    checklist_checked, audio_path, is_transcribed, show_on_lock_screen,
    reminder_date_time, reminder_interval, reminder_end_date,
    folder_id, is_archived, is_deleted
  } = req.body;

  try {
    const result = await pool.query(
      `UPDATE notes SET
        title=$1, content=$2, theme_id=$3, is_checklist=$4, checklist_items=$5,
        checklist_checked=$6, audio_path=$7, is_transcribed=$8,
        show_on_lock_screen=$9, reminder_date_time=$10, reminder_interval=$11,
        reminder_end_date=$12, folder_id=$13, is_archived=$14, is_deleted=$15,
        updated_at=NOW()
       WHERE id=$16 AND user_id=$17 RETURNING *`,
      [
        title, content, theme_id, is_checklist,
        JSON.stringify(checklist_items), JSON.stringify(checklist_checked),
        audio_path, is_transcribed, show_on_lock_screen,
        reminder_date_time, reminder_interval, reminder_end_date,
        folder_id, is_archived, is_deleted, id, req.userId
      ]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Nota no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en updateNote:', error);
    res.status(500).json({ error: 'Error al actualizar nota' });
  }
};

const deleteNote = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'UPDATE notes SET is_deleted = true, updated_at = NOW() WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    res.json({ message: 'Nota eliminada' });
  } catch (error) {
    console.error('Error en deleteNote:', error);
    res.status(500).json({ error: 'Error al eliminar nota' });
  }
};

module.exports = { getNotes, createNote, updateNote, deleteNote };