import { useState, useEffect } from 'react';
import schools from "./Schools";

import {
  Box, CssBaseline,
  Dialog, DialogTitle, DialogContent,
  DialogActions, Button, Typography, Chip,
  CircularProgress, IconButton,
  useTheme, useMediaQuery
} from '@mui/material';

import SchoolIcon from '@mui/icons-material/School';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

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
import MenuIcon from '@mui/icons-material/Menu';
import Chatbot from './Chatbot';
import './Chatbot.css';
import './App.css';
import StudentIdCard from './StudentIdCard';
import Statistics from './Statistics';

function generateStudentId(schoolName: string, year: number, rollNo: number, seq: number) {
  const firstLetter = schoolName[0].toUpperCase();
  const yr = String(year).slice(-2);
  const rno = rollNo.toString().padStart(2, '0');
  const last4 = seq.toString().padStart(4, '0');
  return `${firstLetter}${yr}-${rno}-${last4}`;
}

const menuItems = [
  { key: 'student', label: 'New Admission', icon: <PersonAddIcon /> },
  { key: 'show', label: 'Search Student', icon: <SearchIcon /> },
  { key: 'idcard', label: 'Student ID Card', icon: <CardMembershipIcon /> },
  { key: 'fee', label: 'Fee Management', icon: <PaymentIcon /> },
  { key: 'stats', label: 'Statistics', icon: <BarChartIcon /> },
  { key: 'history', label: 'History', icon: <HistoryIcon /> },
  { key: 'updateDelete', label: 'Manage Students', icon: <EditNoteIcon /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

function App() {
  const [menu, setMenu] = useState<'student' | 'show' | 'idcard' | 'history' | 'updateDelete' | 'settings' | 'fee' | 'stats'>('student');
  const [previewData, setPreviewData] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [formKey, setFormKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
    const handleChatbotNavigation = (event: CustomEvent) => {
      const section = event.detail;
      if (section && menuItems.find(item => item.key === section)) {
        setMenu(section);
        if (section !== 'idcard') {
          setSelectedStudent(null);
        }
      }
    };
    window.addEventListener('chatbot-navigate', handleChatbotNavigation as EventListener);
    return () => window.removeEventListener('chatbot-navigate', handleChatbotNavigation as EventListener);
  }, []);

  // Set theme class on document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode);
  }, [mode]);

  const handlePreview = async (data: any) => {
    try {
      const year = new Date().getFullYear();
      const admissions = await getAdmissions();
      const seq = admissions.length + 1;
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
      setConfirmOpen(false);
      setFormKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error("Error in handleConfirm:", error);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  if (!loggedIn) {
    return <div className="app-loading"><CircularProgress /></div>;
  }

  return (
    <div className={`app-container ${mode}`} data-theme={mode}>
      <CssBaseline />
      <Chatbot />

      {/* Sidebar */}
      <aside className={`app-sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <SchoolIcon style={{ fontSize: 20, color: 'white' }} />
          </div>
          <h1 className="sidebar-title">{schoolName || 'School'}</h1>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.key}
              className={`nav-item ${menu === item.key ? 'active' : ''}`}
              onClick={() => {
                setMenu(item.key as any);
                if (isMobile) setMobileOpen(false);
              }}
            >
              <span className="nav-item-icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            className="btn btn-icon"
            onClick={() => setMode(mode === 'light' ? 'dark' : 'light')}
            title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}
          >
            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
          </button>
          <button
            className="btn btn-icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogoutIcon />
          </button>
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />
      )}

      {/* Main Content */}
      <main className="app-main">
        {/* Header */}
        <header className="app-header">
          <div className="header-left">
            <IconButton
              className="menu-toggle"
              onClick={() => setMobileOpen(!mobileOpen)}
              sx={{ display: { sm: 'none' } }}
            >
              <MenuIcon />
            </IconButton>
            <h1 className="header-title">
              {menuItems.find(item => item.key === menu)?.label || 'Dashboard'}
            </h1>
          </div>
          <div className="header-right">
            {/* Add any header actions here */}
          </div>
        </header>

        {/* Content Area */}
        <div className="app-content">
          {isDataReady ? (
            <>
              {menu === 'student' && (
                <AdmissionForm
                  key={formKey}
                  onPreview={handlePreview}
                  getNextRollNo={async (cls: string, section: string) => await getNextRollNoForClass(cls, section)}
                  styles={{}}
                />
              )}
              {menu === 'show' && <ShowStudent />}
              {menu === 'idcard' && (
                !selectedStudent ? (
                  <ShowStudent onSelectStudent={setSelectedStudent} idCardMode={true} />
                ) : (
                  <StudentIdCard
                    student={selectedStudent}
                    onUpdatePhoto={(photo) => setSelectedStudent((s: any) => ({ ...s, photo }))}
                    onGenerateId={() => { }}
                  />
                )
              )}
              {menu === 'history' && <HistorySection />}
              {menu === 'updateDelete' && <UpdateDeleteStudent />}
              {menu === 'settings' && <AcademicSettings />}
              {menu === 'fee' && <FeeManagement />}
              {menu === 'stats' && <Statistics mode={mode} />}
            </>
          ) : (
            <div className="app-loading"><CircularProgress /></div>
          )}
        </div>
      </main>

      {/* Confirmation Dialog - Professional Layout */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #0052CC 0%, #6554C0 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1
        }}>
          <CheckCircleIcon /> Confirm Admission
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {previewData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {/* Student Photo and Basic Info */}
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
                <Box sx={{
                  width: 120,
                  height: 150,
                  borderRadius: 2,
                  overflow: 'hidden',
                  border: '3px solid #0052CC',
                  flexShrink: 0,
                  background: '#f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {previewData.photoData ? (
                    <img src={previewData.photoData} alt="Student" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <Box sx={{ textAlign: 'center', color: '#999', fontSize: 12 }}>No Photo</Box>
                  )}
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h5" sx={{ fontWeight: 700, color: '#172B4D', mb: 1 }}>
                    {previewData.name}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                    <Chip label={`Class ${previewData.class} - ${previewData.section}`} color="primary" size="small" />
                    <Chip label={`Roll No: ${previewData.rollNo}`} variant="outlined" size="small" />
                  </Box>
                  <Typography variant="body2" color="textSecondary">
                    Student ID: <strong>{previewData.studentId}</strong>
                  </Typography>
                  <Typography variant="body2" color="textSecondary">
                    Admission Date: <strong>{new Date().toLocaleDateString('en-IN')}</strong>
                  </Typography>
                </Box>
              </Box>

              {/* Personal Details */}
              <Box sx={{ background: '#F4F5F7', borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#0052CC', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <PersonIcon fontSize="small" /> Personal Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Box><Typography variant="caption" color="textSecondary">Gender</Typography><Typography variant="body2">{previewData.gender}</Typography></Box>
                  <Box><Typography variant="caption" color="textSecondary">Date of Birth</Typography><Typography variant="body2">{previewData.dob}</Typography></Box>
                  <Box><Typography variant="caption" color="textSecondary">Aadhar No.</Typography><Typography variant="body2">{previewData.aadhar || '-'}</Typography></Box>
                  <Box><Typography variant="caption" color="textSecondary">APAAR ID</Typography><Typography variant="body2">{previewData.apaar || '-'}</Typography></Box>
                </Box>
              </Box>

              {/* Guardian Details */}
              <Box sx={{ background: '#F4F5F7', borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#6554C0', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <FamilyRestroomIcon fontSize="small" /> Guardian Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Box><Typography variant="caption" color="textSecondary">Father's Name</Typography><Typography variant="body2">{previewData.fatherName || '-'}</Typography></Box>
                  <Box><Typography variant="caption" color="textSecondary">Father's Mobile</Typography><Typography variant="body2">{previewData.fatherMobile || '-'}</Typography></Box>
                  <Box><Typography variant="caption" color="textSecondary">Mother's Name</Typography><Typography variant="body2">{previewData.motherName || '-'}</Typography></Box>
                  <Box><Typography variant="caption" color="textSecondary">Mother's Mobile</Typography><Typography variant="body2">{previewData.motherMobile || '-'}</Typography></Box>
                </Box>
              </Box>

              {/* Contact Details */}
              <Box sx={{ background: '#F4F5F7', borderRadius: 2, p: 2 }}>
                <Typography variant="subtitle2" sx={{ color: '#00A3BF', fontWeight: 600, mb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ContactPhoneIcon fontSize="small" /> Contact & Address
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.5 }}>
                  <Box><Typography variant="caption" color="textSecondary">Email</Typography><Typography variant="body2">{previewData.email || '-'}</Typography></Box>
                  <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" color="textSecondary">Address</Typography><Typography variant="body2">{previewData.address || '-'}</Typography></Box>
                </Box>
              </Box>

              {previewData.note && (
                <Box sx={{ background: '#FFF3CD', borderRadius: 2, p: 2, border: '1px solid #FFE69C' }}>
                  <Typography variant="caption" color="textSecondary">Additional Notes</Typography>
                  <Typography variant="body2">{previewData.note}</Typography>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #eee' }}>
          <Button onClick={() => setConfirmOpen(false)} variant="outlined" color="inherit">
            Edit Details
          </Button>
          <Button onClick={handleConfirm} variant="contained" sx={{ bgcolor: '#36B37E', '&:hover': { bgcolor: '#2D9A6B' } }}>
            ✓ Confirm & Save
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default App;
