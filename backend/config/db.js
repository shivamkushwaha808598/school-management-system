const mysql = require('mysql2/promise');
require('dotenv').config();

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || ''
};

const DB_NAME = process.env.DB_NAME || 'school_management_db';

// Connection Pool (तेज़ और सुरक्षित क्वेरी के लिए)
const pool = mysql.createPool({
  ...DB_CONFIG,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  charset: 'utf8mb4',
  dateStrings: true // DATE कॉलम 'YYYY-MM-DD' स्ट्रिंग में मिलेंगे
});

// डेटाबेस बनाने और कनेक्शन चेक करने का फंक्शन
const connectDB = async () => {
  let tempConnection;
  try {
    tempConnection = await mysql.createConnection(DB_CONFIG);
    await tempConnection.query(
      `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
  } catch (err) {
    console.error('❌ डेटाबेस बनाने में त्रुटि:', err.message);
    process.exit(1);
  } finally {
    if (tempConnection) await tempConnection.end();
  }

  try {
    const connection = await pool.getConnection();
    console.log(`✅ MySQL डेटाबेस '${DB_NAME}' से सफलतापूर्वक जुड़ गया!`);
    connection.release();
  } catch (err) {
    console.error('❌ MySQL कनेक्शन में त्रुटि:', err.message);
    process.exit(1);
  }
};

module.exports = { pool, connectDB };