import { useEffect, useState } from 'react';
import API from '../api/axios';

const TeacherDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [notices, setNotices] = useState([]);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 1. टीचर की क्लासेस और नोटिस लोड करें
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [classRes, noticeRes] = await Promise.all([
          API.get('/teacher/my-classes'),
          API.get('/teacher/notices'),
        ]);
        setClasses(classRes.data);
        setNotices(noticeRes.data);
        if (classRes.data.length > 0) {
          setSelectedClass(String(classRes.data[0].id));
        }
      } catch (err) {
        setMessage({
          type: 'error',
          text: err.response?.data?.message || 'डेटा लोड करने में समस्या आई।',
        });
      }
    };
    fetchInitialData();
  }, []);

  // 2. चुनी गई क्लास के स्टूडेंट्स लोड करें
  useEffect(() => {
    if (!selectedClass) {
      setStudents([]);
      return;
    }

    const fetchStudents = async () => {
      setLoadingStudents(true);
      setMessage({ type: '', text: '' });
      try {
        const res = await API.get(`/teacher/classes/${selectedClass}/students`);
        setStudents(res.data);

        // सभी स्टूडेंट्स को डिफ़ॉल्ट 'Present' सेट करें
        const initialStatus = {};
        res.data.forEach((stu) => {
          initialStatus[stu.id] = 'Present';
        });
        setAttendance(initialStatus);
      } catch (err) {
        setMessage({
          type: 'error',
          text: err.response?.data?.message || 'स्टूडेंट्स लोड करने में समस्या आई।',
        });
      } finally {
        setLoadingStudents(false);
      }
    };

    fetchStudents();
  }, [selectedClass]);

  const handleStatusChange = (studentId, status) => {
    setAttendance((prev) => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendance = async (e) => {
    e.preventDefault();
    if (!selectedClass || students.length === 0) return;

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    const records = students.map((stu) => ({
      student_id: stu.id,
      status: attendance[stu.id] || 'Present',
    }));

    try {
      const res = await API.post('/teacher/attendance', {
        class_id: Number(selectedClass),
        date,
        records,
      });
      setMessage({ type: 'success', text: res.data.message || 'अटेंडेंस सेव हो गई।' });
    } catch (err) {
      setMessage({
        type: 'error',
        text: err.response?.data?.message || 'अटेंडेंस सबमिट करने में एरर आया।',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Teacher Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#4b5563' }}>
            स्वागत है, <strong>{user.name}</strong> ({user.email})
          </p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Alert Message */}
      {message.text && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '6px',
            marginBottom: '20px',
            background: message.type === 'success' ? '#dcfce7' : '#fee2e2',
            color: message.type === 'success' ? '#166534' : '#b91c1c',
            fontWeight: 'bold',
          }}
        >
          {message.text}
        </div>
      )}

      {/* Attendance Section */}
      <div style={{ border: '1px solid #d1d5db', borderRadius: '8px', padding: '20px', marginBottom: '28px' }}>
        <h2 style={{ marginTop: 0 }}>Mark Daily Attendance</h2>

        {classes.length === 0 ? (
          <p style={{ color: '#b91c1c' }}>आपको अभी तक कोई क्लास असाइन नहीं की गई है। Admin से संपर्क करें।</p>
        ) : (
          <form onSubmit={handleSubmitAttendance}>
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Select Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid #9ca3af', minWidth: '180px' }}
                >
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.class_name} - {cls.section}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 'bold' }}>Attendance Date</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  style={{ padding: '7px 12px', borderRadius: '4px', border: '1px solid #9ca3af' }}
                />
              </div>
            </div>

            {loadingStudents ? (
              <p>स्टूडेंट्स लोड हो रहे हैं...</p>
            ) : students.length === 0 ? (
              <p style={{ color: '#6b7280' }}>इस क्लास में अभी कोई स्टूडेंट रजिस्टर्ड नहीं है।</p>
            ) : (
              <>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
                  <thead>
                    <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>ID</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Student Name</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Email</th>
                      <th style={{ padding: '10px', border: '1px solid #ddd' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((stu) => (
                      <tr key={stu.id}>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{stu.id}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd', fontWeight: 'bold' }}>{stu.name}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>{stu.email}</td>
                        <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                          {['Present', 'Absent', 'Late'].map((statusOption) => (
                            <label key={statusOption} style={{ marginRight: '14px', cursor: 'pointer' }}>
                              <input
                                type="radio"
                                name={`status-${stu.id}`}
                                value={statusOption}
                                checked={attendance[stu.id] === statusOption}
                                onChange={() => handleStatusChange(stu.id, statusOption)}
                                style={{ marginRight: '4px' }}
                              />
                              <span
                                style={{
                                  fontWeight: attendance[stu.id] === statusOption ? 'bold' : 'normal',
                                  color:
                                    statusOption === 'Present'
                                      ? '#166534'
                                      : statusOption === 'Absent'
                                      ? '#b91c1c'
                                      : '#b45309',
                                }}
                              >
                                {statusOption}
                              </span>
                            </label>
                          ))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <button
                  type="submit"
                  disabled={submitting}
                  style={{
                    padding: '10px 20px',
                    background: '#2563eb',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  {submitting ? 'सेव हो रहा है...' : 'Save Attendance'}
                </button>
              </>
            )}
          </form>
        )}
      </div>

      {/* Notices Section */}
      <div>
        <h3>Teacher Notices</h3>
        {notices.length === 0 ? (
          <p>कोई नोटिस उपलब्ध नहीं है।</p>
        ) : (
          notices.map((n) => (
            <div key={n.id} style={{ padding: '12px 16px', border: '1px solid #e5e7eb', borderLeft: '4px solid #16a34a', borderRadius: '6px', marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 4px' }}>{n.title}</h4>
              <p style={{ margin: '0 0 6px', color: '#374151' }}>{n.description}</p>
              <small style={{ color: '#6b7280' }}>{new Date(n.created_at).toLocaleDateString()}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default TeacherDashboard;