import { useState, useEffect } from 'react';
import './DeveloperDashboard.css';

interface School {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    status: 'pending' | 'active' | 'rejected' | 'deactivated';
    created_at: string;
    verified_at?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'https://nlkh.duckdns.org';



const DeveloperDashboard: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [secret, setSecret] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected' | 'deactivated'>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const authenticate = async () => {
        if (!secret) return;

        setLoading(true);
        setError('');
        localStorage.setItem('developerSecret', secret);

        try {
            const endpoint = filter === 'all' ? '/api/developer/all' : '/api/developer/pending';
            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'x-developer-secret': secret
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem('developerSecret');
                    setIsAuthenticated(false);
                    setError('Invalid developer secret');
                    setLoading(false);
                    return;
                }
                throw new Error('Failed to fetch schools');
            }

            const data = await response.json();
            setSchools(data);
            setIsAuthenticated(true); // Only authenticate AFTER server validates
        } catch (err: any) {
            setError(err.message || 'Network error');
            localStorage.removeItem('developerSecret');
            setIsAuthenticated(false);
        } finally {
            setLoading(false);
        }
    };

    const fetchSchools = async () => {
        setLoading(true);
        setError('');

        try {
            const storedSecret = localStorage.getItem('developerSecret') || secret;
            const endpoint = filter === 'all' ? '/api/developer/all' : '/api/developer/pending';

            const response = await fetch(`${API_BASE}${endpoint}`, {
                headers: {
                    'x-developer-secret': storedSecret
                }
            });

            if (!response.ok) {
                if (response.status === 401 || response.status === 403) {
                    setIsAuthenticated(false);
                    localStorage.removeItem('developerSecret');
                    setError('Invalid developer secret');
                    return;
                }
                throw new Error('Failed to fetch schools');
            }

            const data = await response.json();
            setSchools(data);
        } catch (err: any) {

            setError(err.message || 'Failed to load schools');
        } finally {
            setLoading(false);
        }
    };

    const verifySchool = async (schoolId: string) => {
        setActionLoading(schoolId);
        try {
            const storedSecret = localStorage.getItem('developerSecret');
            const response = await fetch(`${API_BASE}/api/developer/verify/${schoolId}`, {
                method: 'POST',
                headers: {
                    'x-developer-secret': storedSecret || ''
                }
            });

            if (!response.ok) throw new Error('Verification failed');

            await fetchSchools();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const rejectSchool = async (schoolId: string) => {
        setActionLoading(schoolId);
        try {
            const storedSecret = localStorage.getItem('developerSecret');
            const response = await fetch(`${API_BASE}/api/developer/reject/${schoolId}`, {
                method: 'POST',
                headers: {
                    'x-developer-secret': storedSecret || ''
                }
            });

            if (!response.ok) throw new Error('Rejection failed');

            await fetchSchools();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const deactivateSchool = async (schoolId: string) => {
        if (!window.confirm('Are you sure you want to deactivate this school? They will lose access immediately.')) return;
        setActionLoading(schoolId);
        try {
            const storedSecret = localStorage.getItem('developerSecret');
            const response = await fetch(`${API_BASE}/api/developer/deactivate/${schoolId}`, {
                method: 'POST',
                headers: { 'x-developer-secret': storedSecret || '' }
            });

            if (!response.ok) throw new Error('Deactivation failed');
            await fetchSchools();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const activateSchool = async (schoolId: string) => {
        setActionLoading(schoolId);
        try {
            const storedSecret = localStorage.getItem('developerSecret');
            const response = await fetch(`${API_BASE}/api/developer/activate/${schoolId}`, {
                method: 'POST',
                headers: { 'x-developer-secret': storedSecret || '' }
            });

            if (!response.ok) throw new Error('Activation failed');
            await fetchSchools();
        } catch (err: any) {
            setError(err.message);
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeactivateAll = async () => {
        const confirm1 = window.confirm('⚠ EMERGENCY STOP: Are you sure you want to deactivate ALL schools?');
        if (!confirm1) return;
        const confirm2 = window.confirm('⚠ This will immediately lock out ALL users. Confirm again?');
        if (!confirm2) return;

        setLoading(true);
        try {
            const storedSecret = localStorage.getItem('developerSecret');
            const response = await fetch(`${API_BASE}/api/developer/deactivate-all`, {
                method: 'POST',
                headers: { 'x-developer-secret': storedSecret || '' }
            });

            if (!response.ok) throw new Error('Emergency stop failed');
            const data = await response.json();
            alert(data.message);
            await fetchSchools();
        } catch (err: any) {
            setError(err.message);
            setLoading(false);
        }
    };

    const handleResetPassword = async (schoolId: string, schoolName: string) => {
        const newPassword = prompt(`Enter new password for ${schoolName}:`);
        if (!newPassword) return;

        setActionLoading(schoolId);
        try {
            const storedSecret = localStorage.getItem('developerSecret');
            const response = await fetch(`${API_BASE}/api/developer/reset-password/${schoolId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-developer-secret': storedSecret || ''
                },
                body: JSON.stringify({ new_password: newPassword })
            });

            if (!response.ok) throw new Error('Password reset failed');
            const data = await response.json();
            alert(data.message);
        } catch (err: any) {
            alert(err.message);
        } finally {
            setActionLoading(null);
        }
    };


    useEffect(() => {
        const storedSecret = localStorage.getItem('developerSecret');
        if (storedSecret) {
            setSecret(storedSecret);
            setIsAuthenticated(true);
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            fetchSchools();
        }
    }, [isAuthenticated, filter]);

    const getStatusBadge = (status: string) => {
        const colors: Record<string, string> = {
            pending: '#FFAB00',
            active: '#36B37E',
            rejected: '#DE350B',
            deactivated: '#6B778C'
        };
        return (
            <span style={{
                background: colors[status] || '#6B778C',
                color: 'white',
                padding: '4px 12px',
                borderRadius: '12px',
                fontSize: '12px',
                fontWeight: 600,
                textTransform: 'uppercase'
            }}>
                {status}
            </span>
        );
    };

    const filteredSchools = filter === 'all'
        ? schools
        : schools.filter(s => s.status === filter);

    if (!isAuthenticated) {
        return (
            <div className="dev-dashboard">
                <div className="dev-auth-card">
                    <h1>🔐 Developer Portal</h1>
                    <p>Enter developer secret to access verification dashboard</p>
                    <input
                        type="password"
                        value={secret}
                        onChange={e => setSecret(e.target.value)}
                        placeholder="Developer Secret Key"
                        onKeyPress={e => e.key === 'Enter' && authenticate()}
                    />
                    <button onClick={authenticate}>Access Dashboard</button>
                    {error && <div className="dev-error">{error}</div>}
                </div>
            </div>
        );
    }

    return (
        <div className="dev-dashboard">
            <header className="dev-header">
                <div>
                    <h1>🎓 Vidyalaya Developer Dashboard</h1>
                    <p>School Verification Portal</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        className="logout-btn"
                        style={{ backgroundColor: '#EF4444' }}
                        onClick={handleDeactivateAll}
                    >
                        ⛔ STOP ALL
                    </button>
                    <button
                        className="logout-btn"
                        onClick={() => {
                            localStorage.removeItem('developerSecret');
                            setIsAuthenticated(false);
                            setSecret('');
                        }}
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className="dev-filters">
                <button
                    className={filter === 'pending' ? 'active' : ''}
                    onClick={() => setFilter('pending')}
                >
                    ⏳ Pending
                </button>
                <button
                    className={filter === 'active' ? 'active' : ''}
                    onClick={() => setFilter('active')}
                >
                    ✅ Active
                </button>
                <button
                    className={filter === 'rejected' ? 'active' : ''}
                    onClick={() => setFilter('rejected')}
                >
                    ❌ Rejected
                </button>
                <button
                    className={filter === 'deactivated' ? 'active' : ''}
                    onClick={() => setFilter('deactivated' as any)}
                >
                    ⛔ Stopped
                </button>
                <button
                    className={filter === 'all' ? 'active' : ''}
                    onClick={() => setFilter('all')}
                >
                    📋 All
                </button>
            </div>

            {error && <div className="dev-error">{error}</div>}

            {loading ? (
                <div className="dev-loading">Loading...</div>
            ) : filteredSchools.length === 0 ? (
                <div className="dev-empty">
                    No {filter === 'all' ? '' : filter} schools found
                </div>
            ) : (
                <div className="dev-table-container">
                    <table className="dev-table">
                        <thead>
                            <tr>
                                <th>School Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Registered</th>
                                <th>Status</th>
                                <th>Actions</th>
                                <th>Password</th>
                            </tr>
                        </thead>


                        <tbody>
                            {filteredSchools.map(school => (
                                <tr key={school.id}>
                                    <td><strong>{school.name}</strong></td>
                                    <td>{school.email}</td>
                                    <td>{school.phone}</td>
                                    <td>{new Date(school.created_at).toLocaleDateString()}</td>
                                    <td>{getStatusBadge(school.status)}</td>
                                    <td>
                                        {school.status === 'pending' && (
                                            <div className="action-buttons">
                                                <button
                                                    className="verify-btn"
                                                    onClick={() => verifySchool(school.id)}
                                                    disabled={actionLoading === school.id}
                                                >
                                                    {actionLoading === school.id ? '...' : '✅ Verify'}
                                                </button>
                                                <button
                                                    className="reject-btn"
                                                    onClick={() => rejectSchool(school.id)}
                                                    disabled={actionLoading === school.id}
                                                >
                                                    {actionLoading === school.id ? '...' : '❌ Reject'}
                                                </button>
                                            </div>
                                        )}
                                        {school.status === 'active' && (
                                            <button
                                                className="reject-btn"
                                                onClick={() => deactivateSchool(school.id)}
                                                disabled={actionLoading === school.id}
                                            >
                                                {actionLoading === school.id ? '...' : '⛔ Stop'}
                                            </button>
                                        )}
                                        {school.status === 'deactivated' && (
                                            <button
                                                className="verify-btn"
                                                onClick={() => activateSchool(school.id)}
                                                disabled={actionLoading === school.id}
                                            >
                                                {actionLoading === school.id ? '...' : '✅ Activate'}
                                            </button>
                                        )}
                                        {school.status === 'rejected' && (
                                            <span className="status-text">Rejected</span>
                                        )}
                                    </td>
                                    <td>
                                        <button
                                            className="verify-btn"
                                            onClick={() => handleResetPassword(school.id, school.name)}
                                            disabled={actionLoading === school.id}
                                            style={{ backgroundColor: '#F59E0B', marginLeft: '5px' }}
                                        >
                                            🔑 Reset Pwd
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default DeveloperDashboard;
