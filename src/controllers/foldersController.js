const pool = require('../config/db');

const getFolders = async (req, res) => {
  try {
    const result = await pool.query(
      // ✅ Ordenar por position primero, created_at como fallback
      'SELECT * FROM folders WHERE user_id = $1 ORDER BY position ASC, created_at ASC',
      [req.userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error en getFolders:', error);
    res.status(500).json({ error: 'Error al obtener carpetas' });
  }
};

const createFolder = async (req, res) => {
  const { id, name, color, position } = req.body;          // ✅ NUEVO: position
  try {
    const result = await pool.query(
      `INSERT INTO folders (id, user_id, name, color, position, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING *`,
      [id, req.userId, name, color, position ?? 0]         // ✅ default 0
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error en createFolder:', error);
    res.status(500).json({ error: 'Error al crear carpeta' });
  }
};

const updateFolder = async (req, res) => {
  const { id } = req.params;
  const { name, color, position } = req.body;              // ✅ NUEVO: position
  try {
    const result = await pool.query(
      `UPDATE folders SET name=$1, color=$2, position=$3, updated_at=NOW()
       WHERE id=$4 AND user_id=$5 RETURNING *`,
      [name, color, position ?? 0, id, req.userId]         // ✅ NUEVO
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