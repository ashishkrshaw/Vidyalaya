import { useState, useEffect } from 'react'; // top me
import schools, { type School } from "./Schools";
import { Box, CssBaseline, Drawer, Toolbar, AppBar, Typography, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Button, Card, Avatar, ListItemIcon, TextField, Fade, Slide } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import AdmissionForm from './AdmissionForm';
import ShowStudent from './ShowStudent';
import HistoryIcon from '@mui/icons-material/History';
import HistorySection from './HistorySection';
import EditNoteIcon from '@mui/icons-material/EditNote';
import UpdateDeleteStudent from './UpdateDeleteStudent';
import SettingsIcon from '@mui/icons-material/Settings';
import AcademicSettings from './AcademicSettings';
import PaymentIcon from '@mui/icons-material/Payment';
import FeeManagement from './FeeManagement';
import LockIcon from '@mui/icons-material/Lock';
import { addAdmission, getAdmissionsByClassSection, getNextStudentSeq } from './db';

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