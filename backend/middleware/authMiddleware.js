const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  if (!process.env.JWT_SECRET) {
    console.error('❌ JWT_SECRET .env में सेट नहीं है');
    return res.status(500).json({ status: 'error', message: 'सर्वर कॉन्फ़िगरेशन त्रुटि' });
  }

  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ status: 'error', message: 'टोकन नहीं मिला (No token)' });
  }

  const token = authHeader.split(' ')[1];

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'टोकन की समय सीमा खत्म हो गई, दोबारा लॉगिन करें'
        : 'अमान्य टोकन (Not authorized)';
    return res.status(401).json({ status: 'error', message });
  }
};

const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'आपको इस कार्य की अनुमति नहीं है (Access Denied)'
      });
    }
    next();
  };
};

module.exports = { protect, authorizeRoles };