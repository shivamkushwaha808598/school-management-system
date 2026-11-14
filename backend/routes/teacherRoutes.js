const express = require('express');
const { pool: db } = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('teacher'));

// 1. GET: /api/teacher/my-classes (टीचर को असाइन की गई क्लासेस)
router.get('/my-classes', async (req, res) => {
  try {
    const [classes] = await db.query(
      'SELECT id, class_name, section FROM classes WHERE teacher_id = ?',
      [req.user.id]
    );
    res.json(classes);
  } catch (error) {
    console.error('Teacher Classes Error:', error);
    res.status(500).json({ message: 'क्लासेस लोड करने में समस्या आई।' });
  }
});

// 2. GET: /api/teacher/classes/:classId/students (किसी क्लास के सभी स्टूडेंट्स)
router.get('/classes/:classId/students', async (req, res) => {
  try {
    const [students] = await db.query(
      "SELECT id, name, email, phone FROM users WHERE role = 'student' AND class_id = ? ORDER BY name ASC",
      [req.params.classId]
    );
    res.json(students);
  } catch (error) {
    console.error('Class Students Error:', error);
    res.status(500).json({ message: 'स्टूडेंट्स की लिस्ट लाने में समस्या आई।' });
  }
});

// 3. POST: /api/teacher/attendance (एक साथ पूरी क्लास की अटेंडेंस लगाएं या अपडेट करें)
router.post('/attendance', async (req, res) => {
  const { class_id, date, records } = req.body;
  // records का फॉर्मेट: [{ student_id: 2, status: 'Present' }, { student_id: 3, status: 'Absent' }]

  if (!class_id || !date || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ message: 'class_id, date और records लिस्ट अनिवार्य हैं।' });
  }

  const validStatuses = ['Present', 'Absent', 'Late'];

  try {
    for (const rec of records) {
      if (!rec.student_id || !validStatuses.includes(rec.status)) {
        return res.status(400).json({ message: `अमान्य अटेंडेंस डेटा (Student ID: ${rec.student_id})` });
      }

      // ON DUPLICATE KEY UPDATE: यदि उसी तारीख की अटेंडेंस पहले से लगी है तो उसे अपडेट कर देगा
      await db.query(
        `INSERT INTO attendance (student_id, class_id, date, status, marked_by)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE status = VALUES(status), marked_by = VALUES(marked_by)`,
        [rec.student_id, class_id, date, rec.status, req.user.id]
      );
    }

    res.json({ message: 'अटेंडेंस सफलतापूर्वक सेव हो गई है।' });
  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({ message: 'अटेंडेंस सेव करने में एरर आया।' });
  }
});

// 4. GET: /api/teacher/notices (टीचर्स के लिए नोटिस)
router.get('/notices', async (req, res) => {
  try {
    const [notices] = await db.query(
      "SELECT id, title, description, created_at FROM notices WHERE target_role IN ('all', 'teacher') ORDER BY created_at DESC"
    );
    res.json(notices);
  } catch (error) {
    console.error('Teacher Notices Error:', error);
    res.status(500).json({ message: 'नोटिस लोड करने में समस्या आई।' });
  }
});

module.exports = router;