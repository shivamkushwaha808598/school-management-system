const express = require('express');
const { pool: db } = require('../config/db');
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(protect, authorizeRoles('student'));

// 1. GET: /api/student/dashboard (प्रोफाइल, अटेंडेंस प्रतिशत, पेंडिंग फीस और नोटिस एक साथ)
router.get('/dashboard', async (req, res) => {
  const studentId = req.user.id;

  try {
    const [
      [profileRows],
      [attendanceRows],
      [feeRows],
      [noticeRows]
    ] = await Promise.all([
      db.query(
        `SELECT u.id, u.name, u.email, u.phone, c.class_name, c.section
         FROM users u
         LEFT JOIN classes c ON u.class_id = c.id
         WHERE u.id = ?`,
        [studentId]
      ),
      db.query(
        'SELECT date, status FROM attendance WHERE student_id = ? ORDER BY date DESC LIMIT 30',
        [studentId]
      ),
      db.query(
        'SELECT id, amount, due_date, status, payment_id, paid_on FROM fees WHERE student_id = ? ORDER BY due_date DESC',
        [studentId]
      ),
      db.query(
        "SELECT id, title, description, created_at FROM notices WHERE target_role IN ('all', 'student') ORDER BY created_at DESC LIMIT 10"
      )
    ]);

    const totalDays = attendanceRows.length;
    const presentDays = attendanceRows.filter(a => a.status === 'Present' || a.status === 'Late').length;
    const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

    res.json({
      profile: profileRows[0] || null,
      attendance: {
        percentage: attendancePercentage,
        totalDays,
        presentDays,
        recentRecords: attendanceRows
      },
      fees: feeRows,
      notices: noticeRows
    });
  } catch (error) {
    console.error('Student Dashboard Error:', error);
    res.status(500).json({ message: 'डैशबोर्ड डेटा लोड करने में समस्या आई।' });
  }
});

module.exports = router;