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
        if (reminderInterval === '5min')  minutesBefore = 5;
        else if (reminderInterval === '15min') minutesBefore = 15;
        else if (reminderInterval === '30min') minutesBefore = 30;
        else if (reminderInterval === '1h')    minutesBefore = 60;
        else if (reminderInterval === '1d')    minutesBefore = 1440;

        const reminderTime = new Date(startDate.getTime() - minutesBefore * 60000);
        const diffMs = reminderTime.getTime() - now.getTime();
        const minutesLate = Math.floor(Math.abs(diffMs) / 60000);

        console.log(`📅 Evento: ${event.title} | reminderTime: ${reminderTime.toISOString()} | diffMs: ${diffMs}`);

        // ✅ Caso 1: es hora exacta (ventana de 1 minuto) — push normal
        if (diffMs >= -60000 && diffMs <= 0) {
          await sendPush(
            event.fcm_token,
            `📅 ${event.title}`,
            reminderInterval === '1d'
              ? 'Tu evento es mañana'
              : `Tu evento empieza en ${reminderInterval}`
          );
          console.log(`🔔 Push normal enviada: ${event.title}`);

        // ✅ Caso 2: llegó tarde pero menos de 60 min — push con aviso de retraso
        } else if (diffMs < -60000 && minutesLate <= 60) {
          await sendPush(
            event.fcm_token,
            `📅 ${event.title}`,
            `Recordatorio tardío — hace ${minutesLate} min`
          );
          console.log(`⚠️ Push tardía enviada (${minutesLate} min tarde): ${event.title}`);

        // ✅ Caso 3: pasaron más de 60 min — marca sin push para no spamear
        } else if (diffMs < -60000 && minutesLate > 60) {
          console.log(`⏭️ Reminder expirado (${minutesLate} min tarde), marcando sin push: ${event.title}`);
        }

        // ✅ En los 3 casos marca reminder_sent = true para no reintentar
        if (diffMs <= 0) {
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