import { useState, useEffect } from 'react';


// Mock data - replace with your actual Schools data
const schools = [
  { username: 'admin', password: 'admin123', schoolName: 'Green Valley School' },
  { username: 'demo', password: 'demo123', schoolName: 'Sunrise Academy' }
];

const drawerWidth = 260;

function generateStudentId(schoolName, year, rollNo, seq) {
  const firstLetter = schoolName[0].toUpperCase();
  const yr = String(year).slice(-2);
  const rno = rollNo.toString().padStart(2, '0');
  const last4 = seq.toString().padStart(4, '0');
  return `${firstLetter}${yr}-${rno}-${last4}`;
}

function generateCaptcha(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < length; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}

// Simple Button Component
const Button = ({ children, onClick, variant = 'default', disabled = false, className = '' }) => {
  const baseStyle = {
    padding: '12px 24px',
    borderRadius: '15px',
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s ease',
    opacity: disabled ? 0.6 : 1
  };

  const variantStyles = {
    default: {
      background: 'rgba(255, 255, 255, 0.2)',
      color: '#fff',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    primary: {
      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
      color: '#fff',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)'
    }
  };

  return (
    <button
      style={{ ...baseStyle, ...variantStyles[variant] }}
      onClick={onClick}
      disabled={disabled}
      className={className}
      onMouseOver={(e) => {
        if (!disabled) {
          e.target.style.transform = 'translateY(-2px)';
          e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.6)';
        }
      }}
      onMouseOut={(e) => {
        if (!disabled) {
          e.target.style.transform = 'translateY(0)';
          e.target.style.boxShadow = variantStyles[variant].boxShadow || 'none';
        }
      }}
    >
      {children}
    </button>
  );
};

// Input Component
const Input = ({ type = 'text', placeholder, value, onChange, label, error, className = '' }) => {
  return (
    <div style={{ marginBottom: '16px' }}>
      {label && (
        <label style={{
          display: 'block',
          marginBottom: '8px',
          color: 'rgba(255, 255, 255, 0.9)',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {label}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: '12px',
          border: error ? '1px solid #ff6b6b' : '1px solid rgba(255, 255, 255, 0.3)',
          background: 'rgba(255, 255, 255, 0.1)',
          color: '#fff',
          fontSize: '14px',
          outline: 'none',
          transition: 'all 0.3s ease',
          backdropFilter: 'blur(10px)',
          boxSizing: 'border-box'
        }}
        onFocus={(e) => {
          e.target.style.border = '1px solid #fff';
          e.target.style.boxShadow = '0 0 0 2px rgba(255, 255, 255, 0.2)';
        }}
        onBlur={(e) => {
          e.target.style.border = error ? '1px solid #ff6b6b' : '1px solid rgba(255, 255, 255, 0.3)';
          e.target.style.boxShadow = 'none';
        }}
        className={className}
      />
      {error && (
        <div style={{
          color: '#ff6b6b',
          fontSize: '12px',
          marginTop: '4px'
        }}>
          {error}
        </div>
      )}
    </div>
  );
};

// Card Component
const Card = ({ children, className = '', style = {} }) => {
  return (
    <div
      style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '25px',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        padding: '32px',
        ...style
      }}
      className={className}
    >
      {children}
    </div>
  );
};

// Modal Component
const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.25)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        borderRadius: '20px',
        boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
        maxWidth: '500px',
        width: '100%',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        {title && (
          <div style={{
            padding: '20px 24px 0',
            fontSize: '18px',
            fontWeight: '600',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            🔒 {title}
          </div>
        )}
        <div style={{ padding: '20px 24px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};

// Menu Item Component
const MenuItem = ({ icon, label, isActive, onClick }) => {
  return (
    <div
      style={{
        borderRadius: '12px',
        margin: '4px 8px',
        padding: '12px 16px',
        cursor: 'pointer',
        background: isActive
          ? 'rgba(255, 255, 255, 0.25)'
          : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.18)',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        color: '#fff'
      }}
      onClick={onClick}
      onMouseOver={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.2)';
        e.target.style.transform = 'translateX(5px)';
      }}
      onMouseOut={(e) => {
        e.target.style.background = isActive
          ? 'rgba(255, 255, 255, 0.25)'
          : 'rgba(255, 255, 255, 0.05)';
        e.target.style.transform = 'translateX(0)';
      }}
    >
      <span style={{ fontSize: '18px' }}>{icon}</span>
      <span style={{
        fontWeight: isActive ? '600' : '400',
        fontSize: '14px'
      }}>
        {label}
      </span>
    </div>
  );
};

// Simple Form Component
const AdmissionForm = ({ onSubmit }) => {
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    class: '1',
    section: 'A',
    dob: '',
    address: '',
    phone: '',
    email: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <form onSubmit={handleSubmit} style={{ color: '#fff' }}>
      <Input
        label="Student Name *"
        value={formData.studentName}
        onChange={(e) => handleChange('studentName', e.target.value)}
        placeholder="Enter student name"
      />
      
      <Input
        label="Father's Name *"
        value={formData.fatherName}
        onChange={(e) => handleChange('fatherName', e.target.value)}
        placeholder="Enter father's name"
      />
      
      <Input
        label="Mother's Name"
        value={formData.motherName}
        onChange={(e) => handleChange('motherName', e.target.value)}
        placeholder="Enter mother's name"
      />

      <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Class *
          </label>
          <select
            value={formData.class}
            onChange={(e) => handleChange('class', e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              boxSizing: 'border-box'
            }}
          >
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(num => (
              <option key={num} value={num} style={{ background: '#333', color: '#fff' }}>
                {num}
              </option>
            ))}
          </select>
        </div>
        
        <div style={{ flex: 1 }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            color: 'rgba(255, 255, 255, 0.9)',
            fontSize: '14px',
            fontWeight: '500'
          }}>
            Section *
          </label>
          <select
            value={formData.section}
            onChange={(e) => handleChange('section', e.target.value)}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: '12px',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              background: 'rgba(255, 255, 255, 0.1)',
              color: '#fff',
              fontSize: '14px',
              outline: 'none',
              backdropFilter: 'blur(10px)',
              boxSizing: 'border-box'
            }}
          >
            {['A','B','C','D','E'].map(letter => (
              <option key={letter} value={letter} style={{ background: '#333', color: '#fff' }}>
                {letter}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Input
        type="date"
        label="Date of Birth *"
        value={formData.dob}
        onChange={(e) => handleChange('dob', e.target.value)}
      />
      
      <Input
        label="Address"
        value={formData.address}
        onChange={(e) => handleChange('address', e.target.value)}
        placeholder="Enter address"
      />
      
      <Input
        type="tel"
        label="Phone Number"
        value={formData.phone}
        onChange={(e) => handleChange('phone', e.target.value)}
        placeholder="Enter phone number"
      />
      
      <Input
        type="email"
        label="Email"
        value={formData.email}
        onChange={(e) => handleChange('email', e.target.value)}
        placeholder="Enter email address"
      />

      <Button
        type="submit"
        variant="primary"
        style={{ width: '100%', marginTop: '16px' }}
        disabled={!formData.studentName || !formData.fatherName || !formData.class || !formData.section || !formData.dob}
      >
        Preview Admission
      </Button>
    </form>
  );
};

function App() {
  const [menu, setMenu] = useState('student');
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [previewData, setPreviewData] = useState(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [username, setUsername] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const timer = setInterval(() => {
      setCaptcha(generateCaptcha());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const getNextRollNo = async (cls, section) => {
    // Mock function - replace with your actual logic
    return Math.floor(Math.random() * 50) + 1;
  };

  const handlePreview = async (data) => {
    const year = new Date().getFullYear();
    const rollNo = await getNextRollNo(data.class, data.section);
    const seq = Math.floor(Math.random() * 9999) + 1;
    const studentId = generateStudentId(schoolName, year, rollNo, seq);

    setPreviewData({ ...data, rollNo, studentId });
    setConfirmOpen(true);
  };

  const handleConfirm = async () => {
    // Mock function - replace with your actual database logic
    console.log('Adding admission:', previewData);
    setSuccessMsg(`Success! New admission added. Student ID: ${previewData.studentId}`);
    setConfirmOpen(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogin = () => {
    if (captchaInput.trim() !== captcha) {
      setLoginError('Captcha does not match.');
      return;
    }

    const found = schools.find((s) =>
      s.username.toLowerCase() === username.trim().toLowerCase() &&
      s.password === loginPassword
    );

    if (found) {
      setLoggedIn(true);
      setSchoolName(found.schoolName);
      setLoginPassword('');
      setLoginError('');
      setCaptchaInput('');
      setUsername('');
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  const menuItems = [
    { key: 'student', label: 'New Admission', icon: '👨‍🎓' },
    { key: 'show', label: 'Show Student', icon: '🔍' },
    { key: 'history', label: 'History', icon: '📚' },
    { key: 'updateDelete', label: 'Update/Delete Student', icon: '✏️' },
    { key: 'fee', label: 'Fee Management', icon: '💰' },
    { key: 'settings', label: 'Academic Settings', icon: '⚙️' },
  ];

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
      backgroundSize: '400% 400%',
      animation: 'gradientShift 15s ease infinite',
      display: 'flex'
    }}>
      <style>
        {`
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          .fade-in {
            animation: fadeIn 0.6s ease-out;
          }
        `}
      </style>

      {/* Login Modal */}
      <Modal isOpen={!loggedIn} title="Login Required">
        <div style={{ color: '#fff', textAlign: 'center', marginBottom: '24px' }}>
          <p style={{ margin: 0, opacity: 0.9 }}>
            Enter profile password to access the app.
          </p>
        </div>
        
        <Input
          label="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Enter username"
        />
        
        <Input
          type="password"
          label="Password"
          value={loginPassword}
          onChange={(e) => setLoginPassword(e.target.value)}
          placeholder="Enter password"
          error={loginError}
        />
        
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginTop: '16px',
          marginBottom: '8px',
          gap: '16px'
        }}>
          <div style={{
            padding: '12px 24px',
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '10px',
            fontWeight: '700',
            letterSpacing: '2px',
            color: '#fff',
            fontSize: '18px'
          }}>
            {captcha}
          </div>
          <Button onClick={() => setCaptcha(generateCaptcha())}>
            Refresh
          </Button>
        </div>
        
        <Input
          label="Enter Captcha"
          value={captchaInput}
          onChange={(e) => setCaptchaInput(e.target.value)}
          placeholder="Enter the captcha above"
        />
        
        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <Button variant="primary" onClick={handleLogin}>
            Login
          </Button>
        </div>
        
        <div style={{ textAlign: 'center', marginTop: '24px', opacity: 0.6, fontSize: '12px', color: '#fff' }}>
          © All rights reserved | ASK Ltd
        </div>
      </Modal>

      {/* Main App */}
      {loggedIn && (
        <div style={{ display: 'flex', width: '100%' }} className="fade-in">
          {/* Header */}
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: '70px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 24px',
            zIndex: 100
          }}>
            <span style={{ fontSize: '24px', marginRight: '12px' }}>🏫</span>
            <h1 style={{
              margin: 0,
              color: '#fff',
              fontWeight: '700',
              letterSpacing: '1px',
              textShadow: '0 2px 4px rgba(0,0,0,0.3)'
            }}>
              {schoolName}
            </h1>
          </div>

          {/* Sidebar */}
          <div style={{
            width: `${drawerWidth}px`,
            height: '100vh',
            position: 'fixed',
            left: 0,
            top: 0,
            paddingTop: '70px',
            background: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            color: '#fff',
            overflow: 'auto'
          }}>
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              padding: '24px 0',
              borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
              <div style={{
                width: '70px',
                height: '70px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '28px',
                marginBottom: '12px',
                border: '2px solid rgba(255, 255, 255, 0.3)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)'
              }}>
                🏫
              </div>
              <h3 style={{
                margin: 0,
                color: '#fff',
                fontWeight: '700',
                textAlign: 'center',
                padding: '0 16px'
              }}>
                {schoolName}
              </h3>
            </div>

            <div style={{ padding: '16px 0' }}>
              {menuItems.map((item) => (
                <MenuItem
                  key={item.key}
                  icon={item.icon}
                  label={item.label}
                  isActive={menu === item.key}
                  onClick={() => setMenu(item.key)}
                />
              ))}
            </div>
          </div>

          {/* Main Content */}
          <div style={{
            marginLeft: `${drawerWidth}px`,
            paddingTop: '70px',
            padding: '100px 32px 32px',
            width: `calc(100% - ${drawerWidth}px)`,
            minHeight: '100vh',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <div style={{ width: '100%', maxWidth: '800px' }}>
              {menu === 'student' && (
                <Card className="fade-in">
                  <h2 style={{
                    color: '#fff',
                    fontWeight: '700',
                    textAlign: 'center',
                    margin: '0 0 32px 0',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}>
                    New Admission
                  </h2>
                  <AdmissionForm onSubmit={handlePreview} />
                </Card>
              )}
              
              {menu === 'show' && (
                <Card className="fade-in">
                  <h2 style={{
                    color: '#fff',
                    fontWeight: '700',
                    textAlign: 'center',
                    margin: '0 0 32px 0'
                  }}>
                    Show Student
                  </h2>
                  <p style={{ color: '#fff', textAlign: 'center', opacity: 0.8 }}>
                    Student search functionality will be implemented here.
                  </p>
                </Card>
              )}
              
              {menu === 'history' && (
                <Card className="fade-in">
                  <h2 style={{
                    color: '#fff',
                    fontWeight: '700',
                    textAlign: 'center',
                    margin: '0 0 32px 0'
                  }}>
                    History
                  </h2>
                  <p style={{ color: '#fff', textAlign: 'center', opacity: 0.8 }}>
                    History section will be implemented here.
                  </p>
                </Card>
              )}
              
              {menu === 'updateDelete' && (
                <Card className="fade-in">
                  <h2 style={{
                    color: '#fff',
                    fontWeight: '700',
                    textAlign: 'center',
                    margin: '0 0 32px 0'
                  }}>
                    Update/Delete Student
                  </h2>
                  <p style={{ color: '#fff', textAlign: 'center', opacity: 0.8 }}>
                    Update and delete functionality will be implemented here.
                  </p>
                </Card>
              )}
              
              {menu === 'fee' && (
                <Card className="fade-in">
                  <h2 style={{
                    color: '#fff',
                    fontWeight: '700',
                    textAlign: 'center',
                    margin: '0 0 32px 0'
                  }}>
                    Fee Management
                  </h2>
                  <p style={{ color: '#fff', textAlign: 'center', opacity: 0.8 }}>
                    Fee management functionality will be implemented here.
                  </p>
                </Card>
              )}
              
              {menu === 'settings' && (
                <Card className="fade-in">
                  <h2 style={{
                    color: '#fff',
                    fontWeight: '700',
                    textAlign: 'center',
                    margin: '0 0 32px 0'
                  }}>
                    Academic Settings
                  </h2>
                  <p style={{ color: '#fff', textAlign: 'center', opacity: 0.8 }}>
                    Academic settings will be implemented here.
                  </p>
                </Card>
              )}
            </div>
          </div>

          {/* Preview Modal */}
          <Modal
            isOpen={confirmOpen}
            onClose={() => setConfirmOpen(false)}
            title="Confirm Admission"
          >
            {previewData && (
              <div>
                <div style={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  marginBottom: '24px'
                }}>
                  <pre style={{
                    color: '#fff',
                    fontSize: '14px',
                    margin: 0,
                    fontFamily: 'monospace',
                    whiteSpace: 'pre-wrap'
                  }}>
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </div>
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center'
                }}>
                  <Button onClick={() => setConfirmOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" onClick={handleConfirm}>
                    Confirm
                  </Button>
                </div>
              </div>
            )}
          </Modal>

          {/* Success Message */}
          {successMsg && (
            <div style={{
              position: 'fixed',
              top: '100px',
              right: '32px',
              background: 'rgba(76, 175, 80, 0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(76, 175, 80, 0.3)',
              borderRadius: '15px',
              color: '#4caf50',
              padding: '16px 24px',
              fontWeight: '600',
              boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
              zIndex: 1000,
              maxWidth: '400px'
            }} className="fade-in">
              {successMsg}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default App;

const drawerWidth = 260;

// You can change this to your actual school name

function generateStudentId(schoolName: string, year: number, rollNo: number, seq: number) {
  const firstLetter = schoolName[0].toUpperCase();
  const yr = String(year).slice(-2);
  const rno = rollNo.toString().padStart(2, '0');
  const last4 = seq.toString().padStart(4, '0');
  return `${firstLetter}${yr}-${rno}-${last4}`;
}
// Random alphanumeric captcha
function generateCaptcha(length: number = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let captcha = '';
  for (let i = 0; i < length; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}


function App() {
  // --- replace the state block inside App() with this ---
  const [menu, setMenu] = useState<'student' | 'show' | 'history' | 'updateDelete' | 'settings' | 'fee'>('student');
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [username, setUsername] = useState('');      // <-- NEW: username for login input
  const [schoolName, setSchoolName] = useState('');  // displayed across the app (AppBar, sidebar)
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');


  // Get next available roll number for class-section from IndexedDB
  const getNextRollNo = async (cls: string, section: string): Promise<number> => {
    const admissions = await getAdmissionsByClassSection(cls, section);
    const used = admissions.map((a: any) => Number(a.rollNo));
    for (let i = 1; i <= 50; i++) {
      if (!used.includes(i)) return i;
    }
    return 0;
  };


  // inside App()
  useEffect(() => {
    const timer = setInterval(() => {
      setCaptcha(generateCaptcha());
    }, 30000); // 20 seconds
    return () => clearInterval(timer);
  }, []);


  // Preview handler: get next student sequence and generate studentId
  const handlePreview = async (data: any) => {
    const year = new Date().getFullYear();
    const rollNo = await getNextRollNo(data.class, data.section);
    const seq = await getNextStudentSeq();
    const studentId = generateStudentId(schoolName, year, rollNo, seq);

    setPreviewData({ ...data, rollNo, studentId });
    setConfirmOpen(true);
  };

  // Confirm handler: store admission in IndexedDB
  const handleConfirm = async () => {
    await addAdmission(previewData);
    setSuccessMsg(`Success! New admission added. Student ID: ${previewData.studentId}`);
    setConfirmOpen(false);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleLogin = () => {
    // captcha check first
    if (captchaInput.trim() !== captcha) {
      setLoginError('Captcha does not match.');
      return;
    }

    // Find by username (case-insensitive for username)
    const found = schools.find((s: School) =>
      s.username.toLowerCase() === username.trim().toLowerCase() &&
      s.password === loginPassword
    );


    if (found) {
      // Set logged in and set the display school name from the found record
      setLoggedIn(true);
      setSchoolName(found.schoolName);   // <-- this ensures AppBar / sidebar show the correct schoolName
      setLoginPassword('');
      setLoginError('');
      setCaptchaInput('');
      setUsername('');                    // optional: clear username field
    } else {
      setLoginError('Invalid username or password.');
    }
  };


  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #f5576c 75%, #4facfe 100%)',
        backgroundSize: '400% 400%',
        animation: 'gradientShift 15s ease infinite',
        '@keyframes gradientShift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' }
        }
      }}
    >
      <CssBaseline />

      {/* Login Dialog */}
      <Dialog
        open={!loggedIn}
        disableEscapeKeyDown
        PaperProps={{
          sx: {
            background: 'rgba(255, 255, 255, 0.25)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255, 255, 255, 0.18)',
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
          }
        }}
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: '#fff',
          textAlign: 'center'
        }}>
          <LockIcon sx={{ color: '#fff' }} /> Login Required
        </DialogTitle>
        <DialogContent sx={{ minWidth: 350 }}>
          <Typography sx={{ mb: 3, color: '#fff', textAlign: 'center', opacity: 0.9 }}>
            Enter profile password to access the app.
          </Typography>
          <TextField
            label="Username"
            value={username}
            onChange={e => setUsername(e.target.value)}
            fullWidth
            autoFocus
            sx={{
              mb: 2,
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#fff' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiInputBase-input': { color: '#fff' }
            }}
          />

          <TextField
            label="Password"
            type="password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            fullWidth
            onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
            error={!!loginError}
            helperText={loginError}
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#fff' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiInputBase-input': { color: '#fff' },
              '& .MuiFormHelperText-root': { color: '#ff6b6b' }
            }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
            <Box
              sx={{
                p: 1.5,
                px: 3,
                bgcolor: 'rgba(255,255,255,0.2)',
                borderRadius: '10px',
                fontWeight: 700,
                letterSpacing: 2,
                color: '#fff',
                fontSize: '1.2rem'
              }}
            >
              {captcha}
            </Box>
            <Button onClick={() => setCaptcha(generateCaptcha())} sx={{ ml: 2, color: '#fff' }}>
              Refresh
            </Button>
          </Box>
          <TextField
            label="Enter Captcha"
            value={captchaInput}
            onChange={e => setCaptchaInput(e.target.value)}
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                background: 'rgba(255, 255, 255, 0.1)',
                borderRadius: '15px',
                '& fieldset': { borderColor: 'rgba(255, 255, 255, 0.3)' },
                '&:hover fieldset': { borderColor: 'rgba(255, 255, 255, 0.5)' },
                '&.Mui-focused fieldset': { borderColor: '#fff' }
              },
              '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' },
              '& .MuiInputBase-input': { color: '#fff' }
            }}
          />

        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={handleLogin}
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
              borderRadius: '25px',
              px: 4,
              py: 1.5,
              fontSize: '1.1rem',
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
              },
              transition: 'all 0.3s ease'
            }}
          >
            Login
          </Button>
        </DialogActions>
        <Box sx={{ width: '100%', textAlign: 'center', mt: 2, pb: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            © All rights reserved | ASK Ltd
          </Typography>
        </Box>
      </Dialog>

      {/* Main App UI, only visible after login */}
      {loggedIn && (
        <Fade in={loggedIn} timeout={800}>
          <Box sx={{ display: 'flex', width: '100%' }}>
            {/* App Bar */}
            <AppBar
              position="fixed"
              sx={{
                zIndex: (theme) => theme.zIndex.drawer + 1,
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(20px)',
                border: '1px solid rgba(255, 255, 255, 0.18)',
                boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
              }}
            >
              <Toolbar>
                <SchoolIcon sx={{ mr: 2, color: '#fff' }} />
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 2,
                    color: '#fff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                  }}
                >
                  {schoolName}
                </Typography>
              </Toolbar>
            </AppBar>

            {/* Sidebar */}
            <Drawer
              variant="permanent"
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {
                  width: drawerWidth,
                  boxSizing: 'border-box',
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.18)',
                  color: '#fff',
                },
              }}
            >
              <Toolbar />
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mt: 3,
                mb: 2,
                animation: 'fadeInUp 0.8s ease-out'
              }}>
                <Avatar sx={{
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  width: 70,
                  height: 70,
                  mb: 2,
                  backdropFilter: 'blur(10px)',
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: '0 12px 40px rgba(31, 38, 135, 0.5)',
                  },
                  transition: 'all 0.3s ease'
                }}>
                  <SchoolIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 700,
                    color: '#fff',
                    mb: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    textAlign: 'center'
                  }}
                >
                  {schoolName}
                </Typography>
              </Box>

              <List sx={{ px: 2 }}>
                {[
                  { key: 'student', label: 'New Admission', icon: <PersonAddIcon /> },
                  { key: 'show', label: 'Show Student', icon: <SearchIcon /> },
                  { key: 'history', label: 'History', icon: <HistoryIcon /> },
                  { key: 'updateDelete', label: 'Update/Delete Student', icon: <EditNoteIcon /> },
                  { key: 'fee', label: 'Fee Management', icon: <PaymentIcon /> },
                  { key: 'settings', label: 'Academic Settings', icon: <SettingsIcon /> },
                ].map((item, index) => (
                  <Slide key={item.key} direction="right" in={true} timeout={300 + index * 100}>
                    <ListItem
                      sx={{
                        borderRadius: 3,
                        mx: 1,
                        my: 0.5,
                        cursor: 'pointer',
                        background: menu === item.key
                          ? 'rgba(255, 255, 255, 0.25)'
                          : 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        border: '1px solid rgba(255, 255, 255, 0.18)',
                        '&:hover': {
                          background: 'rgba(255, 255, 255, 0.2)',
                          transform: 'translateX(5px)',
                          boxShadow: '0 4px 15px rgba(31, 38, 135, 0.3)',
                        },
                        transition: 'all 0.3s ease',
                        boxShadow: menu === item.key
                          ? '0 8px 32px rgba(31, 38, 135, 0.37)'
                          : 'none'
                      }}
                      onClick={() => setMenu(item.key as any)}
                    >
                      <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.label}
                        sx={{
                          '& .MuiListItemText-primary': {
                            fontWeight: menu === item.key ? 600 : 400,
                            fontSize: '0.95rem'
                          }
                        }}
                      />
                    </ListItem>
                  </Slide>
                ))}
              </List>
            </Drawer>

            {/* Main Content */}
            <Box
              component="main"
              sx={{
                flexGrow: 1,
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                minHeight: '100vh'
              }}
            >
              <Toolbar />
              <Fade in={true} timeout={600}>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {menu === 'student' ? (
                    <Card sx={{
                      width: '100%',
                      maxWidth: 650,
                      p: 4,
                      mt: 4,
                      background: 'rgba(255, 255, 255, 0.25)',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(255, 255, 255, 0.18)',
                      borderRadius: '25px',
                      boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                      animation: 'slideInUp 0.6s ease-out',
                      '@keyframes slideInUp': {
                        from: { opacity: 0, transform: 'translateY(30px)' },
                        to: { opacity: 1, transform: 'translateY(0)' }
                      }
                    }}>
                      <Typography
                        variant="h5"
                        gutterBottom
                        align="center"
                        sx={{
                          color: '#fff',
                          fontWeight: 700,
                          textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                          mb: 3
                        }}
                      >
                        New Admission
                      </Typography>
                      <AdmissionForm onPreview={handlePreview} getNextRollNo={getNextRollNo} />
                    </Card>
                  ) : menu === 'show' ? (
                    <ShowStudent />
                  ) : menu === 'updateDelete' ? (
                    <UpdateDeleteStudent />
                  ) : menu === 'fee' ? (
                    <FeeManagement />
                  ) : menu === 'settings' ? (
                    <AcademicSettings />
                  ) : (
                    <HistorySection />
                  )}
                </Box>
              </Fade>

              {/* Preview Dialog */}
              <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                PaperProps={{
                  sx: {
                    background: 'rgba(255, 255, 255, 0.25)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255, 255, 255, 0.18)',
                    borderRadius: '20px',
                    boxShadow: '0 8px 32px rgba(31, 38, 135, 0.37)',
                    color: '#fff'
                  }
                }}
                TransitionComponent={Fade}
              >
                <DialogTitle sx={{ color: '#fff', fontWeight: 600 }}>
                  Confirm Admission
                </DialogTitle>
                <DialogContent>
                  <pre style={{
                    color: '#fff',
                    fontSize: '0.9rem',
                    background: 'rgba(255, 255, 255, 0.1)',
                    padding: '15px',
                    borderRadius: '10px',
                    border: '1px solid rgba(255, 255, 255, 0.2)'
                  }}>
                    {JSON.stringify(previewData, null, 2)}
                  </pre>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                  <Button
                    onClick={() => setConfirmOpen(false)}
                    sx={{
                      color: '#fff',
                      borderRadius: '15px',
                      px: 3
                    }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    variant="contained"
                    sx={{
                      background: 'linear-gradient(45deg, #667eea 30%, #764ba2 90%)',
                      borderRadius: '15px',
                      px: 3,
                      fontWeight: 600,
                      '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: '0 6px 20px rgba(102, 126, 234, 0.6)',
                      },
                      transition: 'all 0.3s ease'
                    }}
                  >
                    Confirm
                  </Button>
                </DialogActions>
              </Dialog>

              {/* Success Message */}
              {successMsg && (
                <Fade in={!!successMsg} timeout={500}>
                  <Box sx={{
                    mt: 3,
                    p: 3,
                    background: 'rgba(76, 175, 80, 0.2)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(76, 175, 80, 0.3)',
                    borderRadius: '15px',
                    color: '#4caf50',
                    fontWeight: 600,
                    fontSize: 18,
                    textAlign: 'center',
                    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { transform: 'scale(1)' },
                      '50%': { transform: 'scale(1.02)' },
                      '100%': { transform: 'scale(1)' }
                    }
                  }}>
                    {successMsg}
                  </Box>
                </Fade>
              )}
            </Box>
          </Box>
        </Fade>
      )}
    </Box>
  );
}

export default App;