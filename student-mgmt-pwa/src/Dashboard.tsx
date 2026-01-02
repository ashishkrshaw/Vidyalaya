import React, { useEffect, useState } from 'react';
import './Dashboard.css';
import { getAdmissions, loadSchoolLogo } from './db';
import AvatarBoy from './assets/avatar_boy.png';

// Icons
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PaymentIcon from '@mui/icons-material/Payment';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import HistoryIcon from '@mui/icons-material/History';
import SearchIcon from '@mui/icons-material/Search';

interface DashboardProps {
    onMenuClick: (key: string) => void;
    schoolName: string;
}

const Dashboard: React.FC<DashboardProps> = ({ onMenuClick, schoolName }) => {
    const [studentCount, setStudentCount] = useState(0);
    const [totalPaid, setTotalPaid] = useState(0);
    const [totalPayable, setTotalPayable] = useState(0);
    const [todayDate, setTodayDate] = useState('');
    const [bannerLogo, setBannerLogo] = useState<string | null>(null);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const students = await getAdmissions();
                setStudentCount(students.length);

                // Calculate Financial Stats
                let paid = 0;
                let dues = 0;

                students.forEach((s: any) => {
                    // Calculate Total Paid from History
                    if (s.feeHistory && Array.isArray(s.feeHistory)) {
                        s.feeHistory.forEach((p: any) => {
                            paid += Number(p.amount) || 0;
                        });
                    }
                    // Sum up current dues (assuming 'dues' field tracks pending amount)
                    dues += Number(s.dues) || 0;
                });

                setTotalPaid(paid);
                // Total Payable = Collected + Pending
                setTotalPayable(paid + dues);

            } catch (e) {
                console.error("Failed to fetch stats", e);
            }
        };

        fetchStats();

        // Load school logo for banner
        const loadBannerLogo = async () => {
            try {
                const logo = await loadSchoolLogo();
                if (logo && typeof logo === 'string' && logo.startsWith('data:')) {
                    setBannerLogo(logo);
                }
            } catch (e) {
                console.error('Error loading school logo:', e);
            }
        };
        loadBannerLogo();

        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        setTodayDate(new Date().toLocaleDateString('en-US', options));
    }, []);

    return (
        <div className="dashboard-container">
            {/* Banner */}
            <div className="dashboard-banner">
                <div className="banner-content">
                    <div className="banner-date">{todayDate}</div>
                    <h1 className="banner-title">{schoolName || 'Student Database'}</h1>
                    <p className="banner-subtitle">Always stay updated in your ScholarBase dashboard.</p>
                </div>
                <img
                    src={bannerLogo || AvatarBoy}
                    alt={bannerLogo ? 'School Logo' : 'Student'}
                    className="banner-image"
                    style={bannerLogo ? {
                        objectFit: 'contain',
                        borderRadius: '16px',
                        padding: '10px',
                        background: 'rgba(255,255,255,0.2)',
                        backdropFilter: 'blur(10px)'
                    } : undefined}
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                />
            </div>

            {/* Quick Access / Enrolled Courses */}
            <div className="quick-access-section">
                <div className="section-header">
                    <h2 className="section-title">Quick Actions</h2>
                    <a href="#" className="section-link" onClick={(e) => { e.preventDefault(); }}>See all</a>
                </div>

                <div className="quick-access-grid">
                    {/* New Admission */}
                    <div className="quick-card" style={{ '--card-color': '#8b5cf6' } as React.CSSProperties} onClick={() => onMenuClick('student')}>
                        <div className="card-icon">
                            <PersonAddIcon />
                        </div>
                        <div>
                            <h3>New Admission</h3>
                            <p>Register a new student</p>
                        </div>
                        <button className="btn-view">Start</button>
                    </div>

                    {/* Student Search */}
                    <div className="quick-card" style={{ '--card-color': '#ec4899' } as React.CSSProperties} onClick={() => onMenuClick('show')}>
                        <div className="card-icon">
                            <SearchIcon />
                        </div>
                        <div>
                            <h3>Find Student</h3>
                            <p>Search & View Profiles</p>
                        </div>
                        <button className="btn-view">Search</button>
                    </div>

                    {/* Fee Management */}
                    <div className="quick-card" style={{ '--card-color': '#3b82f6' } as React.CSSProperties} onClick={() => onMenuClick('fee')}>
                        <div className="card-icon">
                            <PaymentIcon />
                        </div>
                        <div>
                            <h3>Fee Payment</h3>
                            <p>Collect fees & dues</p>
                        </div>
                        <button className="btn-view">Collect</button>
                    </div>

                    {/* Statistics */}
                    <div className="quick-card" style={{ '--card-color': '#ef4444' } as React.CSSProperties} onClick={() => onMenuClick('stats')}>
                        <div className="card-icon">
                            <EqualizerIcon />
                        </div>
                        <div>
                            <h3>Statistics</h3>
                            <p>View Charts & Reports</p>
                        </div>
                        <button className="btn-view">View</button>
                    </div>

                    {/* History */}
                    <div className="quick-card" style={{ '--card-color': '#14b8a6' } as React.CSSProperties} onClick={() => onMenuClick('history')}>
                        <div className="card-icon">
                            <HistoryIcon />
                        </div>
                        <div>
                            <h3>History</h3>
                            <p>Activity Logs</p>
                        </div>
                        <button className="btn-view">Open</button>
                    </div>

                </div>
            </div>

            {/* Finance Stats */}
            <div className="stats-section">
                <div className="section-header">
                    <h2 className="section-title">Finance Overview</h2>
                </div>
                <div className="stats-grid">
                    <div className="stat-card" style={{ '--card-color': '#7c3aed' } as React.CSSProperties}>
                        <div className="stat-icon-wrapper" style={{ background: '#7c3aed' }}>
                            <PaymentIcon />
                        </div>
                        <div className="stat-value">₹ {totalPayable.toLocaleString('en-IN')}</div>
                        <div className="stat-label">Total Payable</div>
                    </div>

                    <div className="stat-card" style={{ '--card-color': '#10b981' } as React.CSSProperties}>
                        <div className="stat-icon-wrapper" style={{ background: '#10b981' }}>
                            <PaymentIcon />
                        </div>
                        <div className="stat-value">₹ {totalPaid.toLocaleString('en-IN')}</div>
                        <div className="stat-label">Total Paid</div>
                    </div>

                    <div className="stat-card" style={{ '--card-color': '#f59e0b' } as React.CSSProperties}>
                        <div className="stat-icon-wrapper" style={{ background: '#f59e0b' }}>
                            <SchoolIcon />
                        </div>
                        <div className="stat-value">{studentCount}</div>
                        <div className="stat-label">Total Students</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;
