// Password Reset Controller – implements forgot and reset password flow (BE-03)

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
import { z } from 'zod';
import { getDatabasePool } from '../config/database.js';

let poolInstance = null;
function getPool() {
  if (!poolInstance) {
    poolInstance = getDatabasePool();
  }
  return poolInstance;
}

// Validation schemas
const forgotSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

const resetSchema = z.object({
  token: z.string().min(1, { message: 'Token is required' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain an uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain a lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain a number' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain a special character' }),
});

/**
 * POST /api/auth/forgot-password
 * Generates a reset token, stores it, and temporarily suspends the account.
 * Does not reveal whether the email exists.
 */
export async function forgotPassword(req, res, next) {
  const pool = getPool();
  try {
    const validation = forgotSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid input', details: validation.error.flatten().fieldErrors },
      });
    }
    const { email } = validation.data;
    const [users] = await pool.query('SELECT id, status FROM users WHERE email = ? LIMIT 1', [email]);
    const user = users[0];
    // Always respond the same way to avoid enumeration
    if (!user) {
      return res.status(200).json({ success: true, message: 'If the email is registered, a reset link will be sent.' });
    }
    // Generate token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    // Store token (upsert) and mark used = false
    await pool.query(
      'INSERT INTO password_resets (user_id, token_hash, expires_at) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE token_hash = ?, expires_at = ?, used = FALSE',
      [user.id, tokenHash, expiresAt, tokenHash, expiresAt]
    );
    // Temporarily suspend the account
    if (user.status !== 'suspended') {
      await pool.query('UPDATE users SET status = ? WHERE id = ?', ['suspended', user.id]);
    }
    // Send email containing rawToken link
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT, 10),
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${rawToken}`;
      await transporter.sendMail({
        from: `"No Reply" <no-reply@${process.env.EMAIL_HOST}>`,
        to: email,
        subject: 'Password Reset Request',
        text: `You requested a password reset. Click the link to reset your password: ${resetLink}`,
      });
    } catch (mailErr) {
      console.error('Failed to send password reset email:', mailErr);
    }
    console.log(`Password reset token for user ${user.id}: ${rawToken}`);
    return res.status(200).json({ success: true, message: 'If the email is registered, a reset link will be sent.' });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 * Validates token, updates password, marks token used, and re‑activates account.
 */
export async function resetPassword(req, res, next) {
  const pool = getPool();
  try {
    const validation = resetSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid input', details: validation.error.flatten().fieldErrors },
      });
    }
    const { token, password } = validation.data;
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query(
      'SELECT user_id, expires_at, used FROM password_resets WHERE token_hash = ? LIMIT 1',
      [tokenHash]
    );
    const record = rows[0];
    if (!record || record.used) {
      return res.status(400).json({ success: false, error: { message: 'Invalid or expired token' } });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ success: false, error: { message: 'Invalid or expired token' } });
    }
    // Hash new password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    // Update user password and reactivate account
    await pool.query('UPDATE users SET password_hash = ?, status = ? WHERE id = ?', [passwordHash, 'active', record.user_id]);
    // Mark token used
    await pool.query('UPDATE password_resets SET used = TRUE WHERE token_hash = ?', [tokenHash]);
    return res.status(200).json({ success: true, message: 'Password has been reset.' });
  } catch (err) {
    next(err);
  }
}
