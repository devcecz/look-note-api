const pool = require('../config/db');

const getFolders = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM folders WHERE user_id = $1 ORDER BY created_at DESC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error en getFolders:', error);
    res.status(500).json({ error: 'Error al obtener carpetas' });
  }
};

const createFolder = async (req, res) => {
  const { id, name, color } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO folders (id, user_id, name, color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING *`,
      [id, req.userId, name, color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en createFolder:', error);
    res.status(500).json({ error: 'Error al crear carpeta' });
  }
};

const updateFolder = async (req, res) => {
  const { id } = req.params;
  const { name, color } = req.body;
  try {
    const result = await pool.query(
      `UPDATE folders SET name=$1, color=$2, updated_at=NOW()
       WHERE id=$3 AND user_id=$4 RETURNING *`,
      [name, color, id, req.userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Carpeta no encontrada' });
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Error en updateFolder:', error);
    res.status(500).json({ error: 'Error al actualizar carpeta' });
  }
};

const deleteFolder = async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query(
      'DELETE FROM folders WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    );
    res.json({ message: 'Carpeta eliminada' });
  } catch (error) {
    console.error('Error en deleteFolder:', error);
    res.status(500).json({ error: 'Error al eliminar carpeta' });
  }
};

module.exports = { getFolders, createFolder, updateFolder, deleteFolder };