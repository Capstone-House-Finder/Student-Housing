import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env from project root (not backend directory)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');
dotenv.config({ path: path.join(projectRoot, '.env') });

import cors from 'cors';
import adminRoutes from './Routes/adminRoutes.js';
import listingRoutes from './Routes/listingRoutes.js';
import rentalRoutes from './Routes/rentalRoutes.js';
import userRoutes from './Routes/userRoutes.js';
import reportRoutes from './Routes/reportRoutes.js';
import reviewRoutes from './Routes/reviewRoutes.js';
import amenityRoutes from './Routes/amenityRoutes.js';
import contactRoutes from './Routes/contactRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

import { notFound } from './middleware/notFound.js';
// Removed WhatsApp routes; functionality integrated into contact endpoint
import { getDatabasePool } from './config/database.js';

const app = express();
const port = process.env.PORT || 5000;

// Initialize database connection
const pool = getDatabasePool();

// Cors configuration (allow frontend origin)
const allowedOrigins = [
    process.env.FRONTEND_URL,
    'http://localhost:3000',
    'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        
        if (allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.originalUrl}`);
    next();
});

// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        // Test database connection
        await pool.getConnection();
        res.status(200).json({
            status: 'healthy',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            database: 'disconnected',
            error: error.message
        });
    }
});

// API Routes
app.use('/api/listings', listingRoutes);
app.use('/api/rentals', rentalRoutes);
app.use('/api/auth', userRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/amenities', amenityRoutes);
app.use('/api/contacts', contactRoutes);


// 404 handler
app.use(notFound);

// Error handling middleware (should be last)
app.use(errorHandler);

/** 
 * Uncomment the following lines to enable HTTPS with self-signed certificates for local development.
 * Make sure to generate cert.pem and key.pem files and place them in the config directory.
 * Note: Browsers will show a security warning for self-signed certificates.
// Start server
app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
});

*/

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await pool.end();
    process.exit(0);
});

export { pool };

// Export app for testing purposes
export default app;