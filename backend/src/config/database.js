/**
 * Database connection pool configuration for MySQL (Aiven).
 *
 * The environment variable `DATABASE_URL` should be in the form:
 *   aiven://username:password@host:port/database
 * For compatibility with `mysql2`, we replace the protocol with `mysql://`.
 */
import mysql from 'mysql2/promise';

export function getDatabasePool() {
    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
        throw new Error('DATABASE_URL not defined in environment variables');
    }
    // Convert aiven:// to mysql:// for the mysql2 driver
    const url = rawUrl.replace(/^aiven:\/\//, 'mysql://');
    // mysql2 can parse the URL directly
    const pool = mysql.createPool(url);
    // Optionally test connection once at startup
    pool.getConnection()
        .then(conn => {
            console.log('✅ Connected to MySQL/Aiven database');
            conn.release();
        })
        .catch(err => {
            console.error('❌ Failed to connect to MySQL/Aiven database:', err.message);
        });
    return pool;
}
