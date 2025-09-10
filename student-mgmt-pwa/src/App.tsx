import { useState, useEffect, useMemo, useCallback } from 'react';
import schools, { type School } from "./Schools";

import { 
  Box, CssBaseline, Drawer, Toolbar, AppBar, Typography, List, 
  ListItem, ListItemText, Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Card, Avatar, ListItemIcon, TextField, 
  Fade, CircularProgress, IconButton 
} from '@mui/material';

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
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import Chatbot from './Chatbot';
import './Chatbot.css';


const drawerWidth = 260;
const API_BASE_URL = "https://gdrive-backend-1.onrender.com";

const getStyles = (mode: 'light' | 'dark') => ({
  mainContainer: {
    display: 'flex',
    minHeight: '100vh',
    backgroundColor: mode === 'dark' ? '#1f2937' : '#f4f6f8',
    color: mode === 'dark' ? '#ffffff' : '#212121',
  },
  appBar: {
    backgroundColor: mode === 'dark' ? '#374151' : '#ffffff',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
    color: mode === 'dark' ? '#ffffff' : '#212121',
  },
  drawerPaper: {
    width: drawerWidth,
    backgroundColor: mode === 'dark' ? '#374151' : '#ffffff',
    borderRight: mode === 'dark' ? '1px solid #4b5563' : '1px solid #e0e0e0',
  },
  loginDialog: {
    '& .MuiDialog-paper': {
      backgroundColor: mode === 'dark' ? '#374151' : '#ffffff',
      borderRadius: '8px',
      minWidth: '400px',
      color: mode === 'dark' ? '#ffffff' : '#212121',
    }
  },
  loginTextField: {
    '& .MuiOutlinedInput-root': {
      backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
      borderRadius: '8px',
      '& fieldset': {
        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
      },
      '&:hover fieldset': {
        borderColor: mode === 'dark' ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)',
      },
      '&.Mui-focused fieldset': {
        borderColor: mode === 'dark' ? '#60a5fa' : '#1976d2',
      }
    },
    '& .MuiInputLabel-root': {
      color: mode === 'dark' ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.6)',
    },
    '& .MuiInputBase-input': {
      color: mode === 'dark' ? '#ffffff' : '#212121',
    },
    '& .MuiFormHelperText-root': {
      color: mode === 'dark' ? '#f87171' : '#d32f2f',
    }
  },
  captchaBox: {
    padding: '12px 24px',
    backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.05)' : '#eeeeee',
    borderRadius: '4px',
    fontWeight: 'bold',
    letterSpacing: '2px',
    color: mode === 'dark' ? '#ffffff' : '#212121',
    fontSize: '1.2rem',
    fontFamily: 'monospace',
    border: mode === 'dark' ? '1px solid rgba(255,255,255,0.3)' : '1px solid #dcdcdc',
  },
  loginButton: {
    background: '#2563eb',
    borderRadius: '8px',
    padding: '10px 24px',
    fontSize: '1rem',
    fontWeight: '600',
    textTransform: 'none',
    color: '#ffffff',
    '&:hover': {
      background: '#1d4ed8',
    },
    transition: 'all 0.2s ease'
  },
  sidebarAvatar: {
    backgroundColor: '#2563eb',
    width: 64,
    height: 64,
  },
  menuItem: {
    borderRadius: '8px',
    margin: '4px 12px',
    padding: '10px 16px',
    '&:hover': {
      backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    },
    transition: 'all 0.2s ease',
    '& .MuiListItemIcon-root': {
        color: mode === 'dark' ? '#d1d5db' : '#5f6368'
    },
    '& .MuiListItemText-primary': {
        color: mode === 'dark' ? '#d1d5db' : '#3c4043',
        fontWeight: 500,
    }
  },
  activeMenuItem: {
    borderRadius: '8px',
    margin: '4px 12px',
    padding: '10px 16px',
    backgroundColor: mode === 'dark' ? 'rgba(96, 165, 250, 0.16)' : 'rgba(25, 118, 210, 0.08)',
    '& .MuiListItemIcon-root': {
        color: '#1976d2'
    },
    '& .MuiListItemText-primary': {
        color: '#1976d2',
        fontWeight: 600
    }
  },
  dialogPaper: {
    backgroundColor: mode === 'dark' ? '#374151' : '#ffffff',
    borderRadius: '8px',
    color: mode === 'dark' ? '#ffffff' : '#212121',
  },
  previewContent: {
    color: mode === 'dark' ? '#e5e7eb' : '#212121',
    fontSize: '0.9rem',
    backgroundColor: mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#f5f5f5',
    padding: '16px',
    borderRadius: '8px',
    border: mode === 'dark' ? '1px solid #4b5563' : '1px solid #e0e0e0',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
  },
  successMessage: {
    marginTop: '24px',
    padding: '20px',
    backgroundColor: '#059669',
    borderRadius: '8px',
    color: '#ffffff',
    fontWeight: '600',
    fontSize: '16px',
    textAlign: 'center',
  },
  mainCard: {
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '1100px',
    backgroundColor: mode === 'dark' ? '#374151' : '#ffffff',
    color: mode === 'dark' ? '#ffffff' : '#212121',
  },
  appBarButton: {
    color: 'inherit',
    borderRadius: '8px',
    '&:hover': { 
        backgroundColor: mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.08)' 
    }
  }
});

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

        fetch(`${API_BASE_URL}/upload-drive`, {
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
          }).then(driveResponse => {
            if (driveResponse.ok) {
              console.log('✅ Data backed up to Google Drive');
            } else {
              console.warn('⚠️ Google Drive backup failed');
            }
          }).catch(driveError => {
            console.warn('⚠️ Google Drive backup failed:', driveError);
          });

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
  const [isDataReady, setIsDataReady] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('dark');

  const styles = useMemo(() => getStyles(mode), [mode]);

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

  const handleLogout = () => {
    localStorage.clear();
    UserDataManager.setCurrentUser('');
    UserDataManager.setUserData({});
    setLoggedIn(false);
    setSchoolName('');
    setIsDataReady(false);
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
      setLoggedIn(true);
      setSchoolName(found.schoolName);
      setLoginPassword('');
      setLoginError('');
      setCaptchaInput('');
      setUsername('');

      localStorage.setItem('loggedIn', 'true');
      localStorage.setItem('schoolName', found.schoolName);
      localStorage.setItem('currentUsername', found.username);

      UserDataManager.setCurrentUser(found.username);
      UserDataManager.loadUserData().then(dataLoaded => {
        if (dataLoaded) {
          setIsDataReady(true);
          console.log('✅ Login successful and data loaded for user:', found.username);
        } else {
          handleLogout();
          setLoginError('Failed to load user data. Please try again.');
        }
      });
    } else {
      setLoginError('Invalid username or password.');
    }
  };

  return (
    <Box sx={styles.mainContainer}>
      <Chatbot />
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
          color: 'inherit',
          textAlign: 'center',
          fontSize: '1.25rem',
          fontWeight: 600
        }}>
          <LockIcon /> Login Required
        </DialogTitle>
        <DialogContent sx={{ minWidth: 350, padding: '20px' }}>
          <Typography sx={{
            marginBottom: 3,
            textAlign: 'center',
            opacity: 0.9,
            fontSize: '1rem'
          }}>
            Enter profile password to access the app.
          </Typography>

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
                sx={{ color: 'inherit', textTransform: 'none' }}
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
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', paddingBottom: 3 }}>
          <Button
            onClick={handleLogin}
            variant="contained"
            sx={styles.loginButton}
          >
            Login
          </Button>
        </DialogActions>

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
                <SchoolIcon sx={{ marginRight: 2 }} />
                <Typography
                  variant="h6"
                  noWrap
                  component="div"
                  sx={{
                    fontWeight: 700,
                    letterSpacing: 1,
                    textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                    flexGrow: 1
                  }}
                >
                  {schoolName}
                </Typography>
                <IconButton sx={{ ml: 1 }} onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="inherit">
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                <Button
                  onClick={handleLogout}
                  color="inherit"
                  sx={styles.appBarButton}
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
                    opacity: 0.7,
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
                    <ListItemIcon sx={{ minWidth: 40 }}>
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
              {isDataReady ? (
              <Fade in={true} timeout={600}>
                <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
                  {menu === 'student' ? (
                    <Card sx={styles.mainCard}>
                      <Typography
                        variant="h5"
                        gutterBottom
                        align="center"
                        sx={{
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
                        styles={styles}
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
              ) : (
                <Box sx={{ display: 'flex', flexGrow: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <CircularProgress />
                </Box>
              )}

              <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                PaperProps={{ sx: styles.dialogPaper }}
                TransitionComponent={Fade}
              >
                <DialogTitle sx={{ fontWeight: 600 }}>
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
                    sx={{ color: 'inherit', borderRadius: '12px', padding: '8px 20px' }}
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