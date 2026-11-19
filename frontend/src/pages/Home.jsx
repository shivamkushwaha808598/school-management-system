import { useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../api/axios';

const Home = () => {
  const [form, setForm] = useState({ student_name: '', parent_name: '', phone: '', applying_class: '', message: '' });
  const [status, setStatus] = useState({ type: '', text: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setStatus({ type: '', text: '' });
    try {
      const res = await API.post('/enquiry', form);
      setStatus({ type: 'success', text: res.data.message });
      setForm({ student_name: '', parent_name: '', phone: '', applying_class: '', message: '' });
    } catch (err) {
      setStatus({ type: 'error', text: err.response?.data?.message || 'आवेदन भेजने में समस्या आई।' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputStyle = { width: '100%', padding: '10px', marginBottom: '12px', boxSizing: 'border-box', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '15px' };

  return (
    <div style={{ fontFamily: 'sans-serif', color: '#1e293b', background: '#f8fafc', minHeight: '100vh' }}>
      <nav style={{ background: '#1e3a8a', color: '#fff', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <span style={{ fontSize: '20px', fontWeight: 'bold', display: 'block' }}>Education Valley Inter College</span>
          <span style={{ fontSize: '13px', color: '#bfdbfe' }}>Nauta, Jhansi, Uttar Pradesh</span>
        </div>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#about" style={{ color: '#e2e8f0', textDecoration: 'none' }}>About</a>
          <a href="#admission" style={{ color: '#e2e8f0', textDecoration: 'none' }}>Admissions</a>
          <Link to="/login" style={{ background: '#f59e0b', color: '#111827', padding: '8px 18px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold' }}>
            Portal Login
          </Link>
        </div>
      </nav>

      <header style={{ background: 'linear-gradient(135deg, #1d4ed8, #1e40af)', color: '#fff', padding: '64px 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '34px', margin: '0 0 12px' }}>Education Valley Inter College, Nauta, Jhansi</h1>
        <p style={{ fontSize: '18px', maxWidth: '750px', margin: '0 auto 24px', color: '#dbeafe' }}>
          Nauta, Jhansi, Uttar Pradesh | Nursery to Class 12th | Smart Classrooms | Digital Student & Parent Portal
        </p>
        <a href="#admission" style={{ background: '#fff', color: '#1e3a8a', padding: '12px 28px', borderRadius: '6px', textDecoration: 'none', fontWeight: 'bold', fontSize: '16px' }}>
          Apply for Admission 2026-27
        </a>
      </header>

      <section id="about" style={{ maxWidth: '1050px', margin: '48px auto', padding: '0 24px' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '28px' }}>Why Choose Education Valley Inter College?</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '20px' }}>
          {[
            { title: 'Smart Digital Campus', desc: 'Real-time attendance, online fee receipts, and instant school notices.' },
            { title: 'Experienced Teachers', desc: 'Dedicated faculty in Nauta, Jhansi focused on conceptual clarity and board exam excellence.' },
            { title: 'Science & Computer Labs', desc: 'Modern laboratories for practical learning and digital literacy.' },
            { title: 'Safe Campus & Discipline', desc: 'Supportive learning environment for students across Nauta and nearby Jhansi villages.' },
          ].map((item, i) => (
            <div key={i} style={{ background: '#fff', padding: '20px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <h3 style={{ margin: '0 0 8px', color: '#1e3a8a' }}>{item.title}</h3>
              <p style={{ margin: 0, color: '#475569', lineHeight: '1.5' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="admission" style={{ maxWidth: '560px', margin: '48px auto', padding: '28px', background: '#fff', borderRadius: '10px', border: '1px solid #cbd5e1' }}>
        <h2 style={{ marginTop: 0, textAlign: 'center', color: '#1e3a8a' }}>Online Admission Enquiry</h2>
        {status.text && (
          <div style={{ padding: '12px', borderRadius: '6px', marginBottom: '16px', fontWeight: 'bold', background: status.type === 'success' ? '#dcfce7' : '#fee2e2', color: status.type === 'success' ? '#166534' : '#b91c1c' }}>
            {status.text}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <input style={inputStyle} placeholder="Student Full Name *" required value={form.student_name} onChange={(e) => setForm({ ...form, student_name: e.target.value })} />
          <input style={inputStyle} placeholder="Parent / Guardian Name *" required value={form.parent_name} onChange={(e) => setForm({ ...form, parent_name: e.target.value })} />
          <input style={inputStyle} type="tel" placeholder="Mobile Number *" required value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <input style={inputStyle} placeholder="Applying for Class (e.g. 5th, 10th, 12th) *" required value={form.applying_class} onChange={(e) => setForm({ ...form, applying_class: e.target.value })} />
          <textarea style={{ ...inputStyle, minHeight: '72px' }} placeholder="Any Message (Optional)" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
          <button type="submit" disabled={submitting} style={{ width: '100%', padding: '12px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer' }}>
            {submitting ? 'Submitting...' : 'Submit Admission Enquiry'}
          </button>
        </form>
      </section>

      <footer style={{ background: '#0f172a', color: '#94a3b8', textAlign: 'center', padding: '20px', marginTop: '48px' }}>
        © 2026 Education Valley Inter College | Nauta, Jhansi, Uttar Pradesh
      </footer>
    </div>
  );
};

export default Home;
