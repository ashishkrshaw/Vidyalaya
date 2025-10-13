import { useState, useEffect, useMemo } from 'react';
import schools from "./Schools";

import { 
  Box, CssBaseline, Toolbar, AppBar, Typography, 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Card, 
  Fade, CircularProgress, IconButton, Container, Tooltip,
  Drawer, List, ListItem, ListItemIcon, ListItemText, ListItemButton
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
import { addAdmission, getAdmissions, addHistoryEntry, getNextRollNoForClass } from './db';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import Chatbot from './Chatbot';
import './Chatbot.css';
import StudentIdCard from './StudentIdCard';

const SIDEBAR_WIDTH = 280;

const getStyles = (mode: 'light' | 'dark') => ({
  mainContainer: {
    display: 'flex',
    minHeight: '100vh',
    background: mode === 'dark' 
      ? '#121212'
      : '#f4f6f8',
    color: mode === 'dark' ? '#ffffff' : '#1a202c',
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    transition: 'background 0.3s, color 0.3s',
  },
  appBar: {
    background: mode === 'dark' 
      ? 'rgba(18, 18, 18, 0.8)'
      : 'rgba(255, 255, 255, 0.8)',
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
    boxShadow: 'none',
    color: mode === 'dark' ? '#ffffff' : '#1a202c',
    zIndex: 1200,
    width: `calc(100% - ${SIDEBAR_WIDTH}px)`,
    ml: `${SIDEBAR_WIDTH}px`,
  },
  sidebar: {
    width: SIDEBAR_WIDTH,
    flexShrink: 0,
    '& .MuiDrawer-paper': {
      width: SIDEBAR_WIDTH,
      boxSizing: 'border-box',
      background: mode === 'dark' 
        ? 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)'
        : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
      borderRight: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
      color: mode === 'dark' ? '#ffffff' : '#1a202c',
    },
  },
  sidebarHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 20px',
    background: mode === 'dark' 
      ? 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)'
      : 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    color: '#ffffff',
    minHeight: '64px',
    boxSizing: 'border-box',
  },
  sidebarItem: {
    margin: '4px 12px',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    '&:hover': {
      background: mode === 'dark' 
        ? 'rgba(33, 150, 243, 0.1)'
        : 'rgba(33, 150, 243, 0.08)',
      transform: 'translateX(4px)',
    },
    '&.active': {
      background: mode === 'dark' 
        ? 'linear-gradient(135deg, rgba(33, 150, 243, 0.2) 0%, rgba(33, 203, 243, 0.2) 100%)'
        : 'linear-gradient(135deg, rgba(33, 150, 243, 0.15) 0%, rgba(33, 203, 243, 0.15) 100%)',
      color: '#2196F3',
      fontWeight: 600,
      '& .MuiListItemIcon-root': {
        color: '#2196F3',
      },
    },
  },
  sidebarIcon: {
    minWidth: '40px',
    color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.6)',
  },
  sidebarText: {
    '& .MuiTypography-root': {
      fontSize: '14px',
      fontWeight: 500,
    },
  },
  mainCard: {
    padding: '40px',
    borderRadius: '20px',
    background: mode === 'dark'
      ? 'linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)'
      : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
    boxShadow: mode === 'dark'
      ? '0 20px 40px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.1)'
      : '0 20px 40px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.05)',
    border: `1px solid ${mode === 'dark' ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)'}`,
    width: '100%',
    maxWidth: '1200px',
    margin: '0 auto',
    color: mode === 'dark' ? '#ffffff' : '#1a202c',
    position: 'relative',
    overflow: 'hidden',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: '4px',
      background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
    },
  },
  formTextField: {
    '& .MuiOutlinedInput-root': {
      background: mode === 'dark' 
        ? 'rgba(255, 255, 255, 0.08)' 
        : 'rgba(255, 255, 255, 0.9)',
      borderRadius: '12px',
      transition: 'all 0.3s ease',
      '& fieldset': {
        borderColor: mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.3)' 
          : 'rgba(0, 0, 0, 0.3)',
        borderWidth: '1px',
      },
      '&:hover fieldset': {
        borderColor: mode === 'dark' 
          ? 'rgba(255, 255, 255, 0.5)' 
          : 'rgba(0, 0, 0, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: '#2196F3',
        borderWidth: '2px',
      },
    },
    '& .MuiInputLabel-root': {
      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.7)',
      fontWeight: 500,
      '&.Mui-focused': {
        color: '#2196F3',
        fontWeight: 600,
      },
    },
    '& .MuiInputBase-input': {
      color: mode === 'dark' ? '#ffffff' : '#000000',
      fontSize: '16px',
    },
    '& .MuiFormHelperText-root': {
      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
      fontSize: '12px',
    },
    '& .MuiInputAdornment-root .MuiSvgIcon-root': {
      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
    },
  },
});

function generateStudentId(schoolName: string, year: number, rollNo: number, seq: number) {
  const firstLetter = schoolName[0].toUpperCase();
  const yr = String(year).slice(-2);
  const rno = rollNo.toString().padStart(2, '0');
  const last4 = seq.toString().padStart(4, '0');
  return `${firstLetter}${yr}-${rno}-${last4}`;
}

import Statistics from './Statistics';
// ...existing code...
const menuItems = [
  { key: 'student', label: 'New Admission', icon: <PersonAddIcon /> },
  { key: 'show', label: 'Show Student', icon: <SearchIcon /> },
  { key: 'idcard', label: 'Student ID Card', icon: <CardMembershipIcon /> },
  { key: 'fee', label: 'Fee Management', icon: <PaymentIcon /> },
  { key: 'stats', label: 'Statistics', icon: <BarChartIcon /> },
  { key: 'history', label: 'History', icon: <HistoryIcon /> },
  { key: 'updateDelete', label: 'Update/Delete', icon: <EditNoteIcon /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

function App() {
  const [menu, setMenu] = useState<'student' | 'show' | 'idcard' | 'history' | 'updateDelete' | 'settings' | 'fee' | 'stats'>('student');
  const [previewData, setPreviewData] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('dark');
  const [formKey, setFormKey] = useState(0);

  const styles = useMemo(() => getStyles(mode), [mode]);

  useEffect(() => {
    const autoLogin = () => {
      const defaultUsername = "Test_User";
      const defaultPassword = "Xy@123456";
      const found = schools.find(s => s.username === defaultUsername && s.password === defaultPassword);
      if (found) {
        setLoggedIn(true);
        setSchoolName(found.schoolName);
        localStorage.setItem('schoolId', found.id.toString());
        localStorage.setItem('loggedIn', 'true');
        localStorage.setItem('schoolName', found.schoolName);
        localStorage.setItem('currentUsername', found.username);
        setIsDataReady(true);
      }
    };
    autoLogin();
  }, []);

  useEffect(() => {
    // Listen for chatbot navigation events
    const handleChatbotNavigation = (event: CustomEvent) => {
      const section = event.detail;
      if (section && menuItems.find(item => item.key === section)) {
        setMenu(section);
        // Reset selected student when navigating away from ID card
        if (section !== 'idcard') {
          setSelectedStudent(null);
        }
      }
    };

    window.addEventListener('chatbot-navigate', handleChatbotNavigation as EventListener);
    return () => {
      window.removeEventListener('chatbot-navigate', handleChatbotNavigation as EventListener);
    };
  }, []);

  const handlePreview = async (data: any) => {
    try {
      const year = new Date().getFullYear();
      const admissions = await getAdmissions();
      const seq = admissions.length + 1;
      // Use rollNo from form data instead of generating new one
      const studentId = generateStudentId(schoolName, year, data.rollNo, seq);
      setPreviewData({ ...data, studentId, createdAt: new Date().toISOString() });
      setConfirmOpen(true);
    } catch (error) {
      console.error("Error in handlePreview:", error);
    }
  };

  const handleConfirm = async () => {
    if (!previewData) return;
    try {
      await addAdmission(previewData);
      await addHistoryEntry({ ...previewData, action: 'admission_added', timestamp: new Date().toISOString() });
      console.log(`Success! New admission added. Student ID: ${previewData.studentId}`);
      setConfirmOpen(false);
      setFormKey(prevKey => prevKey + 1); // This will reset the form
    } catch (error) {
      console.error("Error in handleConfirm:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  // Student selection for ID card
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  return (
    <Box sx={styles.mainContainer}>
      <Chatbot />
      <CssBaseline />
      {loggedIn && (
        <Fade in={loggedIn} timeout={1000}>
          <Box sx={{ display: 'flex', width: '100%' }}>
            {/* Sidebar */}
            <Drawer
              variant="permanent"
              sx={styles.sidebar}
            >
              {/* Sidebar Header */}
              <Box sx={styles.sidebarHeader}>
                <SchoolIcon sx={{ mr: 2, fontSize: 28 }} />
                <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                  {schoolName}
                </Typography>
              </Box>

              {/* Navigation Menu */}
              <List sx={{ pt: 2, pb: 1 }}>
                {menuItems.map((item) => (
                  <ListItemButton
                    key={item.key}
                    onClick={() => setMenu(item.key as any)}
                    sx={[
                      styles.sidebarItem,
                      menu === item.key && { '&.active': styles.sidebarItem['&.active'] }
                    ]}
                    className={menu === item.key ? 'active' : ''}
                  >
                    <ListItemIcon sx={styles.sidebarIcon}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.label} 
                      sx={styles.sidebarText}
                    />
                  </ListItemButton>
                ))}
              </List>

              {/* Sidebar Footer */}
              <Box sx={{ mt: 'auto', p: 2 }}>
                <ListItemButton
                  onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
                  sx={[styles.sidebarItem, { mb: 1 }]}
                >
                  <ListItemIcon sx={styles.sidebarIcon}>
                    {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                  </ListItemIcon>
                  <ListItemText 
                    primary={mode === 'dark' ? 'Light Mode' : 'Dark Mode'} 
                    sx={styles.sidebarText}
                  />
                </ListItemButton>
                
                <ListItemButton
                  onClick={handleLogout}
                  sx={styles.sidebarItem}
                >
                  <ListItemIcon sx={styles.sidebarIcon}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Logout" 
                    sx={styles.sidebarText}
                  />
                </ListItemButton>
              </Box>
            </Drawer>

            {/* Main Content */}
            <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
              {/* Top App Bar */}
              <AppBar position="fixed" sx={styles.appBar}>
                <Toolbar>
                  <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                    {menuItems.find(item => item.key === menu)?.label || 'School Management'}
                  </Typography>
                </Toolbar>
              </AppBar>

              {/* Main Content Area */}
              <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
                {isDataReady ? (
                  <Container maxWidth="xl">
                    {menu === 'student' ? (
                      <Card sx={styles.mainCard}>
                        <AdmissionForm key={formKey} onPreview={handlePreview} getNextRollNo={async (cls: string, section: string) => await getNextRollNoForClass(cls, section)} styles={styles} />
                      </Card>
                    ) : menu === 'show' ? (
                      <ShowStudent />
                    ) : menu === 'idcard' ? (
                      <Box>
                        {!selectedStudent ? (
                          <ShowStudent
                            onSelectStudent={setSelectedStudent}
                            idCardMode={true}
                          />
                        ) : (
                          <StudentIdCard student={selectedStudent} onUpdatePhoto={(photo) => setSelectedStudent((s: any) => ({ ...s, photo }))} onGenerateId={() => {}} />
                        )}
                      </Box>
                    ) : menu === 'history' ? (
                      <HistorySection />
                    ) : menu === 'updateDelete' ? (
                      <UpdateDeleteStudent />
                    ) : menu === 'settings' ? (
                      <AcademicSettings />
                    ) : menu === 'fee' ? (
                      <FeeManagement />
                    ) : menu === 'stats' ? (
                      <Statistics />
                    ) : null}
                  </Container>
                ) : <CircularProgress />}
              </Box>
            </Box>
          </Box>
        </Fade>
      )}
      
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Admission</DialogTitle>
        <DialogContent>
          <pre>{JSON.stringify(previewData, null, 2)}</pre>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm} color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default App;
