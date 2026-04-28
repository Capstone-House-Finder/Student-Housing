/**
 * Production authentication middleware – verifies JWT tokens.
 * Attaches decoded user payload to `req.user`.
 */
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
}

export function authenticate(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Expect "Bearer <token>"

    if (!token) {
        return res.status(401).json({ success: false, error: { message: 'No token provided' } });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, error: { message: 'Invalid or expired token' } });
        }
        req.user = decoded; // { id, email, ... }
        next();
    });
}
