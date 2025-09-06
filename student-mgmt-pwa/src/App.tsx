import { useState, useEffect } from 'react';
import schools, { type School } from "./Schools";
import { Box, CssBaseline, Drawer, Toolbar, AppBar, Typography, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Button, Card, Avatar, ListItemIcon, TextField, Fade } from '@mui/material';
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
import { addAdmission } from './db';

const drawerWidth = 260;
const API_BASE_URL = "https://gdrive-backend-1.onrender.com";

const styles = {
  mainContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: '#1a237e',
    backgroundImage: 'linear-gradient(135deg, #1a237e 0%, #283593 25%, #3949ab 50%, #3f51b5 75%, #5c6bc0 100%)',
  },
  appBar: {
    backgroundColor: 'rgba(25, 118, 210, 0.9)',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: 'rgba(63, 81, 181, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(255,255,255,0.1)',
  },
  loginDialog: {
    '& .MuiDialog-paper': {
      backgroundColor: 'rgba(63, 81, 181, 0.95)',
      backdropFilter: 'blur(15px)',
      borderRadius: '16px',
      border: '1px solid rgba(255,255,255,0.1)',
      minWidth: '400px',
    }
  },
  loginTextField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: 'rgba(255,255,255,0.1)',
      borderRadius: '12px',
      '& fieldset': {
        borderColor: 'rgba(255,255,255,0.3)',
      },
      '&:hover fieldset': {
        borderColor: 'rgba(255,255,255,0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#ffffff',
      }
    },
    '& .MuiInputLabel-root': {
      color: 'rgba(255,255,255,0.7)',
    },
    '& .MuiInputBase-input': {
      color: '#ffffff',
    },
    '& .MuiFormHelperText-root': {
      color: '#ff5252',
    }
  },
  captchaBox: {
    padding: '12px 24px',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: '8px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: '#ffffff',
    fontSize: '1.2rem',
    fontFamily: 'monospace',
    border: '1px solid rgba(255,255,255,0.2)',
  },
  loginButton: {
    background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
    borderRadius: '24px',
    padding: '12px 32px',
    fontSize: '1.1rem',
    fontWeight: '600',
    textTransform: 'none',
    color: '#ffffff',
    boxShadow: '0 4px 15px rgba(33, 150, 243, 0.4)',
    '&:hover': {
      background: 'linear-gradient(45deg, #1976d2 30%, #1cb5e0 90%)',
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(33, 150, 243, 0.6)',
    },
    transition: 'all 0.3s ease'
  },
  sidebarAvatar: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    width: 64,
    height: 64,
    border: '2px solid rgba(255,255,255,0.2)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
  },
  menuItem: {
    borderRadius: '12px',
    margin: '4px 8px',
    backgroundColor: 'rgba(255,255,255,0.05)',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.15)',
      transform: 'translateX(4px)',
    },
    transition: 'all 0.2s ease',
  },
  activeMenuItem: {
    borderRadius: '12px',
    margin: '4px 8px',
    backgroundColor: 'rgba(255,255,255,0.2)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  },
  dialogPaper: {
    backgroundColor: 'rgba(63, 81, 181, 0.95)',
    backdropFilter: 'blur(15px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
  },
  previewContent: {
    color: '#ffffff',
    fontSize: '0.9rem',
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.2)',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
  },
  successMessage: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: 'rgba(76, 175, 80, 0.9)',
    borderRadius: '12px',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '16px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
  }
};

function generateStudentId(schoolName: string, year: number, rollNo: number, seq: number) {
  const firstLetter = schoolName[0].toUpperCase();
  const yr = String(year).slice(-2);
  const rno = rollNo.toString().padStart(2, '0');
  const last4 = seq.toString().padStart(4, '0');
  return `${firstLetter}${yr}-${rno}-${last4}`;
}

function generateCaptcha(length: number = 2) {
  const chars = 'ABCDE';
  let captcha = '';
  for (let i = 0; i < length; i++) {
    captcha += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return captcha;
}

class UserDataManager {
  private static currentUsername: string | null = null;
  private static userData: any = {
    admissions: [],
    students: [],
    history: [],
    academicSettings: {},
    feeManagement: [],
    profile: {}
  };

  static setCurrentUser(username: string) {
    this.currentUsername = username;
  }

  static getCurrentUsername() {
    return this.currentUsername;
  }

  static setUserData(data: any) {
    this.userData = {
      admissions: data.admissions || [],
      students: data.students || [],
      history: data.history || [],
      academicSettings: data.academicSettings || {},
      feeManagement: data.feeManagement || [],
      profile: data.profile || {},
      ...data
    };
  }

  static getUserData() {
    return this.userData;
  }

  static async loadUserData() {
    if (!this.currentUsername) {
      console.error('❌ No current username set');
      return false;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/get-data/${this.currentUsername}`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          this.setUserData(result.data || {});
          console.log('✅ User data loaded from MongoDB for:', this.currentUsername);
          return true;
        }
      }

      console.log('ℹ️ No existing data found, creating new user file for:', this.currentUsername);
      await this.createNewUserFile();
      return true;

    } catch (error) {
      console.error('❌ Error loading user data:', error);
      return false;
    }
  }

  static async createNewUserFile() {
    if (!this.currentUsername) return false;

    const initialData = {
      username: this.currentUsername,
      admissions: [],
      students: [],
      history: [],
      academicSettings: {
        currentSession: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
        classes: ['1st', '2nd', '3rd', '4th', '5th', '6th', '7th', '8th', '9th', '10th'],
        sections: ['A', 'B', 'C']
      },
      feeManagement: [],
      profile: {
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      }
    };

    try {
      const response = await fetch(`${API_BASE_URL}/save-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          username: this.currentUsername,
          data: initialData
        })
      });

      if (response.ok) {
        this.setUserData(initialData);
        console.log('✅ New user file created in MongoDB for:', this.currentUsername);
        return true;
      }
    } catch (error) {
      console.error('❌ Error creating new user file:', error);
    }

    return false;
  }

  static async saveUserData(sectionName: string, sectionData: any) {
    if (!this.currentUsername) {
      console.error('❌ No username set for saving data');
      return false;
    }

    try {
      this.userData[sectionName] = sectionData;
      this.userData.profile.lastUpdated = new Date().toISOString();

      const response = await fetch(`${API_BASE_URL}/save-data`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          username: this.currentUsername,
          data: this.userData
        })
      });

      if (response.ok) {
        console.log(`✅ ${sectionName} data saved to MongoDB for user:`, this.currentUsername);

        try {
          await fetch(`${API_BASE_URL}/upload-drive`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({
              username: this.currentUsername,
              name: `${this.currentUsername}_backup.json`,
              content: this.userData
            })
          });
          console.log('✅ Data backed up to Google Drive');
        } catch (driveError) {
          console.warn('⚠️ Google Drive backup failed:', driveError);
        }

        return true;
      }
    } catch (error) {
      console.error(`❌ Error saving ${sectionName} data:`, error);
    }

    return false;
  }

  static getSectionData(sectionName: string) {
    return this.userData[sectionName] || [];
  }

  static addToSection(sectionName: string, newData: any) {
    if (!this.userData[sectionName]) {
      this.userData[sectionName] = [];
    }

    if (Array.isArray(this.userData[sectionName])) {
      this.userData[sectionName].push(newData);
    } else {
      this.userData[sectionName] = { ...this.userData[sectionName], ...newData };
    }

    return this.saveUserData(sectionName, this.userData[sectionName]);
  }

  static updateSectionItem(sectionName: string, itemId: string, updatedData: any) {
    if (Array.isArray(this.userData[sectionName])) {
      const index = this.userData[sectionName].findIndex((item: any) => item.id === itemId || item.studentId === itemId);
      if (index !== -1) {
        this.userData[sectionName][index] = { ...this.userData[sectionName][index], ...updatedData };
        return this.saveUserData(sectionName, this.userData[sectionName]);
      }
    }
    return false;
  }

  static deleteSectionItem(sectionName: string, itemId: string) {
    if (Array.isArray(this.userData[sectionName])) {
      this.userData[sectionName] = this.userData[sectionName].filter((item: any) =>
        item.id !== itemId && item.studentId !== itemId
      );
      return this.saveUserData(sectionName, this.userData[sectionName]);
    }
    return false;
  }
}

function App() {
  const [menu, setMenu] = useState<'student' | 'show' | 'history' | 'updateDelete' | 'settings' | 'fee'>('student');
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [captchaInput, setCaptchaInput] = useState('');
  const [previewData, setPreviewData] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [username, setUsername] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [dataLoading, setDataLoading] = useState(false);

  const getNextRollNo = async (cls: string, section: string): Promise<number> => {
    try {
      const admissions = UserDataManager.getSectionData('admissions');
      const classAdmissions = admissions.filter((a: any) => a.class === cls && a.section === section);
      const used = classAdmissions.map((a: any) => Number(a.rollNo));

      for (let i = 1; i <= 50; i++) {
        if (!used.includes(i)) return i;
      }
      return 0;
    } catch (error) {
      console.error('Error getting next roll number:', error);
      return 1;
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCaptcha(generateCaptcha());
    }, 30000);
    return () => clearInterval(timer);
  }, []);

  const handlePreview = async (data: any) => {
    try {
      const year = new Date().getFullYear();
      const rollNo = await getNextRollNo(data.class, data.section);
      const admissions = UserDataManager.getSectionData('admissions');
      const seq = admissions.length + 1;
      const studentId = generateStudentId(schoolName, year, rollNo, seq);

      setPreviewData({ ...data, rollNo, studentId, createdAt: new Date().toISOString() });
      setConfirmOpen(true);
    } catch (error) {
      console.error('Error in preview handler:', error);
    }
  };

  const handleConfirm = async () => {
    try {
      await addAdmission(previewData);
      await UserDataManager.addToSection('admissions', previewData);
      await UserDataManager.addToSection('history', {
        ...previewData,
        action: 'admission_added',
        timestamp: new Date().toISOString()
      });

      setSuccessMsg(`Success! New admission added. Student ID: ${previewData.studentId}`);
      setConfirmOpen(false);
      setTimeout(() => setSuccessMsg(''), 3000);

    } catch (error) {
      console.error('Error confirming admission:', error);
      setSuccessMsg('Error saving admission. Please try again.');
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleLogin = async () => {
    if (captchaInput.trim() !== captcha) {
      setLoginError('Captcha does not match.');
      return;
    }

    const found = schools.find((s: School) =>
      s.username.toLowerCase() === username.trim().toLowerCase() &&
      s.password === loginPassword
    );

    if (found) {
      try {
        setDataLoading(true);
        UserDataManager.setCurrentUser(found.username);
        const dataLoaded = await UserDataManager.loadUserData();
        
        if (dataLoaded) {
          setLoggedIn(true);
          setSchoolName(found.schoolName);
          setLoginPassword('');
          setLoginError('');
          setCaptchaInput('');
          setUsername('');

          localStorage.setItem('loggedIn', 'true');
          localStorage.setItem('schoolName', found.schoolName);
          localStorage.setItem('currentUsername', found.username);

          console.log('✅ Login successful for user:', found.username);
        } else {
          setLoginError('Failed to load user data. Please try again.');
        }
      } catch (error) {
        console.error('❌ Login error:', error);
        setLoginError('Login failed. Please try again.');
      } finally {
        setDataLoading(false);
      }
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  useEffect(() => {
    const checkExistingLogin = async () => {
      const storedLogin = localStorage.getItem('loggedIn');
      const storedSchoolName = localStorage.getItem('schoolName');
      const storedUsername = localStorage.getItem('currentUsername');

      if (storedLogin === 'true' && storedSchoolName && storedUsername) {
        setDataLoading(true);

        try {
          UserDataManager.setCurrentUser(storedUsername);
          const dataLoaded = await UserDataManager.loadUserData();

          if (dataLoaded) {
            setLoggedIn(true);
            setSchoolName(storedSchoolName);
            console.log('✅ Auto-login successful for user:', storedUsername);
          } else {
            localStorage.clear();
          }
        } catch (error) {
          console.error('❌ Auto-login failed:', error);
          localStorage.clear();
        } finally {
          setDataLoading(false);
        }
      }
    };

    checkExistingLogin();
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    UserDataManager.setCurrentUser('');
    UserDataManager.setUserData({});
    setLoggedIn(false);
    setSchoolName('');
  };

  return (
    <Box sx={styles.mainContainer}>
      <CssBaseline />

      <Dialog
        open={!loggedIn}
        disableEscapeKeyDown
        sx={styles.loginDialog}
        TransitionComponent={Fade}
      >
        <DialogTitle sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: '#fff',
          textAlign: 'center',
          fontSize: '1.25rem',
          fontWeight: 600
        }}>
          <LockIcon sx={{ color: '#fff' }} /> Login Required
        </DialogTitle>
        <DialogContent sx={{ minWidth: 350, padding: '20px' }}>
          <Typography sx={{
            marginBottom: 3,
            color: '#fff',
            textAlign: 'center',
            opacity: 0.9,
            fontSize: '1rem'
          }}>
            {dataLoading ? 'Loading user data...' : 'Enter profile password to access the app.'}
          </Typography>

          {!dataLoading && (
            <>
              <TextField
                label="Username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                fullWidth
                autoFocus
                sx={{ ...styles.loginTextField, marginBottom: 2 }}
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
                sx={{ ...styles.loginTextField, marginBottom: 2 }}
              />

              <Box sx={{ display: 'flex', alignItems: 'center', marginTop: 2, marginBottom: 1, gap: 2 }}>
                <Box sx={styles.captchaBox}>
                  {captcha}
                </Box>
                <Button
                  onClick={() => setCaptcha(generateCaptcha())}
                  sx={{ color: '#fff', textTransform: 'none' }}
                >
                  Refresh
                </Button>
              </Box>

              <TextField
                label="Enter Captcha"
                value={captchaInput}
                onChange={e => setCaptchaInput(e.target.value)}
                fullWidth
                onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
                sx={styles.loginTextField}
              />
            </>
          )}
        </DialogContent>

        {!dataLoading && (
          <DialogActions sx={{ justifyContent: 'center', paddingBottom: 3 }}>
            <Button
              onClick={handleLogin}
              variant="contained"
              sx={styles.loginButton}
            >
              Login
            </Button>
          </DialogActions>
        )}

        <Box sx={{ width: '100%', textAlign: 'center', marginTop: 2, paddingBottom: 2 }}>
          <Typography variant="caption" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
            © All rights reserved | ASK Ltd
          </Typography>
        </Box>
      </Dialog>

      {loggedIn && (
        <Fade in={loggedIn} timeout={800}>
          <Box sx={{ display: 'flex', width: '100%' }}>
            <AppBar position="fixed" sx={styles.appBar}>
              <Toolbar>
                <SchoolIcon sx={{ marginRight: 2, color: '#fff' }} />
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 1,
                    color: '#fff',
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    flexGrow: 1
                  }}
                >
                  {schoolName}
                </Typography>
                <Button
                  onClick={handleLogout}
                  sx={{
                    color: '#fff',
                    borderRadius: '8px',
                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
                  }}
                >
                  Logout
                </Button>
              </Toolbar>
            </AppBar>

            <Drawer
              variant="permanent"
              sx={{
                width: drawerWidth,
                flexShrink: 0,
                '& .MuiDrawer-paper': styles.drawerPaper,
              }}
            >
              <Toolbar />
              <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: 3,
                marginBottom: 2,
              }}>
                <Avatar sx={styles.sidebarAvatar}>
                  <SchoolIcon fontSize="large" />
                </Avatar>
                <Typography
                  variant="h6"
                  sx={{
                    fontWeight: 600,
                    color: '#fff',
                    marginTop: 2,
                    marginBottom: 1,
                    textAlign: 'center',
                    fontSize: '1.1rem'
                  }}
                >
                  {schoolName}
                </Typography>
                <Typography
                  variant="caption"
                  sx={{
                    color: 'rgba(255,255,255,0.7)',
                    textAlign: 'center',
                    fontSize: '0.8rem'
                  }}
                >
                  User: {UserDataManager.getCurrentUsername()}
                </Typography>
              </Box>

              <List sx={{ padding: '0 12px' }}>
                {[
                  { key: 'student', label: 'New Admission', icon: <PersonAddIcon /> },
                  { key: 'show', label: 'Show Student', icon: <SearchIcon /> },
                  { key: 'history', label: 'History', icon: <HistoryIcon /> },
                  { key: 'updateDelete', label: 'Update/Delete Student', icon: <EditNoteIcon /> },
                  { key: 'fee', label: 'Fee Management', icon: <PaymentIcon /> },
                  { key: 'settings', label: 'Academic Settings', icon: <SettingsIcon /> },
                ].map((item) => (
                  <ListItem
                    key={item.key}
                    sx={menu === item.key ? styles.activeMenuItem : styles.menuItem}
                    onClick={() => setMenu(item.key as any)}
                    style={{ cursor: 'pointer' }}
                  >
                    <ListItemIcon sx={{ color: '#fff', minWidth: 40 }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText
                      primary={item.label}
                      sx={{
                        '& .MuiListItemText-primary': {
                          fontWeight: menu === item.key ? 600 : 400,
                          fontSize: '0.95rem',
                          color: '#fff'
                        }
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Drawer>

            <Box
              component="main"
              sx={{
                flexGrow: 1,
                padding: 4,
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
                    <Card sx={styles.mainCard}>
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
                      <AdmissionForm
                        onPreview={handlePreview}
                        getNextRollNo={getNextRollNo}
                        userDataManager={UserDataManager}
                      />
                    </Card>
                  ) : menu === 'show' ? (
                    <ShowStudent userDataManager={UserDataManager} />
                  ) : menu === 'updateDelete' ? (
                    <UpdateDeleteStudent userDataManager={UserDataManager} />
                  ) : menu === 'fee' ? (
                    <FeeManagement userDataManager={UserDataManager} />
                  ) : menu === 'settings' ? (
                    <AcademicSettings userDataManager={UserDataManager} />
                  ) : (
                    <HistorySection userDataManager={UserDataManager} />
                  )}
                </Box>
              </Fade>

              <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                PaperProps={{ sx: styles.dialogPaper }}
                TransitionComponent={Fade}
              >
                <DialogTitle sx={{ color: '#fff', fontWeight: 600 }}>
                  Confirm Admission
                </DialogTitle>
                <DialogContent>
                  <Box sx={styles.previewContent}>
                    {JSON.stringify(previewData, null, 2)}
                  </Box>
                </DialogContent>
                <DialogActions sx={{ padding: 3 }}>
                  <Button
                    onClick={() => setConfirmOpen(false)}
                    sx={{ color: '#fff', borderRadius: '12px', padding: '8px 20px' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    variant="contained"
                    sx={{
                      ...styles.loginButton,
                      padding: '8px 20px',
                    }}
                  >
                    Confirm
                  </Button>
                </DialogActions>
              </Dialog>

              {successMsg && (
                <Fade in={!!successMsg} timeout={500}>
                  <Box sx={styles.successMessage}>
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

export { UserDataManager };
export default App;