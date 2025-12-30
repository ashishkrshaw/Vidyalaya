import { useState, useEffect, useCallback } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import './Login.css';

interface LoginProps {
    onLogin: (schoolName: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [email, setEmail] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const schoolName = import.meta.env.VITE_SCHOOL_NAME || 'School Management System';
    const envUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@123';

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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (captchaInput.toUpperCase() !== captcha) {
            setError('Invalid captcha');
            generateCaptcha();
            return;
        }

        if (!username || !password) {
            setError('Enter credentials');
            return;
        }

        setIsLoading(true);
        await new Promise(r => setTimeout(r, 800));

        if (username === envUsername && password === envPassword) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('schoolName', schoolName);
            localStorage.setItem('schoolId', 'school_default');
            onLogin(schoolName);
        } else {
            setIsLoading(false);
            setError('Invalid credentials');
            generateCaptcha();
        }
    };

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!username || !email || !password || !confirmPassword) {
            setError('All fields are required');
            return;
        }

        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        if (captchaInput.toUpperCase() !== captcha) {
            setError('Invalid captcha');
            generateCaptcha();
            return;
        }

        setIsLoading(true);
        await new Promise(r => setTimeout(r, 1000));
        setIsLoading(false);
        setError('Registration feature coming soon! Please use admin login.');
        generateCaptcha();
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
                        onClick={() => { setActiveTab('login'); setError(''); }}
                    >
                        Login
                    </button>
                    <button
                        className={`tab ${activeTab === 'signup' ? 'active' : ''}`}
                        onClick={() => { setActiveTab('signup'); setError(''); }}
                    >
                        Create Account
                    </button>
                    <div className={`tab-indicator ${activeTab}`}></div>
                </div>

                {/* Login Form */}
                {activeTab === 'login' && (
                    <form onSubmit={handleSubmit} className="login-form">
                        <div className="field">
                            <input
                                type="text"
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Username"
                                autoComplete="username"
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
                                value={username}
                                onChange={e => setUsername(e.target.value)}
                                placeholder="Username"
                                autoComplete="username"
                            />
                        </div>

                        <div className="field">
                            <input
                                type="email"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                placeholder="Email Address"
                                autoComplete="email"
                            />
                        </div>

                        <div className="field">
                            <input
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                placeholder="Password"
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="field">
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm Password"
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
