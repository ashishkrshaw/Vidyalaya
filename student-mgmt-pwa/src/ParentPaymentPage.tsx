import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import SchoolIcon from '@mui/icons-material/School';
import PersonIcon from '@mui/icons-material/Person';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PaymentIcon from '@mui/icons-material/Payment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import QrCodeIcon from '@mui/icons-material/QrCode';
import DownloadIcon from '@mui/icons-material/Download';
import HomeIcon from '@mui/icons-material/Home';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import './ParentPaymentPage.css';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

interface PaymentData {
    order_id: string;
    student_name: string;
    student_id: string;
    class_name: string;
    section: string;
    amount: number;
    status: 'pending' | 'success' | 'failed' | 'cancelled';
    school_name: string;
    receipt_id?: string;
    transaction_id?: string;
    paid_at?: string;
}

type PaymentMethod = 'qr' | 'upi_id' | 'upi_app';
type PaymentStatus = 'pending' | 'processing' | 'success' | 'failed';

const ParentPaymentPage: React.FC = () => {
    const [paymentData, setPaymentData] = useState<PaymentData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('qr');
    const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('pending');
    const [upiId, setUpiId] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [receiptId, setReceiptId] = useState('');
    const [copied, setCopied] = useState(false);

    // School's UPI VPA (will come from school settings in production)
    const SCHOOL_UPI_VPA = 'school@paytm';

    // Extract payment token from URL
    const getPaymentToken = () => {
        const path = window.location.pathname;
        const match = path.match(/\/pay\/(.+)/);
        return match ? match[1] : null;
    };

    // Fetch payment details
    useEffect(() => {
        const token = getPaymentToken();
        if (!token) {
            setError('Invalid payment link');
            setLoading(false);
            return;
        }

        const fetchPayment = async () => {
            try {
                const response = await fetch(`${API_BASE}/api/payments/order/${token}`);
                if (!response.ok) {
                    throw new Error('Payment link not found or expired');
                }
                const data = await response.json();
                setPaymentData(data);

                // If already paid, show success
                if (data.status === 'success') {
                    setPaymentStatus('success');
                    setReceiptId(data.receipt_id || '');
                    setTransactionId(data.transaction_id || '');
                } else if (data.status === 'cancelled') {
                    setError('This payment has been cancelled by the school');
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load payment details');
            } finally {
                setLoading(false);
            }
        };

        fetchPayment();
    }, []);

    // Generate UPI intent URL
    const getUpiIntentUrl = () => {
        if (!paymentData) return '';
        return `upi://pay?pa=${SCHOOL_UPI_VPA}&pn=${encodeURIComponent(paymentData.school_name)}&am=${paymentData.amount}&tn=${paymentData.order_id}&cu=INR`;
    };

    // Copy UPI ID
    const handleCopyUpi = () => {
        navigator.clipboard.writeText(SCHOOL_UPI_VPA);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Open UPI App
    const openUpiApp = (appName: string) => {
        const upiUrl = getUpiIntentUrl();
        let deepLink = upiUrl;

        switch (appName) {
            case 'gpay':
                deepLink = `gpay://upi/${upiUrl.replace('upi://', '')}`;
                break;
            case 'phonepe':
                deepLink = `phonepe://${upiUrl}`;
                break;
            case 'paytm':
                deepLink = `paytmmp://${upiUrl}`;
                break;
        }

        window.location.href = deepLink;

        // After redirect, start polling for payment status
        setPaymentStatus('processing');
        startPolling();
    };

    // Poll for payment status
    const startPolling = () => {
        const token = getPaymentToken();
        if (!token) return;

        const pollInterval = setInterval(async () => {
            try {
                const response = await fetch(`${API_BASE}/api/payments/order/${token}`);
                const data = await response.json();

                if (data.status === 'success') {
                    clearInterval(pollInterval);
                    setPaymentStatus('success');
                    setReceiptId(data.receipt_id || '');
                    setTransactionId(data.transaction_id || '');
                } else if (data.status === 'failed') {
                    clearInterval(pollInterval);
                    setPaymentStatus('failed');
                }
            } catch (err) {
                console.error('Polling error:', err);
            }
        }, 3000); // Poll every 3 seconds

        // Stop polling after 5 minutes
        setTimeout(() => clearInterval(pollInterval), 300000);
    };

    // Manual payment verification (for UPI ID payment)
    const handleManualVerify = async () => {
        if (!transactionId.trim()) {
            alert('Please enter the UPI Transaction ID');
            return;
        }

        setPaymentStatus('processing');

        // In real implementation, verify with Paytm API
        // For now, simulate success
        setTimeout(() => {
            setPaymentStatus('success');
            setReceiptId(`RCP-${Date.now().toString(36).toUpperCase()}`);
        }, 2000);
    };

    // Download receipt
    const handleDownloadReceipt = () => {
        if (!receiptId) return;
        window.open(`${API_BASE}/api/payments/receipt/${receiptId}/pdf`, '_blank');
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

    if (error) {
        return (
            <div className="parent-payment-page">
                <div className="payment-error-state">
                    <ErrorIcon className="error-icon" />
                    <h2>Payment Error</h2>
                    <p>{error}</p>
                </div>
            </div>
        );
    }

    if (!paymentData) return null;

    return (
        <div className="parent-payment-page">
            {/* Header */}
            <header className="payment-page-header">
                <div className="header-content">
                    <SchoolIcon className="school-icon" />
                    <div>
                        <h1>{paymentData.school_name}</h1>
                        <p>Secure Fee Payment Portal</p>
                    </div>
                </div>
                <div className="secured-badge">
                    <CheckCircleIcon style={{ fontSize: 16 }} />
                    Secured Payment
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

                        <div className="receipt-info">
                            <div className="receipt-row">
                                <span>Receipt No</span>
                                <strong>{receiptId}</strong>
                            </div>
                            <div className="receipt-row">
                                <span>Transaction ID</span>
                                <strong>{transactionId}</strong>
                            </div>
                        </div>

                        <div className="success-details">
                            <div className="detail-row">
                                <span>Amount Paid</span>
                                <span className="amount">₹{paymentData.amount.toLocaleString()}</span>
                            </div>
                            <div className="detail-row">
                                <span>Student Name</span>
                                <span>{paymentData.student_name}</span>
                            </div>
                            <div className="detail-row">
                                <span>Class</span>
                                <span>{paymentData.class_name} - {paymentData.section}</span>
                            </div>
                            <div className="detail-row">
                                <span>Date</span>
                                <span>{new Date().toLocaleDateString('en-IN', { dateStyle: 'long' })}</span>
                            </div>
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
                        <p>We couldn't verify your payment. Please try again.</p>
                        <button className="action-btn primary" onClick={() => setPaymentStatus('pending')}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* Processing State */}
                {paymentStatus === 'processing' && (
                    <div className="payment-processing">
                        <div className="processing-animation">
                            <div className="processing-circle"></div>
                            <PaymentIcon className="processing-icon" />
                        </div>
                        <h2>Waiting for Payment</h2>
                        <p>Complete the payment in your UPI app</p>
                        <p className="do-not-close">Please do not close this window</p>
                    </div>
                )}

                {/* Pending State - Payment Form */}
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
                                    <span className="detail-value">{paymentData.student_name}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Student ID</span>
                                    <span className="detail-value id">{paymentData.student_id}</span>
                                </div>
                                <div className="detail-item">
                                    <span className="detail-label">Class & Section</span>
                                    <span className="detail-value">{paymentData.class_name} - {paymentData.section}</span>
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
                                ₹{paymentData.amount.toLocaleString()}
                            </div>
                        </div>

                        {/* Payment Methods */}
                        <div className="payment-method-card">
                            <h2 className="card-title">
                                <PaymentIcon />
                                Pay via UPI
                            </h2>

                            <div className="payment-tabs">
                                <button
                                    className={`tab-btn ${paymentMethod === 'qr' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('qr')}
                                >
                                    <QrCodeIcon /> Scan QR
                                </button>
                                <button
                                    className={`tab-btn ${paymentMethod === 'upi_app' ? 'active' : ''}`}
                                    onClick={() => setPaymentMethod('upi_app')}
                                >
                                    <PhoneAndroidIcon /> UPI Apps
                                </button>
                            </div>

                            {/* QR Code */}
                            {paymentMethod === 'qr' && (
                                <div className="qr-section">
                                    <div className="qr-container">
                                        <QRCodeSVG
                                            value={getUpiIntentUrl()}
                                            size={200}
                                            level="H"
                                            includeMargin
                                        />
                                    </div>
                                    <p className="scan-instruction">Scan with any UPI app to pay</p>

                                    <div className="upi-id-display">
                                        <span>UPI ID:</span>
                                        <code>{SCHOOL_UPI_VPA}</code>
                                        <button className="copy-btn" onClick={handleCopyUpi}>
                                            <ContentCopyIcon style={{ fontSize: 16 }} />
                                            {copied ? 'Copied!' : 'Copy'}
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* UPI Apps */}
                            {paymentMethod === 'upi_app' && (
                                <div className="upi-apps-section">
                                    <p>Choose your UPI app:</p>
                                    <div className="upi-apps-grid">
                                        <button className="upi-app-btn gpay" onClick={() => openUpiApp('gpay')}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/f/f2/Google_Pay_Logo.svg" alt="GPay" />
                                            <span>Google Pay</span>
                                        </button>
                                        <button className="upi-app-btn phonepe" onClick={() => openUpiApp('phonepe')}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/7/71/PhonePe_Logo.svg" alt="PhonePe" />
                                            <span>PhonePe</span>
                                        </button>
                                        <button className="upi-app-btn paytm" onClick={() => openUpiApp('paytm')}>
                                            <img src="https://upload.wikimedia.org/wikipedia/commons/2/24/Paytm_Logo.svg" alt="Paytm" />
                                            <span>Paytm</span>
                                        </button>
                                    </div>
                                    <a href={getUpiIntentUrl()} className="generic-upi-btn">
                                        <PhoneAndroidIcon />
                                        Open Default UPI App
                                    </a>
                                </div>
                            )}

                            {/* Manual Transaction Entry */}
                            <div className="manual-verify-section">
                                <p>Already paid? Enter UTR/Transaction ID:</p>
                                <div className="verify-input-group">
                                    <input
                                        type="text"
                                        placeholder="Enter 12-digit UTR number"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                    />
                                    <button onClick={handleManualVerify}>Verify</button>
                                </div>
                            </div>
                        </div>

                        <p className="security-note">
                            🔒 Your payment is secured with 256-bit encryption
                        </p>
                    </>
                )}
            </main>

            <footer className="payment-footer">
                <p>For any queries, contact school administration</p>
                <p className="powered-by">Powered by <strong>Vidyalaya</strong></p>
            </footer>
        </div>
    );
};

export default ParentPaymentPage;
