const express = require('express');
const bcrypt = require('bcryptjs');
const { pool: db } = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('admin'));

// 1. GET: /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const [
      [[{ totalStudents }]],
      [[{ totalTeachers }]],
      [[{ totalClasses }]],
      [[{ pendingFees }]]
    ] = await Promise.all([
      db.query("SELECT COUNT(*) AS totalStudents FROM users WHERE role = 'student'"),
      db.query("SELECT COUNT(*) AS totalTeachers FROM users WHERE role = 'teacher'"),
      db.query("SELECT COUNT(*) AS totalClasses FROM classes"),
      db.query("SELECT COALESCE(SUM(amount), 0) AS pendingFees FROM fees WHERE status = 'Pending'")
    ]);

    res.json({ totalStudents, totalTeachers, totalClasses, pendingFees });
  } catch (error) {
    console.error('Stats Error:', error);
    res.status(500).json({ message: 'आंकड़े लोड करने में समस्या आई।' });
  }
});

// 2. POST: /api/admin/users
router.post('/users', async (req, res) => {
  let { name, email, password, role, class_id, phone } = req.body;

  if (!name || !email || !password || !role) {
    return res.status(400).json({ message: 'सभी ज़रूरी जानकारी भरें।' });
  }

  if (!['student', 'teacher'].includes(role)) {
    return res.status(400).json({ message: 'अमान्य रोल। केवल student या teacher ही जोड़ा जा सकता है।' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।' });
  }

  email = email.trim().toLowerCase();
  name = name.trim();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, class_id, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, role === 'student' ? (class_id || null) : null, phone || null]
    );

    res.status(201).json({ message: ${role} सफलतापूर्वक जोड़ा गया।, userId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'यह ईमेल पहले से रजिस्टर्ड है।' });
    }
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
      return res.status(400).json({ message: 'चुनी गई क्लास मौजूद नहीं है।' });
    }
    console.error('Create User Error:', error);
    res.status(500).json({ message: 'यूज़र जोड़ने में एरर आया।' });
  }
});

// 3. GET: /api/admin/users
router.get('/users', async (req, res) => {
  const { role } = req.query;

  if (role && !['student', 'teacher', 'admin'].includes(role)) {
    return res.status(400).json({ message: 'अमान्य रोल फ़िल्टर।' });
  }

  try {
    const query = role
      ? 'SELECT id, name, email, role, class_id, phone, created_at FROM users WHERE role = ? ORDER BY id DESC'
      : 'SELECT id, name, email, role, class_id, phone, created_at FROM users ORDER BY id DESC';
    const [users] = await db.query(query, role ? [role] : []);
    res.json(users);
  } catch (error) {
    console.error('Fetch Users Error:', error);
    res.status(500).json({ message: 'लिस्ट लाने में समस्या आई।' });
  }
});

// 4. POST: /api/admin/classes
router.post('/classes', async (req, res) => {
  const { class_name, section, teacher_id } = req.body;

  if (!class_name || !section) {
    return res.status(400).json({ message: 'क्लास का नाम और सेक्शन दोनों ज़रूरी हैं।' });
  }

  try {
    if (teacher_id) {
      const [teachers] = await db.query("SELECT id FROM users WHERE id = ? AND role = 'teacher'", [teacher_id]);
      if (teachers.length === 0) {
        return res.status(400).json({ message: 'दी गई ID किसी वैध टीचर की नहीं है।' });
      }
    }

    const [result] = await db.query(
      'INSERT INTO classes (class_name, section, teacher_id) VALUES (?, ?, ?)',
      [class_name.trim(), section.trim(), teacher_id || null]
    );
    res.status(201).json({ message: 'क्लास बन गई है।', classId: result.insertId });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ message: 'यह क्लास और सेक्शन पहले से मौजूद है।' });
    }
    console.error('Create Class Error:', error);
    res.status(500).json({ message: 'क्लास बनाने में एरर आया।' });
  }
});

// 5. GET: /api/admin/classes
router.get('/classes', async (req, res) => {
  try {
    const [classes] = await db.query(
      SELECT c.id, c.class_name, c.section, c.teacher_id, u.name AS teacher_name
      FROM classes c
      LEFT JOIN users u ON c.teacher_id = u.id
      ORDER BY c.class_name, c.section
    );
    res.json(classes);
  } catch (error) {
    console.error('Fetch Classes Error:', error);
    res.status(500).json({ message: 'क्लासेस लाने में त्रुटि हुई।' });
  }
});

// 6. POST: /api/admin/notices
router.post('/notices', async (req, res) => {
  const { title, description, target_role } = req.body;

  if (!title || !description) {
    return res.status(400).json({ message: 'नोटिस का शीर्षक और विवरण दोनों आवश्यक हैं।' });
  }

  const validTargets = ['all', 'teacher', 'student', 'parent'];
  const finalTarget = validTargets.includes(target_role) ? target_role : 'all';

  try {
    const [result] = await db.query(
      'INSERT INTO notices (title, description, target_role, posted_by) VALUES (?, ?, ?, ?)',
      [title.trim(), description.trim(), finalTarget, req.user.id]
    );
    res.status(201).json({ message: 'नोटिस पब्लिश हो गया।', noticeId: result.insertId });
  } catch (error) {
    console.error('Create Notice Error:', error);
    res.status(500).json({ message: 'नोटिस सेव करने में एरर आया।' });
  }
});

// 7. POST: /api/admin/fees
router.post('/fees', async (req, res) => {
  const { student_id, amount, due_date } = req.body;

  if (!student_id || !amount || !due_date) {
    return res.status(400).json({ message: 'Student ID, राशि और अंतिम तिथि आवश्यक हैं।' });
  }

  try {
    const [students] = await db.query("SELECT id FROM users WHERE id = ? AND role = 'student'", [student_id]);
    if (students.length === 0) {
      return res.status(400).json({ message: 'वैध स्टूडेंट नहीं मिला।' });
    }

    const [result] = await db.query(
      'INSERT INTO fees (student_id, amount, due_date, status) VALUES (?, ?, ?, ?)',
      [student_id, amount, due_date, 'Pending']
    );
    res.status(201).json({ message: 'फीस रिकॉर्ड बन गया है।', feeId: result.insertId });
  } catch (error) {
    console.error('Create Fee Error:', error);
    res.status(500).json({ message: 'फीस जोड़ने में एरर आया।' });
  }
});

// 8. GET: /api/admin/fees
router.get('/fees', async (req, res) => {
  try {
    const [fees] = await db.query(
      SELECT f.*, u.name AS student_name, u.email AS student_email
      FROM fees f
      JOIN users u ON f.student_id = u.id
      ORDER BY f.id DESC
    );
    res.json(fees);
  } catch (error) {
    console.error('Fetch Fees Error:', error);
    res.status(500).json({ message: 'फीस रिकॉर्ड्स लाने में त्रुटि हुई।' });
  }
});

// 9. PUT: /api/admin/fees/:id/pay
router.put('/fees/:id/pay', async (req, res) => {
  const { payment_id } = req.body || {};
  try {
    const [result] = await db.query(
      "UPDATE fees SET status = 'Paid', payment_id = ?, paid_on = CURDATE() WHERE id = ?",
      [payment_id || CASH-, req.params.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'फीस रिकॉर्ड नहीं मिला।' });
    }
    res.json({ message: 'फीस सफलतापूर्वक Paid मार्क कर दी गई है।' });
  } catch (error) {
    console.error('Pay Fee Error:', error);
    res.status(500).json({ message: 'फीस अपडेट करने में एरर आया।' });
  }
});

module.exports = router;
