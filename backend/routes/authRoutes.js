const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit'); // npm install express-rate-limit
const { pool: db } = require('../config/db');

const router = express.Router();

// लॉगिन पर Brute-force रोकने के लिए Rate Limiter
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 मिनट
  max: 5, // 15 मिनट में अधिकतम 5 गलत प्रयास
  message: { message: 'बहुत अधिक प्रयास किए गए हैं। कृपया 15 मिनट बाद पुनः प्रयास करें।' }
});

// POST: /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  let { email, password } = req.body;

  // 1. टाइप और खाली होने की जांच
  if (typeof email !== 'string' || typeof password !== 'string' || !email.trim() || !password) {
    return res.status(400).json({ message: 'कृपया सही ईमेल और पासवर्ड भरें।' });
  }

  email = email.trim().toLowerCase();

  try {
    // 2. सिर्फ ज़रूरी कॉलम ही डेटाबेस से निकालें
    const [users] = await db.query(
      'SELECT id, name, email, password, role FROM users WHERE email = ? LIMIT 1',
      [email]
    );

    const user = users[0];

    // 3. Timing Attack से बचने के लिए डमी हैश का उपयोग करें
    const dummyHash = '$2a$10$CwTycUXWue0Thq9StjUM0uJ8.1/4R9w.6X1x.5Y6z.7A8b.9C0d1e';
    const passwordToCompare = user ? user.password : dummyHash;
    
    const isMatch = await bcrypt.compare(password, passwordToCompare);

    if (!user || !isMatch) {
      return res.status(401).json({ message: 'गलत ईमेल या पासवर्ड।' });
    }

    // 4. JWT Token जनरेट करें (Payload को हल्का रखें)
    if (!process.env.JWT_SECRET) {
      throw new Error('JWT_SECRET पर्यावरण चर (Environment Variable) सेट नहीं है।');
    }

    const token = jwt.sign(
      { id: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // 5. सुरक्षित Cookie में टोकन भेजें (वैकल्पिक लेकिन अनुशंसित)
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 दिन
    });

    res.json({
      message: 'लॉगिन सफल रहा',
      token, // यदि मोबाइल ऐप के लिए JSON में भी चाहिए तो रखें, वरना हटा दें
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login Error:', error);
    res.status(500).json({ message: 'सर्वर एरर, कृपया बाद में प्रयास करें।' });
  }
});

module.exports = router;