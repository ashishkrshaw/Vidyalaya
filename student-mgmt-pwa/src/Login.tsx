import { useState, useEffect, useCallback } from 'react';
import SchoolIcon from '@mui/icons-material/School';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import DescriptionIcon from '@mui/icons-material/Description';
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
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [termsModalOpen, setTermsModalOpen] = useState(false);

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

        if (!termsAccepted) {
            setError('Please accept the Terms & Conditions to continue');
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
        // If this tab was opened from landing page, close it to return to landing
        // Otherwise, navigate to the landing page
        if (window.opener) {
            window.close();
        } else {
            // Fallback: navigate to landing page (remove ?view=login)
            const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
            window.location.href = newUrl;
        }
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

                        <div className="terms-checkbox">
                            <label className="checkbox-container">
                                <input
                                    type="checkbox"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                />
                                <span className="checkmark"></span>
                                <span className="checkbox-text">
                                    I accept the{' '}
                                    <button
                                        type="button"
                                        className="terms-link"
                                        onClick={() => setTermsModalOpen(true)}
                                    >
                                        Terms & Conditions
                                    </button>
                                </span>
                            </label>
                        </div>

                        {error && <div className="error">{error}</div>}
                        {success && <div className="success">{success}</div>}

                        <button type="submit" className="submit-btn signup" disabled={isLoading || !termsAccepted}>
                            {isLoading ? <span className="loader"></span> : 'Create Account →'}
                        </button>
                    </form>
                )}

                <p className="footer">Powered by <strong>ScholarBase</strong></p>
            </div>

            {/* Terms and Conditions Modal */}
            {termsModalOpen && (
                <div className="terms-modal-overlay" onClick={() => setTermsModalOpen(false)}>
                    <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close-btn" onClick={() => setTermsModalOpen(false)}>
                            <CloseIcon />
                        </button>

                        <div className="modal-header">
                            <div className="modal-icon">
                                <DescriptionIcon />
                            </div>
                            <h2>Terms & Conditions</h2>
                            <p>Last updated: January 2026</p>
                        </div>

                        <div className="terms-modal-content">
                            <div className="terms-section">
                                <h3>1. Welcome to ScholarBase</h3>
                                <p>
                                    Thank you for choosing ScholarBase! By joining our platform, you become part of
                                    India's growing community of modern educational institutions. These terms ensure
                                    a seamless and secure experience for everyone.
                                </p>
                            </div>

                            <div className="terms-section">
                                <h3>2. What We Offer You</h3>
                                <p>ScholarBase empowers your institution with:</p>
                                <ul>
                                    <li>✨ Intuitive student record management</li>
                                    <li>💳 Hassle-free fee collection</li>
                                    <li>📱 Automated SMS and email notifications</li>
                                    <li>📄 Professional receipt generation</li>
                                    <li>📊 Powerful analytics and insights</li>
                                </ul>
                            </div>

                            <div className="terms-section">
                                <h3>3. Our Partnership Together</h3>
                                <p>To ensure the best experience, we kindly ask that you:</p>
                                <ul>
                                    <li>Share accurate information so we can serve you better</li>
                                    <li>Keep your login credentials secure for your protection</li>
                                    <li>Use our platform to enhance your school's operations</li>
                                    <li>Reach out to our support team whenever you need help</li>
                                </ul>
                            </div>

                            <div className="terms-section">
                                <h3>4. Your Data, Your Control</h3>
                                <p>
                                    <strong>Your data belongs entirely to you.</strong> All student records and institutional
                                    data remain 100% under your ownership. We never share or sell your information.
                                    Your trust is our priority, protected with bank-grade 256-bit encryption.
                                </p>
                            </div>

                            <div className="terms-section">
                                <h3>5. Our Commitment to Reliability</h3>
                                <p>We understand your school depends on us. That's why we:</p>
                                <ul>
                                    <li>Maintain 99.9% uptime for seamless operations</li>
                                    <li>Notify you in advance of any scheduled improvements</li>
                                    <li>Continuously enhance features based on your feedback</li>
                                    <li>Provide dedicated support to resolve concerns quickly</li>
                                </ul>
                            </div>

                            <div className="terms-section">
                                <h3>6. Flexible & Transparent Pricing</h3>
                                <p>We believe in complete transparency:</p>
                                <ul>
                                    <li>Choose flexible monthly or discounted yearly plans</li>
                                    <li>Start with our free tier to explore the platform</li>
                                    <li>Upgrade or downgrade anytime based on your needs</li>
                                    <li>Receive 30-day advance notice for any pricing updates</li>
                                </ul>
                            </div>

                            <div className="terms-section">
                                <h3>7. Innovation & Excellence</h3>
                                <p>
                                    ScholarBase is built with cutting-edge technology. We continuously innovate to
                                    bring you new features, improved performance, and enhanced security designed
                                    for Indian schools.
                                </p>
                            </div>

                            <div className="terms-section">
                                <h3>8. Our Promise to You</h3>
                                <p>
                                    We are fully committed to delivering a reliable service. Your satisfaction and
                                    success remain our top priority. We work tirelessly to ensure you receive the
                                    value you deserve.
                                </p>
                            </div>

                            <div className="terms-section">
                                <h3>9. Freedom & Flexibility</h3>
                                <p>You have complete control over your subscription:</p>
                                <ul>
                                    <li>Cancel anytime with no questions asked</li>
                                    <li>Export all your data easily within 30 days</li>
                                    <li>Keep access until your current billing period ends</li>
                                    <li>Return anytime – we'll welcome you back!</li>
                                </ul>
                            </div>

                            <div className="terms-section">
                                <h3>10. Legal Framework</h3>
                                <p>
                                    These terms are governed by the laws of India, ensuring your rights are protected
                                    under established legal frameworks.
                                </p>
                            </div>

                            <div className="terms-section">
                                <h3>11. We're Here for You</h3>
                                <p>
                                    Have questions? Our friendly support team is always ready to help!
                                    Reach out at <strong>aryanshashi31@gmail.com</strong> – we typically respond
                                    within 24 hours.
                                </p>
                            </div>
                        </div>

                        <div className="terms-modal-footer">
                            <button
                                className="accept-terms-btn"
                                onClick={() => {
                                    setTermsAccepted(true);
                                    setTermsModalOpen(false);
                                }}
                            >
                                I Accept Terms & Conditions
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Login;
