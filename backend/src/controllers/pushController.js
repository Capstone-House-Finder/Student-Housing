import { getDatabasePool } from '../config/database.js';

let poolInstance = null;
function getPool() {
  if (!poolInstance) {
    poolInstance = getDatabasePool();
  }
  return poolInstance;
}

export async function registerToken(req, res, next) {
  const pool = getPool();
  try {
    const { token, platform } = req.body;
    if (!token || !['ios', 'android'].includes(platform)) {
      return res.status(400).json({ success: false, error: { message: 'Valid token and platform are required' } });
    }

    await pool.query(
      `INSERT INTO push_tokens (user_id, token, platform)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE user_id = VALUES(user_id), platform = VALUES(platform), updated_at = CURRENT_TIMESTAMP`,
      [req.user.id, token, platform]
    );

    res.status(200).json({ success: true, message: 'Push token registered' });
  } catch (err) {
    next(err);
  }
}

export async function unregisterToken(req, res, next) {
  const pool = getPool();
  try {
    const { token } = req.body;
    if (token) {
      await pool.query('DELETE FROM push_tokens WHERE user_id = ? AND token = ?', [req.user.id, token]);
    } else {
      await pool.query('DELETE FROM push_tokens WHERE user_id = ?', [req.user.id]);
    }
    res.status(200).json({ success: true, message: 'Push token unregistered' });
  } catch (err) {
    next(err);
  }
}

export async function sendNotification(userId, title, body, data = {}) {
  const pool = getPool();
  const [tokens] = await pool.query('SELECT token FROM push_tokens WHERE user_id = ?', [userId]);
  if (!tokens || tokens.length === 0) {
    return { sent: 0 };
  }

  const messages = tokens.map((row) => ({
    to: row.token,
    sound: 'default',
    title,
    body,
    data,
  }));

  const response = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(messages),
  });

  if (!response.ok) {
    throw new Error(`Expo push failed with ${response.status}`);
  }

  return { sent: messages.length };
}
