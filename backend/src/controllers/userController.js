/**
 * User controller – implements registration, login, profile operations.
 * BE-01: Implement user registration endpoint
 */

import crypto from 'crypto';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { getDatabasePool } from '../config/database.js';

// Lazy pool - only get it when needed (not at module load time)
let poolInstance = null;
function getPool() {
  if (!poolInstance) {
    poolInstance = getDatabasePool();
  }
  return poolInstance;
}

// Helper to get pool in each function
function getPoolInstance() {
  return getPool();
}

// ── Validation schemas (Zod) ────────────────────────────────────────

const registerSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string()
    .min(8, { message: 'Password must be at least 8 characters' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^a-zA-Z0-9]/, { message: 'Password must contain at least one special character' }),
  role: z.enum(['student', 'landlord', 'admin']).optional().default('student'),
  // Optional profile fields
  full_name: z.string().optional(),
  phone: z.string().optional(),
  avatar_url: z.string().url().optional(),
  bio: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

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

// ── Registration ────────────────────────────────────────────────────────

export async function register(req, res, next) {
  const pool = getPoolInstance();
  try {
    // 1. Validate input
    const validationResult = registerSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid input',
          details: validationResult.error.flatten().fieldErrors,
        },
      });
    }

    const { email: rawEmail, password, role } = validationResult.data;
    const email = rawEmail.trim().toLowerCase();

    // 2. Check for duplicate email
    const queryResult = await pool.query(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const existingUsers = Array.isArray(queryResult) ? queryResult[0] : [];
    if (existingUsers && existingUsers.length > 0) {
      return res.status(409).json({
        success: false,
        error: { message: 'Email already registered' },
      });
    }

    // 3. Hash password with bcrypt (saltRounds = 12)
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 4. Store user in users table and optionally create profile
    const [result] = await pool.query(
      'INSERT INTO users (email, password_hash, role) VALUES (?, ?, ?)',
      [email, passwordHash, role]
    );

    const userId = result.insertId;
    // Insert profile if any optional fields are provided
    const { full_name, phone, avatar_url, bio } = validationResult.data;
    if (full_name || phone || avatar_url || bio) {
      await pool.query(
        'INSERT INTO user_profiles (user_id, full_name, phone, avatar_url, bio) VALUES (?, ?, ?, ?, ?)',
        [userId, full_name || null, phone || null, avatar_url || null, bio || null]
      );
    }

    // 5. Generate unique token, set expiry, and store hashed token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await pool.query(
      'INSERT INTO email_verifications (user_id, token_hash, expires_at) VALUES (?, ?, ?)',
      [userId, tokenHash, expiresAt]
    );

    // 6. Send verification email
    try {
      const { sendEmail } = await import('../config/email.js');
      const verifyLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${rawToken}`;
      await sendEmail({
        to: email,
        subject: 'Verify Your Email Address',
        text: `Welcome! Please verify your email by clicking: ${verifyLink}`,
        html: `<div style="font-family: sans-serif; padding: 20px;">
          <h2 style="color: #0d6efd;">Verify Your Email Address</h2>
          <p>Thank you for registering with Student Housing!</p>
          <p>Please click the button below to verify your email address. This link is valid for 24 hours.</p>
          <a href="${verifyLink}" style="display: inline-block; padding: 10px 20px; background-color: #0d6efd; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">If you did not create this account, please ignore this email.</p>
        </div>`
      });
    } catch (mailErr) {
      console.error('Failed to send verification email:', mailErr);
    }

    // 7. Return 201 with status pending_verification
    res.status(201).json({
      success: true,
      data: {
        status: 'pending_verification',
        user: {
          id: userId,
          email,
          role,
          email_verified: false,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Login ────────────────────────────────────────────────────────────

export async function login(req, res, next) {
  const pool = getPoolInstance();
  try {
    // 1. Validate input
    const validationResult = loginSchema.safeParse(req.body);
    if (!validationResult.success) {
      return res.status(400).json({
        success: false,
        error: {
          message: 'Invalid input',
          details: validationResult.error.flatten().fieldErrors,
        },
      });
    }

    const { email: rawEmail, password } = validationResult.data;
    const email = rawEmail.trim().toLowerCase();

    // 2. Query user by email
    const loginResult = await pool.query(
      'SELECT id, email, password_hash, role, status, email_verified FROM users WHERE email = ? LIMIT 1',
      [email]
    );
    const users = Array.isArray(loginResult) ? loginResult[0] : [];

    if (!users || users.length === 0) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    const user = users[0];

    // 3. Compare password with bcrypt
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: { message: 'Invalid credentials' },
      });
    }

    // 4. Reject suspended accounts
    if (user.status === 'suspended') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_SUSPENDED',
          message: 'Your account has been suspended. Please contact support.',
        },
      });
    }

    if (!user.email_verified) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'EMAIL_UNVERIFIED',
          message: 'Your email address is unverified. Please verify your email to log in.',
          resendEndpoint: '/api/auth/resend-verification',
        }
      });
    }

    // 4. Generate JWT
    const token = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    // 5. Return 200 with JWT
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          email_verified: Boolean(user.email_verified),
        },
        token,
        refreshToken,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req, res, next) {
  const pool = getPoolInstance();
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, error: { message: 'Refresh token is required' } });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, error: { message: 'Invalid refresh token' } });
    }

    const [users] = await pool.query(
      'SELECT id, email, role FROM users WHERE id = ? AND status = ? LIMIT 1',
      [decoded.id, 'active']
    );
    if (!users || users.length === 0) {
      return res.status(401).json({ success: false, error: { message: 'User not found or inactive' } });
    }

    const user = users[0];
    res.status(200).json({
      success: true,
      data: {
        user,
        token: createAccessToken(user),
        accessToken: createAccessToken(user),
        refreshToken: createRefreshToken(user),
      },
    });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, error: { message: 'Invalid or expired refresh token' } });
    }
    next(err);
  }
}

// ── Get Profile ───────────────────────────────────────────────────────

export async function getProfile(req, res, next) {
  const pool = getPoolInstance();
  try {
    // req.user is set by auth middleware
    const [users] = await pool.query(
      'SELECT id, email, role, status, email_verified, created_at FROM users WHERE id = ? LIMIT 1',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: { message: 'User not found' },
      });
    }

    res.status(200).json({
      success: true,
      data: {
        user: {
          ...users[0],
          email_verified: Boolean(users[0].email_verified),
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Update Profile ─────────────────────────────────────────────────

export async function updateProfile(req, res, next) {
  const pool = getPoolInstance();
  try {
    const { full_name, phone, bio } = req.body;

    // Check if profile exists
    const [existing] = await pool.query(
      'SELECT id FROM user_profiles WHERE user_id = ? LIMIT 1',
      [req.user.id]
    );

    if (existing.length > 0) {
      // Update existing profile
      await pool.query(
        'UPDATE user_profiles SET full_name = ?, phone = ?, bio = ? WHERE user_id = ?',
        [full_name, phone, bio, req.user.id]
      );
    } else {
      // Create new profile
      await pool.query(
        'INSERT INTO user_profiles (user_id, full_name, phone, bio) VALUES (?, ?, ?, ?)',
        [req.user.id, full_name, phone, bio]
      );
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated',
    });
  } catch (err) {
    next(err);
  }
}
// ── Admin: Get All Users ─────────────────────────────────────────────────
export async function getAllUsers(req, res, next) {
  const pool = getPoolInstance();
  try {
    const [users] = await pool.query(
      'SELECT id, email, role, status, created_at FROM users',
      []
    );
    res.status(200).json({
      success: true,
      data: users,
    });
  } catch (err) {
    next(err);
  }
}

// ── Admin: Suspend User ─────────────────────────────────────────────────
export async function suspendUser(req, res, next) {
  const pool = getPoolInstance();
  const userId = parseInt(req.params.id, 10);
  try {
    // Verify user exists and is active (not suspended or deleted)
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND status = ?',
      [userId, 'active']
    );
    if (!rows || rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'User not found, already suspended, or deleted' },
      });
    }
    await pool.query('UPDATE users SET status = ? WHERE id = ?', ['suspended', userId]);
    // Invalidate tokens – optional: add to blocklist if needed
    res.status(200).json({
      success: true,
      message: 'User suspended',
    });
  } catch (err) {
    next(err);
  }
}

// ── Admin: Unsuspend User ─────────────────────────────────────────────────
export async function unsuspendUser(req, res, next) {
  const pool = getPoolInstance();
  const userId = parseInt(req.params.id, 10);
  try {
    // Verify user exists and is suspended (not deleted)
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND status = ?',
      [userId, 'suspended']
    );
    if (!rows || rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'User not found, not suspended, or deleted' },
      });
    }
    await pool.query('UPDATE users SET status = ? WHERE id = ?', ['active', userId]);
    res.status(200).json({
      success: true,
      message: 'User unsuspended',
    });
  } catch (err) {
    next(err);
  }
}

// ── Admin: Delete (Anonymize) User ────────────────────────────────────────
export async function deleteUser(req, res, next) {
  const pool = getPoolInstance();
  const userId = parseInt(req.params.id, 10);
  try {
    // Remove profile data
    await pool.query('DELETE FROM user_profiles WHERE user_id = ?', [userId]);
    // Delete listings owned by the user (will cascade to related tables)
    await pool.query('DELETE FROM listings WHERE landlord_id = ?', [userId]);
    // Delete rentals where user is student or landlord
    await pool.query('DELETE FROM rentals WHERE student_id = ? OR landlord_id = ?', [userId, userId]);
    // Delete reviews authored by the user
    await pool.query('DELETE FROM reviews WHERE student_id = ?', [userId]);
    // Anonymize email and mark as deleted
    const anonymizedEmail = `deleted_${userId}@example.com`;
    await pool.query(
      'UPDATE users SET email = ?, status = ?, email_verified = FALSE WHERE id = ?',
      [anonymizedEmail, 'deleted', userId]
    );
    res.status(200).json({
      success: true,
      message: 'User deleted (anonymized) and related data removed',
    });
  } catch (err) {
    next(err);
  }
}

// ── Admin: Listing Moderation ────────────────────────────────────────
export async function getAdminListings(req, res, next) {
  const pool = getPoolInstance();
  try {
    // Return all non-deleted listings (pending verification, flagged, and verified)
    const [listings] = await pool.query(
      'SELECT l.*, u.email as landlord_email FROM listings l JOIN users u ON l.landlord_id = u.id WHERE l.deleted_at IS NULL ORDER BY l.verified ASC, l.flagged DESC, l.created_at DESC',
      []
    );
    res.status(200).json({ success: true, data: listings });
  } catch (err) {
    next(err);
  }
}

export async function verifyListing(req, res, next) {
  const pool = getPoolInstance();
  const listingId = parseInt(req.params.id, 10);
  try {
    // Mark listing as verified and clear flagged
    const [result] = await pool.query(
      'UPDATE listings SET verified = true, flagged = false WHERE id = ? AND deleted_at IS NULL',
      [listingId]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }
    // Return updated listing
    const [rows] = await pool.query('SELECT * FROM listings WHERE id = ?', [listingId]);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function rejectListing(req, res, next) {
  const pool = getPoolInstance();
  const listingId = parseInt(req.params.id, 10);
  try {
    // Mark listing as not verified and flagged (rejected)
    const [result] = await pool.query(
      'UPDATE listings SET verified = false, flagged = true WHERE id = ? AND deleted_at IS NULL',
      [listingId]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }
    const [rows] = await pool.query('SELECT * FROM listings WHERE id = ?', [listingId]);
    res.status(200).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
}

export async function deleteListingAdmin(req, res, next) {
  const pool = getPoolInstance();
  const listingId = parseInt(req.params.id, 10);
  try {
    // Soft delete the listing
    const [result] = await pool.query(
      'UPDATE listings SET deleted_at = CURRENT_TIMESTAMP WHERE id = ? AND deleted_at IS NULL',
      [listingId]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ success: false, error: { message: 'Listing not found' } });
    }
    res.status(200).json({ success: true, message: `Listing ${listingId} deleted` });
  } catch (err) {
    next(err);
  }
}

