import { useState, useEffect, useCallback } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './Login.css';

interface LoginProps {
    onLogin: (schoolName: string, token?: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [phone, setPhone] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fallback to env-based auth for offline/legacy mode
    const envUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@123';
    const defaultSchoolName = import.meta.env.VITE_SCHOOL_NAME || 'ScholarBase';

    const generateCaptcha = useCallback(() => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let result = '';
        for (let i = 0; i < 5; i++) {
            result += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        setCaptcha(result);
        setCaptchaInput('');
    }, []);

    useEffect(() => {
        generateCaptcha();
    }, [generateCaptcha]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (captchaInput.toUpperCase() !== captcha) {
            setError('Invalid captcha');
            generateCaptcha();
            return;
        }

        if (!email || !password) {
            setError('Enter credentials');
            return;
        }

        setIsLoading(true);

        // Try backend API first
        try {
            const response = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                if (response.status === 403) {
                    setError(data.detail || 'Account not verified');
                } else {
                    setError(data.detail || 'Login failed');
                }
                setIsLoading(false);
                generateCaptcha();
                return;
            }

            // Success - store token and login
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('accessToken', data.access_token);
            localStorage.setItem('schoolName', data.school.name);
            localStorage.setItem('schoolId', data.school.id);
            onLogin(data.school.name, data.access_token);

        } catch (networkError) {
            // Fallback to env-based login if backend is not available
            console.log('Backend not available, using fallback auth');

            if (email === envUsername && password === envPassword) {
                localStorage.setItem('isLoggedIn', 'true');
                localStorage.setItem('schoolName', defaultSchoolName);
                localStorage.setItem('schoolId', 'school_default');
                onLogin(defaultSchoolName);
            } else {
                setError('Invalid credentials');
                generateCaptcha();
            }
        }

        setIsLoading(false);
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (captchaInput.toUpperCase() !== captcha) {
            setError('Invalid captcha');
            generateCaptcha();
            return;
        }

        if (!schoolName || !email || !password || !phone) {
            setError('Please fill all required fields');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE}/api/auth/signup`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: schoolName,
                    email,
                    password,
                    phone
                })
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.detail || 'Registration failed');
                setIsLoading(false);
                generateCaptcha();
                return;
            }

            setSuccess(data.message || 'Registration successful! Please wait for verification.');
            setActiveTab('login');
            setSchoolName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setPhone('');
            generateCaptcha();

        } catch (networkError) {
            setError('Cannot connect to server. Please try again later.');
        }

        setIsLoading(false);
    };

    const handleBackToHome = () => {
        const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
        window.history.pushState({ path: newUrl }, '', newUrl);
        window.location.reload();
    };

    return (
        <div className="login-universe">
            {/* Animated Background */}
            <div className="login-bg">
                <div className="bg-gradient"></div>
                <div className="bg-grid"></div>
                <div className="starfield"></div>
                <div className="floating-shapes">
                    <div className="shape shape-1"></div>
                    <div className="shape shape-2"></div>
                    <div className="shape shape-3"></div>
                    <div className="shape shape-4"></div>
                </div>
            </div>

            {/* Back Button */}
            <button className="back-to-home" onClick={handleBackToHome}>
                <ArrowBackIcon /> Back to Home
            </button>

            {/* Login Card */}
            <div className="login-card">
                {/* Logo */}
                <div className="login-logo">
                    <div className="logo-icon">
                        <SchoolIcon style={{ fontSize: 32, color: 'white' }} />
                    </div>
                    <h1>ScholarBase</h1>
                </div>

                {/* Tab Switcher */}
                <div className="login-tabs">
                    <button
                        className={`tab ${activeTab === 'login' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}
                    >
                        Login
                    </button>
                    <button
                        className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('signup'); setError(''); setSuccess(''); }}
                    >
                        Create Account
                    </button>
                    <div className={`tab-indicator ${activeTab}`}></div>
                </div>

                {/* Login Form */}
                {activeTab === 'login' && (
                    <form onSubmit={handleLogin} className="login-form">
                        <div className="field">
                            <input
                                type="text"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email / Username"
                                autoComplete="email"
                            />
                        </div>

                        <div className="field">
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password"
                                autoComplete="current-password"
                            />
                        </div>

                        <div className="captcha-row">
                            <div className="captcha-box">
                                <span>{captcha}</span>
                                <button type="button" onClick={generateCaptcha}>↻</button>
                            </div>
                            <input
                                type="text"
                                value={captchaInput}
                                onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
                                placeholder="Enter code"
                                maxLength={5}
                            />
                        </div>

                        {error && <div className="error">{error}</div>}
                        {success && <div className="success">{success}</div>}

                        <button type="submit" className="submit-btn" disabled={isLoading}>
                            {isLoading ? <span className="loader"></span> : 'Sign In →'}
                        </button>
                    </form>
                )}

                {/* Signup Form */}
                {activeTab === 'signup' && (
                    <form onSubmit={handleSignup} className="login-form">
                        <div className="field">
                            <input
                                type="text"
                                value={schoolName}
                                onChange={e => setSchoolName(e.target.value)}
                                placeholder="School Name *"
                            />
                        </div>

                        <div className="field">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email Address *"
                                autoComplete="email"
                            />
                        </div>

                        <div className="field">
                            <input
                                type="tel"
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                placeholder="Phone Number *"
                            />
                        </div>

                        <div className="field">
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password (min 6 chars) *"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="field">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password *"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="captcha-row">
                            <div className="captcha-box">
                                <span>{captcha}</span>
                                <button type="button" onClick={generateCaptcha}>↻</button>
                            </div>
                            <input
                                type="text"
                                value={captchaInput}
                                onChange={e => setCaptchaInput(e.target.value.toUpperCase())}
                                placeholder="Enter code"
                                maxLength={5}
                            />
                        </div>

                        {error && <div className="error">{error}</div>}
                        {success && <div className="success">{success}</div>}

                        <button type="submit" className="submit-btn signup" disabled={isLoading}>
                            {isLoading ? <span className="loader"></span> : 'Create Account →'}
                        </button>
                    </form>
                )}

                <p className="footer">Powered by <strong>ScholarBase</strong></p>
            </div>
        </div>
    );
};

export default Login;
