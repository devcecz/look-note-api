const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const multer = require('multer');

const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
});

const upload = multer({ storage: multer.memoryStorage() });

const uploadAudio = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No se recibió archivo' });

    const userId = req.userId;
    const filename = `${userId}/${Date.now()}.wav`;

    await s3.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: filename,
      Body: req.file.buffer,
      ContentType: 'audio/wav',
    }));

    const url = `${process.env.R2_PUBLIC_URL}/${filename}`;
    console.log(`✅ Audio subido: ${url}`);
    res.json({ url, filename });

  } catch (error) {
    console.error('❌ Error subiendo audio:', error);
    res.status(500).json({ error: 'Error al subir audio' });
  }
};

const deleteAudio = async (req, res) => {
  try {
    const { filename } = req.params;
    const userId = req.userId;

    // Seguridad: solo puede borrar sus propios audios
    if (!filename.startsWith(`${userId}/`)) {
      return res.status(403).json({ error: 'No autorizado' });
    }

    await s3.send(new DeleteObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: decodeURIComponent(filename),
    }));

    console.log(`🗑️ Audio eliminado: ${filename}`);
    res.json({ message: 'Audio eliminado' });

  } catch (error) {
    console.error('❌ Error eliminando audio:', error);
    res.status(500).json({ error: 'Error al eliminar audio' });
  }
};

module.exports = { uploadAudio, deleteAudio, upload };