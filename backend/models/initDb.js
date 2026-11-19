const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

const addForeignKeyIfMissing = async (table, constraintName, sql) => {
  const [rows] = await pool.query(
    `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND CONSTRAINT_NAME = ?
       AND CONSTRAINT_TYPE = 'FOREIGN KEY'`,
    [table, constraintName]
  );
  if (rows.length === 0) {
    await pool.query(sql);
  }
};

const initializeDatabase = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role ENUM('admin', 'teacher', 'student', 'parent') NOT NULL,
        class_id INT NULL,
        phone VARCHAR(20) NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_users_role (role),
        INDEX idx_users_class (class_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS classes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        class_name VARCHAR(50) NOT NULL,
        section VARCHAR(10) NOT NULL,
        teacher_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY uq_class_section (class_name, section),
        CONSTRAINT fk_classes_teacher
          FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await addForeignKeyIfMissing(
      'users',
      'fk_users_class',
      `ALTER TABLE users
         ADD CONSTRAINT fk_users_class
         FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE SET NULL`
    );

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        class_id INT NOT NULL,
        date DATE NOT NULL,
        status ENUM('Present', 'Absent', 'Late') NOT NULL,
        marked_by INT NULL,
        UNIQUE KEY unique_attendance (student_id, date),
        INDEX idx_attendance_class_date (class_id, date),
        CONSTRAINT fk_att_student
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE,
        CONSTRAINT fk_att_class
          FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
        CONSTRAINT fk_att_marked_by
          FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fees (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        due_date DATE NOT NULL,
        status ENUM('Paid', 'Pending') NOT NULL DEFAULT 'Pending',
        payment_id VARCHAR(100) NULL,
        paid_on DATE NULL,
        INDEX idx_fees_student (student_id),
        INDEX idx_fees_status (status),
        CONSTRAINT fk_fees_student
          FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS notices (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(200) NOT NULL,
        description TEXT NOT NULL,
        target_role ENUM('all', 'teacher', 'student', 'parent') NOT NULL DEFAULT 'all',
        posted_by INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_notices_role (target_role),
        CONSTRAINT fk_notices_posted_by
          FOREIGN KEY (posted_by) REFERENCES users(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS enquiries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        student_name VARCHAR(100) NOT NULL,
        parent_name VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        applying_class VARCHAR(50) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);

    const adminEmail = process.env.ADMIN_EMAIL || 'admin@school.com';
    const adminPass = process.env.ADMIN_PASSWORD || 'Admin@123';
    const [rows] = await pool.query('SELECT id FROM users WHERE email = ?', [adminEmail]);

    if (rows.length === 0) {
      const hashedPassword = await bcrypt.hash(adminPass, 10);
      await pool.query(
        'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
        ['Principal Admin', adminEmail, hashedPassword, 'admin']
      );
      console.log(`Default Admin created: ${adminEmail}`);
    }

    console.log('All MySQL tables ready!');
  } catch (err) {
    console.error('Database init error:', err.message);
    process.exit(1);
  }
};

module.exports = initializeDatabase;
