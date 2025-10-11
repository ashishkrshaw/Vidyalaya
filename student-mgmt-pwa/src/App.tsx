import { useState, useEffect, useMemo } from 'react';
import schools from "./Schools";

import { 
  Box, CssBaseline, Toolbar, AppBar, Typography, 
  Dialog, DialogTitle, DialogContent, 
  DialogActions, Button, Card, 
  Fade, CircularProgress, IconButton, Container, Tooltip
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
import { addAdmission, getAdmissions, getNextStudentSeq, addHistoryEntry } from './db';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import Chatbot from './Chatbot';
import './Chatbot.css';
import StudentIdCard from './StudentIdCard';

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
  { key: 'history', label: 'History', icon: <HistoryIcon /> },
  { key: 'updateDelete', label: 'Update/Delete', icon: <EditNoteIcon /> },
  { key: 'fee', label: 'Fee Management', icon: <PaymentIcon /> },
  { key: 'stats', label: 'Statistics', icon: <HistoryIcon /> },
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

  const handlePreview = async (data: any) => {
    try {
      const year = new Date().getFullYear();
      const rollNo = await getNextStudentSeq();
      const admissions = await getAdmissions();
      const seq = admissions.length + 1;
      const studentId = generateStudentId(schoolName, year, rollNo, seq);
      setPreviewData({ ...data, rollNo, studentId, createdAt: new Date().toISOString() });
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
          <Box sx={{ display: 'flex', width: '100%', flexDirection: 'column' }}>
            <AppBar position="fixed" sx={styles.appBar}>
              <Toolbar>
                <SchoolIcon sx={{ mr: 2 }} />
                <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
                  {schoolName}
                </Typography>
                {menuItems.map(item => (
                  <Tooltip title={item.label} key={item.key}>
                    <IconButton color={menu === item.key ? 'primary' : 'inherit'} onClick={() => setMenu(item.key as any)}>
                      {item.icon}
                    </IconButton>
                  </Tooltip>
                ))}
                <IconButton sx={{ ml: 2 }} onClick={() => setMode(mode === 'light' ? 'dark' : 'light')} color="inherit">
                  {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                <Button color="inherit" onClick={handleLogout}>Logout</Button>
              </Toolbar>
            </AppBar>
            <Box component="main" sx={{ flexGrow: 1, p: 3, width: '100%' }}>
              <Toolbar />
              {isDataReady ? (
                <Container maxWidth="xl">
                  {menu === 'student' ? (
                    <Card sx={styles.mainCard}>
                      <AdmissionForm key={formKey} onPreview={handlePreview} getNextRollNo={async () => await getNextStudentSeq()} styles={styles} />
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
