/**
 * Database connection pool configuration for MySQL (Aiven).
 * Handles SSL/TLS encryption with proper certificate.
 */
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

let pool = null;

function getDatabasePool() {
    if (pool) return pool;

    // Build config from DATABASE_URL or individual DB_* env vars
    let config;
    const rawUrl = process.env.DATABASE_URL;
    if (rawUrl) {
        const urlObj = new URL(rawUrl);
        config = {
            host: urlObj.hostname,
            port: parseInt(urlObj.port) || 3306,
            user: urlObj.username,
            password: urlObj.password,
            database: urlObj.pathname.slice(1) || 'defaultdb',
        };
    } else if (process.env.DB_HOST && process.env.DB_NAME) {
        config = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME,
        };
    } else if (process.env.NODE_ENV === 'test') {
        // Dummy pool for test environments
        pool = {
            query: async () => [[]],
            getConnection: async () => ({ release: () => {} }),
        };
        return pool;
    } else {
        throw new Error('Database connection info missing. Set DATABASE_URL or DB_HOST/DB_NAME.');
    }

    // Load Aiven CA certificate
    const certPath = path.join(projectRoot, 'certs', 'ca.pem');
    try {
        const ca = fs.readFileSync(certPath, 'utf-8');
        config.ssl = { ca, rejectUnauthorized: true };
        console.log('✅ Loaded SSL certificate from certs/ca.pem');
    } catch (err) {
        console.warn('⚠️  Could not load SSL certificate, using no SSL:', err.message);
        config.ssl = undefined;
    }

    // Timeouts to avoid ETIMEDOUT hanging
    // config.connectTimeout = 10000;   // 10s connect timeout
    // config.acquireTimeout = 10000;   // 10s acquire timeout

    pool = mysql.createPool({
        ...config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
    });

    // Test connection at startup
    pool.getConnection()
        .then(conn => {
            console.log('✅ Connected to MySQL/Aiven database');
            conn.release();
        })
        .catch(err => {
            console.error('❌ Failed to connect to MySQL/Aiven database:', err.message);
            
            config = {
                host: process.env.DB_HOST,
                port: parseInt(process.env.DB_PORT) || 3306,
                user: process.env.DB_USER || 'root',
                password: process.env.DB_PASSWORD || '',
                database: process.env.DB_NAME || 'defaultdb',
            };

            pool = mysql.createPool({
                ...config,
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0,
            });

            pool.getConnection()
                .then(conn => {
                    console.log('✅ Connected to MySQL database without SSL');
                    console.log(config);
                    conn.release();
                })
                .catch(err => {
                    console.error('❌ Failed to connect to MySQL database without SSL:', err.message);
                });
            
        });

    return pool;
}

export { getDatabasePool };
