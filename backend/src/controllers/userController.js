/**
 * User controller – implements registration, login, profile operations.
 * BE-01: Implement user registration endpoint
 */

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

    const { email, password, role } = validationResult.data;

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

    // 5. Generate JWT with payload { id, role }
    const token = jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 6. Return 201 with JWT
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: userId,
          email,
          role,
        },
        token,
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

    const { email, password } = validationResult.data;

    // 2. Query user by email
    const loginResult = await pool.query(
      'SELECT id, email, password_hash, role FROM users WHERE email = ? LIMIT 1',
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

    // 4. Generate JWT
    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // 5. Return 200 with JWT
    res.status(200).json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
        token,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── Get Profile ───────────────────────────────────────────────────────

export async function getProfile(req, res, next) {
  const pool = getPoolInstance();
  try {
    // req.user is set by auth middleware
    const [users] = await pool.query(
      'SELECT id, email, role, status, created_at FROM users WHERE id = ? LIMIT 1',
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
      data: { user: users[0] },
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
    // Verify user exists and is active
    const [rows] = await pool.query(
      'SELECT id FROM users WHERE id = ? AND status = ?',
      [userId, 'active']
    );
    if (!rows || rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'User not found or already suspended' },
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
    // Anonymize email and suspend account
    const anonymizedEmail = `deleted_${userId}@example.com`;
    await pool.query('UPDATE users SET email = ?, role = ? WHERE id = ?', [anonymizedEmail, 'suspended', userId]);
    res.status(200).json({
      success: true,
      message: 'User deleted (anonymized) and related data removed',
    });
  } catch (err) {
    next(err);
  }
}

