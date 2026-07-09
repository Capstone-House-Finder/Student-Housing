import { getDatabasePool } from '../config/database.js';

let poolInstance = null;
function getPool() {
  if (!poolInstance) {
    poolInstance = getDatabasePool();
  }
  return poolInstance;
}

export async function requireVerifiedEmail(req, res, next) {
  if (!req.user || !req.user.id) {
    return res.status(401).json({ success: false, error: { message: 'Unauthorized' } });
  }

  const pool = getPool();
  try {
    const [rows] = await pool.query('SELECT email_verified FROM users WHERE id = ? LIMIT 1', [req.user.id]);
    const user = rows[0];

    if (!user) {
      return res.status(404).json({ success: false, error: { message: 'User not found' } });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_UNVERIFIED',
          message: 'Your email address is unverified. Please verify your email to access this feature.',
          resendEndpoint: '/api/auth/resend-verification',
        }
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}
