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
import listingRoutes from './Routes/listingRoutes.js';
import userRoutes from './Routes/userRoutes.js';
import reportRoutes from './Routes/reportRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
// Removed WhatsApp routes; functionality integrated into contact endpoint
import { getDatabasePool } from './config/database.js';

const app = express();
const port = process.env.PORT || 5000;

// Initialize database connection
const pool = getDatabasePool();

// Middleware
app.use(cors());
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
app.use('/api/auth', userRoutes);
app.use('/api/reports', reportRoutes);

// 404 handler
app.use(notFound);

// Error handling middleware (should be last)
app.use(errorHandler);

// Start server
app.listen(port, () => {
    console.log(`Server listening at port ${port}`);
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('SIGTERM signal received: closing HTTP server');
    await pool.end();
    process.exit(0);
});

export { pool };