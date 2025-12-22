import React, { useState, useEffect, useRef } from 'react';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import { getAdmissionsByClassSection, getAdmissions, addHistoryEntry, loadFeeMap, addFeePayment, loadPrincipalSignature, loadSchoolLogo, loadSchoolInfo } from './db';
import type { SchoolInfo } from './db';
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

  // School branding state
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    name: 'Sunrise Public School',
    address: '123 Main Road, City - 110001',
    phone: '+91-9876543210',
    email: 'info@school.edu',
    website: 'www.school.edu'
  });
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);

  // QR code ref for PDF
  const qrRef = useRef<HTMLDivElement>(null);

  // Effects
  useEffect(() => {
    loadFeeMap().then(setFeeMap);
    loadPrincipalSignature().then(setPrincipalSignature);
    loadSchoolInfo().then(setSchoolInfo);
    loadSchoolLogo().then((logo) => {
      if (logo && typeof logo === 'string') {
        setSchoolLogo(logo);
      } else if (logo instanceof Blob) {
        const reader = new FileReader();
        reader.onload = (e) => setSchoolLogo(e.target?.result as string);
        reader.readAsDataURL(logo);
      }
    });
  }, []);

  useEffect(() => {
    if (student && months.length > 0 && feeMap[student.class]) {
      setTotal(Number(feeMap[student.class]) * months.length);
    } else {
      setTotal(0);
    }
  }, [student, months, feeMap]);

  useEffect(() => {
    getAdmissions().then((students: any[]) => {
      const payments: any[] = [];
      students.forEach((s: any) => {
        (s.feeHistory || []).forEach((p: any) => {
          payments.push({ ...p, class: s.class });
        });
      });
      setAllPayments(payments);
    });
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
    const pageWidth = 210;
    const margin = 15;

    // Colors
    const primaryBlue = '#1e3a8a';
    const textGray = '#4b5563';
    const borderGray = '#e5e7eb';

    // Helper: Convert number to words
    const numberToWords = (num: number): string => {
      const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
      const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
      if (num === 0) return 'Zero';
      if (num < 20) return ones[num];
      if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? ' ' + ones[num % 10] : '');
      if (num < 1000) return ones[Math.floor(num / 100)] + ' Hundred' + (num % 100 ? ' ' + numberToWords(num % 100) : '');
      if (num < 100000) return numberToWords(Math.floor(num / 1000)) + ' Thousand' + (num % 1000 ? ' ' + numberToWords(num % 1000) : '');
      if (num < 10000000) return numberToWords(Math.floor(num / 100000)) + ' Lakh' + (num % 100000 ? ' ' + numberToWords(num % 100000) : '');
      return numberToWords(Math.floor(num / 10000000)) + ' Crore' + (num % 10000000 ? ' ' + numberToWords(num % 10000000) : '');
    };

    // Watermark
    doc.setTextColor(230, 230, 230);
    doc.setFontSize(60);
    doc.setFont('helvetica', 'bold');
    doc.text('PAID', 105, 150, { align: 'center', angle: 45 });

    // Reset text color
    doc.setTextColor(0, 0, 0);

    // Header section
    let y = 15;

    // School Logo
    if (schoolLogo) {
      try {
        doc.addImage(schoolLogo, 'PNG', margin, y, 22, 22);
      } catch (e) {
        // Fallback to placeholder if logo fails
        doc.setDrawColor(30, 58, 138);
        doc.setFillColor(30, 58, 138);
        doc.rect(margin, y, 22, 22, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('LOGO', margin + 11, y + 12, { align: 'center' });
      }
    } else {
      // Logo placeholder
      doc.setDrawColor(30, 58, 138);
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, y, 22, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.text('LOGO', margin + 11, y + 12, { align: 'center' });
    }

    // School name and address from settings
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolInfo.name.toUpperCase(), 105, y + 8, { align: 'center' });

    doc.setTextColor(85, 85, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(schoolInfo.address, 105, y + 14, { align: 'center' });
    doc.text(`Ph: ${schoolInfo.phone} | Email: ${schoolInfo.email} | Web: ${schoolInfo.website}`, 105, y + 19, { align: 'center' });


    // Student Photo placeholder on right
    const photoX = pageWidth - margin - 25;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(243, 244, 246);
    doc.rect(photoX, y, 25, 30, 'FD');

    // Add student photo if available
    if (receiptData.student.photoData || receiptData.student.photo) {
      try {
        doc.addImage(receiptData.student.photoData || receiptData.student.photo, 'JPEG', photoX + 1, y + 1, 23, 28);
      } catch (e) {
        doc.setTextColor(150, 150, 150);
        doc.setFontSize(7);
        doc.text('Photo', photoX + 12.5, y + 16, { align: 'center' });
      }
    } else {
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(7);
      doc.text('Photo', photoX + 12.5, y + 16, { align: 'center' });
    }

    // Blue separator line
    y = 42;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    // Receipt title
    y = 50;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(75, y - 3, 60, 10, 2, 2, 'F');
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('STUDENT FEE RECEIPT', 105, y + 4, { align: 'center' });

    // Info grid - Left column
    y = 68;
    doc.setFontSize(10);

    // Left column
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Receipt No:', margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`RCP/${new Date().getFullYear()}/${receiptNumber}`, margin + 25, y);

    y += 7;
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Date:', margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(receiptData.date, margin + 25, y);

    y += 7;
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Student ID:', margin, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(receiptData.student.studentId || '-', margin + 25, y);

    // Right column
    y = 68;
    const rightCol = 110;
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Name:', rightCol, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(receiptData.student.name, rightCol + 30, y);

    y += 7;
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Class / Section:', rightCol, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(`${receiptData.student.class} - ${receiptData.student.section}`, rightCol + 30, y);

    y += 7;
    doc.setTextColor(75, 85, 99);
    doc.setFont('helvetica', 'bold');
    doc.text('Father\'s Name:', rightCol, y);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    doc.text(receiptData.student.fatherName || '-', rightCol + 30, y);

    // Fee Table
    y = 95;
    const tableWidth = pageWidth - 2 * margin;
    const col1 = 15; // S.No width
    const col2 = 120; // Particulars width
    const col3 = tableWidth - col1 - col2; // Amount width

    // Table header
    doc.setFillColor(30, 58, 138);
    doc.rect(margin, y, tableWidth, 10, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text('S.No', margin + 5, y + 7);
    doc.text('Particulars / Description', margin + col1 + 5, y + 7);
    doc.text('Amount (₹)', margin + col1 + col2 + 5, y + 7);

    // Table rows
    y += 10;
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');

    const monthlyFee = Number(feeMap[receiptData.student.class]) || 0;
    const rows = [
      { sno: '1', desc: `Tuition Fee (${receiptData.months.join(', ')})`, amount: receiptData.total },
    ];

    rows.forEach((row, i) => {
      doc.setDrawColor(229, 231, 235);
      doc.rect(margin, y, col1, 10);
      doc.rect(margin + col1, y, col2, 10);
      doc.rect(margin + col1 + col2, y, col3, 10);

      doc.text(row.sno, margin + 5, y + 7);
      doc.text(row.desc, margin + col1 + 5, y + 7);
      doc.setFont('helvetica', 'bold');
      doc.text(row.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 }), margin + col1 + col2 + col3 - 5, y + 7, { align: 'right' });
      doc.setFont('helvetica', 'normal');
      y += 10;
    });

    // Total row
    doc.setFillColor(249, 250, 251);
    doc.rect(margin, y, col1 + col2, 12, 'F');
    doc.rect(margin + col1 + col2, y, col3, 12, 'F');
    doc.setDrawColor(229, 231, 235);
    doc.rect(margin, y, col1 + col2, 12);
    doc.rect(margin + col1 + col2, y, col3, 12);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('TOTAL AMOUNT', margin + col1 + col2 - 5, y + 8, { align: 'right' });
    doc.setFontSize(12);
    doc.text(`₹ ${receiptData.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`, margin + col1 + col2 + col3 - 5, y + 8, { align: 'right' });

    // Amount in words
    y += 20;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(75, 85, 99);
    doc.text(`Amount in Words: ${numberToWords(Math.round(receiptData.total))} Rupees Only.`, margin, y);

    // Dashed separator
    y += 12;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0);

    // Footer section
    y += 10;

    // QR Code
    if (qrRef.current) {
      const canvas = qrRef.current.querySelector('canvas');
      if (canvas) {
        const qrDataUrl = canvas.toDataURL('image/png');
        doc.addImage(qrDataUrl, 'PNG', margin, y, 25, 25);
      }
    }
    doc.setFontSize(7);
    doc.setTextColor(102, 102, 102);
    doc.text('Scan to Verify', margin + 12.5, y + 30, { align: 'center' });

    // Signatures
    const signY = y + 5;

    // Accountant signature
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(100, signY + 20, 140, signY + 20);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Accountant', 120, signY + 26, { align: 'center' });

    // Principal signature
    doc.line(155, signY + 20, 195, signY + 20);
    doc.text('Principal / Auth. Signatory', 175, signY + 26, { align: 'center' });

    // Add principal signature image if available
    if (principalSignature && principalSignature.type && principalSignature.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function (e) {
        const imgData = e.target?.result as string;
        doc.addImage(imgData, 'PNG', 160, signY + 5, 35, 12);
        // Footer note
        doc.setFontSize(8);
        doc.setTextColor(156, 163, 175);
        doc.text('This document is computer generated and subject to the school\'s rules and regulations.', 105, 195, { align: 'center' });
        doc.save(`Receipt_${receiptData.student.name}_${receiptNumber}.pdf`);
      };
      reader.readAsDataURL(principalSignature);
      return;
    }

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('This document is computer generated and subject to the school\'s rules and regulations.', 105, 195, { align: 'center' });

    doc.save(`Receipt_${receiptData.student.name}_${receiptNumber}.pdf`);
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
            </div>

            <div className="fee-form-field">
              <label className="fee-form-label">Select Months to Pay</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {monthOptions.map(month => (
                  <label key={month} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                    padding: '6px 12px',
                    background: months.includes(month) ? '#0052CC' : '#F4F5F7',
                    color: months.includes(month) ? '#FFFFFF' : '#42526E',
                    borderRadius: 4,
                    cursor: 'pointer',
                    fontSize: 14,
                    transition: 'all 0.2s'
                  }}>
                    <input
                      type="checkbox"
                      checked={months.includes(month)}
                      onChange={() => handleMonthToggle(month)}
                      style={{ display: 'none' }}
                    />
                    {month}
                  </label>
                ))}
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
          <div className="fee-dialog" onClick={e => e.stopPropagation()} style={{ maxWidth: 650, padding: 0, overflow: 'hidden' }}>
            {/* Receipt Preview */}
            <div style={{ padding: 24, position: 'relative', background: '#fff' }}>
              {/* PAID Watermark */}
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-30deg)', fontSize: 60, color: 'rgba(0,200,0,0.08)', fontWeight: 'bold', pointerEvents: 'none', zIndex: 0 }}>PAID</div>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', borderBottom: '2px solid #1e3a8a', paddingBottom: 12, marginBottom: 16, position: 'relative', zIndex: 1 }}>
                {schoolLogo ? (
                  <img src={schoolLogo} alt="Logo" style={{ width: 60, height: 60, borderRadius: 8, objectFit: 'contain' }} />
                ) : (
                  <div style={{ width: 60, height: 60, background: '#1e3a8a', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 'bold', fontSize: 10 }}>LOGO</div>
                )}
                <div style={{ flex: 1, textAlign: 'center', padding: '0 16px' }}>
                  <h3 style={{ margin: 0, color: '#1e3a8a', fontSize: 18, fontWeight: 800, textTransform: 'uppercase' }}>{schoolInfo.name}</h3>
                  <p style={{ margin: '4px 0 0', fontSize: 11, color: '#555', lineHeight: 1.4 }}>
                    {schoolInfo.address}<br />
                    Ph: {schoolInfo.phone} | Email: {schoolInfo.email}
                  </p>
                </div>
                <div style={{ width: 65, height: 80, border: '1px solid #ccc', padding: 2, background: '#f9f9f9' }}>
                  {(receiptData.student.photoData || receiptData.student.photo) ? (
                    <img src={receiptData.student.photoData || receiptData.student.photo} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999', fontSize: 10 }}>Photo</div>
                  )}
                </div>
              </div>

              {/* Title Badge */}
              <div style={{ textAlign: 'center', marginBottom: 16 }}>
                <span style={{ background: '#e5e7eb', padding: '5px 20px', borderRadius: 20, fontWeight: 'bold', fontSize: 12, color: '#374151', textTransform: 'uppercase' }}>Student Fee Receipt</span>
              </div>

              {/* Info Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 24px', marginBottom: 16, fontSize: 13, position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#4b5563' }}>Receipt No:</span>
                  <span style={{ fontWeight: 500 }}>RCP/{new Date().getFullYear()}/{receiptNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#4b5563' }}>Student Name:</span>
                  <span style={{ fontWeight: 500 }}>{receiptData.student.name}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#4b5563' }}>Date:</span>
                  <span style={{ fontWeight: 500 }}>{receiptData.date}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#4b5563' }}>Class / Section:</span>
                  <span style={{ fontWeight: 500 }}>{receiptData.student.class} - {receiptData.student.section}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#4b5563' }}>Student ID:</span>
                  <span style={{ fontWeight: 500 }}>{receiptData.student.studentId}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 600, color: '#4b5563' }}>Father's Name:</span>
                  <span style={{ fontWeight: 500 }}>{receiptData.student.fatherName || '-'}</span>
                </div>
              </div>

              {/* Fee Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16, fontSize: 13, position: 'relative', zIndex: 1 }}>
                <thead>
                  <tr style={{ background: '#1e3a8a', color: '#fff' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', width: 50 }}>S.No</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Particulars</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', width: 120 }}>Amount (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>1</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>Tuition Fee ({receiptData.months.join(', ')})</td>
                    <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb', textAlign: 'right', fontWeight: 'bold', fontFamily: 'monospace' }}>{receiptData.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr style={{ background: '#f9fafb', fontWeight: 'bold' }}>
                    <td colSpan={2} style={{ padding: '12px', textAlign: 'right', fontSize: 14 }}>TOTAL AMOUNT</td>
                    <td style={{ padding: '12px', textAlign: 'right', fontSize: 16, color: '#1e3a8a' }}>₹ {receiptData.total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                  </tr>
                </tfoot>
              </table>

              {/* Footer with QR and Signatures */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: 16, borderTop: '1px dashed #ccc', position: 'relative', zIndex: 1 }}>
                {/* QR Code */}
                <div ref={qrRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <QRCodeCanvas
                    value={JSON.stringify({
                      receipt: receiptNumber,
                      studentId: receiptData.student.studentId,
                      name: receiptData.student.name,
                      amount: receiptData.total,
                      date: receiptData.date
                    })}
                    size={70}
                    bgColor="#ffffff"
                    fgColor="#172B4D"
                    level="M"
                  />
                  <span style={{ fontSize: 9, color: '#666', marginTop: 4 }}>Scan to Verify</span>
                </div>

                {/* Signatures */}
                <div style={{ display: 'flex', gap: 32 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: 40 }}></div>
                    <div style={{ borderTop: '1px solid #000', width: 100, marginBottom: 4 }}></div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>Accountant</span>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ height: 40 }}></div>
                    <div style={{ borderTop: '1px solid #000', width: 120, marginBottom: 4 }}></div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#333' }}>Principal</span>
                  </div>
                </div>
              </div>

              <p style={{ textAlign: 'center', fontSize: 9, color: '#9ca3af', marginTop: 12 }}>This document is computer generated and subject to the school's rules and regulations.</p>
            </div>

            {/* Actions */}
            <div style={{ padding: 16, background: '#f4f5f7', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
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