const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken requerido' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    // Buscar o crear usuario
    let user = await pool.query(
      'SELECT * FROM users WHERE google_id = $1',
      [googleId]
    );

    if (user.rows.length === 0) {
      user = await pool.query(
        `INSERT INTO users (google_id, email, name, picture, created_at)
         VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
        [googleId, email, name, picture]
      );
    } else {
      user = await pool.query(
        `UPDATE users SET name = $1, picture = $2 WHERE google_id = $3 RETURNING *`,
        [name, picture, googleId]
      );
    }

    const dbUser = user.rows[0];

    // Generar JWT propio
    const token = jwt.sign(
      { userId: dbUser.id, email: dbUser.email },
      process.env.JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        picture: dbUser.picture,
      }
    });

  } catch (error) {
    console.error('Error en googleLogin:', error);
    res.status(401).json({ error: 'Token de Google inválido' });
  }
};

module.exports = { googleLogin };