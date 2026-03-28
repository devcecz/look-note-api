const cron = require('node-cron');
const pool = require('../config/db');
const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const sendPush = async (fcmToken, title, body) => {
  try {
    await admin.messaging().send({
      token: fcmToken,
      notification: { title, body },
      android: {
        priority: 'high',
        notification: { sound: 'default' },
      },
    });
    console.log(`✅ Push enviada a: ${fcmToken.substring(0, 20)}...`);
  } catch (e) {
    console.error(`❌ Error enviando push: ${e.message}`);
  }
};

const startReminderCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      console.log(`⏰ Cron corriendo: ${now.toISOString()}`);

      // ✅ Query simplificado sin JOIN a used_trials
      const result = await pool.query(`
        SELECT 
          ae.id, ae.title, ae.description, ae.start_date, ae.reminder_interval,
          u.fcm_token
        FROM agenda_events ae
        JOIN users u ON u.id = ae.user_id
        WHERE 
          ae.is_deleted = false
          AND ae.reminder_interval != 'none'
          AND ae.reminder_sent = false
          AND u.fcm_token IS NOT NULL
      `);

      console.log(`📋 Eventos encontrados: ${result.rows.length}`);

      for (const event of result.rows) {
        const startDate = new Date(event.start_date);
        const reminderInterval = event.reminder_interval;

        let minutesBefore = 0;
        if (reminderInterval === '5min') minutesBefore = 5;
        else if (reminderInterval === '15min') minutesBefore = 15;
        else if (reminderInterval === '30min') minutesBefore = 30;
        else if (reminderInterval === '1h') minutesBefore = 60;
        else if (reminderInterval === '1d') minutesBefore = 1440;

        const reminderTime = new Date(startDate.getTime() - minutesBefore * 60000);
        const diffMs = Math.abs(reminderTime.getTime() - now.getTime());

        console.log(`📅 Evento: ${event.title} | reminderTime: ${reminderTime.toISOString()} | diff: ${diffMs}ms`);

        if (diffMs < 60000) {
          await sendPush(
            event.fcm_token,
            `📅 ${event.title}`,
            reminderInterval === '1d'
              ? 'Tu evento es mañana'
              : `Tu evento empieza en ${reminderInterval}`
          );

          await pool.query(
            'UPDATE agenda_events SET reminder_sent = true WHERE id = $1',
            [event.id]
          );
        }
      }
    } catch (e) {
      console.error('❌ Error en cron:', e.message);
    }
  });

  console.log('⏰ Cron de recordatorios iniciado');
};

module.exports = { startReminderCron };