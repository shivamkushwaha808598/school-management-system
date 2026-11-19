const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  ...(process.env.DB_SSL === 'true' ? { ssl: { rejectUnauthorized: false } } : {})
};

const DB_NAME = process.env.DB_NAME || 'school_management_db';

const pool = mysql.createPool({
  ...DB_CONFIG,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true
});

const connectDB = async () => {
  if (process.env.DB_SSL !== 'true') {
    let tempConnection;
    try {
      tempConnection = await mysql.createConnection(DB_CONFIG);
      await tempConnection.query(
        `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
      );
    } catch (err) {
      console.error('Database create warning:', err.message);
    } finally {
      if (tempConnection) await tempConnection.end();
    }
  }

  try {
    const connection = await pool.getConnection();
    console.log(`MySQL database '${DB_NAME}' connected successfully!`);
    connection.release();
  } catch (err) {
    console.error('Database connection error:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };
