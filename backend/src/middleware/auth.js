/**
 * Production authentication middleware – verifies JWT tokens.
 * Attaches decoded user payload to `req.user`.
 * Also checks if user is suspended or deleted and blocks access if so.
 */
import jwt from 'jsonwebtoken';
import { getDatabasePool } from '../config/database.js';

let poolInstance = null;
function getPool() {
  if (!poolInstance) {
    poolInstance = getDatabasePool();
  }
  return poolInstance;
}

export function authenticate(req, res, next) {
    const JWT_SECRET = process.env.JWT_SECRET;

    if (!JWT_SECRET) {
        console.warn('JWT_SECRET not defined in environment variables');
        return res.status(500).json({ success: false, error: { message: 'Server configuration error' } });
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, error: { message: 'No token provided' } });
    }

    jwt.verify(token, JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(401).json({ success: false, error: { message: 'Invalid or expired token' } });
        }

        // Check if user is suspended or deleted
        try {
            const pool = getPool();
            const [rows] = await pool.query(
                'SELECT status FROM users WHERE id = ? LIMIT 1',
                [decoded.id]
            );
            const user = rows[0];

            if (!user) {
                return res.status(401).json({ success: false, error: { message: 'User not found' } });
            }

            if (user.status === 'suspended') {
                return res.status(403).json({
                    success: false,
                    error: {
                        code: 'ACCOUNT_SUSPENDED',
                        message: 'Your account has been suspended. Please contact support.',
                    },
                });
            }

            if (user.status === 'deleted') {
                return res.status(401).json({
                    success: false,
                    error: {
                        code: 'ACCOUNT_DELETED',
                        message: 'This account has been deleted.',
                    },
                });
            }

            req.user = decoded; // { id, email, ... }
            next();
        } catch (dbErr) {
            console.error('Database error in auth middleware:', dbErr);
            return res.status(500).json({ success: false, error: { message: 'Server error' } });
        }
    });
}
