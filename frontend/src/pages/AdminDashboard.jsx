import { useEffect, useState } from 'react';
import API from '../api/axios';

const AdminDashboard = () => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [fees, setFees] = useState([]);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Forms State
  const [userForm, setUserForm] = useState({ name: '', email: '', password: '', role: 'student', class_id: '' });
  const [classForm, setClassForm] = useState({ class_name: '', section: '', teacher_id: '' });
  const [feeForm, setFeeForm] = useState({ student_id: '', amount: '', due_date: '' });
  const [noticeForm, setNoticeForm] = useState({ title: '', description: '', target_role: 'all' });

  const loadAllData = async () => {
    try {
      const [tRes, sRes, cRes, fRes] = await Promise.all([
        API.get('/admin/users?role=teacher'),
        API.get('/admin/users?role=student'),
        API.get('/admin/classes'),
        API.get('/admin/fees'),
      ]);
      setTeachers(tRes.data);
      setStudents(sRes.data);
      setClasses(cRes.data);
      setFees(fRes.data);
    } catch (err) {
      setMsg({ type: 'error', text: err.response?.data?.message || 'डेटा लोड करने में समस्या आई।' });
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const showAlert = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg({ type: '', text: '' }), 4000);
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...userForm, class_id: userForm.role === 'student' && userForm.class_id ? Number(userForm.class_id) : null };
      const res = await API.post('/admin/users', payload);
      showAlert('success', res.data.message || 'यूज़र बन गया।');
      setUserForm({ name: '', email: '', password: '', role: 'student', class_id: '' });
      loadAllData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'यूज़र बनाने में एरर आया।');
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const payload = { ...classForm, teacher_id: classForm.teacher_id ? Number(classForm.teacher_id) : null };
      const res = await API.post('/admin/classes', payload);
      showAlert('success', res.data.message || 'क्लास बन गई।');
      setClassForm({ class_name: '', section: '', teacher_id: '' });
      loadAllData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'क्लास बनाने में एरर आया।');
    }
  };

  const handleCreateFee = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/fees', {
        student_id: Number(feeForm.student_id),
        amount: Number(feeForm.amount),
        due_date: feeForm.due_date,
      });
      showAlert('success', res.data.message || 'फीस रिकॉर्ड बन गया।');
      setFeeForm({ student_id: '', amount: '', due_date: '' });
      loadAllData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'फीस बनाने में एरर आया।');
    }
  };

  const handleMarkPaid = async (feeId) => {
    try {
      const res = await API.put(`/admin/fees/${feeId}/pay`);
      showAlert('success', res.data.message);
      loadAllData();
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'फीस अपडेट नहीं हो सकी।');
    }
  };

  const handlePublishNotice = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/admin/notices', noticeForm);
      showAlert('success', res.data.message || 'नोटिस पब्लिश हो गया।');
      setNoticeForm({ title: '', description: '', target_role: 'all' });
    } catch (err) {
      showAlert('error', err.response?.data?.message || 'नोटिस पब्लिश नहीं हो सका।');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const inputStyle = { width: '100%', padding: '8px', marginBottom: '10px', boxSizing: 'border-box', borderRadius: '4px', border: '1px solid #cbd5e1' };
  const btnStyle = { padding: '8px 16px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' };
  const cardStyle = { border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px', background: '#fff' };

  return (
    <div style={{ maxWidth: '1150px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Admin Control Panel</h1>
          <p style={{ margin: '4px 0 0', color: '#475569' }}>Logged in as: <strong>{user.name}</strong> ({user.email})</p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Alert */}
      {msg.text && (
        <div style={{ padding: '12px', borderRadius: '6px', marginBottom: '20px', fontWeight: 'bold', background: msg.type === 'success' ? '#dcfce7' : '#fee2e2', color: msg.type === 'success' ? '#166534' : '#b91c1c' }}>
          {msg.text}
        </div>
      )}

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ ...cardStyle, background: '#eff6ff' }}>
          <h4 style={{ margin: '0 0 6px', color: '#1e40af' }}>Total Students</h4>
          <p style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>{students.length}</p>
        </div>
        <div style={{ ...cardStyle, background: '#f0fdf4' }}>
          <h4 style={{ margin: '0 0 6px', color: '#166534' }}>Total Teachers</h4>
          <p style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>{teachers.length}</p>
        </div>
        <div style={{ ...cardStyle, background: '#faf5ff' }}>
          <h4 style={{ margin: '0 0 6px', color: '#6b21a8' }}>Total Classes</h4>
          <p style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>{classes.length}</p>
        </div>
        <div style={{ ...cardStyle, background: '#fefce8' }}>
          <h4 style={{ margin: '0 0 6px', color: '#854d0e' }}>Pending Fees</h4>
          <p style={{ fontSize: '26px', fontWeight: 'bold', margin: 0 }}>
            ₹{fees.filter(f => f.status === 'Pending').reduce((s, f) => s + Number(f.amount), 0)}
          </p>
        </div>
      </div>

      {/* 4 Action Forms Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        {/* Add User */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Add Teacher / Student</h3>
          <form onSubmit={handleCreateUser}>
            <input style={inputStyle} placeholder="Full Name" required value={userForm.name} onChange={e => setUserForm({ ...userForm, name: e.target.value })} />
            <input style={inputStyle} type="email" placeholder="Email" required value={userForm.email} onChange={e => setUserForm({ ...userForm, email: e.target.value })} />
            <input style={inputStyle} type="password" placeholder="Password" required value={userForm.password} onChange={e => setUserForm({ ...userForm, password: e.target.value })} />
            <select style={inputStyle} value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
            </select>
            {userForm.role === 'student' && (
              <select style={inputStyle} value={userForm.class_id} onChange={e => setUserForm({ ...userForm, class_id: e.target.value })}>
                <option value="">-- Select Class --</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.class_name} - {c.section}</option>)}
              </select>
            )}
            <button style={btnStyle} type="submit">Create User</button>
          </form>
        </div>

        {/* Create Class */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Create New Class</h3>
          <form onSubmit={handleCreateClass}>
            <input style={inputStyle} placeholder="Class Name (e.g. 12th)" required value={classForm.class_name} onChange={e => setClassForm({ ...classForm, class_name: e.target.value })} />
            <input style={inputStyle} placeholder="Section (e.g. A)" required value={classForm.section} onChange={e => setClassForm({ ...classForm, section: e.target.value })} />
            <select style={inputStyle} value={classForm.teacher_id} onChange={e => setClassForm({ ...classForm, teacher_id: e.target.value })}>
              <option value="">-- Assign Class Teacher --</option>
              {teachers.map(t => <option key={t.id} value={t.id}>{t.name} ({t.email})</option>)}
            </select>
            <button style={btnStyle} type="submit">Add Class</button>
          </form>
        </div>

        {/* Assign Fee */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Assign Student Fee</h3>
          <form onSubmit={handleCreateFee}>
            <select style={inputStyle} required value={feeForm.student_id} onChange={e => setFeeForm({ ...feeForm, student_id: e.target.value })}>
              <option value="">-- Select Student --</option>
              {students.map(s => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
            <input style={inputStyle} type="number" placeholder="Amount (₹)" required value={feeForm.amount} onChange={e => setFeeForm({ ...feeForm, amount: e.target.value })} />
            <input style={inputStyle} type="date" required value={feeForm.due_date} onChange={e => setFeeForm({ ...feeForm, due_date: e.target.value })} />
            <button style={btnStyle} type="submit">Assign Fee</button>
          </form>
        </div>

        {/* Publish Notice */}
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>Publish Notice</h3>
          <form onSubmit={handlePublishNotice}>
            <input style={inputStyle} placeholder="Notice Title" required value={noticeForm.title} onChange={e => setNoticeForm({ ...noticeForm, title: e.target.value })} />
            <textarea style={{ ...inputStyle, minHeight: '64px' }} placeholder="Description..." required value={noticeForm.description} onChange={e => setNoticeForm({ ...noticeForm, description: e.target.value })} />
            <select style={inputStyle} value={noticeForm.target_role} onChange={e => setNoticeForm({ ...noticeForm, target_role: e.target.value })}>
              <option value="all">All (Students & Teachers)</option>
              <option value="student">Students Only</option>
              <option value="teacher">Teachers Only</option>
            </select>
            <button style={btnStyle} type="submit">Publish Notice</button>
          </form>
        </div>
      </div>

      {/* Fee Management Table */}
      <div style={cardStyle}>
        <h3 style={{ marginTop: 0 }}>All Fee Records</h3>
        {fees.length === 0 ? <p>कोई फीस रिकॉर्ड नहीं है।</p> : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f1f5f9', textAlign: 'left' }}>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Student</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Amount</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Due Date</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Status</th>
                <th style={{ padding: '10px', border: '1px solid #cbd5e1' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {fees.map(f => (
                <tr key={f.id}>
                  <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{f.student_name}</td>
                  <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>₹{f.amount}</td>
                  <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>{f.due_date.split('T')[0]}</td>
                  <td style={{ padding: '10px', border: '1px solid #cbd5e1', fontWeight: 'bold', color: f.status === 'Paid' ? 'green' : '#d97706' }}>{f.status}</td>
                  <td style={{ padding: '10px', border: '1px solid #cbd5e1' }}>
                    {f.status === 'Pending' ? (
                      <button onClick={() => handleMarkPaid(f.id)} style={{ padding: '4px 10px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                        Mark Paid
                      </button>
                    ) : (
                      <span style={{ color: '#64748b', fontSize: '13px' }}>Paid ({f.payment_id})</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;