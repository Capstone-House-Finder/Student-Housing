import { createPool } from 'mysql2';
import 'dotenv/config';

// Create a connection pool
const pool = createPool({
  host: process.env.DB_HOST || 'localhost',      // or your database host (e.g., '127.0.0.1')
  user: process.env.DB_USER || 'root',           // your MySQL username
  password: process.env.DB_PASSWORD, // your MySQL password
  database: process.env.DB_NAME, // the name of your database
  waitForConnections: true,
  connectionLimit: 10,    // max number of simultaneous connections
  queueLimit: 0
});

// Convert the pool to use Promises (allows the use of async/await)
const promisePool = pool.promise();

export const execute = promisePool.execute.bind(promisePool);
export const query = promisePool.query.bind(promisePool);
export const getConnection = promisePool.getConnection.bind(promisePool);

export default promisePool;