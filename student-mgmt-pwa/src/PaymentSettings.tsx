import React, { useState, useEffect } from 'react';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import SaveIcon from '@mui/icons-material/Save';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloseIcon from '@mui/icons-material/Close';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import PaymentIcon from '@mui/icons-material/Payment';
import LanguageIcon from '@mui/icons-material/Language';
import {
    savePaytmConfig,
    loadPaytmConfig,
    getOnlineTransactions,
} from './db';
import type { OnlineTransaction } from './db';
import './PaymentSettings.css';

const PaymentSettings: React.FC = () => {
    // State
    const [activeTab, setActiveTab] = useState<'config' | 'transactions'>('config');
    const [merchantId, setMerchantId] = useState('');
    const [merchantKey, setMerchantKey] = useState('');
    const [isLive, setIsLive] = useState(false);
    const [isConfigured, setIsConfigured] = useState(false);
    const [transactions, setTransactions] = useState<OnlineTransaction[]>([]);
    const [selectedTxn, setSelectedTxn] = useState<OnlineTransaction | null>(null);
    const [msg, setMsg] = useState('');
    const [loading, setLoading] = useState(true);

    // Load config on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                const config = await loadPaytmConfig();
                if (config) {
                    setMerchantId(config.merchantId || '');
                    setMerchantKey(config.merchantKey || '');
                    setIsLive(config.isLive || false);
                    setIsConfigured(!!config.merchantId && !!config.merchantKey);
                }
                const txns = await getOnlineTransactions();
                setTransactions(txns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
            } catch (error) {
                console.error('Error loading payment settings:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Save config handler
    const handleSaveConfig = async () => {
        if (!merchantId.trim() || !merchantKey.trim()) {
            setMsg('Please enter both Merchant ID and Merchant Key.');
            setTimeout(() => setMsg(''), 3000);
            return;
        }

        try {
            await savePaytmConfig({
                merchantId: merchantId.trim(),
                merchantKey: merchantKey.trim(),
                isLive
            });
            setIsConfigured(true);
            setMsg('Payment configuration saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            console.error('Error saving config:', error);
            setMsg('Failed to save configuration.');
            setTimeout(() => setMsg(''), 3000);
        }
    };

    // Get payment mode icon
    const getPaymentModeIcon = (mode: string) => {
        switch (mode) {
            case 'UPI': return <PhoneAndroidIcon style={{ fontSize: 16 }} />;
            case 'CARD': return <CreditCardIcon style={{ fontSize: 16 }} />;
            case 'NETBANKING': return <LanguageIcon style={{ fontSize: 16 }} />;
            case 'WALLET': return <AccountBalanceWalletIcon style={{ fontSize: 16 }} />;
            default: return <PaymentIcon style={{ fontSize: 16 }} />;
        }
    };

    // Format date
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) {
        return (
            <div className="payment-page">
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                    <div className="loading-spinner"></div>
                    <span style={{ marginLeft: 16, color: 'var(--text-secondary)' }}>Loading payment settings...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="payment-page">
            {/* Header */}
            <div className="payment-page-header">
                <h1 className="payment-page-title">
                    <CreditCardIcon />
                    Payment Gateway
                </h1>
            </div>

            {/* Success/Error Message */}
            {msg && (
                <div className={`payment-alert ${msg.includes('success') ? 'payment-alert-success' : 'payment-alert-warning'}`}>
                    {msg.includes('success') ? <CheckCircleIcon /> : <ErrorIcon />}
                    {msg}
                </div>
            )}

            {/* Tabs */}
            <div className="payment-tabs">
                <button
                    className={`payment-tab ${activeTab === 'config' ? 'active' : ''}`}
                    onClick={() => setActiveTab('config')}
                >
                    <SettingsIcon style={{ fontSize: 18, marginRight: 8 }} />
                    Configuration
                </button>
                <button
                    className={`payment-tab ${activeTab === 'transactions' ? 'active' : ''}`}
                    onClick={() => setActiveTab('transactions')}
                >
                    <HistoryIcon style={{ fontSize: 18, marginRight: 8 }} />
                    Transaction History
                </button>
            </div>

            {/* Configuration Tab */}
            {activeTab === 'config' && (
                <div className="payment-card">
                    <h2 className="payment-card-title">
                        <SettingsIcon />
                        Paytm Merchant Configuration
                    </h2>

                    {/* Configuration Status Indicator */}
                    <div className={`config-status ${isConfigured ? 'configured' : 'not-configured'}`}>
                        <div className="config-status-dot"></div>
                        <span className="config-status-text">
                            {isConfigured ? 'Payment Gateway Configured' : 'Payment Gateway Not Configured'}
                        </span>
                    </div>

                    <div className="payment-form-grid">
                        <div className="payment-form-field">
                            <label className="payment-form-label">Merchant ID</label>
                            <input
                                type="text"
                                className="payment-form-input"
                                value={merchantId}
                                onChange={(e) => setMerchantId(e.target.value)}
                                placeholder="Enter your Paytm Merchant ID"
                            />
                        </div>
                        <div className="payment-form-field">
                            <label className="payment-form-label">Merchant Key</label>
                            <input
                                type="password"
                                className="payment-form-input"
                                value={merchantKey}
                                onChange={(e) => setMerchantKey(e.target.value)}
                                placeholder="Enter your Paytm Merchant Key"
                            />
                        </div>
                    </div>

                    {/* Live/Test Toggle */}
                    <div className="payment-toggle-container">
                        <div
                            className={`payment-toggle ${isLive ? 'active' : ''}`}
                            onClick={() => setIsLive(!isLive)}
                        ></div>
                        <span className="payment-toggle-label">
                            {isLive ? 'Live Mode (Production)' : 'Test Mode (Sandbox)'}
                        </span>
                    </div>

                    {!isLive && (
                        <div className="payment-alert payment-alert-warning" style={{ marginTop: 16, marginBottom: 16 }}>
                            <ErrorIcon />
                            Test mode is enabled. Transactions will not be processed with real funds.
                        </div>
                    )}

                    <button className="payment-btn payment-btn-primary" onClick={handleSaveConfig}>
                        <SaveIcon />
                        Save Configuration
                    </button>
                </div>
            )}

            {/* Transactions Tab */}
            {activeTab === 'transactions' && (
                <div className="payment-card">
                    <h2 className="payment-card-title">
                        <ReceiptLongIcon />
                        Online Transaction History
                    </h2>

                    {transactions.length === 0 ? (
                        <div className="payment-empty-state">
                            <ReceiptLongIcon />
                            <h3>No Transactions Yet</h3>
                            <p>Online payment transactions will appear here once processed.</p>
                        </div>
                    ) : (
                        <div className="payment-table-container">
                            <table className="payment-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>Payment Mode</th>
                                        <th>Transaction ID</th>
                                        <th>Student</th>
                                        <th>Amount</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {transactions.map((txn, index) => (
                                        <tr key={index} onClick={() => setSelectedTxn(txn)}>
                                            <td className="timestamp">{formatDate(txn.timestamp)}</td>
                                            <td>
                                                <span className={`payment-mode-badge ${txn.paymentMode.toLowerCase()}`}>
                                                    {getPaymentModeIcon(txn.paymentMode)}
                                                    {txn.paymentMode}
                                                </span>
                                            </td>
                                            <td><span className="txn-id">{txn.txnId}</span></td>
                                            <td>
                                                <div style={{ fontWeight: 600 }}>{txn.studentName}</div>
                                                <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{txn.studentId}</div>
                                            </td>
                                            <td className="amount">₹{txn.amount.toLocaleString()}</td>
                                            <td>
                                                <span className={`payment-status-badge ${txn.status.toLowerCase()}`}>
                                                    {txn.status === 'SUCCESS' && <CheckCircleIcon style={{ fontSize: 14 }} />}
                                                    {txn.status === 'FAILED' && <ErrorIcon style={{ fontSize: 14 }} />}
                                                    {txn.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* Transaction Detail Modal */}
            {selectedTxn && (
                <div className="payment-modal-overlay" onClick={() => setSelectedTxn(null)}>
                    <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="payment-modal-header">
                            <ReceiptLongIcon />
                            <h2>Transaction Details</h2>
                        </div>
                        <div className="payment-modal-content">
                            <div className="payment-modal-row">
                                <span className="payment-modal-label">Transaction ID</span>
                                <span className="payment-modal-value" style={{ fontFamily: 'monospace' }}>{selectedTxn.txnId}</span>
                            </div>
                            <div className="payment-modal-row">
                                <span className="payment-modal-label">Order ID</span>
                                <span className="payment-modal-value" style={{ fontFamily: 'monospace' }}>{selectedTxn.orderId}</span>
                            </div>
                            <div className="payment-modal-row">
                                <span className="payment-modal-label">Date & Time</span>
                                <span className="payment-modal-value">{formatDate(selectedTxn.timestamp)}</span>
                            </div>
                            <div className="payment-modal-row">
                                <span className="payment-modal-label">Student Name</span>
                                <span className="payment-modal-value">{selectedTxn.studentName}</span>
                            </div>
                            <div className="payment-modal-row">
                                <span className="payment-modal-label">Student ID</span>
                                <span className="payment-modal-value">{selectedTxn.studentId}</span>
                            </div>
                            <div className="payment-modal-row">
                                <span className="payment-modal-label">Amount</span>
                                <span className="payment-modal-value" style={{ fontSize: 18, color: '#059669', fontWeight: 700 }}>
                                    ₹{selectedTxn.amount.toLocaleString()}
                                </span>
                            </div>
                            <div className="payment-modal-row">
                                <span className="payment-modal-label">Payment Mode</span>
                                <span className="payment-modal-value">
                                    <span className={`payment-mode-badge ${selectedTxn.paymentMode.toLowerCase()}`}>
                                        {getPaymentModeIcon(selectedTxn.paymentMode)}
                                        {selectedTxn.paymentMode}
                                    </span>
                                </span>
                            </div>
                            <div className="payment-modal-row">
                                <span className="payment-modal-label">Status</span>
                                <span className="payment-modal-value">
                                    <span className={`payment-status-badge ${selectedTxn.status.toLowerCase()}`}>
                                        {selectedTxn.status === 'SUCCESS' && <CheckCircleIcon style={{ fontSize: 14 }} />}
                                        {selectedTxn.status === 'FAILED' && <ErrorIcon style={{ fontSize: 14 }} />}
                                        {selectedTxn.status}
                                    </span>
                                </span>
                            </div>
                            {selectedTxn.bankTxnId && (
                                <div className="payment-modal-row">
                                    <span className="payment-modal-label">Bank Transaction ID</span>
                                    <span className="payment-modal-value" style={{ fontFamily: 'monospace' }}>{selectedTxn.bankTxnId}</span>
                                </div>
                            )}
                            {selectedTxn.bankName && (
                                <div className="payment-modal-row">
                                    <span className="payment-modal-label">Bank Name</span>
                                    <span className="payment-modal-value">{selectedTxn.bankName}</span>
                                </div>
                            )}
                            {selectedTxn.gatewayName && (
                                <div className="payment-modal-row">
                                    <span className="payment-modal-label">Gateway</span>
                                    <span className="payment-modal-value">{selectedTxn.gatewayName}</span>
                                </div>
                            )}
                            {selectedTxn.responseMessage && (
                                <div className="payment-modal-row">
                                    <span className="payment-modal-label">Response</span>
                                    <span className="payment-modal-value">{selectedTxn.responseMessage}</span>
                                </div>
                            )}
                        </div>
                        <div className="payment-modal-footer">
                            <button className="payment-btn payment-btn-secondary" onClick={() => setSelectedTxn(null)}>
                                <CloseIcon style={{ fontSize: 18 }} />
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PaymentSettings;
