import React, { useEffect, useState } from 'react';
import './AdminProfile.css';
import { loadSchoolInfo, type SchoolInfo } from './db';

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
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;
