import { useEffect, useState } from 'react';
import API from '../api/axios';

const StudentDashboard = () => {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await API.get('/student/dashboard');
        setData(res.data);
      } catch (err) {
        setError(err.response?.data?.message || 'डैशबोर्ड लोड करने में समस्या आई।');
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = '/login';
  };

  const handlePrintReceipt = (fee) => {
    const receiptWin = window.open('', '_blank', 'width=720,height=600');
    const paidDate = fee.paid_on ? fee.paid_on.split('T')[0] : new Date().toISOString().split('T')[0];
    const receiptNo = fee.payment_id || `REC-${fee.id}`;
    const classLabel = profile?.class_name ? `${profile.class_name} - ${profile.section}` : 'Not Assigned';

    receiptWin.document.write(`
      <html>
        <head>
          <title>Fee Receipt - ${receiptNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #111827; }
            .box { border: 2px solid #1e3a8a; border-radius: 8px; padding: 24px; max-width: 620px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px; }
            .header h1 { margin: 0; color: #1e3a8a; font-size: 24px; }
            .header p { margin: 4px 0 0; color: #4b5563; font-size: 13px; }
            .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 4px; font-weight: bold; margin-top: 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 16px; }
            td, th { border: 1px solid #d1d5db; padding: 10px; text-align: left; }
            th { background: #f3f4f6; }
            .footer { margin-top: 32px; display: flex; justify-content: space-between; font-size: 13px; color: #4b5563; }
          </style>
        </head>
        <body>
          <div class="box">
            <div class="header">
              <h1>Sunrise Public School</h1>
              <p>Bhopal, Madhya Pradesh | Official Fee Payment Receipt</p>
              <div class="badge">PAID RECEIPT</div>
            </div>
            <table>
              <tr><th>Receipt / Payment ID</th><td><strong>${receiptNo}</strong></td></tr>
              <tr><th>Student Name</th><td>${profile?.name || ''}</td></tr>
              <tr><th>Class & Section</th><td>${classLabel}</td></tr>
              <tr><th>Due Date</th><td>${fee.due_date.split('T')[0]}</td></tr>
              <tr><th>Paid Date</th><td>${paidDate}</td></tr>
              <tr><th>Amount Paid</th><td><strong>₹${fee.amount}</strong></td></tr>
            </table>
            <div class="footer">
              <span>Generated on: ${new Date().toLocaleDateString()}</span>
              <span>Authorized Signatory</span>
            </div>
          </div>
          <script>window.onload = function() { window.print(); };</script>
        </body>
      </html>
    `);
    receiptWin.document.close();
  };

  if (loading) return <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>लोड हो रहा है...</div>;
  if (error) return <div style={{ padding: '40px', color: 'red', fontFamily: 'sans-serif' }}>{error}</div>;

  const { profile, attendance, fees, notices } = data;

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '24px', fontFamily: 'sans-serif' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={{ margin: 0 }}>Student Dashboard</h1>
          <p style={{ margin: '4px 0 0', color: '#4b5563' }}>
            {profile?.name} | Class: <strong>{profile?.class_name ? `${profile.class_name} - ${profile.section}` : 'Not Assigned'}</strong>
          </p>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 16px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '28px' }}>
        <div style={{ padding: '16px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#f0fdf4' }}>
          <h3 style={{ margin: '0 0 8px', color: '#166534' }}>Attendance</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{attendance.percentage}%</p>
          <small>{attendance.presentDays} / {attendance.totalDays} दिन उपस्थित</small>
        </div>

        <div style={{ padding: '16px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#fefce8' }}>
          <h3 style={{ margin: '0 0 8px', color: '#854d0e' }}>Pending Fees</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>
            ₹{fees.filter(f => f.status === 'Pending').reduce((sum, f) => sum + Number(f.amount), 0)}
          </p>
          <small>{fees.filter(f => f.status === 'Pending').length} बकाया किस्त</small>
        </div>

        <div style={{ padding: '16px', border: '1px solid #d1d5db', borderRadius: '8px', background: '#eff6ff' }}>
          <h3 style={{ margin: '0 0 8px', color: '#1e40af' }}>Active Notices</h3>
          <p style={{ fontSize: '28px', fontWeight: 'bold', margin: 0 }}>{notices.length}</p>
          <small>स्कूल की ताज़ा सूचनाएं</small>
        </div>
      </div>

      {/* Attendance & Fees Tables */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', marginBottom: '28px' }}>
        <div>
          <h3>Recent Attendance</h3>
          {attendance.recentRecords.length === 0 ? <p>कोई रिकॉर्ड नहीं</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Date</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {attendance.recentRecords.map((rec, idx) => (
                  <tr key={idx}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{rec.date.split('T')[0]}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', color: rec.status === 'Present' ? 'green' : 'red' }}>
                      {rec.status}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div>
          <h3>Fee Details</h3>
          {fees.length === 0 ? <p>कोई फीस रिकॉर्ड नहीं</p> : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f3f4f6', textAlign: 'left' }}>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Amount</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Due Date</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Status</th>
                  <th style={{ padding: '8px', border: '1px solid #ddd' }}>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {fees.map((fee) => (
                  <tr key={fee.id}>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>₹{fee.amount}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>{fee.due_date.split('T')[0]}</td>
                    <td style={{ padding: '8px', border: '1px solid #ddd', fontWeight: 'bold', color: fee.status === 'Paid' ? 'green' : '#d97706' }}>
                      {fee.status}
                    </td>
                    <td style={{ padding: '8px', border: '1px solid #ddd' }}>
                      {fee.status === 'Paid' ? (
                        <button
                          onClick={() => handlePrintReceipt(fee)}
                          style={{ padding: '4px 10px', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}
                        >
                          Print Receipt
                        </button>
                      ) : (
                        <span style={{ color: '#9ca3af', fontSize: '12px' }}>Pending</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Notices */}
      <div>
        <h3>School Notices</h3>
        {notices.length === 0 ? <p>कोई नया नोटिस नहीं है।</p> : notices.map((n) => (
          <div key={n.id} style={{ padding: '12px 16px', border: '1px solid #e5e7eb', borderLeft: '4px solid #2563eb', borderRadius: '6px', marginBottom: '12px' }}>
            <h4 style={{ margin: '0 0 4px' }}>{n.title}</h4>
            <p style={{ margin: '0 0 6px', color: '#374151' }}>{n.description}</p>
            <small style={{ color: '#6b7280' }}>{new Date(n.created_at).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
};

export default StudentDashboard;
