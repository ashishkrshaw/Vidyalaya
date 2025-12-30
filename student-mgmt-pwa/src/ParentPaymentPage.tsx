import React, { useState, useEffect } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import DownloadIcon from '@mui/icons-material/Download';
import HomeIcon from '@mui/icons-material/Home';
import './ParentPaymentPage.css';

// Simulated student data (in real app, this would come from URL params and backend)
interface StudentPaymentData {
    studentId: string;
    name: string;
    class: string;
    section: string;
    rollNo: string;
    fatherName: string;
    schoolName: string;
    duesAmount: number;
    paymentId: string;
}

type PaymentMethod = 'upi' | 'card' | 'netbanking';
type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

const ParentPaymentPage: React.FC = () => {
    // State
    const [studentData, setStudentData] = useState<StudentPaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('upi');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
    const [upiId, setUpiId] = useState('');
    const [processingStep, setProcessingStep] = useState(0);
    const [transactionId, setTransactionId] = useState('');
    const [showReceipt, setShowReceipt] = useState(false);

    // Simulate loading student data from URL/backend
    useEffect(() => {
        const loadStudentData = async () => {
            // In real implementation, parse URL params and fetch from backend
            await new Promise(resolve => setTimeout(resolve, 1200));

            // Simulated data
            setStudentData({
                studentId: 'V24-05-0023',
                name: 'Rahul Sharma',
                class: '8',
                section: 'A',
                rollNo: '15',
                fatherName: 'Rajesh Sharma',
                schoolName: 'DAV Public School',
                duesAmount: 4500,
                paymentId: 'PAY-' + Date.now().toString(36).toUpperCase(),
            });
            setLoading(false);
        };
        loadStudentData();
    }, []);

    // Process payment (simulated)
    const handlePayment = async () => {
        if (paymentMethod === 'upi' && !upiId) {
            return;
        }

        setPaymentStatus('processing');

        // Simulated payment processing steps
        const steps = ['Initiating payment...', 'Connecting to Paytm...', 'Processing transaction...', 'Verifying payment...'];

        for (let i = 0; i < steps.length; i++) {
            setProcessingStep(i);
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Simulate success (90% chance) or failure
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
            setTransactionId('TXN' + Date.now().toString(36).toUpperCase());
            setPaymentStatus('success');
            // Simulate notifying admin
            console.log('Payment successful - Admin notified');
        } else {
            setPaymentStatus('failed');
        }
    };

    // Retry payment
    const handleRetry = () => {
        setPaymentStatus('pending');
        setProcessingStep(0);
    };

    // Download receipt (simulated)
    const handleDownloadReceipt = () => {
        setShowReceipt(true);
        setTimeout(() => {
            alert('Receipt downloaded! (In real implementation, this would generate a PDF)');
        }, 500);
    };

    // Get step label
    const getProcessingLabel = () => {
        const steps = ['Initiating payment...', 'Connecting to Paytm...', 'Processing transaction...', 'Verifying payment...'];
        return steps[processingStep] || 'Processing...';
    };

    if (loading) {
        return (
            <div className="parent-payment-page">
                <div className="payment-loading">
                    <div className="loading-spinner-large"></div>
                    <h3>Loading Payment Details</h3>
                    <p>Please wait while we fetch your payment information...</p>
                </div>
            </div>
        );
    }

    if (!studentData) {
        return (
            <div className="parent-payment-page">
                <div className="payment-error-state">
                    <ErrorIcon className="error-icon" />
                    <h2>Payment Link Invalid</h2>
                    <p>This payment link has expired or is invalid. Please contact the school for a new payment link.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="parent-payment-page">
            {/* Header */}
            <header className="payment-page-header">
                <div className="header-content">
                    <SchoolIcon className="school-icon" />
                    <div>
                        <h1>{studentData.schoolName}</h1>
                        <p>Secure Fee Payment Portal</p>
                    </div>
                </div>
                <div className="secured-badge">
                    <CheckCircleIcon style={{ fontSize: 16 }} />
                    Secured by Paytm
                </div>
            </header>

            <main className="payment-main">
                {/* Success State */}
                {paymentStatus === 'success' && (
                    <div className="payment-result success">
                        <div className="result-icon-wrapper success">
                            <CheckCircleIcon className="result-icon" />
                        </div>
                        <h2>Payment Successful!</h2>
                        <p className="transaction-id">Transaction ID: <strong>{transactionId}</strong></p>

                        <div className="success-details">
                            <div className="detail-row">
                                <span>Amount Paid</span>
                                <span className="amount">₹{studentData.duesAmount.toLocaleString()}</span>
                            </div>
                            <div className="detail-row">
                                <span>Student Name</span>
                                <span>{studentData.name}</span>
                            </div>
                            <div className="detail-row">
                                <span>Class</span>
                                <span>{studentData.class} - {studentData.section}</span>
                            </div>
                            <div className="detail-row">
                                <span>Date</span>
                                <span>{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                            </div>
                        </div>

                        <div className="success-message">
                            <CheckCircleIcon style={{ color: '#22c55e' }} />
                            <span>School administration has been notified of your payment.</span>
                        </div>

                        <div className="success-actions">
                            <button className="action-btn primary" onClick={handleDownloadReceipt}>
                                <DownloadIcon />
                                Download Receipt
                            </button>
                            <button className="action-btn secondary" onClick={() => window.close()}>
                                <HomeIcon />
                                Close
                            </button>
                        </div>
                    </div>
                )}

                {/* Failed State */}
                {paymentStatus === 'failed' && (
                    <div className="payment-result failed">
                        <div className="result-icon-wrapper failed">
                            <ErrorIcon className="result-icon" />
                        </div>
                        <h2>Payment Failed</h2>
                        <p>We couldn't process your payment. Please try again.</p>

                        <div className="failure-reasons">
                            <p>Possible reasons:</p>
                            <ul>
                                <li>Insufficient balance</li>
                                <li>Network connection issue</li>
                                <li>Bank server temporarily unavailable</li>
                            </ul>
                        </div>

                        <div className="failed-actions">
                            <button className="action-btn primary" onClick={handleRetry}>
                                Try Again
                            </button>
                        </div>
                    </div>
                )}

                {/* Processing State */}
                {paymentStatus === 'processing' && (
                    <div className="payment-processing">
                        <div className="processing-animation">
                            <div className="processing-circle"></div>
                            <PaymentIcon className="processing-icon" />
                        </div>
                        <h2>Processing Payment</h2>
                        <p className="processing-step">{getProcessingLabel()}</p>
                        <div className="processing-dots">
                            {[0, 1, 2, 3].map(i => (
                                <div key={i} className={`dot ${i <= processingStep ? 'active' : ''}`}></div>
                            ))}
                        </div>
                        <p className="do-not-close">Please do not close this window or press back button.</p>
                    </div>
                )}

                {/* Pending State - Main Form */}
                {paymentStatus === 'pending' && (
                    <>
                        {/* Student Info Card */}
                        <div className="student-info-card">
                            <h2 className="card-title">
                                <PersonIcon />
                                Student Details
                            </h2>
                            <div className="student-details-grid">
                                <div className="detail-item">
                                    <span className="detail-label">Student Name</span>
                                    <span className="detail-value">{studentData.name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Student ID</span>
                                    <span className="detail-value id">{studentData.studentId}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Class & Section</span>
                                    <span className="detail-value">{studentData.class} - {studentData.section}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Roll Number</span>
                                    <span className="detail-value">{studentData.rollNo}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Father's Name</span>
                                    <span className="detail-value">{studentData.fatherName}</span>
                                </div>
                            </div>
                        </div>

                        {/* Amount Card */}
                        <div className="amount-card">
                            <div className="amount-header">
                                <CurrencyRupeeIcon />
                                <span>Amount Due</span>
                            </div>
                            <div className="amount-value">
                                ₹{studentData.duesAmount.toLocaleString()}
                            </div>
                            <p className="amount-note">Includes all pending fee dues</p>
                        </div>

                        {/* Payment Method Selection */}
                        <div className="payment-method-card">
                            <h2 className="card-title">
                                <PaymentIcon />
                                Select Payment Method
                            </h2>

                            <div className="payment-methods">
                                <button
                                    className={`method-btn ${paymentMethod === 'upi' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('upi')}
                                >
                                    <PhoneAndroidIcon />
                                    <span>UPI</span>
                                    <small>Google Pay, PhonePe, Paytm</small>
                                </button>
                                <button
                                    className={`method-btn ${paymentMethod === 'card' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('card')}
                                >
                                    <CreditCardIcon />
                                    <span>Card</span>
                                    <small>Credit / Debit Card</small>
                                </button>
                                <button
                                    className={`method-btn ${paymentMethod === 'netbanking' ? 'selected' : ''}`}
                                    onClick={() => setPaymentMethod('netbanking')}
                                >
                                    <AccountBalanceIcon />
                                    <span>Net Banking</span>
                                    <small>All Banks Supported</small>
                                </button>
                            </div>

                            {/* UPI Input */}
                            {paymentMethod === 'upi' && (
                                <div className="upi-input-section">
                                    <label>Enter UPI ID</label>
                                    <input
                                        type="text"
                                        placeholder="yourname@upi"
                                        value={upiId}
                                        onChange={(e) => setUpiId(e.target.value)}
                                        className="upi-input"
                                    />
                                    <p className="upi-hint">Example: mobilenumber@paytm, yourname@oksbi</p>
                                </div>
                            )}

                            {/* Card Details (Simulated) */}
                            {paymentMethod === 'card' && (
                                <div className="card-input-section">
                                    <p className="redirect-note">
                                        <CreditCardIcon style={{ fontSize: 18 }} />
                                        You will be redirected to Paytm's secure payment page
                                    </p>
                                </div>
                            )}

                            {/* Net Banking (Simulated) */}
                            {paymentMethod === 'netbanking' && (
                                <div className="netbanking-section">
                                    <p className="redirect-note">
                                        <AccountBalanceIcon style={{ fontSize: 18 }} />
                                        You will be redirected to your bank's secure login page
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Pay Button */}
                        <button
                            className="pay-now-btn"
                            onClick={handlePayment}
                            disabled={paymentMethod === 'upi' && !upiId}
                        >
                            <PaymentIcon />
                            Pay ₹{studentData.duesAmount.toLocaleString()}
                        </button>

                        <p className="security-note">
                            🔒 Your payment is secured with 256-bit encryption
                        </p>
                    </>
                )}
            </main>

            {/* Footer */}
            <footer className="payment-footer">
                <p>For any queries, contact school administration</p>
                <p className="powered-by">Powered by <strong>Paytm</strong></p>
            </footer>
        </div>
    );
};

export default ParentPaymentPage;
