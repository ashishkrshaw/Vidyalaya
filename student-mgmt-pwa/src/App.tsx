import { useState, useEffect } from 'react';

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
import SettingsIcon from '@mui/icons-material/Settings';
import AcademicSettings from './AcademicSettings';
import PaymentIcon from '@mui/icons-material/Payment';
import FeeManagement from './FeeManagement';
import DownloadIcon from '@mui/icons-material/Download';
import BadgeIcon from '@mui/icons-material/Badge';
import { addAdmission, getAdmissions, addHistoryEntry, getNextRollNoForClass, loadSchoolInfo, loadSchoolLogo, loadPrincipalSignature } from './db';
import jsPDF from 'jspdf';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BarChartIcon from '@mui/icons-material/BarChart';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import Chatbot from './Chatbot';
import Login from './Login';
import './Chatbot.css';
import './App.css';
import Statistics from './Statistics';
import Dashboard from './Dashboard';

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
  { key: 'fee', label: 'Fee Management', icon: <PaymentIcon /> },
  { key: 'stats', label: 'Statistics', icon: <BarChartIcon /> },
  { key: 'history', label: 'History', icon: <HistoryIcon /> },
  { key: 'settings', label: 'Settings', icon: <SettingsIcon /> },
];

function App() {
  const [menu, setMenu] = useState<'student' | 'show' | 'history' | 'settings' | 'fee' | 'stats'>('student');
  const [previewData, setPreviewData] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [formKey, setFormKey] = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [admissionSuccess, setAdmissionSuccess] = useState(false);
  const [savedStudent, setSavedStudent] = useState<any | null>(null);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Check if already logged in and load School Info
  useEffect(() => {
    const initApp = async () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      if (isLoggedIn) {
        setLoggedIn(true);
        setIsDataReady(true);

        // Load latest school name from DB
        try {
          const info = await loadSchoolInfo();
          if (info && info.name) {
            setSchoolName(info.name);
            localStorage.setItem('schoolName', info.name); // Keep sync
          } else {
            setSchoolName(localStorage.getItem('schoolName') || import.meta.env.VITE_SCHOOL_NAME || 'School');
          }
        } catch (e) {
          setSchoolName(localStorage.getItem('schoolName') || import.meta.env.VITE_SCHOOL_NAME || 'School');
        }
      }
    };
    initApp();
  }, []);

  // Handle login from Login component
  const handleLogin = (name: string) => {
    setLoggedIn(true);
    setSchoolName(name);
    setIsDataReady(true);
  };

  useEffect(() => {
    const handleChatbotNavigation = (event: CustomEvent) => {
      const section = event.detail;
      if (section && menuItems.find(item => item.key === section)) {
        setMenu(section);
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
      setSavedStudent(previewData);
      setConfirmOpen(false);
      setAdmissionSuccess(true);
      setFormKey(prevKey => prevKey + 1);
    } catch (error) {
      console.error("Error in handleConfirm:", error);
    }
  };

  const downloadAdmissionReceipt = async () => {
    if (!savedStudent) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const margin = 15;

    // Load school info
    const schoolInfo = await loadSchoolInfo();
    const schoolLogo = await loadSchoolLogo();

    // Header section
    let y = 15;

    // School Logo
    if (schoolLogo && typeof schoolLogo === 'string' && schoolLogo.startsWith('data:')) {
      try {
        doc.addImage(schoolLogo, 'PNG', margin, y, 22, 22);
      } catch (e) {
        doc.setFillColor(30, 58, 138);
        doc.rect(margin, y, 22, 22, 'F');
      }
    } else {
      doc.setFillColor(30, 58, 138);
      doc.rect(margin, y, 22, 22, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(8);
      doc.text('LOGO', margin + 11, y + 12, { align: 'center' });
    }

    // School name
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolInfo.name.toUpperCase(), 105, y + 8, { align: 'center' });

    doc.setTextColor(85, 85, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(schoolInfo.address, 105, y + 14, { align: 'center' });
    doc.text(`Ph: ${schoolInfo.phone} | Email: ${schoolInfo.email}`, 105, y + 19, { align: 'center' });

    // Student Photo with proper border
    const photoX = pageWidth - margin - 22;
    const photoY = y;
    const photoW = 22;
    const photoH = 28;

    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, photoW, photoH);

    if (savedStudent.photoData) {
      try {
        doc.addImage(savedStudent.photoData, 'JPEG', photoX + 1, photoY + 1, photoW - 2, photoH - 2);
      } catch (e) { }
    } else {
      doc.setFillColor(243, 244, 246);
      doc.rect(photoX + 1, photoY + 1, photoW - 2, photoH - 2, 'F');
      doc.setTextColor(150, 150, 150);
      doc.setFontSize(6);
      doc.text('Photo', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }

    // Blue separator
    y = 45;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    // Title
    y = 53;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(70, y - 3, 70, 10, 2, 2, 'F');
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ADMISSION RECEIPT', 105, y + 4, { align: 'center' });

    // Admission details
    y = 72;
    const labelWidth = 45;
    doc.setFontSize(10);

    const details = [
      { label: 'Admission Date', value: new Date().toLocaleDateString('en-IN') },
      { label: 'Student ID', value: savedStudent.studentId },
      { label: 'Student Name', value: savedStudent.name },
      { label: 'Class / Section', value: `${savedStudent.class} - ${savedStudent.section}` },
      { label: 'Roll Number', value: savedStudent.rollNo || '-' },
      { label: 'Date of Birth', value: savedStudent.dob || '-' },
      { label: "Father's Name", value: savedStudent.fatherName || '-' },
      { label: "Mother's Name", value: savedStudent.motherName || '-' },
      { label: 'Contact Number', value: savedStudent.fatherMobile || savedStudent.parentMobile || '-' },
      { label: 'Address', value: savedStudent.address || '-' },
      { label: 'Aadhar Number', value: savedStudent.aadhar || '-' },
    ];

    details.forEach((item) => {
      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'bold');
      doc.text(item.label + ':', margin, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(item.value.toString(), margin + labelWidth, y);
      y += 8;
    });

    // Footer - Only Principal (removed guardian)
    y = 185;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0);

    y += 15;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - margin - 55, y, pageWidth - margin - 5, y);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Principal / Authorized Signatory', pageWidth - margin - 30, y + 6, { align: 'center' });

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('This is a computer generated admission receipt.', 105, 220, { align: 'center' });

    doc.save(`Admission_Receipt_${savedStudent.name}_${savedStudent.studentId}.pdf`);
  };

  const downloadIdCardPDF = async () => {
    if (!savedStudent) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85, 130] });
    const pageWidth = 85;
    const margin = 5;

    // Load school info
    const schoolInfo = await loadSchoolInfo();
    const schoolLogo = await loadSchoolLogo();
    const principalSig = await loadPrincipalSignature();

    // Header background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Teal accent
    doc.setFillColor(20, 184, 166);
    doc.circle(pageWidth + 5, -5, 25, 'F');

    // School logo box
    if (schoolLogo && typeof schoolLogo === 'string' && schoolLogo.startsWith('data:')) {
      try {
        doc.addImage(schoolLogo, 'PNG', 8, 8, 8, 8);
      } catch (e) {
        doc.setFillColor(20, 184, 166);
        doc.roundedRect(8, 8, 8, 8, 1, 1, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(6);
        doc.text(schoolInfo.name.charAt(0), 12, 13, { align: 'center' });
      }
    } else {
      doc.setFillColor(20, 184, 166);
      doc.roundedRect(8, 8, 8, 8, 1, 1, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(6);
      doc.text(schoolInfo.name.charAt(0), 12, 13, { align: 'center' });
    }

    // School name
    doc.setTextColor(45, 212, 191);
    doc.setFontSize(6);
    doc.setFont('helvetica', 'bold');
    doc.text(schoolInfo.name.toUpperCase(), pageWidth / 2 + 5, 12, { align: 'center' });

    // STUDENT ID text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('STUDENT ID', pageWidth / 2, 22, { align: 'center' });

    // Photo frame
    const photoSize = 28;
    const photoX = (pageWidth - photoSize) / 2;
    const photoY = 30;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4, 2, 2, 'F');

    if (savedStudent.photoData) {
      try {
        doc.addImage(savedStudent.photoData, 'JPEG', photoX, photoY, photoSize, photoSize);
      } catch (e) {
        doc.setFillColor(241, 245, 249);
        doc.rect(photoX, photoY, photoSize, photoSize, 'F');
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(6);
        doc.text('Photo', photoX + photoSize / 2, photoY + photoSize / 2, { align: 'center' });
      }
    } else {
      doc.setFillColor(241, 245, 249);
      doc.rect(photoX, photoY, photoSize, photoSize, 'F');
      doc.setTextColor(148, 163, 184);
      doc.setFontSize(6);
      doc.text('Photo', photoX + photoSize / 2, photoY + photoSize / 2, { align: 'center' });
    }

    // Student name
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(savedStudent.name, pageWidth / 2, 68, { align: 'center' });

    // Class
    doc.setTextColor(13, 148, 136);
    doc.setFontSize(7);
    doc.text(`Class ${savedStudent.class} - ${savedStudent.section}`, pageWidth / 2, 73, { align: 'center' });

    // Data grid
    let y = 80;
    doc.setFontSize(5);

    // Row 1
    doc.setTextColor(148, 163, 184);
    doc.text('STUDENT ID', margin + 2, y);
    doc.text('ROLL NO', pageWidth - margin - 2, y, { align: 'right' });
    y += 3;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7);
    doc.text(savedStudent.studentId || '-', margin + 2, y);
    doc.text(savedStudent.rollNo || '-', pageWidth - margin - 2, y, { align: 'right' });

    // Row 2
    y += 6;
    doc.setFontSize(5);
    doc.setTextColor(148, 163, 184);
    doc.text('DATE OF BIRTH', margin + 2, y);
    doc.text('VALID TILL', pageWidth - margin - 2, y, { align: 'right' });
    y += 3;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(7);
    doc.text(savedStudent.dob || '-', margin + 2, y);
    const expiryYear = new Date().getMonth() >= 3 ? new Date().getFullYear() + 1 : new Date().getFullYear();
    doc.setTextColor(239, 68, 68);
    doc.text(`Mar ${expiryYear}`, pageWidth - margin - 2, y, { align: 'right' });

    // Emergency
    y += 7;
    doc.setDrawColor(241, 245, 249);
    doc.line(margin, y - 2, pageWidth - margin, y - 2);
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(5);
    doc.text(`Emergency: ${savedStudent.fatherMobile || savedStudent.parentMobile || '-'}`, pageWidth / 2, y + 2, { align: 'center' });

    // Footer with QR and signature
    const footerY = 105;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY, pageWidth, 25, 'F');

    // QR Code - embedded as text placeholder (actual QR would need canvas)
    doc.setFillColor(255, 255, 255);
    doc.rect(margin, footerY + 3, 15, 15, 'F');
    doc.setTextColor(100);
    doc.setFontSize(4);
    doc.text('QR', margin + 7.5, footerY + 11, { align: 'center' });

    // Signature
    if (principalSig && typeof principalSig === 'string') {
      try {
        doc.addImage(principalSig, 'PNG', pageWidth - margin - 25, footerY + 3, 22, 10);
      } catch (e) { }
    }
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(4);
    doc.text('PRINCIPAL', pageWidth - margin - 12, footerY + 17, { align: 'center' });

    // Bottom accent
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 128, pageWidth, 2, 'F');

    doc.save(`ID_Card_${savedStudent.name}_${savedStudent.studentId}.pdf`);
  };

  // Unified logout handler
  const handleLogout = () => {
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('loginTime');
    localStorage.removeItem('schoolName');
    setLoggedIn(false);
    setIsDataReady(false);
  };

  // Show Login page if not logged in
  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
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
              {menu === 'history' && <HistorySection />}
              {menu === 'settings' && <AcademicSettings />}
              {menu === 'fee' && <FeeManagement />}
              {menu === 'stats' && <Statistics mode={mode} />}
            </>
          ) : (
            <Dashboard onMenuClick={setMenu as any} styles={styles} schoolName={schoolName} />
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

      {/* Admission Success Dialog */}
      <Dialog open={admissionSuccess} onClose={() => setAdmissionSuccess(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{
          background: 'linear-gradient(135deg, #36B37E 0%, #00A3BF 100%)',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'center'
        }}>
          <CheckCircleIcon /> Admission Successful!
        </DialogTitle>
        <DialogContent sx={{ p: 4, textAlign: 'center' }}>
          {savedStudent && (
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                {savedStudent.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                Class {savedStudent.class} - {savedStudent.section} | Roll No: {savedStudent.rollNo}
              </Typography>
              <Typography variant="caption" color="textSecondary" sx={{ mb: 3, display: 'block' }}>
                Student ID: {savedStudent.studentId}
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap', mt: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<DownloadIcon />}
                  onClick={downloadAdmissionReceipt}
                  sx={{
                    bgcolor: '#1e3a8a',
                    '&:hover': { bgcolor: '#1e40af' },
                    px: 2
                  }}
                >
                  Admission Receipt
                </Button>
                <Button
                  variant="contained"
                  startIcon={<BadgeIcon />}
                  onClick={downloadIdCardPDF}
                  sx={{
                    bgcolor: '#14b8a6',
                    '&:hover': { bgcolor: '#0d9488' },
                    px: 2
                  }}
                >
                  ID Card
                </Button>
              </Box>

              <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 2 }}>
                Download admission receipt and student ID card
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, justifyContent: 'center', borderTop: '1px solid #eee' }}>
          <Button
            onClick={() => { setAdmissionSuccess(false); setSavedStudent(null); }}
            variant="outlined"
          >
            Close
          </Button>
          <Button
            onClick={() => { setAdmissionSuccess(false); setSavedStudent(null); setMenu('fee'); }}
            variant="contained"
            sx={{ bgcolor: '#36B37E' }}
          >
            Collect Fee Now
          </Button>
        </DialogActions>
      </Dialog>

      <Chatbot />
    </div>
  );
}

export default App;
