import { useState, useEffect, useCallback } from 'react';
import './Login.css';

interface LoginProps {
    onLogin: (schoolName: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
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
            onLogin(schoolName);
        } else {
            setIsLoading(false);
            setError('Invalid credentials');
            generateCaptcha();
        }
    };

    return (
        <div className="login-page">
            <div className="login-left">
                <div className="brand">
                    <div className="brand-icon">🎓</div>
                    <h1>{schoolName}</h1>
                    <p>Streamline admissions, fees & student management</p>
                </div>
            </div>

            <div className="login-right">
                <form onSubmit={handleSubmit} className="login-form">
                    <h2>Sign In</h2>

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

                    <p className="footer">Powered by <strong>Skooly</strong></p>
                </form>
            </div>
        </div>
    );
};

export default Login;
