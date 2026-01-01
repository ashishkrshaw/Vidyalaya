import { useState, useEffect, useCallback } from 'react';
import './Login.css';

interface LoginProps {
    onLogin: (schoolName: string, token: string) => void;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [isSignup, setIsSignup] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [schoolName, setSchoolName] = useState('');
    const [phone, setPhone] = useState('');
    const [address, setAddress] = useState('');
    const [captchaInput, setCaptchaInput] = useState('');
    const [captcha, setCaptcha] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    // Fallback to env-based auth for offline/legacy mode
    const envUsername = import.meta.env.VITE_ADMIN_USERNAME || 'admin';
    const envPassword = import.meta.env.VITE_ADMIN_PASSWORD || 'Admin@123';
    const defaultSchoolName = import.meta.env.VITE_SCHOOL_NAME || 'School Management System';

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
                // Check for pending/rejected status
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
                onLogin(defaultSchoolName, '');
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
                    phone,
                    address: address || null
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
            setIsSignup(false);
            setSchoolName('');
            setEmail('');
            setPassword('');
            setPhone('');
            setAddress('');
            generateCaptcha();

        } catch (networkError) {
            setError('Cannot connect to server. Please try again later.');
        }

        setIsLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="brand">
                    <div className="brand-icon">🎓</div>
                    <h1>{defaultSchoolName}</h1>
                    <p>Streamline admissions, fees & student management</p>
                </div>
            </div>

            <div className="login-right">
                <form onSubmit={isSignup ? handleSignup : handleLogin} className="login-form">
                    <h2>{isSignup ? 'Register School' : 'Sign In'}</h2>

                    {isSignup && (
                        <>
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
                                    type="tel"
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    placeholder="Phone Number *"
                                />
                            </div>
                            <div className="field">
                                <input
                                    type="text"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    placeholder="Address (Optional)"
                                />
                            </div>
                        </>
                    )}

                    <div className="field">
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder={isSignup ? "Email *" : "Email"}
                            autoComplete="email"
                        />
                    </div>

                    <div className="field">
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            placeholder={isSignup ? "Password (min 6 chars) *" : "Password"}
                            autoComplete={isSignup ? "new-password" : "current-password"}
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
                        {isLoading ? <span className="loader"></span> : (isSignup ? 'Register →' : 'Sign In →')}
                    </button>

                    <div className="toggle-auth">
                        {isSignup ? (
                            <p>Already registered? <span onClick={() => { setIsSignup(false); setError(''); setSuccess(''); }}>Sign In</span></p>
                        ) : (
                            <p>New school? <span onClick={() => { setIsSignup(true); setError(''); setSuccess(''); }}>Register here</span></p>
                        )}
                    </div>

                    <p className="footer">Powered by <strong>Skooly</strong></p>
                </form>
            </div>
        </div>
    );
};

export default Login;
