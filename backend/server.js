const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { connectDB } = require('./config/db');
const initializeDatabase = require('./models/initDb');

const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const teacherRoutes = require('./routes/teacherRoutes');
const studentRoutes = require('./routes/studentRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => res.json({ status: 'success', message: 'Backend running!' }));

app.post('/api/enquiry', async (req, res) => {
  const { pool } = require('./config/db');
  const { student_name, parent_name, phone, applying_class, message } = req.body;
  if (!student_name || !parent_name || !phone || !applying_class) {
    return res.status(400).json({ message: 'All required fields are mandatory.' });
  }
  try {
    await pool.query(
      'INSERT INTO enquiries (student_name, parent_name, phone, applying_class, message) VALUES (?, ?, ?, ?, ?)',
      [ student_name.trim(), parent_name.trim(), phone.trim(), applying_class.trim(), message || '' ]
    );
    res.status(201).json({ message: 'Admission enquiry submitted successfully!' });
  } catch (err) {
    console.error('Enquiry Error:', err);
    res.status(500).json({ message: 'Failed to submit enquiry.' });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/teacher', teacherRoutes);
app.use('/api/student', studentRoutes);

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: 'Server error' }); });

const startServer = async () => {
  await connectDB();
  await initializeDatabase();
  app.listen(PORT, () => console.log('Server running on port ' + PORT));
};

startServer();
