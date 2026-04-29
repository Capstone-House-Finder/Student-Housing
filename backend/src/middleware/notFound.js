/**
 * 404 Not Found handler – catches any request that reaches this point.
 */
export function notFound(req, res, _next) {
    res.status(404).json({
        success: false,
        error: {
            message: `Endpoint ${req.originalUrl} not found`
        }
    });
}