import React, { useState, useEffect, useRef } from 'react';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import { getAdmissionsByClassSection, getAdmissions, addHistoryEntry, loadFeeMap, addFeePayment, loadPrincipalSignature } from './db';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { QRCodeCanvas } from 'qrcode.react';
import './FeeManagement.css';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];
const monthOptions = [
  'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'
];

const FeeManagement: React.FC = () => {
  // State
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [student, setStudent] = useState<any | null>(null);
  const [months, setMonths] = useState<string[]>([]);
  const [feeMap, setFeeMap] = useState<{ [cls: string]: string }>({});
  const [total, setTotal] = useState(0);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [msg, setMsg] = useState('');
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<any>(null);
  const [principalSignature, setPrincipalSignature] = useState<any>(null);
  const [allPayments, setAllPayments] = useState<any[]>([]);
  const [summaryClass, setSummaryClass] = useState('');
  const [summaryMonth, setSummaryMonth] = useState('');
  const [summary, setSummary] = useState<{ [month: string]: number }>({});
  const [classMonthSum, setClassMonthSum] = useState<number | null>(null);
  const [receiptNumber, setReceiptNumber] = useState<number>(0);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingPayment, setPendingPayment] = useState(false);

  // QR code ref for PDF
  const qrRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    loadFeeMap().then(setFeeMap);
    loadPrincipalSignature().then(setPrincipalSignature);
  }, []);

  useEffect(() => {
    if (student && months.length > 0 && feeMap[student.class]) {
      setTotal(Number(feeMap[student.class]) * months.length);
    } else {
      setTotal(0);
    }
  }, [student, months, feeMap]);

  // Function to refresh all payments (for live summary data)
  const refreshPayments = async () => {
    const students = await getAdmissions();
    const payments: any[] = [];
    students.forEach((s: any) => {
      (s.feeHistory || []).forEach((p: any) => {
        payments.push({ ...p, class: s.class, name: s.name, studentId: s.studentId });
      });
    });
    setAllPayments(payments);
  };

  useEffect(() => {
    refreshPayments();
  }, []);

  useEffect(() => {
    const monthTotals: { [month: string]: number } = {};
    allPayments.forEach(p => {
      if (Array.isArray(p.months)) {
        p.months.forEach((m: string) => {
          monthTotals[m] = (monthTotals[m] || 0) + (Number(p.amount) / p.months.length);
        });
      }
    });
    setSummary(monthTotals);
  }, [allPayments]);

  useEffect(() => {
    if (!summaryClass || !summaryMonth) {
      setClassMonthSum(null);
      return;
    }
    let sum = 0;
    allPayments.forEach(p => {
      if (p.class === summaryClass && Array.isArray(p.months) && p.months.includes(summaryMonth)) {
        sum += Number(p.amount) / p.months.length;
      }
    });
    setClassMonthSum(sum);
  }, [summaryClass, summaryMonth, allPayments]);

  useEffect(() => {
    const last = localStorage.getItem('lastReceiptNumber');
    const next = last ? parseInt(last) + 1 : 1001;
    setReceiptNumber(next);
    localStorage.setItem('lastReceiptNumber', String(next));
  }, []);

  // Handlers
  const handleSearch = async () => {
    if (cls && section && rollNo) {
      const all = await getAdmissionsByClassSection(cls, section);
      const found = all.find((s: any) => String(s.rollNo) === rollNo);
      setStudent(found || null);
    }
  };

  const handlePay = async () => {
    await addHistoryEntry({
      action: 'fee_payment',
      studentId: student.studentId,
      timestamp: new Date().toISOString(),
      details: {
        months,
        amount: total,
        class: student.class,
        section: student.section,
        rollNo: student.rollNo,
        name: student.name,
      },
    });
    const newDues = (student.dues || 0) - total;
    await addFeePayment(student.studentId, {
      date: new Date().toISOString(),
      months,
      amount: total,
      dues: newDues,
    });
    const all = await getAdmissionsByClassSection(student.class, student.section);
    const updated = all.find((s: any) => String(s.rollNo) === String(student.rollNo));
    setStudent(updated || null);
    setConfirmOpen(false);
    setMsg('Payment successful and logged in history!');
    setMonths([]);

    // Refresh summary data
    await refreshPayments();

    setTimeout(() => setMsg(''), 2500);
    setReceiptData({
      student,
      months,
      total,
      date: new Date().toLocaleDateString(),
      principalSignature,
    });
    setReceiptOpen(true);
  };

  const handlePayRequest = () => {
    setPasswordDialogOpen(true);
    setPendingPayment(true);
  };

  const handlePasswordConfirm = () => {
    if (passwordInput === '123456') {
      setPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      if (pendingPayment) {
        handlePay();
        setPendingPayment(false);
      }
    } else {
      setPasswordError('Incorrect password.');
    }
  };

  const handleDownloadPDF = async () => {
    if (!receiptData) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Sunrise Public School', 105, 22, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('123 Main Road, City, State, PIN', 105, 30, { align: 'center' });
    doc.text('Contact: 9876543210 | info@sunrise.edu', 105, 36, { align: 'center' });
    doc.setDrawColor(0);
    doc.rect(20, 15, 25, 25);
    doc.setFontSize(10);
    doc.text('Logo', 32.5, 27.5, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Fee Receipt', 105, 52, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: ${receiptNumber}`, 20, 60);
    doc.text(`Date: ${receiptData.date}`, 150, 60);
    let y = 75;
    doc.setFont('helvetica', 'bold');
    doc.text('Student Information', 20, y);
    doc.setLineWidth(0.5);
    doc.line(20, y + 2, 190, y + 2);
    doc.setFont('helvetica', 'normal');
    y += 10;
    doc.text(`Name: ${receiptData.student.name}`, 20, y);
    doc.text(`Roll No: ${receiptData.student.rollNo || receiptData.student.studentId}`, 120, y);
    y += 8;
    doc.text(`Class: ${receiptData.student.class} - ${receiptData.student.section}`, 20, y);
    doc.text(`Academic Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, 120, y);
    y += 8;
    doc.text(`Guardian: ${receiptData.student.fatherName}`, 20, y);
    doc.text(`Contact: ${receiptData.student.fatherMobile}`, 120, y);
    y += 15;
    doc.setFont('helvetica', 'bold');
    doc.text('Fee Details', 20, y);
    doc.line(20, y + 2, 190, y + 2);
    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.text(`Tuition Fee:`, 20, y);
    doc.text(`Rs. ${receiptData.total.toFixed(2)}`, 180, y, { align: 'right' });
    y += 8;
    doc.text(`Months Paid:`, 20, y);
    doc.text(`${receiptData.months.join(', ')}`, 180, y, { align: 'right' });
    y += 12;
    doc.setFont('helvetica', 'bold');
    doc.line(20, y, 190, y);
    y += 8;
    doc.text(`Total Amount Paid:`, 20, y);
    doc.text(`Rs. ${receiptData.total.toFixed(2)}`, 180, y, { align: 'right' });
    y += 8;
    doc.line(20, y, 190, y);

    // QR code will be captured from canvas element in JSX

    // Add QR placeholder box and verification text
    y += 15;
    doc.setDrawColor(0);
    doc.rect(20, y, 35, 35);
    doc.setFontSize(9);
    doc.text('Scan to verify', 37.5, y + 40, { align: 'center' });

    // Use the hidden QR from ref if available
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const qrDataUrl = canvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', 22, y + 2, 31, 31);
      }
    }

    y += 10;
    doc.setFont('helvetica', 'normal');
    doc.line(20, y + 35, 80, y + 35);
    doc.text('Accountant', 35, y + 40);
    doc.line(130, y + 35, 190, y + 35);
    doc.text('Principal', 150, y + 40);
    y += 55;
    if (principalSignature && principalSignature.type && principalSignature.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imgData = e.target?.result as string;
        doc.addImage(imgData, 'PNG', 145, y - 18, 40, 15);
        doc.save(`Receipt_${receiptData.student.name}_${receiptData.date}.pdf`);
      };
      reader.readAsDataURL(principalSignature);
      return;
    }
    doc.setFontSize(10);
    doc.text('This is a computer-generated receipt and does not require a signature.', 105, 280, { align: 'center' });
    doc.save(`Receipt_${receiptData.student.name}_${receiptData.date}.pdf`);
  };

  const handleExportAllExcel = () => {
    if (!allPayments.length) return;
    const data = allPayments.map(p => {
      return {
        'Name': p.name || '',
        'Student ID': p.studentId || '',
        'Roll/Admission No': p.rollNo || p.studentId || '',
        'Class': p.class || '',
        'Section': p.section || '',
        'Academic Year': `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        'Months Paid': p.months?.join(', ') || '',
        'Amount Paid': p.amount || 0,
        'Payment Method': p.paymentMethod || 'Cash',
        'Paid Date': p.date ? new Date(p.date).toLocaleDateString() : '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Payments');
    XLSX.writeFile(wb, 'All_Payments.csv', { bookType: 'csv' });
  };

  const handleMonthToggle = (month: string) => {
    setMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  // Calculate student dues and paid months (starting from admission month)
  const getStudentDuesInfo = () => {
    if (!student || !feeMap[student.class]) return { totalPaid: 0, annualFee: 0, dues: 0, paidMonths: [] as string[], applicableMonths: [] as string[] };
    const monthlyFee = Number(feeMap[student.class]) || 0;
    const totalPaid = (student.feeHistory || []).reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);

    // Determine applicable months based on admission date
    let applicableMonths = [...monthOptions]; // Default: all 12 months
    if (student.admissionDate) {
      const admDate = new Date(student.admissionDate);
      const admMonth = admDate.getMonth(); // 0-11
      // Academic year: April (3) to March (2)
      // Map calendar month to academic month index
      // April=0, May=1, ..., March=11
      const academicMonthIndex = (admMonth >= 3) ? admMonth - 3 : admMonth + 9;
      applicableMonths = monthOptions.slice(academicMonthIndex);
    }

    const annualFee = monthlyFee * applicableMonths.length;
    const dues = Math.max(0, annualFee - totalPaid);

    // Determine paid months based on total paid (sequential from admission month)
    const paidMonths: string[] = [];
    let remaining = totalPaid;
    for (const m of applicableMonths) {
      if (remaining >= monthlyFee) {
        paidMonths.push(m);
        remaining -= monthlyFee;
      } else {
        break;
      }
    }
    return { totalPaid, annualFee, dues, paidMonths, applicableMonths };
  };

  return (
    <div className="fee-page">
      {/* Header */}
      <div className="fee-page-header">
        <h1 className="fee-page-title">
          <MonetizationOnIcon />
          Fee Management
        </h1>
      </div>

      {msg && <div className="fee-alert fee-alert-success">{msg}</div>}

      {/* Main Grid */}
      <div className="fee-grid">
        {/* Search Student Card */}
        <div className="fee-card">
          <h2 className="fee-card-title">
            <SearchIcon />
            Find Student
          </h2>
          <div className="fee-form-grid">
            <div className="fee-form-field">
              <label className="fee-form-label">Class</label>
              <select
                className="fee-form-select"
                value={cls}
                onChange={(e) => setCls(e.target.value)}
              >
                <option value="">Select Class</option>
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="fee-form-field">
              <label className="fee-form-label">Section</label>
              <select
                className="fee-form-select"
                value={section}
                onChange={(e) => setSection(e.target.value)}
              >
                <option value="">Select Section</option>
                {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="fee-form-field">
              <label className="fee-form-label">Roll Number</label>
              <input
                type="text"
                className="fee-form-input"
                value={rollNo}
                onChange={(e) => setRollNo(e.target.value)}
                placeholder="Enter Roll No"
              />
            </div>
          </div>
          <button className="fee-btn fee-btn-primary fee-btn-full" onClick={handleSearch}>
            <SearchIcon style={{ fontSize: 18 }} />
            Search Student
          </button>
        </div>

        {/* Student Payment Card */}
        {student && (
          <div className="fee-card">
            <h2 className="fee-card-title">
              <PersonIcon />
              Student Payment
            </h2>
            <div className="fee-student-info">
              <h3 className="fee-student-name">{student.name}</h3>
              <p className="fee-student-id">{student.studentId}</p>
              <div className="fee-student-details">
                <span><strong>Class:</strong> {student.class}</span>
                <span><strong>Section:</strong> {student.section}</span>
                <span><strong>Roll No:</strong> {student.rollNo}</span>
              </div>
              {/* Dues Display */}
              {(() => {
                const info = getStudentDuesInfo();
                return (
                  <div style={{ marginTop: 16, padding: 16, background: info.dues > 0 ? '#FFEBE6' : '#E3FCEF', borderRadius: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Annual Fee:</span>
                      <strong>₹{info.annualFee}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span>Total Paid:</span>
                      <strong style={{ color: '#006644' }}>₹{info.totalPaid}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', paddingTop: 8 }}>
                      <span style={{ fontWeight: 'bold' }}>Outstanding Dues:</span>
                      <strong style={{ color: info.dues > 0 ? '#DE350B' : '#006644', fontSize: 18 }}>
                        ₹{info.dues}
                      </strong>
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="fee-form-field">
              <label className="fee-form-label">Select Months to Pay</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {(() => {
                  const info = getStudentDuesInfo();
                  return monthOptions.map(month => {
                    const isApplicable = info.applicableMonths.includes(month);
                    const isPaid = info.paidMonths.includes(month);
                    const isSelected = months.includes(month);
                    return (
                      <label key={month} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '6px 12px',
                        background: !isApplicable ? '#EBECF0' : (isPaid ? '#E3FCEF' : (isSelected ? '#0052CC' : '#F4F5F7')),
                        color: !isApplicable ? '#A5ADBA' : (isPaid ? '#006644' : (isSelected ? '#FFFFFF' : '#42526E')),
                        borderRadius: 4,
                        cursor: (!isApplicable || isPaid) ? 'not-allowed' : 'pointer',
                        fontSize: 14,
                        transition: 'all 0.2s',
                        opacity: (!isApplicable || isPaid) ? 0.6 : 1,
                        border: isPaid ? '2px solid #36B37E' : 'none'
                      }}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => isApplicable && !isPaid && handleMonthToggle(month)}
                          disabled={!isApplicable || isPaid}
                          style={{ display: 'none' }}
                        />
                        {month} {isPaid && '✓'} {!isApplicable && '—'}
                      </label>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="fee-summary">
              <div className="fee-summary-row">
                <span>Fee per Month</span>
                <span>₹{feeMap[student.class] || 'N/A'}</span>
              </div>
              <div className="fee-summary-row">
                <span>Months Selected</span>
                <span>{months.length}</span>
              </div>
              <div className="fee-summary-row fee-summary-total">
                <span>Total Amount</span>
                <span>₹{total}</span>
              </div>
            </div>

            <button
              className="fee-btn fee-btn-primary fee-btn-full"
              disabled={months.length === 0 || !feeMap[student.class]}
              onClick={handlePayRequest}
            >
              <MonetizationOnIcon style={{ fontSize: 18 }} />
              Make Payment
            </button>
          </div>
        )}

        {/* Fee Summary Card */}
        <div className="fee-card">
          <h2 className="fee-card-title">
            <MonetizationOnIcon />
            Fee Payment Summary
          </h2>

          <div className="fee-filters">
            <div className="fee-filter-field">
              <label className="fee-form-label">Filter by Class</label>
              <select
                className="fee-form-select"
                value={summaryClass}
                onChange={(e) => setSummaryClass(e.target.value)}
              >
                <option value="">All Classes</option>
                {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="fee-filter-field">
              <label className="fee-form-label">Filter by Month</label>
              <select
                className="fee-form-select"
                value={summaryMonth}
                onChange={(e) => setSummaryMonth(e.target.value)}
              >
                <option value="">All Months</option>
                {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button className="fee-btn fee-btn-secondary" onClick={handleExportAllExcel}>
              <DownloadIcon style={{ fontSize: 18 }} />
              Export All to Excel
            </button>
          </div>

          {summaryClass && summaryMonth && (
            <div className="fee-alert fee-alert-success" style={{ marginBottom: 16 }}>
              Total for {summaryClass} in {summaryMonth}: ₹{classMonthSum !== null ? classMonthSum.toFixed(2) : '0.00'}
            </div>
          )}

          <div className="fee-table-container">
            <table className="fee-table">
              <thead>
                <tr>
                  <th>Month</th>
                  <th>Total Paid (All Classes)</th>
                </tr>
              </thead>
              <tbody>
                {monthOptions.map(m => (
                  <tr key={m}>
                    <td>{m}</td>
                    <td>₹{summary[m] ? summary[m].toFixed(2) : '0.00'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Confirm Payment Dialog */}
      {confirmOpen && (
        <div className="fee-dialog-overlay" onClick={() => setConfirmOpen(false)}>
          <div className="fee-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="fee-dialog-title">Confirm Payment</h3>
            <p><strong>Student:</strong> {student?.name}</p>
            <p><strong>Class:</strong> {student?.class} - {student?.section}</p>
            <p><strong>Months:</strong> {months.join(', ')}</p>
            <p><strong>Total Amount:</strong> ₹{total}</p>
            <div className="fee-dialog-actions">
              <button className="fee-btn fee-btn-secondary" onClick={() => setConfirmOpen(false)}>Cancel</button>
              <button className="fee-btn fee-btn-primary" onClick={handlePay}>Confirm & Pay</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Dialog */}
      {passwordDialogOpen && (
        <div className="fee-dialog-overlay" onClick={() => setPasswordDialogOpen(false)}>
          <div className="fee-dialog" onClick={e => e.stopPropagation()}>
            <h3 className="fee-dialog-title">🔒 Enter Password</h3>
            <p style={{ color: '#6B778C', marginBottom: 16 }}>Enter payment authorization password</p>
            <input
              type="password"
              className="fee-form-input"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordConfirm()}
              placeholder="Password"
              autoFocus
            />
            {passwordError && <p style={{ color: '#DE350B', marginTop: 8, fontSize: 14 }}>{passwordError}</p>}
            <div className="fee-dialog-actions">
              <button className="fee-btn fee-btn-secondary" onClick={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); setPendingPayment(false); }}>Cancel</button>
              <button className="fee-btn fee-btn-primary" onClick={handlePasswordConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Dialog */}
      {receiptOpen && receiptData && (
        <div className="fee-dialog-overlay" onClick={() => setReceiptOpen(false)}>
          <div className="fee-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3 className="fee-dialog-title">Payment Receipt</h3>
            <div style={{ background: '#F4F5F7', padding: 20, borderRadius: 8, marginBottom: 20 }}>
              <h4 style={{ margin: '0 0 16px 0', textAlign: 'center' }}>Sunrise Public School</h4>
              <p style={{ textAlign: 'center', margin: '0 0 16px 0', fontSize: 12, color: '#6B778C' }}>
                Receipt No: {receiptNumber} | Date: {receiptData.date}
              </p>
              <hr style={{ border: 'none', borderTop: '1px solid #DFE1E6', margin: '16px 0' }} />
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <p><strong>Name:</strong> {receiptData.student.name}</p>
                  <p><strong>Class:</strong> {receiptData.student.class} - {receiptData.student.section}</p>
                  <p><strong>Months Paid:</strong> {receiptData.months.join(', ')}</p>
                </div>
                {/* QR Code for verification */}
                <div ref={qrRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <QRCodeCanvas
                    value={JSON.stringify({
                      receipt: receiptNumber,
                      studentId: receiptData.student.studentId,
                      name: receiptData.student.name,
                      amount: receiptData.total,
                      date: receiptData.date
                    })}
                    size={80}
                    bgColor="#ffffff"
                    fgColor="#172B4D"
                    level="M"
                  />
                  <span style={{ fontSize: 10, color: '#6B778C', marginTop: 4 }}>Scan to verify</span>
                </div>
              </div>
              <hr style={{ border: 'none', borderTop: '1px solid #DFE1E6', margin: '16px 0' }} />
              <p style={{ fontSize: 18, fontWeight: 'bold', textAlign: 'center' }}>Total Paid: ₹{receiptData.total}</p>
            </div>
            <div className="fee-dialog-actions">
              <button className="fee-btn fee-btn-secondary" onClick={() => setReceiptOpen(false)}>Close</button>
              <button className="fee-btn fee-btn-primary" onClick={handleDownloadPDF}>
                <DownloadIcon style={{ fontSize: 18 }} />
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeManagement;