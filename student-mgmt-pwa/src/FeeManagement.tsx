
import React, { useState, useEffect } from 'react';
import { getAdmissions, addFeePayment, loadFeeMap } from './db';
import PaymentIcon from '@mui/icons-material/Payment';
import SearchIcon from '@mui/icons-material/Search';
import ReceiptIcon from '@mui/icons-material/Receipt';
import HistoryIcon from '@mui/icons-material/History';
import PrintIcon from '@mui/icons-material/Print';
import './FeeManagement.css';
import jsPDF from 'jspdf';
import { loadSchoolInfo, loadSchoolLogo, loadPrincipalSignature } from './db';

interface FeePayment {
    date: string;
    amount: number;
    type: string;
    mode: string;
    receiptNo: string;
    remarks?: string;
}

const FeeManagement: React.FC = () => {
    const [students, setStudents] = useState<any[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
    const [feeMap, setFeeMap] = useState<any>({});

    // Payment Form State
    const [amount, setAmount] = useState('');
    const [paymentType, setPaymentType] = useState('Tuition Fee');
    const [paymentMode, setPaymentMode] = useState('Cash');
    const [remarks, setRemarks] = useState('');
    const [msg, setMsg] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (search.trim() === '') {
            setFilteredStudents([]);
        } else {
            const lower = search.toLowerCase();
            const filtered = students.filter(s =>
                (s.name?.toLowerCase().includes(lower)) ||
                (s.studentId?.toLowerCase().includes(lower)) ||
                (s.fatherName?.toLowerCase().includes(lower))
            );
            setFilteredStudents(filtered);
        }
    }, [search, students]);

    const loadData = async () => {
        const data = await getAdmissions();
        setStudents(data);
        const fees = await loadFeeMap();
        setFeeMap(fees);
    };

    const handleSelectStudent = (student: any) => {
        setSelectedStudent(student);
        setSearch('');
        setFilteredStudents([]);
        // Default amount based on class fee
        if (student.class && feeMap[student.class]) {
            setAmount(feeMap[student.class]);
        }
    };

    const generateReceiptNo = () => {
        return `REC-${Date.now().toString().slice(-6)}`;
    };

    const handlePayment = async () => {
        if (!selectedStudent || !amount) return;

        const payment: FeePayment = {
            date: new Date().toISOString(),
            amount: parseFloat(amount),
            type: paymentType,
            mode: paymentMode,
            receiptNo: generateReceiptNo(),
            remarks: remarks || undefined
        };

        await addFeePayment(selectedStudent.studentId, payment);

        // Update local state
        const updatedStudent = {
            ...selectedStudent,
            feeHistory: [...(selectedStudent.feeHistory || []), payment]
        };
        setSelectedStudent(updatedStudent);

        // Update master list
        setStudents(prev => prev.map(s => s.studentId === updatedStudent.studentId ? updatedStudent : s));

        setMsg('Payment recorded successfully!');
        setAmount('');
        setRemarks('');

        setTimeout(() => setMsg(''), 3000);
    };

    const calculateTotalPaid = (history: FeePayment[] = []) => {
        return history.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    };

    const generateReceiptPDF = async (payment: FeePayment) => {
        if (!selectedStudent) return;

        const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
        const pageWidth = 148;
        const margin = 10;

        const schoolInfo = await loadSchoolInfo();

        // Header
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(schoolInfo.name.toUpperCase(), pageWidth / 2, 15, { align: 'center' });

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text(schoolInfo.address, pageWidth / 2, 20, { align: 'center' });

        // Receipt Title
        doc.setFillColor(240, 240, 240);
        doc.rect(margin, 25, pageWidth - margin * 2, 8, 'F');
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('FEE RECEIPT', pageWidth / 2, 30, { align: 'center' });

        // Details
        let y = 45;
        doc.setFontSize(9);
        doc.text(`Receipt No: ${payment.receiptNo}`, margin, y);
        doc.text(`Date: ${new Date(payment.date).toLocaleDateString()}`, pageWidth - margin - 35, y);

        y += 8;
        doc.text(`Student Name: ${selectedStudent.name}`, margin, y);
        y += 6;
        doc.text(`Student ID: ${selectedStudent.studentId}`, margin, y);
        y += 6;
        doc.text(`Class: ${selectedStudent.class} - ${selectedStudent.section}`, margin, y);

        // Table
        y += 10;
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
        doc.text('Description', margin + 5, y);
        doc.text('Amount (₹)', pageWidth - margin - 25, y);
        y += 2;
        doc.line(margin, y, pageWidth - margin, y);

        y += 8;
        doc.text(payment.type, margin + 5, y);
        doc.text(parseFloat(payment.amount.toString()).toFixed(2), pageWidth - margin - 25, y);

        y += 20;
        doc.line(margin, y, pageWidth - margin, y);
        y += 5;
        doc.setFont('helvetica', 'bold');
        doc.text('Total Paid:', margin + 50, y);
        doc.text(`₹ ${parseFloat(payment.amount.toString()).toFixed(2)}`, pageWidth - margin - 25, y);

        // Footer
        y += 20;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.text('Generated by Skooly', pageWidth / 2, 130, { align: 'center' });

        doc.save(`Receipt_${payment.receiptNo}.pdf`);
    };

    return (
        <div className="fee-page">
            <div className="fee-header">
                <h1><PaymentIcon /> Fee Management</h1>
                <p>Collect fees and manage payments</p>
            </div>

            {msg && <div className="fee-alert success">{msg}</div>}

            <div className="fee-container">
                {/* Left Side: Search & Student Info */}
                <div className="fee-sidebar">
                    <div className="fee-search">
                        <SearchIcon className="search-icon" />
                        <input
                            type="text"
                            placeholder="Search student by name/ID..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    {filteredStudents.length > 0 && (
                        <div className="fee-search-results">
                            {filteredStudents.map(s => (
                                <div key={s.studentId} className="result-item" onClick={() => handleSelectStudent(s)}>
                                    <div className="result-name">{s.name}</div>
                                    <div className="result-sub">{s.studentId} | Class {s.class}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {selectedStudent ? (
                        <div className="student-snapshot">
                            <div className="snapshot-header">
                                <h3>{selectedStudent.name}</h3>
                                <span className="chip">{selectedStudent.class}-{selectedStudent.section}</span>
                            </div>
                            <div className="snapshot-details">
                                <p>ID: {selectedStudent.studentId}</p>
                                <p>Father: {selectedStudent.fatherName}</p>
                                <p>Mobile: {selectedStudent.fatherMobile}</p>
                            </div>

                            <div className="fee-summary-card">
                                <div className="summary-row">
                                    <span>Total Paid</span>
                                    <span className="amount green">₹ {calculateTotalPaid(selectedStudent.feeHistory)}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="no-selection">
                            <p>Search and select a student to manage fees</p>
                        </div>
                    )}
                </div>

                {/* Right Side: Payment Form & History */}
                <div className="fee-content">
                    {selectedStudent ? (
                        <>
                            <div className="payment-form">
                                <h2><ReceiptIcon /> New Payment</h2>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Amount (₹)</label>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                            placeholder="Enter Amount"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Type</label>
                                        <select value={paymentType} onChange={e => setPaymentType(e.target.value)}>
                                            <option>Tuition Fee</option>
                                            <option>Annual Fee</option>
                                            <option>Transport Fee</option>
                                            <option>Exam Fee</option>
                                            <option>Other</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Mode</label>
                                        <select value={paymentMode} onChange={e => setPaymentMode(e.target.value)}>
                                            <option>Cash</option>
                                            <option>UPI</option>
                                            <option>Card</option>
                                            <option>Net Banking</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group full">
                                    <label>Remarks</label>
                                    <input
                                        type="text"
                                        value={remarks}
                                        onChange={e => setRemarks(e.target.value)}
                                        placeholder="Optional remarks..."
                                    />
                                </div>
                                <button className="pay-btn" onClick={handlePayment} disabled={!amount}>
                                    Collect Payment
                                </button>
                            </div>

                            <div className="payment-history">
                                <h2><HistoryIcon /> Payment History</h2>
                                {selectedStudent.feeHistory && selectedStudent.feeHistory.length > 0 ? (
                                    <div className="history-list">
                                        {/* Reverse order to show latest first */}
                                        {[...selectedStudent.feeHistory].reverse().map((pay: FeePayment, i: number) => (
                                            <div key={i} className="history-item">
                                                <div className="history-left">
                                                    <span className="pay-date">{new Date(pay.date).toLocaleDateString()}</span>
                                                    <span className="pay-type">{pay.type}</span>
                                                    <span className="pay-mode">{pay.mode}</span>
                                                </div>
                                                <div className="history-right">
                                                    <span className="pay-amount">₹ {pay.amount}</span>
                                                    <button className="print-btn" onClick={() => generateReceiptPDF(pay)}>
                                                        <PrintIcon fontSize="small" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="no-data">No payment history found.</p>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon"><PaymentIcon style={{ fontSize: 64 }} /></div>
                            <h2>Fee Management System</h2>
                            <p>Select a student to start collecting fees</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default FeeManagement;
