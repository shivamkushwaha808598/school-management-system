const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const initializeDatabase = require('./models/initDb');

// 1. सभी रूट फाइलों को इम्पोर्ट करें
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// टेस्ट रूट
app.get('/', (req, res) => {
  res.json({
    status: 'success',
    message: 'School Management System MySQL Backend चल रहा है!'
  });
});

// 2. API Routes (इन्हें हमेशा 404 हैंडलर से ऊपर रखें)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

// 404 हैंडलर (बाकी सभी routes के बाद ही रखें)
app.use((req, res) => {
  res.status(404).json({ status: 'error', message: 'Route नहीं मिला' });
});

// ग्लोबल एरर हैंडलर
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.message);
  res.status(500).json({ status: 'error', message: 'सर्वर में कोई त्रुटि हुई' });
});

// डेटाबेस कनेक्ट करके सर्वर स्टार्ट करें
const startServer = async () => {
  try {
    if (!process.env.JWT_SECRET) {
      throw new Error('.env फाइल में JWT_SECRET सेट नहीं है!');
    }

    await connectDB();
    await initializeDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 सर्वर पोर्ट ${PORT} पर चल रहा है: http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ सर्वर स्टार्ट नहीं हो सका:', err.message);
    process.exit(1);
  }
};

startServer();