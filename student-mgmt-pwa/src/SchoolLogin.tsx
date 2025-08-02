import React, { useState, useEffect, useCallback } from 'react';
import { Eye, EyeOff, School, User, Lock, RefreshCw, Shield } from 'lucide-react';


interface SchoolLoginProps {
  onLoginSuccess: (user: any, schoolInfo: any) => void;
  recaptchaSiteKey?: string;

}

function SchoolLogin(props: SchoolLoginProps) {
  const { onLoginSuccess } = props;
  const [schoolId, setSchoolId] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Custom Captcha State (replaces ReCAPTCHA for better UX)
  const [captchaText, setCaptchaText] = useState('');
  const [userCaptchaInput, setUserCaptchaInput] = useState('');
  const [captchaError, setCaptchaError] = useState('');
  const [timeLeft, setTimeLeft] = useState(45);

  // Generate random captcha
  const generateCaptcha = useCallback(() => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptchaText(result);
    setUserCaptchaInput('');
    setCaptchaError('');
    setTimeLeft(45);
  }, []);

  // Initialize captcha on component mount
  useEffect(() => {
    generateCaptcha();
  }, [generateCaptcha]);

  // Auto-refresh captcha every 45 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          generateCaptcha();
          return 45;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [generateCaptcha]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCaptchaError('');

    // Validate custom captcha (replaces ReCAPTCHA validation)
    if (userCaptchaInput.toLowerCase() !== captchaText.toLowerCase()) {
      setCaptchaError('Please verify you are not a robot.');
      generateCaptcha();
      return;
    }

    if (!schoolId || !username || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // Create a session ID for this captcha attempt
      const captchaSessionId = crypto.randomUUID();
      
      const res = await fetch('http://localhost:3001/api/auth/school-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ 
          schoolId, 
          username, 
          password,
          captchaSessionId,
          captchaText: userCaptchaInput
        })
      });
      const data = await res.json();
      if (res.ok && data.user) {
        // Store auth token and school info
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('schoolInfo', JSON.stringify(data.schoolInfo));
        localStorage.setItem('userData', JSON.stringify(data.user));
        onLoginSuccess(data.user, data.schoolInfo);
      } else {
        setError(data.error || 'Invalid credentials');
        generateCaptcha(); // Generate new captcha on failed login
      }
    } catch (err) {
      setError('Network error - please check if backend is running');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px',
        position: 'relative'
      }}
    >
      {/* Animated background elements */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'hidden', zIndex: 1 }}>
        <div style={{
          position: 'absolute',
          top: '-160px',
          right: '-160px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
          animation: 'float 6s ease-in-out infinite'
        }}></div>
        <div style={{
          position: 'absolute',
          bottom: '-160px',
          left: '-160px',
          width: '320px',
          height: '320px',
          borderRadius: '50%',
          background: 'linear-gradient(45deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))',
          animation: 'float 8s ease-in-out infinite reverse'
        }}></div>
      </div>

      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          minWidth: 0,
          margin: '0 auto',
          position: 'relative',
          zIndex: 2,
          boxSizing: 'border-box',
          paddingLeft: '8px',
          paddingRight: '8px',
        }}
      >
        {/* Login Card */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(20px)',
          borderRadius: '24px',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          overflow: 'hidden',
          transform: 'translateY(0)',
          transition: 'all 0.3s ease'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'translateY(-5px)';
          e.currentTarget.style.boxShadow = '0 35px 60px rgba(0, 0, 0, 0.3)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 25px 50px rgba(0, 0, 0, 0.25)';
        }}>
          
          {/* Header with AdminLTE styling */}
          <div style={{
            background: 'linear-gradient(135deg, #3c8dbc 0%, #367fa9 100%)',
            padding: '40px 30px',
            textAlign: 'center',
            position: 'relative',
            overflow: 'hidden'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(135deg, rgba(60,141,188,0.9) 0%, rgba(54,127,169,0.9) 100%)'
            }}></div>
            <div style={{ position: 'relative', zIndex: 10 }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '64px',
                height: '64px',
                background: 'rgba(255, 255, 255, 0.2)',
                borderRadius: '50%',
                marginBottom: '16px',
                backdropFilter: 'blur(10px)'
              }}>
                <School style={{ width: '32px', height: '32px', color: 'white' }} />
              </div>
              <div className="login-logo">
                <h1 style={{ 
                  color: 'white', 
                  fontSize: '28px', 
                  fontWeight: 'bold', 
                  margin: '0 0 8px 0',
                  textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                }}>
                  <b>School Admin</b> Login
                </h1>
                <p style={{ 
                  color: 'rgba(255,255,255,0.9)', 
                  fontSize: '14px', 
                  margin: 0,
                  textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                }}>
                  Sign in to your school account
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body login-card-body" style={{ padding: '40px 30px' }}>
              <form onSubmit={handleLogin}>
                {/* School ID Field */}
                <div className="input-group mb-3" style={{ marginBottom: '24px', position: 'relative' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>School ID</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter school ID"
                      value={schoolId}
                      onChange={e => setSchoolId(e.target.value)}
                      required
                      autoFocus
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(249, 250, 251, 0.5)',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                        e.target.style.background = 'white';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'rgba(249, 250, 251, 0.5)';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}>
                      <School style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
                    </div>
                  </div>
                </div>

                {/* Username Field */}
                <div className="input-group mb-3" style={{ marginBottom: '24px', position: 'relative' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>Username</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Enter username"
                      value={username}
                      onChange={e => setUsername(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 12px 12px 44px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(249, 250, 251, 0.5)',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                        e.target.style.background = 'white';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'rgba(249, 250, 251, 0.5)';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}>
                      <User style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
                    </div>
                  </div>
                </div>

                {/* Password Field */}
                <div className="input-group mb-3" style={{ marginBottom: '24px', position: 'relative' }}>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
                      placeholder="Enter password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 44px 12px 44px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(249, 250, 251, 0.5)',
                        transition: 'all 0.2s ease',
                        outline: 'none'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                        e.target.style.background = 'white';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'rgba(249, 250, 251, 0.5)';
                      }}
                    />
                    <div style={{
                      position: 'absolute',
                      left: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      pointerEvents: 'none'
                    }}>
                      <Lock style={{ width: '20px', height: '20px', color: '#9ca3af' }} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#9ca3af',
                        padding: '4px',
                        borderRadius: '4px',
                        transition: 'color 0.2s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#6b7280'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#9ca3af'}
                    >
                      {showPassword ? <EyeOff style={{ width: '20px', height: '20px' }} /> : <Eye style={{ width: '20px', height: '20px' }} />}
                    </button>
                  </div>
                </div>

                {/* Custom Captcha Section */}
                <div className="mb-3" style={{ marginBottom: '24px' }}>
                  <label style={{
                  fontSize: '14px',
                  fontWeight: '600',
                  color: '#374151',
                  marginBottom: '8px',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                    <Shield style={{ width: '16px', height: '16px' }} />
                    Security Verification
                  </label>
                  
                  {/* Captcha Display */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                    <div style={{
                      flex: 1,
                      background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                      borderRadius: '12px',
                      padding: '16px',
                      border: '2px dashed #d1d5db',
                      position: 'relative',
                      overflow: 'hidden'
                    }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(147, 51, 234, 0.05) 100%)'
                      }}></div>
                      <div style={{ position: 'relative', zIndex: 10, textAlign: 'center' }}>
                        <div style={{
                          fontSize: '24px',
                          fontWeight: 'bold',
                          color: '#374151',
                          letterSpacing: '4px',
                          fontFamily: 'monospace',
                          userSelect: 'none',
                          transform: 'rotate(1deg)',
                          display: 'inline-block'
                        }}>
                          {captchaText}
                        </div>
                        <div style={{
                          fontSize: '12px',
                          color: '#6b7280',
                          marginTop: '4px'
                        }}>
                          Auto-refresh in {timeLeft}s
                        </div>
                      </div>
                      {/* Noise lines */}
                      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.3 }}>
                        <div style={{
                          position: 'absolute',
                          top: '8px',
                          left: '16px',
                          width: '32px',
                          height: '2px',
                          background: '#3b82f6',
                          transform: 'rotate(45deg)'
                        }}></div>
                        <div style={{
                          position: 'absolute',
                          bottom: '16px',
                          right: '24px',
                          width: '24px',
                          height: '2px',
                          background: '#8b5cf6',
                          transform: 'rotate(-12deg)'
                        }}></div>
                        <div style={{
                          position: 'absolute',
                          top: '24px',
                          right: '32px',
                          width: '16px',
                          height: '2px',
                          background: '#6366f1',
                          transform: 'rotate(75deg)'
                        }}></div>
                      </div>
                    </div>
                    
                    <button
                      type="button"
                      onClick={generateCaptcha}
                      style={{
                        padding: '12px',
                        background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                        color: 'white',
                        borderRadius: '12px',
                        border: 'none',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)';
                        e.currentTarget.style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)';
                        e.currentTarget.style.transform = 'scale(1)';
                      }}
                      title="Refresh Captcha"
                    >
                      <RefreshCw style={{ width: '20px', height: '20px' }} />
                    </button>
                  </div>

                  {/* Captcha Input */}
                  <div style={{ position: 'relative' }}>
                    <input
                      type="text"
                      placeholder="Enter captcha code"
                      value={userCaptchaInput}
                      onChange={e => setUserCaptchaInput(e.target.value)}
                      required
                      maxLength={6}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        fontSize: '16px',
                        background: 'rgba(249, 250, 251, 0.5)',
                        transition: 'all 0.2s ease',
                        outline: 'none',
                        textAlign: 'center',
                        letterSpacing: '4px',
                        fontFamily: 'monospace'
                      }}
                      onFocus={(e) => {
                        e.target.style.borderColor = '#3b82f6';
                        e.target.style.boxShadow = '0 0 0 4px rgba(59, 130, 246, 0.1)';
                        e.target.style.background = 'white';
                      }}
                      onBlur={(e) => {
                        e.target.style.borderColor = '#e5e7eb';
                        e.target.style.boxShadow = 'none';
                        e.target.style.background = 'rgba(249, 250, 251, 0.5)';
                      }}
                    />
                  </div>
                </div>

                {/* Error Messages */}
                {captchaError && (
                  <div className="alert alert-danger py-2" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderLeft: '4px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    animation: 'shake 0.5s ease-in-out'
                  }}>
                    <div style={{ color: '#dc2626', fontSize: '14px' }}>{captchaError}</div>
                  </div>
                )}

                {error && (
                  <div className="alert alert-danger py-2" style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: 'none',
                    borderLeft: '4px solid #ef4444',
                    borderRadius: '8px',
                    padding: '12px 16px',
                    marginBottom: '16px',
                    animation: 'shake 0.5s ease-in-out'
                  }}>
                    <div style={{ color: '#dc2626', fontSize: '14px' }}>{error}</div>
                  </div>
                )}

                <div className="row">
                  <div className="col-12">
                    <button 
                      type="submit" 
                      className="btn btn-primary btn-block" 
                      disabled={loading}
                      style={{
                        width: '100%',
                        background: loading ? '#9ca3af' : 'linear-gradient(135deg, #3c8dbc 0%, #367fa9 100%)',
                        color: 'white',
                        padding: '16px 24px',
                        borderRadius: '12px',
                        fontSize: '18px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: loading ? 'not-allowed' : 'pointer',
                        boxShadow: '0 10px 20px rgba(60, 141, 188, 0.3)',
                        transition: 'all 0.3s ease',
                        position: 'relative',
                        overflow: 'hidden',
                        transform: 'scale(1)'
                      }}
                      onMouseEnter={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #337ab7 0%, #2e6da4 100%)';
                          e.currentTarget.style.transform = 'scale(1.02)';
                          e.currentTarget.style.boxShadow = '0 15px 25px rgba(60, 141, 188, 0.4)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!loading) {
                          e.currentTarget.style.background = 'linear-gradient(135deg, #3c8dbc 0%, #367fa9 100%)';
                          e.currentTarget.style.transform = 'scale(1)';
                          e.currentTarget.style.boxShadow = '0 10px 20px rgba(60, 141, 188, 0.3)';
                        }
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px' }}>
                        {loading ? (
                          <>
                            <div style={{
                              width: '20px',
                              height: '20px',
                              border: '2px solid rgba(255, 255, 255, 0.3)',
                              borderTop: '2px solid white',
                              borderRadius: '50%',
                              animation: 'spin 1s linear infinite'
                            }}></div>
                            <span>Signing In...</span>
                          </>
                        ) : (
                          <>
                            <Shield style={{ width: '20px', height: '20px' }} />
                            <span>Sign In</span>
                          </>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </form>

              {/* Footer */}
              <div style={{ marginTop: '32px', textAlign: 'center' }}>
                <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
                  🔒 Secure login with auto-refreshing captcha
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Security Info */}
        <div style={{ marginTop: '24px', textAlign: 'center' }}>
          <p style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '14px', margin: 0 }}>
            🔒 Your connection is secure and encrypted
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
      `}</style>
    </div>
  );
}

export { SchoolLogin };

