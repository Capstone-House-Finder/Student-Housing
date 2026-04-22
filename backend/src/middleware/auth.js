import jwt from 'jsonwebtoken';

const authMiddleware = (req, res, next) => {
  // 1. Get token from header (Format: Authorization: Bearer <token>)
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided, access denied' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // 2. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Attach user data to the request object
    // This allows subsequent routes to know who is making the request
    req.user = decoded;

    // 4. Move to the next middleware or controller
    next();
  } catch (error) {
    // 5. Handle expired or tampered tokens
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export default authMiddleware;