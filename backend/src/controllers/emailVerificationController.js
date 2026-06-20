import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDatabasePool } from '../config/database.js';

function createAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function createRefreshToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: '30d' }
  );
}

let poolInstance = null;
function getPool() {
  if (!poolInstance) {
    poolInstance = getDatabasePool();
  }
  return poolInstance;
}

const verifySchema = z.object({
  token: z.string().min(1, { message: 'Token is required' }),
});

const resendSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
});

// Minimal in-memory rate limiter
const ipLimits = new Map();
const emailLimits = new Map();
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS = 5; // max 5 requests per 15 minutes

function checkRateLimit(key, limitsMap) {
  const now = Date.now();
  const requests = (limitsMap.get(key) || []).filter(time => now - time < RATE_LIMIT_WINDOW_MS);
  if (requests.length >= MAX_REQUESTS) {
    const oldestRequest = requests[0];
    const retryAfterSec = Math.ceil((RATE_LIMIT_WINDOW_MS - (now - oldestRequest)) / 1000);
    return { limited: true, retryAfter: retryAfterSec };
  }
  requests.push(now);
  limitsMap.set(key, requests);
  return { limited: false };
}

/** @internal – resets in-memory rate limit state between tests */
export function resetRateLimitsForTesting() {
  ipLimits.clear();
  emailLimits.clear();
}

/**
 * GET/POST /api/auth/verify-email
 * Accepts token (from query or body) and validates it.
 */
export async function verifyEmail(req, res, next) {
  const pool = getPool();
  try {
    const token = req.query.token || req.body.token;
    const validation = verifySchema.safeParse({ token });
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Token is required', details: validation.error.flatten().fieldErrors },
      });
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const [rows] = await pool.query(
      'SELECT id, user_id, expires_at, used FROM email_verifications WHERE token_hash = ? LIMIT 1',
      [tokenHash]
    );

    const record = rows[0];
    if (!record) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token' }
      });
    }

    if (record.used) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOKEN_ALREADY_USED',
          message: 'This verification link has already been used.',
          resendEndpoint: '/api/auth/resend-verification',
        }
      });
    }

    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'This verification link has expired.',
          resendEndpoint: '/api/auth/resend-verification',
        }
      });
    }

    // Atomically mark token used (prevents double-consumption race)
    const [tokenUpdate] = await pool.query(
      'UPDATE email_verifications SET used = TRUE WHERE id = ? AND used = FALSE AND expires_at > NOW()',
      [record.id]
    );
    if (!tokenUpdate.affectedRows) {
      const [refreshed] = await pool.query(
        'SELECT used, expires_at FROM email_verifications WHERE id = ? LIMIT 1',
        [record.id]
      );
      const current = refreshed[0];
      if (current?.used) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'TOKEN_ALREADY_USED',
            message: 'This verification link has already been used.',
            resendEndpoint: '/api/auth/resend-verification',
          }
        });
      }
      return res.status(400).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'This verification link has expired.',
          resendEndpoint: '/api/auth/resend-verification',
        }
      });
    }

    await pool.query('UPDATE users SET email_verified = TRUE WHERE id = ?', [record.user_id]);

    const [users] = await pool.query(
      'SELECT id, email, role, email_verified FROM users WHERE id = ? LIMIT 1',
      [record.user_id]
    );
    const user = users[0];
    const authToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    return res.status(200).json({
      success: true,
      message: 'Email verified successfully.',
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          email_verified: true,
        },
        token: authToken,
        refreshToken,
      }
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/resend-verification
 * Resends the verification token, rate-limited per user and IP.
 * Prevents account enumeration.
 */
export async function resendVerification(req, res, next) {
  const pool = getPool();
  try {
    const validation = resendSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: { message: 'Invalid input', details: validation.error.flatten().fieldErrors },
      });
    }

    const { email } = validation.data;
    const normalizedEmail = email.trim().toLowerCase();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown-ip';

    // Enforce rate limiting
    const ipLimitCheck = checkRateLimit(ip, ipLimits);
    if (ipLimitCheck.limited) {
      res.setHeader('Retry-After', ipLimitCheck.retryAfter);
      return res.status(429).json({
        success: false,
        error: { message: 'Too many requests. Please try again later.', retryAfter: ipLimitCheck.retryAfter }
      });
    }

    const emailLimitCheck = checkRateLimit(normalizedEmail, emailLimits);
    if (emailLimitCheck.limited) {
      res.setHeader('Retry-After', emailLimitCheck.retryAfter);
      return res.status(429).json({
        success: false,
        error: { message: 'Too many requests. Please try again later.', retryAfter: emailLimitCheck.retryAfter }
      });
    }

    // Look up user by normalized email
    const [users] = await pool.query('SELECT id, status FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    const user = users[0];

    // Response must be identical regardless of whether user exists to prevent email enumeration
    const successResponse = {
      success: true,
      message: 'If the email is registered, a new verification link will be sent.'
    };

    if (!user) {
      return res.status(200).json(successResponse);
    }

    const [verifiedRows] = await pool.query(
      'SELECT email_verified FROM users WHERE id = ? LIMIT 1',
      [user.id]
    );
    if (verifiedRows[0]?.email_verified) {
      return res.status(200).json(successResponse);
    }

    // Invalidate/expire prior unused verification tokens
    await pool.query(
      'UPDATE email_verifications SET expires_at = CURRENT_TIMESTAMP WHERE user_id = ? AND used = FALSE',
      [user.id]
    );

    // Generate new token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await pool.query(
      'INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [user.id, tokenHash, expiresAt]
    );

    // Send email
    try {
      const { sendEmail } = await import('../config/email.js');
      const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}`;
      await sendEmail({
        to: normalizedEmail,
        subject: 'Verify Your Email Address',
        text: `Please verify your email by clicking: ${verifyLink}`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #0d6efd;">Verify Your Email Address</h2>
          <p>You requested a new verification link for your Student Housing account.</p>
          <p>Please click the button below to verify your email address. This link is valid for 24 hours.</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">If you did not request this, please ignore this email.</p>
        </div>`
      });
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
    }

    return res.status(200).json(successResponse);
  } catch (err) {
    next(err);
  }
}
