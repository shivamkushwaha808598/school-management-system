const express = require('express');
const bcrypt = require('bcryptjs');
const { pool: db } = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();
router.use(protect, authorizeRoles('admin'));

router.get('/stats', async (req, res) => {
  try {
    const [[[{ totalStudents }]], [[{ totalTeachers }]], [[{ totalClasses }]], [[{ pendingFees }]]] = await Promise.all([
      db.query("SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'"),
      db.query("SELECT COUNT(*) AS totalTeachers FROM users WHERE role = 'teacher'"),
      db.query("SELECT COUNT(*) AS totalClasses FROM classes"),
      db.query("SELECT COALESCE(SUM(amount), 0) AS pendingFees FROM fees WHERE status = 'Pending'")
    ]);
    res.json({ totalStudents, totalTeachers, totalClasses, pendingFees });
  } catch (e) {
    res.status(500).json({ message: 'Error loading stats' });
  }
});

router.post('/users', async (req, res) => {
  let { name, email, password, role, class_id, phone } = req.body;
  if (!name || !email || !password || !role) return res.status(400).json({ message: 'All fields required' });
  if (!['student', 'teacher'].includes(role)) return res.status(400).json({ message: 'Invalid role' });
  if (password.length < 6) return res.status(400).json({ message: 'Password min 6 chars' });
  try {
    const hashed = await bcrypt.hash(password, 10);
    const [r] = await db.query(
      'INSERT INTO users (name, email, password, role, class_id, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), email.trim().toLowerCase(), hashed, role, role === 'student' ? (class_id || null) : null, phone || null]
    );
    res.status(201).json({ message: `${role} added successfully`, userId: r.insertId });
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: 'Email already registered' });
    res.status(500).json({ message: 'Error creating user' });
  }
});

router.get('/users', async (req, res) => {
  const { role } = req.query;
  try {
    const q = role
      ? 'SELECT id, name, email, role, class_id, phone, created_at FROM users WHERE role = ? ORDER BY id DESC'
      : 'SELECT id, name, email, role, class_id, phone, created_at FROM users ORDER BY id DESC';
    const [users] = await db.query(q, role ? [role] : []);
    res.json(users);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.post('/classes', async (req, res) => {
  const { class_name, section, teacher_id } = req.body;
  if (!class_name || !section) return res.status(400).json({ message: 'Class name and section required' });
  try {
    const [r] = await db.query(
      'INSERT INTO classes (class_name, section, teacher_id) VALUES (?, ?, ?)',
      [class_name.trim(), section.trim(), teacher_id || null]
    );
    res.status(201).json({ message: 'Class created', classId: r.insertId });
  } catch (e) {
    res.status(500).json({ message: 'Error creating class' });
  }
});

router.get('/classes', async (req, res) => {
  try {
    const [classes] = await db.query(
      'SELECT c.id, c.class_name, c.section, c.teacher_id, u.name AS teacher_name FROM classes c LEFT JOIN users u ON c.teacher_id = u.id ORDER BY c.class_name, c.section'
    );
    res.json(classes);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching classes' });
  }
});

router.post('/notices', async (req, res) => {
  const { title, description, target_role } = req.body;
  if (!title || !description) return res.status(400).json({ message: 'Title and description required' });
  try {
    const [r] = await db.query(
      'INSERT INTO notices (title, description, target_role, posted_by) VALUES (?, ?, ?, ?)',
      [title.trim(), description.trim(), target_role || 'all', req.user.id]
    );
    res.status(201).json({ message: 'Notice published', noticeId: r.insertId });
  } catch (e) {
    res.status(500).json({ message: 'Error saving notice' });
  }
});

router.post('/fees', async (req, res) => {
  const { student_id, amount, due_date } = req.body;
  if (!student_id || !amount || !due_date) return res.status(400).json({ message: 'All fee fields required' });
  try {
    const [r] = await db.query(
      "INSERT INTO fees (student_id, amount, due_date, status) VALUES (?, ?, ?, 'Pending')",
      [student_id, amount, due_date]
    );
    res.status(201).json({ message: 'Fee record created', feeId: r.insertId });
  } catch (e) {
    res.status(500).json({ message: 'Error adding fee' });
  }
});

router.get('/fees', async (req, res) => {
  try {
    const [fees] = await db.query(
      'SELECT f.*, u.name AS student_name, u.email AS student_email FROM fees f JOIN users u ON f.student_id = u.id ORDER BY f.id DESC'
    );
    res.json(fees);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching fees' });
  }
});

router.put('/fees/:id/pay', async (req, res) => {
  const { payment_id } = req.body || {};
  try {
    const [r] = await db.query(
      "UPDATE fees SET status = 'Paid', payment_id = ?, paid_on = CURDATE() WHERE id = ?",
      [payment_id || 'CASH-' + Date.now(), req.params.id]
    );
    if (r.affectedRows === 0) return res.status(404).json({ message: 'Fee record not found' });
    res.json({ message: 'Fee marked as Paid' });
  } catch (e) {
    res.status(500).json({ message: 'Error updating fee' });
  }
});

router.get('/enquiries', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM enquiries ORDER BY id DESC');
    res.json(rows);
  } catch (e) {
    res.status(500).json({ message: 'Error fetching enquiries' });
  }
});

module.exports = router;
