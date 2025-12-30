import React, { useState, useEffect } from 'react';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ScheduleSendIcon from '@mui/icons-material/ScheduleSend';
import SendIcon from '@mui/icons-material/Send';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SmsIcon from '@mui/icons-material/Sms';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import PhoneAndroidIcon from '@mui/icons-material/PhoneAndroid';
import SettingsIcon from '@mui/icons-material/Settings';
import PreviewIcon from '@mui/icons-material/Preview';
import {
    getAdmissions,
    loadFeeMap,
    saveNotificationSettings,
    loadNotificationSettings,
    saveMSG91Config,
    loadMSG91Config,
} from './db';
import type { NotificationSettings, MSG91Config } from './db';
import './FeeNotification.css';

interface StudentDues {
    studentId: string;
    name: string;
    class: string;
    section: string;
    parentMobile: string;
    duesAmount: number;
    paidAmount: number;
}

const FeeNotification: React.FC = () => {
    // Notification Settings State
    const [dayOfMonth, setDayOfMonth] = useState(1);
    const [isEnabled, setIsEnabled] = useState(false);
    const [lastSentDate, setLastSentDate] = useState<string | null>(null);

    // MSG91 Config State
    const [apiKey, setApiKey] = useState('');
    const [senderId, setSenderId] = useState('');
    const [templateId, setTemplateId] = useState('');

    // Students with Dues
    const [studentsWithDues, setStudentsWithDues] = useState<StudentDues[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [sendProgress, setSendProgress] = useState(0);
    const [msg, setMsg] = useState('');
    const [activeSection, setActiveSection] = useState<'settings' | 'preview'>('settings');

    // Load data on mount
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load notification settings
                const settings = await loadNotificationSettings();
                if (settings) {
                    setDayOfMonth(settings.dayOfMonth || 1);
                    setIsEnabled(settings.isEnabled || false);
                    setLastSentDate(settings.lastSentDate || null);
                }

                // Load MSG91 config
                const msg91 = await loadMSG91Config();
                if (msg91) {
                    setApiKey(msg91.apiKey || '');
                    setSenderId(msg91.senderId || '');
                    setTemplateId(msg91.templateId || '');
                }

                // Calculate students with dues
                await calculateDues();
            } catch (error) {
                console.error('Error loading notification data:', error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Calculate student dues
    const calculateDues = async () => {
        const students = await getAdmissions();
        const feeMap = await loadFeeMap();
        const now = new Date();
        const monthOptions = ['April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February', 'March'];

        const duesList: StudentDues[] = [];

        students.forEach((student: any) => {
            const monthlyFee = Number(student.monthlyFee || feeMap[student.class]) || 0;
            if (monthlyFee === 0) return;

            // Calculate applicable months
            let applicableMonths = [...monthOptions];
            if (student.admissionDate) {
                const admDate = new Date(student.admissionDate);
                const admMonth = admDate.getMonth();
                const academicMonthIndex = (admMonth >= 3) ? admMonth - 3 : admMonth + 9;
                applicableMonths = monthOptions.slice(academicMonthIndex);
            }

            // Current academic month index
            const currentMonthIndex = now.getMonth();
            const currentAcademicMonthIndex = (currentMonthIndex >= 3) ? currentMonthIndex - 3 : currentMonthIndex + 9;

            // Elapsed months
            const elapsedMonths = applicableMonths.filter((_m, idx) => {
                const originalIdx = monthOptions.indexOf(applicableMonths[idx]);
                return originalIdx <= currentAcademicMonthIndex;
            });

            const accruedFee = monthlyFee * elapsedMonths.length;

            // Total paid (excluding misc)
            const paidForTuition = (student.feeHistory || []).reduce((sum: number, p: any) => {
                if (p.type === 'misc' || p.type === 'Admission Fee') return sum;
                return sum + (Number(p.amount) || 0);
            }, 0);

            const dues = Math.max(0, accruedFee - paidForTuition);

            if (dues > 0) {
                duesList.push({
                    studentId: student.studentId,
                    name: student.name,
                    class: student.class,
                    section: student.section,
                    parentMobile: student.fatherMobile || student.motherMobile || '',
                    duesAmount: dues,
                    paidAmount: paidForTuition,
                });
            }
        });

        // Sort by dues amount (highest first)
        duesList.sort((a, b) => b.duesAmount - a.duesAmount);
        setStudentsWithDues(duesList);
    };

    // Save settings
    const handleSaveSettings = async () => {
        try {
            await saveNotificationSettings({
                dayOfMonth,
                isEnabled,
                lastSentDate: lastSentDate || undefined,
            });
            await saveMSG91Config({
                apiKey,
                senderId,
                templateId,
            });
            setMsg('Settings saved successfully!');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            console.error('Error saving settings:', error);
            setMsg('Failed to save settings.');
            setTimeout(() => setMsg(''), 3000);
        }
    };

    // Simulate sending notifications
    const handleSendNotifications = async () => {
        if (!apiKey || !templateId) {
            setMsg('Please configure MSG91 settings first.');
            setTimeout(() => setMsg(''), 3000);
            return;
        }

        if (studentsWithDues.length === 0) {
            setMsg('No students with pending dues.');
            setTimeout(() => setMsg(''), 3000);
            return;
        }

        setSending(true);
        setSendProgress(0);

        // Simulate sending with progress
        for (let i = 0; i < studentsWithDues.length; i++) {
            await new Promise(resolve => setTimeout(resolve, 300)); // Simulate API call
            setSendProgress(Math.round(((i + 1) / studentsWithDues.length) * 100));
        }

        // Update last sent date
        const now = new Date().toISOString();
        setLastSentDate(now);
        await saveNotificationSettings({
            dayOfMonth,
            isEnabled,
            lastSentDate: now,
        });

        setSending(false);
        setMsg(`Successfully sent ${studentsWithDues.length} notifications!`);
        setTimeout(() => setMsg(''), 5000);
    };

    // Generate days array (1-28)
    const days = Array.from({ length: 28 }, (_, i) => i + 1);

    // Get ordinal suffix
    const getOrdinal = (n: number) => {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    // Total dues
    const totalDues = studentsWithDues.reduce((sum, s) => sum + s.duesAmount, 0);

    if (loading) {
        return (
            <div className="notification-loading">
                <div className="loading-spinner"></div>
                <span>Loading notification settings...</span>
            </div>
        );
    }

    return (
        <div className="notification-container">
            {/* Header */}
            <div className="notification-header">
                <div className="notification-header-content">
                    <NotificationsActiveIcon className="notification-header-icon" />
                    <div>
                        <h2 className="notification-title">Fee Reminder Notifications</h2>
                        <p className="notification-subtitle">Send automated payment links to parents via SMS</p>
                    </div>
                </div>
                <div className="notification-stats">
                    <div className="stat-item">
                        <span className="stat-value">{studentsWithDues.length}</span>
                        <span className="stat-label">Students with Dues</span>
                    </div>
                    <div className="stat-item">
                        <span className="stat-value">₹{totalDues.toLocaleString()}</span>
                        <span className="stat-label">Total Pending</span>
                    </div>
                </div>
            </div>

            {/* Success/Error Message */}
            {msg && (
                <div className={`notification-alert ${msg.includes('success') || msg.includes('Successfully') ? 'success' : 'warning'}`}>
                    {msg.includes('success') || msg.includes('Successfully') ? <CheckCircleIcon /> : <WarningAmberIcon />}
                    {msg}
                </div>
            )}

            {/* Section Tabs */}
            <div className="notification-tabs">
                <button
                    className={`notification-tab ${activeSection === 'settings' ? 'active' : ''}`}
                    onClick={() => setActiveSection('settings')}
                >
                    <SettingsIcon style={{ fontSize: 18 }} />
                    Configuration
                </button>
                <button
                    className={`notification-tab ${activeSection === 'preview' ? 'active' : ''}`}
                    onClick={() => setActiveSection('preview')}
                >
                    <PreviewIcon style={{ fontSize: 18 }} />
                    Preview & Send
                </button>
            </div>

            {activeSection === 'settings' ? (
                <div className="notification-settings-grid">
                    {/* Schedule Settings Card */}
                    <div className="notification-card">
                        <h3 className="notification-card-title">
                            <ScheduleSendIcon />
                            Schedule Settings
                        </h3>

                        <div className="setting-group">
                            <label className="setting-label">Notification Day</label>
                            <p className="setting-description">Select the day of each month to send fee reminders</p>
                            <div className="day-selector">
                                <select
                                    className="day-select"
                                    value={dayOfMonth}
                                    onChange={(e) => setDayOfMonth(Number(e.target.value))}
                                >
                                    {days.map(d => (
                                        <option key={d} value={d}>{getOrdinal(d)} of every month</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="setting-group">
                            <div className="toggle-row">
                                <div className="toggle-info">
                                    <label className="setting-label">Auto-Send Notifications</label>
                                    <p className="setting-description">Automatically send reminders on the scheduled day</p>
                                </div>
                                <div
                                    className={`toggle-switch ${isEnabled ? 'active' : ''}`}
                                    onClick={() => setIsEnabled(!isEnabled)}
                                >
                                    <div className="toggle-knob"></div>
                                </div>
                            </div>
                        </div>

                        {lastSentDate && (
                            <div className="last-sent-info">
                                <CheckCircleIcon style={{ color: '#22c55e', fontSize: 18 }} />
                                <span>Last sent: {new Date(lastSentDate).toLocaleString('en-IN')}</span>
                            </div>
                        )}
                    </div>

                    {/* MSG91 Configuration Card */}
                    <div className="notification-card">
                        <h3 className="notification-card-title">
                            <SmsIcon />
                            MSG91 Configuration
                        </h3>

                        <div className="setting-group">
                            <label className="setting-label">API Key</label>
                            <input
                                type="password"
                                className="setting-input"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder="Enter MSG91 API Key"
                            />
                        </div>

                        <div className="setting-group">
                            <label className="setting-label">Sender ID</label>
                            <input
                                type="text"
                                className="setting-input"
                                value={senderId}
                                onChange={(e) => setSenderId(e.target.value)}
                                placeholder="e.g., SCHOOL"
                            />
                        </div>

                        <div className="setting-group">
                            <label className="setting-label">Template ID</label>
                            <input
                                type="text"
                                className="setting-input"
                                value={templateId}
                                onChange={(e) => setTemplateId(e.target.value)}
                                placeholder="DLT approved template ID"
                            />
                        </div>

                        <div className="config-status">
                            <div className={`status-dot ${apiKey && templateId ? 'configured' : 'not-configured'}`}></div>
                            <span className={`status-text ${apiKey && templateId ? 'configured' : 'not-configured'}`}>
                                {apiKey && templateId ? 'MSG91 Configured' : 'Configuration Required'}
                            </span>
                        </div>
                    </div>

                    {/* Save Button */}
                    <div className="settings-actions">
                        <button className="notification-btn primary" onClick={handleSaveSettings}>
                            <SaveIcon />
                            Save Configuration
                        </button>
                    </div>
                </div>
            ) : (
                <div className="notification-preview">
                    {/* Preview Header */}
                    <div className="preview-header">
                        <div className="preview-info">
                            <h3>Students with Pending Dues</h3>
                            <p>Review the list before sending notifications</p>
                        </div>
                        <button
                            className="notification-btn primary send-btn"
                            onClick={handleSendNotifications}
                            disabled={sending || studentsWithDues.length === 0}
                        >
                            {sending ? (
                                <>
                                    <div className="btn-spinner"></div>
                                    Sending... {sendProgress}%
                                </>
                            ) : (
                                <>
                                    <SendIcon />
                                    Send to All ({studentsWithDues.length})
                                </>
                            )}
                        </button>
                    </div>

                    {/* Progress Bar (when sending) */}
                    {sending && (
                        <div className="send-progress-container">
                            <div className="send-progress-bar" style={{ width: `${sendProgress}%` }}></div>
                        </div>
                    )}

                    {/* Message Preview */}
                    <div className="message-preview-card">
                        <h4 className="preview-card-title">
                            <SmsIcon />
                            Sample Message Preview
                        </h4>
                        <div className="message-bubble">
                            <p>Dear Parent,</p>
                            <p>Your ward <strong>[Student Name]</strong> of Class <strong>[X-A]</strong> has pending dues of <strong>₹[Amount]</strong>.</p>
                            <p>Pay now: <span className="link-preview">https://paytm.link/[unique-id]</span></p>
                            <p className="message-footer">- [School Name]</p>
                        </div>
                    </div>

                    {/* Students Table */}
                    {studentsWithDues.length > 0 ? (
                        <div className="students-table-container">
                            <table className="students-table">
                                <thead>
                                    <tr>
                                        <th><PersonIcon style={{ fontSize: 16 }} /> Student</th>
                                        <th><SchoolIcon style={{ fontSize: 16 }} /> Class</th>
                                        <th><PhoneAndroidIcon style={{ fontSize: 16 }} /> Parent Mobile</th>
                                        <th><CurrencyRupeeIcon style={{ fontSize: 16 }} /> Dues</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {studentsWithDues.map((student, idx) => (
                                        <tr key={student.studentId} style={{ animationDelay: `${idx * 0.03}s` }}>
                                            <td>
                                                <div className="student-name">{student.name}</div>
                                                <div className="student-id">{student.studentId}</div>
                                            </td>
                                            <td>{student.class} - {student.section}</td>
                                            <td>
                                                {student.parentMobile ? (
                                                    <span className="mobile-number">{student.parentMobile}</span>
                                                ) : (
                                                    <span className="no-mobile">No mobile</span>
                                                )}
                                            </td>
                                            <td className="dues-amount">₹{student.duesAmount.toLocaleString()}</td>
                                            <td>
                                                <span className={`notification-status ${student.parentMobile ? 'ready' : 'warning'}`}>
                                                    {student.parentMobile ? 'Ready' : 'No Contact'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="no-dues-message">
                            <CheckCircleIcon style={{ fontSize: 48, color: '#22c55e' }} />
                            <h3>All Clear!</h3>
                            <p>No students have pending dues at this time.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default FeeNotification;
