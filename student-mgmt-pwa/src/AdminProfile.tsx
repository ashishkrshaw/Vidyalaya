import React, { useEffect, useState } from 'react';
import './AdminProfile.css';
import { loadSchoolInfo, type SchoolInfo } from './db';
import { startRegistration } from '@simplewebauthn/browser';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

interface AdminProfileProps {
    onNavigateToSettings: () => void;
    schoolLogo: string | null;
}

const AdminProfile: React.FC<AdminProfileProps> = ({ onNavigateToSettings, schoolLogo }) => {
    const [schoolInfo, setSchoolInfo] = useState<SchoolInfo | null>(null);
    const [loginTime, setLoginTime] = useState<string>('');
    const [mfaSetupOpen, setMfaSetupOpen] = useState(false);
    const [qrCode, setQrCode] = useState('');
    const [secret, setSecret] = useState('');
    const [otp, setOtp] = useState('');
    const [mfaLoading, setMfaLoading] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const info = await loadSchoolInfo();
                setSchoolInfo(info);
            } catch (e) {
                console.error('Error loading school info:', e);
            }
        };
        fetchData();

        // Get login time from localStorage
        const storedLoginTime = localStorage.getItem('loginTime');
        if (storedLoginTime) {
            const date = new Date(storedLoginTime);
            setLoginTime(date.toLocaleString('en-IN', {
                dateStyle: 'medium',
                timeStyle: 'short'
            }));
        }
    }, []);

    const handleSetupMFA = async () => {
        setMfaLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_BASE}/api/mfa/totp/setup`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setQrCode(data.qr_code);
                setSecret(data.secret);
                setMfaSetupOpen(true);
            } else {
                alert('Failed to initiate MFA setup');
            }
        } catch (e) {
            console.error(e);
            alert('Connection error');
        }
        setMfaLoading(false);
    };

    const verifyAndEnableMFA = async () => {
        if (!otp || otp.length < 6) {
            alert('Please enter a valid 6-digit code');
            return;
        }
        setMfaLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_BASE}/api/mfa/totp/verify-setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code: otp })
            });

            if (res.ok) {
                setMfaSetupOpen(false);
                alert('2-Factor Authentication Enabled!');
                window.location.reload();
            } else {
                alert('Invalid Code. Please try again.');
            }
        } catch (e) {
            console.error(e);
            alert('Error verifying code');
        }
        setMfaLoading(false);
    };

    const handleSetupPasskey = async () => {
        setMfaLoading(true);
        try {
            const token = localStorage.getItem('accessToken');
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

            // 1. Get options from backend
            const resp = await fetch(`${API_BASE}/api/mfa/passkey/register-options`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            if (!resp.ok) throw new Error('Failed to get registration options');
            const options = await resp.json();

            // 2. Start registration with browser
            const attResp = await startRegistration({ optionsJSON: options });

            // 3. Verify with backend
            const verifyResp = await fetch(`${API_BASE}/api/mfa/passkey/register-verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(attResp)
            });

            if (verifyResp.ok) {
                alert('Passkey Registered Successfully!');
                window.location.reload();
            } else {
                alert('Failed to verify passkey registration');
            }

        } catch (e: any) {
            console.error(e);
            if (e.name === 'InvalidStateError') {
                alert('Error: Authenticator was probably already registered by this user');
            } else {
                alert(`Passkey setup failed: ${e.message}`);
            }
        }
        setMfaLoading(false);
    };

    const handleDisableMFA = async () => {
        // Handle both TOTP and Passkey disable
        let code = "";

        if (schoolInfo?.mfa_type === 'passkey') {
            if (!confirm("Are you sure you want to disable Passkey MFA?")) return;
            code = "PASSKEY_DISABLE"; // Special code for passkey
        } else {
            code = prompt("Enter code from your authenticator to disable 2FA:") || "";
            if (!code) return;
        }

        try {
            const token = localStorage.getItem('accessToken');
            const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
            const res = await fetch(`${API_BASE}/api/mfa/disable`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ code })
            });
            if (res.ok) {
                alert('MFA Disabled Successfully');
                window.location.reload();
            } else {
                alert('Failed to disable MFA. Invalid code?');
            }
        } catch (e) {
            console.error(e);
            alert('Connection error');
        }
    };

    const currentDate = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    return (
        <div className="admin-profile-page">
            {/* Header Section */}
            <div className="profile-header">
                <div className="profile-logo-wrapper">
                    {schoolLogo ? (
                        <img src={schoolLogo} alt="School Logo" />
                    ) : (
                        <SchoolIcon />
                    )}
                </div>

                <div className="profile-header-info">
                    <h1>{schoolInfo?.name || 'School Name'}</h1>
                    <div className="profile-role">
                        <AdminPanelSettingsIcon />
                        Administrator Portal
                    </div>
                    <div className="profile-meta">
                        <span className="profile-meta-item">
                            <CalendarMonthIcon />
                            {currentDate}
                        </span>
                        {loginTime && (
                            <span className="profile-meta-item">
                                <SecurityIcon />
                                Logged in: {loginTime}
                            </span>
                        )}
                    </div>
                </div>

                <div className="profile-actions">
                    <button className="profile-action-btn primary" onClick={onNavigateToSettings}>
                        <SettingsIcon />
                        Edit Settings
                    </button>
                </div>
            </div>

            {/* Content Grid */}
            <div className="profile-content">
                {/* School Information */}
                <div className="profile-card">
                    <h3 className="profile-card-title">
                        <BusinessIcon />
                        School Information
                    </h3>
                    <div className="profile-info-row">
                        <span className="profile-info-label">School Name</span>
                        <span className="profile-info-value">{schoolInfo?.name || 'Not Set'}</span>
                    </div>
                    {schoolInfo?.schoolCode && (
                        <div className="profile-info-row">
                            <span className="profile-info-label">School Code</span>
                            <span className="profile-info-value">{schoolInfo.schoolCode}</span>
                        </div>
                    )}
                    <div className="profile-info-row">
                        <span className="profile-info-label">Address</span>
                        <span className="profile-info-value">{schoolInfo?.address || 'Not Set'}</span>
                    </div>
                </div>

                {/* Contact Details */}
                <div className="profile-card">
                    <h3 className="profile-card-title">
                        <PhoneIcon />
                        Contact Details
                    </h3>
                    <div className="profile-info-row">
                        <span className="profile-info-label">Phone</span>
                        <span className="profile-info-value">
                            <a href={`tel:${schoolInfo?.phone}`}>{schoolInfo?.phone || 'Not Set'}</a>
                        </span>
                    </div>
                    <div className="profile-info-row">
                        <span className="profile-info-label">Email</span>
                        <span className="profile-info-value">
                            <a href={`mailto:${schoolInfo?.email}`}>{schoolInfo?.email || 'Not Set'}</a>
                        </span>
                    </div>
                    <div className="profile-info-row">
                        <span className="profile-info-label">Website</span>
                        <span className="profile-info-value">
                            <a href={`https://${schoolInfo?.website}`} target="_blank" rel="noopener noreferrer">
                                {schoolInfo?.website || 'Not Set'}
                            </a>
                        </span>
                    </div>
                </div>

                {/* Quick Settings */}
                <div className="profile-card full-width">
                    <h3 className="profile-card-title">
                        <SettingsIcon />
                        Quick Settings
                    </h3>

                    <div className="quick-setting-row">
                        <div className="quick-setting-info">
                            <span className="quick-setting-title">School Branding</span>
                            <span className="quick-setting-desc">Update logo, name, and contact information</span>
                        </div>
                        <button className="quick-setting-btn" onClick={onNavigateToSettings}>
                            Configure <ArrowForwardIcon style={{ fontSize: 14, marginLeft: 4 }} />
                        </button>
                    </div>

                    <div className="quick-setting-row">
                        <div className="quick-setting-info">
                            <span className="quick-setting-title">Fee Structure</span>
                            <span className="quick-setting-desc">Set class-wise monthly fees and admission fees</span>
                        </div>
                        <button className="quick-setting-btn" onClick={onNavigateToSettings}>
                            Configure <ArrowForwardIcon style={{ fontSize: 14, marginLeft: 4 }} />
                        </button>
                    </div>

                    <div className="quick-setting-row">
                        <div className="quick-setting-info">
                            <span className="quick-setting-title">Academic Year</span>
                            <span className="quick-setting-desc">Configure promotion date and session settings</span>
                        </div>
                        <button className="quick-setting-btn" onClick={onNavigateToSettings}>
                            Configure <ArrowForwardIcon style={{ fontSize: 14, marginLeft: 4 }} />
                        </button>
                    </div>

                    <div className="quick-setting-row">
                        <div className="quick-setting-info">
                            <span className="quick-setting-title">Payment Gateway</span>
                            <span className="quick-setting-desc">Configure online payment settings</span>
                        </div>
                        <button className="quick-setting-btn" onClick={onNavigateToSettings}>
                            Configure <ArrowForwardIcon style={{ fontSize: 14, marginLeft: 4 }} />
                        </button>
                    </div>

                    <div className="quick-setting-row">
                        <div className="quick-setting-info">
                            <span className="quick-setting-title">Notifications</span>
                            <span className="quick-setting-desc">SMS settings and fee reminders</span>
                        </div>
                        <button className="quick-setting-btn" onClick={onNavigateToSettings}>
                            Configure <ArrowForwardIcon style={{ fontSize: 14, marginLeft: 4 }} />
                        </button>
                    </div>

                    <div className="quick-setting-row highlight-pricing">
                        <div className="quick-setting-info">
                            <span className="quick-setting-title">Pricing & Subscription</span>
                            <span className="quick-setting-desc">View and upgrade your plan</span>
                        </div>
                        <button className="quick-setting-btn" onClick={() => window.dispatchEvent(new CustomEvent('navigate-to-pricing'))}>
                            View Plans <ArrowForwardIcon style={{ fontSize: 14, marginLeft: 4 }} />
                        </button>
                    </div>

                    {/* Security Section (New) */}
                    <div className="quick-setting-row" style={{ marginTop: '20px', borderTop: '1px solid #eee', paddingTop: '15px' }}>
                        <div className="quick-setting-info">
                            <span className="quick-setting-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <SecurityIcon fontSize="small" /> Security
                            </span>
                            <span className="quick-setting-desc">
                                {schoolInfo?.mfa_enabled ?
                                    <span style={{ color: 'green', fontWeight: 'bold' }}>
                                        ✓ 2FA is Enabled ({schoolInfo.mfa_type === 'passkey' ? 'Device Passkey' : 'App'})
                                    </span> :
                                    'Secure your account with 2-Factor Authentication'}
                            </span>
                        </div>

                        {!schoolInfo?.mfa_enabled ? (
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button className="quick-setting-btn" onClick={handleSetupMFA} disabled={mfaLoading}>
                                    Use Auth App
                                </button>
                                <button
                                    className="quick-setting-btn"
                                    style={{ backgroundColor: '#0f172a', color: 'white' }}
                                    onClick={handleSetupPasskey}
                                    disabled={mfaLoading}
                                >
                                    Use Passkey
                                </button>
                            </div>
                        ) : (
                            <button className="quick-setting-btn" style={{ borderColor: '#ef4444', color: '#ef4444' }} onClick={handleDisableMFA}>
                                Disable
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* MFA Setup Modal, using existing modal styles */}
            {mfaSetupOpen && (
                <div className="terms-modal-overlay" onClick={() => setMfaSetupOpen(false)}>
                    <div className="terms-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                        <button className="modal-close-btn" onClick={() => setMfaSetupOpen(false)}>
                            <SettingsIcon />
                            {/* Reusing close icon styling but maybe need CloseIcon import or just X */}
                            X
                        </button>
                        <div className="modal-header">
                            <div className="modal-icon"><SecurityIcon /></div>
                            <h2>Setup 2-Step Verification</h2>
                            <p>Protect your account with an Authenticator App</p>
                        </div>
                        <div className="terms-modal-content">
                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <p style={{ marginBottom: 10, fontSize: '0.9rem', color: '#666' }}>1. Scan this QR code with Google Authenticator or Authy</p>
                                <img src={qrCode} alt="MFA QR Code" style={{ width: 180, height: 180, border: '1px solid #ddd', borderRadius: 8, padding: 8 }} />
                                <div style={{ margin: '10px 0', fontSize: '0.8rem', color: '#888', background: '#f5f5f5', padding: 5, borderRadius: 4 }}>
                                    Secret Key: <code style={{ userSelect: 'all' }}>{secret}</code>
                                </div>
                            </div>

                            <div style={{ textAlign: 'center', margin: '20px 0' }}>
                                <p style={{ marginBottom: 10, fontSize: '0.9rem', color: '#666' }}>2. Enter the 6-digit code provided by the app</p>
                                <input
                                    type="text"
                                    value={otp}
                                    onChange={(e) => setOtp(e.target.value)}
                                    placeholder="000 000"
                                    style={{
                                        fontSize: '1.5rem',
                                        textAlign: 'center',
                                        letterSpacing: '5px',
                                        width: '200px',
                                        padding: '10px',
                                        borderRadius: '8px',
                                        border: '1px solid #ccc'
                                    }}
                                    maxLength={6}
                                />
                            </div>
                        </div>
                        <div className="terms-modal-footer">
                            <button className="profile-action-btn primary" onClick={verifyAndEnableMFA} disabled={mfaLoading}>
                                {mfaLoading ? 'Verifying...' : 'Verify & Enable'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminProfile;
