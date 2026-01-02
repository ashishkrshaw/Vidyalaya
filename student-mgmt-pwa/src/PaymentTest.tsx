import React, { useState, useEffect } from 'react';
import {
    Box, Card, CardContent, Typography, TextField, Button,
    MenuItem, Stack, Chip, CircularProgress, Alert, Divider
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import PaymentIcon from '@mui/icons-material/Payment';
import PersonIcon from '@mui/icons-material/Person';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { getAdmissions, loadFeeMap } from './db';

declare global {
    interface Window {
        Razorpay: any;
    }
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface Student {
    studentId: string;
    name: string;
    class: string;
    section: string;
    rollNo?: number;
    fatherMobile?: string;
    fatherName?: string;
    dues?: number;
    admissionFee?: number;
    monthlyFee?: number;
    feeHistory?: any[];
}

interface PaymentResult {
    success: boolean;
    receipt_id?: string;
    razorpay_payment_id?: string;
    error?: string;
}

const classOptions = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const monthOptions = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

const PaymentTest: React.FC = () => {
    const [selectedClass, setSelectedClass] = useState('');
    const [allStudents, setAllStudents] = useState<Student[]>([]);
    const [filteredStudents, setFilteredStudents] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [feeMap, setFeeMap] = useState<{ [cls: string]: number }>({});
    const [loading, setLoading] = useState(false);
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PaymentResult | null>(null);
    const [error, setError] = useState('');

    // Load all students and fee map on mount
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                const students = await getAdmissions();
                setAllStudents(students || []);
                const fees = await loadFeeMap();
                setFeeMap(fees || {});
            } catch (e: any) {
                setError('Failed to load students: ' + e.message);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Filter students when class changes
    useEffect(() => {
        if (selectedClass) {
            const filtered = allStudents.filter(s => s.class === selectedClass);
            setFilteredStudents(filtered);
            setSelectedStudent(null);
        } else {
            setFilteredStudents([]);
        }
    }, [selectedClass, allStudents]);

    // Calculate dues for a student
    const calculateDues = (student: Student): number => {
        // Get monthly fee (student-specific or from feeMap)
        const monthlyFee = Number(student.monthlyFee) || Number(feeMap[student.class]) || 0;
        if (monthlyFee === 0) return 0;

        // Calculate paid amount from fee history (excluding admission fee)
        const paidAmount = (student.feeHistory || []).reduce((sum: number, p: any) => {
            if (p.type === 'Admission Fee' || p.type === 'misc') return sum;
            return sum + (Number(p.amount) || 0);
        }, 0);

        // Calculate current month index (April = 0, March = 11)
        const currentMonth = new Date().getMonth();
        const currentAcademicMonth = currentMonth >= 3 ? currentMonth - 3 : currentMonth + 9;

        // Total fee due till now
        const expectedFee = monthlyFee * (currentAcademicMonth + 1);

        // Dues = Expected - Paid
        return Math.max(0, expectedFee - paidAmount);
    };

    const handlePayment = async () => {
        if (!selectedStudent) return;

        const duesAmount = calculateDues(selectedStudent);
        if (duesAmount <= 0) {
            setError('No dues to pay for this student');
            return;
        }

        setPaymentLoading(true);
        setPaymentResult(null);
        setError('');

        try {
            const token = localStorage.getItem('accessToken');

            const orderRes = await fetch(`${API_BASE}/api/razorpay/create-order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    amount: duesAmount,
                    student_id: selectedStudent.studentId,
                    student_name: selectedStudent.name,
                    class_name: selectedStudent.class,
                    section: selectedStudent.section,
                    parent_mobile: selectedStudent.fatherMobile || ''
                })
            });

            if (!orderRes.ok) {
                const errData = await orderRes.json().catch(() => ({}));
                throw new Error(errData.detail || 'Failed to create order');
            }

            const orderData = await orderRes.json();

            if (!orderData.success) throw new Error(orderData.error || 'Order creation failed');

            const options = {
                key: orderData.key_id,
                amount: orderData.amount,
                currency: orderData.currency,
                name: 'Vidyalaya School',
                description: `Fee Payment - ${selectedStudent.name}`,
                order_id: orderData.razorpay_order_id,
                handler: async (response: any) => {
                    try {
                        const verifyRes = await fetch(`${API_BASE}/api/razorpay/verify-payment`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (verifyData.success) {
                            setPaymentResult({
                                success: true,
                                receipt_id: verifyData.receipt_id,
                                razorpay_payment_id: response.razorpay_payment_id
                            });
                        } else {
                            setPaymentResult({
                                success: false,
                                error: verifyData.error || 'Verification failed'
                            });
                        }
                    } catch (e: any) {
                        setPaymentResult({ success: false, error: e.message });
                    }
                    setPaymentLoading(false);
                },
                prefill: {
                    name: selectedStudent.fatherName || selectedStudent.name,
                    contact: selectedStudent.fatherMobile || ''
                },
                theme: { color: '#667eea' },
                modal: {
                    ondismiss: () => {
                        setPaymentLoading(false);
                    }
                }
            };

            const rzp = new window.Razorpay(options);
            rzp.on('payment.failed', (response: any) => {
                setPaymentResult({
                    success: false,
                    error: response.error?.description || 'Payment failed'
                });
                setPaymentLoading(false);
            });
            rzp.open();

        } catch (e: any) {
            setError(e.message);
            setPaymentLoading(false);
        }
    };

    return (
        <Box sx={{ p: 3, maxWidth: 900, margin: '0 auto' }}>
            <Card sx={{
                background: 'linear-gradient(135deg, rgba(102,126,234,0.1) 0%, rgba(118,75,162,0.1) 100%)',
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0,0,0,0.1)'
            }}>
                <CardContent>
                    <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                        <PaymentIcon sx={{ fontSize: 40, color: '#667eea' }} />
                        <Box>
                            <Typography variant="h5" fontWeight={700} color="text.primary">Razorpay Payment Test</Typography>
                            <Typography variant="body2" color="text.secondary">
                                Select class to view students, then click on a student to pay their dues
                            </Typography>
                        </Box>
                    </Stack>

                    <Divider sx={{ mb: 3 }} />

                    {/* Class Selection */}
                    <Box sx={{ mb: 3 }}>
                        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                            Step 1: Select Class
                        </Typography>
                        <TextField
                            select
                            label="Select Class"
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            fullWidth
                            size="small"
                        >
                            <MenuItem value="">-- Select Class --</MenuItem>
                            {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                        </TextField>
                    </Box>

                    {loading && (
                        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                            <CircularProgress />
                        </Box>
                    )}

                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                    {/* Student List */}
                    {selectedClass && filteredStudents.length > 0 && (
                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                                Step 2: Select Student ({filteredStudents.length} found in Class {selectedClass})
                            </Typography>
                            <Stack spacing={1} sx={{ maxHeight: 300, overflow: 'auto' }}>
                                {filteredStudents.map(student => {
                                    const dues = calculateDues(student);
                                    return (
                                        <Card
                                            key={student.studentId}
                                            onClick={() => setSelectedStudent(student)}
                                            sx={{
                                                p: 2,
                                                cursor: 'pointer',
                                                border: selectedStudent?.studentId === student.studentId ? '2px solid #667eea' : '1px solid #ddd',
                                                bgcolor: selectedStudent?.studentId === student.studentId ? 'rgba(102,126,234,0.1)' : 'white',
                                                '&:hover': { borderColor: '#667eea', bgcolor: 'rgba(102,126,234,0.05)' }
                                            }}
                                        >
                                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                                <Stack direction="row" alignItems="center" spacing={2}>
                                                    <PersonIcon color="primary" />
                                                    <Box>
                                                        <Typography fontWeight={600} color="text.primary">{student.name}</Typography>
                                                        <Typography variant="body2" color="text.secondary">
                                                            Roll: {student.rollNo || '-'} | ID: {student.studentId}
                                                        </Typography>
                                                    </Box>
                                                </Stack>
                                                <Chip
                                                    icon={<CurrencyRupeeIcon />}
                                                    label={dues > 0 ? `Due: ₹${dues}` : 'No Dues'}
                                                    color={dues > 0 ? 'warning' : 'success'}
                                                    size="small"
                                                />
                                            </Stack>
                                        </Card>
                                    );
                                })}
                            </Stack>
                        </Box>
                    )}

                    {selectedClass && filteredStudents.length === 0 && !loading && (
                        <Alert severity="info" sx={{ mb: 3 }}>
                            No students found in Class {selectedClass}. Please add students via New Admission.
                        </Alert>
                    )}

                    {/* Selected Student Details */}
                    {selectedStudent && (
                        <Card sx={{ p: 3, background: 'rgba(102,126,234,0.1)', borderRadius: 2, mb: 3 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                                Step 3: Confirm and Pay
                            </Typography>

                            <Stack spacing={1} sx={{ mb: 3 }}>
                                <Typography color="text.primary">Name: <b>{selectedStudent.name}</b></Typography>
                                <Typography color="text.primary">Class: <b>{selectedStudent.class}-{selectedStudent.section}</b></Typography>
                                <Typography color="text.primary">Roll No: <b>{selectedStudent.rollNo || 'N/A'}</b></Typography>
                                <Typography color="text.primary">Student ID: <b>{selectedStudent.studentId}</b></Typography>
                                <Typography color="text.primary">Parent Mobile: <b>{selectedStudent.fatherMobile || 'N/A'}</b></Typography>
                                <Typography sx={{ fontSize: 20, color: '#e91e63', mt: 1 }}>
                                    Total Dues: <b>₹{calculateDues(selectedStudent)}</b>
                                </Typography>
                            </Stack>

                            <Button
                                variant="contained"
                                size="large"
                                fullWidth
                                startIcon={paymentLoading ? <CircularProgress size={20} color="inherit" /> : <PaymentIcon />}
                                onClick={handlePayment}
                                disabled={paymentLoading || calculateDues(selectedStudent) <= 0}
                                sx={{
                                    py: 1.5,
                                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                    '&:hover': { background: 'linear-gradient(135deg, #5a6fd6 0%, #6a4190 100%)' },
                                    '&:disabled': { background: '#ccc' }
                                }}
                            >
                                {paymentLoading ? 'Processing...' : `Pay ₹${calculateDues(selectedStudent)} with Razorpay`}
                            </Button>
                        </Card>
                    )}

                    {/* Payment Result */}
                    {paymentResult && (
                        <Alert
                            severity={paymentResult.success ? 'success' : 'error'}
                            icon={paymentResult.success ? <CheckCircleIcon /> : undefined}
                            sx={{ mt: 2 }}
                        >
                            {paymentResult.success ? (
                                <Box>
                                    <Typography fontWeight={600}>Payment Successful!</Typography>
                                    <Typography>Receipt ID: <b>{paymentResult.receipt_id}</b></Typography>
                                    <Typography>Payment ID: <b>{paymentResult.razorpay_payment_id}</b></Typography>
                                </Box>
                            ) : (
                                <Typography>Payment Failed: {paymentResult.error}</Typography>
                            )}
                        </Alert>
                    )}

                    {/* Instructions */}
                    <Box sx={{ mt: 3, p: 2, background: 'rgba(0,0,0,0.03)', borderRadius: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary" fontWeight={600}>
                            Test Mode Instructions:
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            • Netbanking: Select any bank → Click Success<br />
                            • Card: 4111 1111 1111 1111, Any expiry, Any CVV<br />
                            • UPI: success@razorpay
                        </Typography>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default PaymentTest;
