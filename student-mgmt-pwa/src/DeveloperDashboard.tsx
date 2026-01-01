import { useState, useEffect } from 'react';
import './DeveloperDashboard.css';

interface School {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    status: 'pending' | 'active' | 'rejected';
    created_at: string;
    verified_at?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const DeveloperDashboard: React.FC = () => {
    const [schools, setSchools] = useState<School[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [secret, setSecret] = useState('');
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('pending');
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const authenticate = () => {
        if (secret) {
            localStorage.setItem('developerSecret', secret);
            setIsAuthenticated(true);
            fetchSchools();
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
                if (response.status === 401) {
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
            rejected: '#DE350B'
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
                                            <span className="status-text">Verified ✓</span>
                                        )}
                                        {school.status === 'rejected' && (
                                            <span className="status-text">Rejected</span>
                                        )}
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
