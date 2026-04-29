/**
 * Database connection pool configuration for MySQL (Aiven).
 *
 * The environment variable `DATABASE_URL` should be in the form:
 *   aiven://username:password@host:port/database
 * For compatibility with `mysql2`, we replace the protocol with `mysql://`.
 */
import mysql from 'mysql2/promise';

let pool = null;

function getDatabasePool() {
    if (pool) return pool;

    const rawUrl = process.env.DATABASE_URL;
    if (!rawUrl) {
        // Provide a dummy pool for test environments where the database is mocked
        if (process.env.NODE_ENV === 'test') {
            pool = {
                query: async () => [[]],
                getConnection: async () => ({ release: () => {} }),
            };
            return pool;
        }
        throw new Error('DATABASE_URL not defined in environment variables');
    }
    // Convert aiven:// to mysql:// for the mysql2 driver
    const url = rawUrl.replace(/^aiven:\/\//, 'mysql://');
    pool = mysql.createPool(url);

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

export { getDatabasePool };
