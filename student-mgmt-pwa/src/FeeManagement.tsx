import React, { useState, useEffect } from 'react';
import { Box, Typography, Card, TextField, Button, MenuItem, FormControl, InputLabel, Select, Checkbox, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Alert, Table, TableHead, TableRow, TableCell, TableBody, Paper, TableContainer } from '@mui/material';
import Grid from '@mui/material/Grid';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import LockIcon from '@mui/icons-material/Lock';
import { getAdmissionsByClassSection, getAdmissions, addHistoryEntry, loadFeeMap, addFeePayment, loadPrincipalSignature } from './db';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];
const monthOptions = [
  'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'
];

const FeeManagement: React.FC = () => {
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

  useEffect(() => {
    getAdmissions().then(students => {
      // Gather all payments from all students
      const payments = [];
      students.forEach((s: any) => {
        (s.feeHistory || []).forEach((p: any) => {
          payments.push({ ...p, class: s.class });
        });
      });
      setAllPayments(payments);
    });
  }, []);

  useEffect(() => {
    // Calculate total paid per month (all classes)
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
    // Calculate sum for selected class and month
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
    // Generate a simple auto-increment receipt number (could be improved with persistent storage)
    const last = localStorage.getItem('lastReceiptNumber');
    const next = last ? parseInt(last) + 1 : 1001;
    setReceiptNumber(next);
    localStorage.setItem('lastReceiptNumber', String(next));
  }, []);

  const handleSearch = async () => {
    if (cls && section && rollNo) {
      const all = await getAdmissionsByClassSection(cls, section);
      const found = all.find((s: any) => String(s.rollNo) === rollNo);
      setStudent(found || null);
    }
  };

  const handlePay = async () => {
    // Log payment in history
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
    // Update student's fee history and dues
    const newDues = (student.dues || 0) - total;
    await addFeePayment(student.studentId, {
      date: new Date().toISOString(),
      months,
      amount: total,
      dues: newDues,
    });
    // Reload student to reflect updated dues/history
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
    // Header
    doc.setFont('times', 'bold');
    doc.setFontSize(20);
    doc.text('Sunrise Public School', 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    doc.text('123 Main Road, City, State, PIN', 105, 28, { align: 'center' });
    doc.text('Contact: 9876543210 | info@sunrise.edu', 105, 34, { align: 'center' });
    // Logo placeholder
    doc.setDrawColor(0);
    doc.rect(15, 15, 20, 20);
    doc.setFontSize(10);
    doc.text('Logo', 25, 27, { align: 'center' });
    // Receipt Title & Info
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('Student Fee Receipt', 105, 48, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('times', 'normal');
    doc.text(`Receipt No: ${receiptNumber}`, 15, 56);
    doc.text(`Date: ${receiptData.date}`, 160, 56);
    // Student Info
    let y = 66;
    doc.setFont('times', 'bold');
    doc.text('Student Information', 15, y);
    doc.setFont('times', 'normal');
    y += 7;
    doc.text(`Name: ${receiptData.student.name}`, 15, y);
    doc.text(`Roll/Admission No: ${receiptData.student.rollNo || receiptData.student.studentId}`, 110, y);
    y += 7;
    doc.text(`Class: ${receiptData.student.class}  Section: ${receiptData.student.section}`, 15, y);
    doc.text(`Academic Year: ${new Date().getFullYear()}-${new Date().getFullYear() + 1}`, 110, y);
    y += 7;
    doc.text(`Guardian: ${receiptData.student.fatherName}`, 15, y);
    doc.text(`Contact: ${receiptData.student.fatherMobile}`, 110, y);
    // Fee Details
    y += 10;
    doc.setFont('times', 'bold');
    doc.text('Fee Details', 15, y);
    doc.setFont('times', 'normal');
    y += 7;
    doc.text(`Tuition Fee: ₹${receiptData.tuitionFee || receiptData.total}`, 15, y);
    doc.text(`Transport Fee: ₹${receiptData.transportFee || 0}`, 110, y);
    y += 7;
    doc.text(`Exam Fee: ₹${receiptData.examFee || 0}`, 15, y);
    doc.text(`Other Charges: ₹${receiptData.otherFee || 0}`, 110, y);
    y += 7;
    doc.text(`Discounts: ₹${receiptData.discount || 0}`, 15, y);
    y += 7;
    doc.setFont('times', 'bold');
    doc.text(`Total Amount Paid: ₹${receiptData.total}`, 15, y);
    doc.setFont('times', 'normal');
    y += 7;
    doc.text(`Payment Method: ${receiptData.paymentMethod || 'Cash'}`, 15, y);
    doc.text(`Paid Date: ${receiptData.date}`, 110, y);
    y += 7;
    doc.text(`Due Amount: ₹${receiptData.due || 0}`, 15, y);
    // Footer
    y += 15;
    doc.setFont('times', 'normal');
    doc.text('Signature of Accountant', 15, y);
    doc.text('Signature of Principal/Admin', 160, y);
    y += 10;
    if (principalSignature && principalSignature.type && principalSignature.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const imgData = e.target?.result as string;
        doc.addImage(imgData, 'PNG', 160, y - 8, 30, 12);
        doc.save(`Receipt_${receiptData.student.name}_${receiptData.date}.pdf`);
      };
      reader.readAsDataURL(principalSignature);
      return;
    }
    doc.setFontSize(10);
    doc.text('This is a computer-generated receipt.', 105, 285, { align: 'center' });
    doc.save(`Receipt_${receiptData.student.name}_${receiptData.date}.pdf`);
  };

  const handleExportAllExcel = () => {
    if (!allPayments.length) return;
    const data = allPayments.map(p => {
      const student = allPayments.find(s => s.studentId === p.studentId);
      return {
        'Name': student?.name || '',
        'Student ID': student?.studentId || '',
        'Roll/Admission No': student?.rollNo || student?.studentId || '',
        'Class': student?.class || '',
        'Section': student?.section || '',
        'Academic Year': `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`,
        'Guardian': student?.fatherName || '',
        'Contact': student?.fatherMobile || '',
        'Months Paid': p.months.join(', '),
        'Amount Paid': p.amount,
        'Payment Method': p.paymentMethod || 'Cash',
        'Paid Date': p.date ? new Date(p.date).toLocaleDateString() : '',
        'Due Amount': p.due || 0,
      };
    });
    // Export as CSV
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Payments');
    XLSX.writeFile(wb, 'All_Payments.csv', { bookType: 'csv' });
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">Fee Management</Typography>
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select value={cls} label="Class" onChange={e => setCls(e.target.value)}>
                {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Section</InputLabel>
              <Select value={section} label="Section" onChange={e => setSection(e.target.value)}>
                {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} fullWidth />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSearch} fullWidth>Search Student</Button>
          </Grid>
        </Grid>
      </Card>
      {student && (
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>{student.name}</Typography>
          <Typography variant="body2" color="text.secondary">{student.studentId}</Typography>
          <Typography sx={{ mt: 1 }}><b>Class:</b> {student.class} <b>Section:</b> {student.section} <b>Roll No:</b> {student.rollNo}</Typography>
          <FormControl fullWidth sx={{ mt: 3 }}>
            <InputLabel>Months to Pay</InputLabel>
            <Select
              multiple
              value={months}
              onChange={e => setMonths(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
              renderValue={selected => (selected as string[]).join(', ')}
              label="Months to Pay"
            >
              {monthOptions.map(month => (
                <MenuItem key={month} value={month}>
                  <Checkbox checked={months.indexOf(month) > -1} />
                  <ListItemText primary={month} />
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography variant="subtitle1">Fee per Month: <b>₹{feeMap[student.class] || '0'}</b></Typography>
            <Typography variant="subtitle1">Months Selected: <b>{months.length}</b></Typography>
            <Typography variant="h6" sx={{ mt: 1 }}>Total: ₹{total}</Typography>
          </Box>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<MonetizationOnIcon />}
            disabled={months.length === 0 || !feeMap[student.class]}
            onClick={handlePayRequest}
            fullWidth
            sx={{ fontWeight: 700 }}
          >
            Make Payment
          </Button>
        </Card>
      )}
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>Fee Payment Summary</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Class</InputLabel>
            <Select value={summaryClass} label="Class" onChange={e => setSummaryClass(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              {classOptions.map(cls => <MenuItem key={cls} value={cls}>{cls}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Month</InputLabel>
            <Select value={summaryMonth} label="Month" onChange={e => setSummaryMonth(e.target.value)}>
              <MenuItem value=""><em>All</em></MenuItem>
              {monthOptions.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
        {summaryClass && summaryMonth && (
          <Typography sx={{ mb: 2 }}>Total paid for <b>{summaryClass}</b> in <b>{summaryMonth}</b>: <b>₹{classMonthSum || 0}</b></Typography>
        )}
        <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 1 }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Month</TableCell>
                <TableCell>Total Paid (All Classes)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {monthOptions.map(m => (
                <TableRow key={m}>
                  <TableCell>{m}</TableCell>
                  <TableCell>₹{summary[m] ? summary[m].toFixed(2) : '0.00'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
      {/* Payment Confirmation Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Payment</DialogTitle>
        <DialogContent>
          <Typography>Student: <b>{student?.name}</b></Typography>
          <Typography>Class: {student?.class} Section: {student?.section} Roll No: {student?.rollNo}</Typography>
          <Typography>Months: {months.join(', ')}</Typography>
          <Typography>Total Amount: <b>₹{total}</b></Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handlePay} variant="contained" color="primary">Confirm & Pay</Button>
        </DialogActions>
      </Dialog>
      {/* Payment Receipt Dialog */}
      <Dialog open={receiptOpen} onClose={() => setReceiptOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Payment Receipt</DialogTitle>
        <DialogContent>
          {receiptData && (
            <Box sx={{ p: 2, textAlign: 'center', fontFamily: 'serif' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>{'School Name'}</Typography>
              <Typography sx={{ fontSize: 15, mb: 2 }}>{'School Address, City, State, PIN'}</Typography>
              <Typography variant="subtitle1" sx={{ mt: 2 }}>Payment Receipt</Typography>
              <Box sx={{ mt: 2, textAlign: 'left', mx: 'auto', maxWidth: 400 }}>
                <Typography><b>Student Name:</b> {receiptData.student.name}</Typography>
                <Typography><b>Class:</b> {receiptData.student.class} <b>Section:</b> {receiptData.student.section} <b>Roll No:</b> {receiptData.student.rollNo}</Typography>
                <Typography><b>Date:</b> {receiptData.date}</Typography>
                <Typography><b>Months Paid:</b> {receiptData.months.join(', ')}</Typography>
                <Typography><b>Amount Paid:</b> ₹{receiptData.total}</Typography>
              </Box>
              <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', alignItems: 'flex-end', minHeight: 80 }}>
                {principalSignature && principalSignature.type && principalSignature.type.startsWith('image/') ? (
                  <img src={URL.createObjectURL(principalSignature)} alt="Principal Signature" style={{ maxWidth: 140, maxHeight: 60 }} />
                ) : principalSignature && typeof principalSignature === 'string' ? (
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>PDF Signature Uploaded</Typography>
                ) : null}
                <Box sx={{ ml: 2, textAlign: 'right' }}>
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Principal/Head</Typography>
                </Box>
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReceiptOpen(false)}>Close</Button>
          <Button onClick={handleDownloadPDF} variant="contained" color="primary">Download PDF</Button>
        </DialogActions>
      </Dialog>
      {msg && (
        <Alert severity="success" sx={{ mt: 3 }}>{msg}</Alert>
      )}
      {/* Password Confirmation Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); setPendingPayment(false); }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LockIcon /> Password Required</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Enter password to confirm payment.</Typography>
          <TextField
            label="Password"
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            fullWidth
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handlePasswordConfirm(); }}
            error={!!passwordError}
            helperText={passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); setPendingPayment(false); }}>Cancel</Button>
          <Button onClick={handlePasswordConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default FeeManagement;
