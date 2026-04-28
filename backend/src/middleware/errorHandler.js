/**
 * Global error handling middleware for Express.
 * Catches any errors thrown in routes or previous middleware,
 * logs them, and returns a standardized JSON response.
 */
export function errorHandler(err, req, res, next) {
    const status = err.status || 500;
    const message = err.message || 'Internal Server Error';
    // Log the error (could be replaced with a proper logger)
    console.error(`[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}`, {
        message: err.message,
        stack: err.stack,
        status
    });
    res.status(status).json({
        success: false,
        error: {
            message,
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
}