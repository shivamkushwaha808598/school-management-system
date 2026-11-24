export function printFeeReceipt(fee, studentName = '', classLabel = '') {
  const paidDate = fee.paid_on ? String(fee.paid_on).split('T')[0] : new Date().toISOString().split('T')[0];
  const dueDate = fee.due_date ? String(fee.due_date).split('T')[0] : '-';
  const receiptNo = fee.payment_id || `REC-${fee.id}`;
  const name = studentName || fee.student_name || 'Student';

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Fee Receipt - ${receiptNo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 32px; color: #111827; margin: 0; }
          .box { border: 2px solid #1e3a8a; border-radius: 8px; padding: 24px; max-width: 620px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #e5e7eb; padding-bottom: 12px; margin-bottom: 20px; }
          .header h1 { margin: 0; color: #1e3a8a; font-size: 22px; }
          .header p { margin: 4px 0 0; color: #4b5563; font-size: 13px; }
          .badge { display: inline-block; background: #dcfce7; color: #166534; padding: 4px 12px; border-radius: 4px; font-weight: bold; margin-top: 8px; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { text-align: left; padding: 10px 12px; border: 1px solid #d1d5db; font-size: 14px; }
          th { background: #f8fafc; width: 40%; color: #374151; }
          .footer { display: flex; justify-content: space-between; margin-top: 36px; font-size: 13px; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="box">
          <div class="header">
            <h1>Education Valley Inter College</h1>
            <p>Nauta, Jhansi (U.P.) | Official Fee Payment Receipt</p>
            <div class="badge">PAID RECEIPT</div>
          </div>
          <table>
            <tr><th>Receipt / Payment ID</th><td><strong>${receiptNo}</strong></td></tr>
            <tr><th>Student Name</th><td>${name}</td></tr>
            ${classLabel ? `<tr><th>Class & Section</th><td>${classLabel}</td></tr>` : ''}
            <tr><th>Due Date</th><td>${dueDate}</td></tr>
            <tr><th>Paid Date</th><td>${paidDate}</td></tr>
            <tr><th>Amount Paid</th><td><strong>₹${fee.amount}</strong></td></tr>
          </table>
          <div class="footer">
            <span>Generated on: ${new Date().toLocaleDateString()}</span>
            <span>Authorized Signatory</span>
          </div>
        </div>
      </body>
    </html>
  `;

  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(html);
  doc.close();

  setTimeout(() => {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 1000);
  }, 250);
}
