import { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, User, Lock, RefreshCw } from 'lucide-react';

interface SuperAdminLoginProps {
  onLoginSuccess: (user: any) => void;
}

const SuperAdminLogin = ({ onLoginSuccess }: SuperAdminLoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [captchaInput, setCaptchaInput] = useState('');
  const [captchaCode, setCaptchaCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Generate random CAPTCHA
  const generateCaptcha = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaCode(result);
    setCaptchaInput('');
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (captchaInput !== captchaCode) {
      setError('Invalid CAPTCHA. Please try again.');
      generateCaptcha();
      return;
    }
    
    setLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      if (username === '123' && password === '123') {
        onLoginSuccess({ username: 'superadmin', role: 'super_admin' });
      } else {
        setError('Invalid credentials. Use username: 123 and password: 123');
        generateCaptcha();
      }
      setLoading(false);
    }, 1000);
  };

  const containerStyle = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif'
  };

  const cardStyle = {
    background: 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    boxShadow: '0 25px 45px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.18)',
    width: '100%',
    maxWidth: '440px',
    overflow: 'hidden',
    animation: 'slideUp 0.6s ease-out'
  };

  const headerStyle = {
    background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    padding: '30px',
    textAlign: 'center' as const,
    color: 'white',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const headerOverlayStyle = {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)',
    animation: 'shimmer 3s infinite'
  };

  const formStyle = {
    padding: '40px 30px'
  };

  const inputGroupStyle = {
    position: 'relative' as const,
    marginBottom: '25px'
  };

  const iconStyle = {
    position: 'absolute' as const,
    left: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#6b7280',
    zIndex: 1
  };

  const inputStyle = {
    width: '100%',
    padding: '15px 15px 15px 45px',
    border: '2px solid #e5e7eb',
    borderRadius: '12px',
    fontSize: '16px',
    transition: 'all 0.3s ease',
    backgroundColor: '#f9fafb',
    outline: 'none',
    boxSizing: 'border-box' as const,
    color: '#000000'
  };

  const inputFocusStyle = {
    ...inputStyle,
    borderColor: '#4f46e5',
    backgroundColor: 'white',
    boxShadow: '0 0 0 3px rgba(79, 70, 229, 0.1)',
    color: '#000000'
  };

  const eyeButtonStyle = {
    position: 'absolute' as const,
    right: '15px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#6b7280',
    padding: '5px'
  };

  const captchaContainerStyle = {
    display: 'flex',
    gap: '15px',
    alignItems: 'center',
    marginBottom: '25px'
  };

  const captchaBoxStyle = {
    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
    border: '2px dashed #9ca3af',
    padding: '12px 20px',
    borderRadius: '8px',
    fontFamily: 'monospace',
    fontSize: '18px',
    fontWeight: 'bold',
    letterSpacing: '3px',
    color: '#374151',
    userSelect: 'none' as const,
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const refreshButtonStyle = {
    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    color: 'white',
    transition: 'all 0.3s ease',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const submitButtonStyle = {
    width: '100%',
    background: loading 
      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)'
      : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
    border: 'none',
    padding: '15px',
    borderRadius: '12px',
    color: 'white',
    fontSize: '16px',
    fontWeight: 'bold',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'all 0.3s ease',
    position: 'relative' as const,
    overflow: 'hidden'
  };

  const errorStyle = {
    background: 'linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%)',
    border: '1px solid #fca5a5',
    color: '#dc2626',
    padding: '12px 15px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
    animation: 'shake 0.5s ease-in-out'
  };

  return (
    <>
      <style>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .loading-spinner {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: white;
          animation: spin 1s linear infinite;
        }
      `}</style>
      
      <div style={containerStyle}>
        <div style={cardStyle}>
          {/* Header */}
          <div style={headerStyle}>
            <div style={headerOverlayStyle}></div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Shield size={48} style={{ marginBottom: '15px' }} />
              <h2 style={{ margin: 0, fontSize: '28px', fontWeight: 'bold' }}>
                Super Admin
              </h2>
              <p style={{ margin: '8px 0 0', opacity: 0.9, fontSize: '16px' }}>
                Secure Access Portal
              </p>
            </div>
          </div>

          {/* Form */}
          <div style={formStyle}>
            <div onSubmit={handleLogin}>
              {/* Username */}
              <div style={inputGroupStyle}>
                <User size={20} style={iconStyle} />
                <input
                  type="text"
                  placeholder="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </div>

              {/* Password */}
              <div style={inputGroupStyle}>
                <Lock size={20} style={iconStyle} />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
                <button
                  type="button"
                  style={eyeButtonStyle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* CAPTCHA */}
              <div style={captchaContainerStyle}>
                <div style={captchaBoxStyle}>
                  {captchaCode}
                </div>
                <button
                  type="button"
                  style={refreshButtonStyle}
                  onClick={generateCaptcha}
                  title="Refresh CAPTCHA"
                >
                  <RefreshCw size={16} />
                </button>
              </div>

              {/* CAPTCHA Input */}
              <div style={inputGroupStyle}>
                <input
                  type="text"
                  placeholder="Enter CAPTCHA code"
                  value={captchaInput}
                  onChange={(e) => setCaptchaInput(e.target.value)}
                  required
                  style={inputStyle}
                  onFocus={(e) => Object.assign(e.target.style, inputFocusStyle)}
                  onBlur={(e) => Object.assign(e.target.style, inputStyle)}
                />
              </div>

              {/* Error Message */}
              {error && (
                <div style={errorStyle}>
                  {error}
                </div>
              )}

              {/* Submit Button */}
              <button
                type="button"
                onClick={handleLogin}
                disabled={loading}
                style={submitButtonStyle}
                onMouseEnter={(e) => {
                  if (!loading) {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 10px 25px rgba(79, 70, 229, 0.3)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {loading ? (
                  <div className="loading-spinner"></div>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>

            {/* Demo Credentials */}
            <div style={{
              marginTop: '25px',
              padding: '15px',
              background: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)',
              borderRadius: '8px',
              fontSize: '14px',
              color: '#0369a1',
              textAlign: 'center' as const
            }}>
              <strong>Demo Credentials:</strong><br />
              Username: 123 | Password: 123
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SuperAdminLogin;