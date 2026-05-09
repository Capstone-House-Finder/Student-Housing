/**
 * Database connection pool configuration for MySQL (Aiven).
 * Handles SSL/TLS encryption with proper certificate.
 */
import mysql from 'mysql2/promise';
import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

let pool = null;

function getDatabasePool() {
    if (pool) return pool;

    let config;
    const rawUrl = process.env.DATABASE_URL;
    
    if (rawUrl) {
        try {
            const urlObj = new URL(rawUrl);
            config = {
                host: urlObj.hostname,
                port: parseInt(urlObj.port) || 3306,
                user: urlObj.username,
                password: urlObj.password,
                database: urlObj.pathname.slice(1) || 'defaultdb',
            };
            console.log(`📡 Configuring connection for remote host: ${config.host}`);
        } catch (err) {
            console.error('❌ Failed to parse DATABASE_URL:', err.message);
        }
    } 
    
    if (!config && process.env.DB_HOST) {
        config = {
            host: process.env.DB_HOST,
            port: parseInt(process.env.DB_PORT) || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'student_housing',
        };
    }

    if (!config) {
        if (process.env.NODE_ENV === 'test') {
            return {
                query: async () => [[]],
                getConnection: async () => ({ release: () => {} }),
            };
        }
        throw new Error('Database connection info missing. Set DATABASE_URL or DB_HOST.');
    }

    // SSL Configuration
    // Prefer certificate content from ENV (for Vercel), fallback to file
    if (process.env.DB_CA_CERT) {
        config.ssl = { ca: process.env.DB_CA_CERT, rejectUnauthorized: true };
        console.log('🔒 Using SSL certificate from environment variable');
    } else {
        const certPath = path.join(projectRoot, 'certs', 'ca.pem');
        try {
            if (fs.existsSync(certPath)) {
                const ca = fs.readFileSync(certPath, 'utf-8');
                config.ssl = { ca, rejectUnauthorized: true };
                console.log('✅ Loaded SSL certificate from certs/ca.pem');
            }
        } catch (err) {
            console.warn('⚠️  Could not load SSL certificate file:', err.message);
        }
    }

    pool = mysql.createPool({
        ...config,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        connectTimeout: 10000,
    });

    // Test connection
    pool.getConnection()
        .then(conn => {
            console.log(`✅ Successfully connected to database at ${config.host}`);
            conn.release();
        })
        .catch(err => {
            console.error(`❌ Connection failed to ${config.host}:`, err.message);
            if (config.ssl) {
                console.log('🔄 Retrying without SSL...');
                const noSslConfig = { ...config, ssl: undefined };
                const noSslPool = mysql.createPool(noSslConfig);
                noSslPool.getConnection()
                    .then(conn => {
                        console.log('✅ Connected without SSL');
                        conn.release();
                        pool = noSslPool;
                    })
                    .catch(e => console.error('❌ Final connection attempt failed:', e.message));
            }
        });

    return pool;
}

export { getDatabasePool };
