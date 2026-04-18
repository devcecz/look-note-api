const pool = require('../config/db');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const appleSignin = require('apple-signin-auth');

// ✅ Inicializar sin CLIENT_ID específico
const client = new OAuth2Client();

// ✅ Lista de CLIENT_IDs válidos (Android + iOS)
// filter(Boolean) quita undefined si alguna variable no está seteada
const VALID_GOOGLE_CLIENT_IDS = [
  process.env.GOOGLE_CLIENT_ID,       // Android (existente, no se toca)
  process.env.GOOGLE_CLIENT_ID_IOS,   // iOS (nueva variable)
].filter(Boolean);

const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ error: 'idToken requerido' });
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: VALID_GOOGLE_CLIENT_IDS, // ✅ Array de audiences válidos
    });

    const payload = ticket.getPayload();
    const { sub: googleId, email, name, picture } = payload;

    console.log(`✅ Google login exitoso: ${email} (audience: ${payload.aud})`);

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
    console.error('Error en googleLogin:', error.message || error);
    res.status(401).json({ error: 'Token de Google inválido', details: error.message });
  }
};

const appleLogin = async (req, res) => {
  const { identityToken, fullName, email } = req.body;

  if (!identityToken) {
    return res.status(400).json({ error: 'identityToken requerido' });
  }

  try {
    const applePayload = await appleSignin.verifyIdToken(identityToken, {
      audience: 'cecz.looknote.app',
      ignoreExpiration: false,
    });

    const appleId = applePayload.sub;
    const appleEmail = email || applePayload.email || `${appleId}@privaterelay.appleid.com`;
    const appleName = fullName || applePayload.email?.split('@')[0] || 'Usuario';

    // Buscar o crear usuario
    let user = await pool.query(
      'SELECT * FROM users WHERE apple_id = $1',
      [appleId]
    );

    if (user.rows.length === 0) {
      // Verificar si ya existe con ese email
      const existingEmail = await pool.query(
        'SELECT * FROM users WHERE email = $1',
        [appleEmail]
      );

      if (existingEmail.rows.length > 0) {
        // Vincular apple_id al usuario existente
        user = await pool.query(
          'UPDATE users SET apple_id = $1 WHERE email = $2 RETURNING *',
          [appleId, appleEmail]
        );
      } else {
        // Crear nuevo usuario
        user = await pool.query(
          `INSERT INTO users (apple_id, email, name, picture, created_at)
           VALUES ($1, $2, $3, $4, NOW()) RETURNING *`,
          [appleId, appleEmail, appleName, null]
        );
      }
    }

    const dbUser = user.rows[0];

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
    console.error('Error en appleLogin:', error.message || error);
    res.status(401).json({ error: 'Token de Apple inválido' });
  }
};

const saveFolderOrder = async (req, res) => {
  const userId = req.userId;
  const { folder_order } = req.body;

  try {
    await pool.query(
      'UPDATE users SET folder_order = $1 WHERE id = $2',
      [JSON.stringify(folder_order), userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error guardando orden:', error);
    res.status(500).json({ error: 'Error al guardar orden' });
  }
};

const getFolderOrder = async (req, res) => {
  const userId = req.userId;
  try {
    const result = await pool.query(
      'SELECT folder_order FROM users WHERE id = $1',
      [userId]
    );
    const order = result.rows[0]?.folder_order;
    res.json({ folder_order: order ? JSON.parse(order) : [] });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener orden' });
  }
};

module.exports = { googleLogin, appleLogin, saveFolderOrder, getFolderOrder };