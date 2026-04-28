/**
 * Development Authentication Middleware - Bypass JWT Verification
 * @module middleware/auth.dev
 *
 * This middleware bypasses JWT token verification for development/testing purposes
 * and attaches a mock user object to the request.
 */

/**
 * Middleware function to bypass JWT verification in development
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next middleware function
 * @returns {void} Calls next() to continue processing
 */
const authDevMiddleware = (req, res, next) => {
  // Attach a mock user object for testing purposes
  req.user = {
    id: 1,
    email: 'test@example.com',
    name: 'Test User'
  };

  // Continue to next middleware/route handler
  next();
};

// Export middleware for use in routes
export default authDevMiddleware;