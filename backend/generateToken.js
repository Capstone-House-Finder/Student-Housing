import jwt from 'jsonwebtoken';

// For testing: use a test secret or your JWT_SECRET from .env
const JWT_SECRET = process.env.JWT_SECRET || 'Mqf4gflFsmzxEwqf7POAcX4WKqYSekbjMIQ6AuYFOM8=';

// Create a test payload with a mock user
const payload = {
  id: 1,  // Mock user ID
  email: 'test@example.com'
};

// Generate token that expires in 24 hours
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

console.log('JWT Token for Testing:');
console.log(token);
console.log('\nUse this in your Authorization header:');
console.log(`Authorization: Bearer ${token}`);
