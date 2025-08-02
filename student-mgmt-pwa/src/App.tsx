import { useState } from 'react';
import { Box, CssBaseline, Drawer, Toolbar, AppBar, Typography, List, ListItem, ListItemText, Dialog, DialogTitle, DialogContent, DialogActions, Button, Card, Avatar, ListItemIcon, TextField } from '@mui/material';
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

const drawerWidth = 240;
const SCHOOL_NAME = 'School'; // You can change this to your actual school name

function generateStudentId(schoolName: string, year: number, rollNo: number, seq: number) {
  const firstLetter = schoolName[0].toUpperCase();
  const yr = String(year).slice(-2);
  const rno = rollNo.toString().padStart(2, '0');
  const last4 = seq.toString().padStart(4, '0');
  return `${firstLetter}${yr},${rno},${last4}`;
}

function App() {
  const [menu, setMenu] = useState<'student' | 'show' | 'history' | 'updateDelete' | 'settings' | 'fee'>('student');
  const [previewData, setPreviewData] = useState<any>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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

  // Preview handler: get next student sequence and generate studentId
  const handlePreview = async (data: any) => {
    const year = new Date().getFullYear();
    const rollNo = await getNextRollNo(data.class, data.section);
    const seq = await getNextStudentSeq();
    const studentId = generateStudentId(SCHOOL_NAME, year, rollNo, seq);
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
    if (loginPassword === '825419') {
      setLoggedIn(true);
      setLoginPassword('');
      setLoginError('');
    } else {
      setLoginError('Incorrect password.');
    }
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', background: 'linear-gradient(135deg, #e3f0ff 0%, #f9f9f9 100%)' }}>
      <CssBaseline />
      {/* Login Dialog */}
      <Dialog open={!loggedIn} disableEscapeKeyDown>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LockIcon /> Login Required</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Enter profile password to access the app.</Typography>
          <TextField
            label="Password"
            type="password"
            value={loginPassword}
            onChange={e => setLoginPassword(e.target.value)}
            fullWidth
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }}
            error={!!loginError}
            helperText={loginError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleLogin} variant="contained">Login</Button>
        </DialogActions>
        <Box sx={{ width: '100%', textAlign: 'center', mt: 2 }}>
          <Typography variant="caption" color="text.secondary">© All rights reserved | ASK Ltd</Typography>
        </Box>
      </Dialog>
      {/* Main App UI, only visible after login */}
      {loggedIn && (
        <>
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, background: 'linear-gradient(90deg, #1976d2 60%, #21cbf3 100%)' }}>
            <Toolbar>
              <SchoolIcon sx={{ mr: 2 }} />
              <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 700, letterSpacing: 2 }}>
                {SCHOOL_NAME} Student Management
              </Typography>
            </Toolbar>
          </AppBar>
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: {
                width: drawerWidth,
                boxSizing: 'border-box',
                background: 'linear-gradient(135deg, #1976d2 60%, #21cbf3 100%)',
                color: '#fff',
                border: 0,
              },
            }}
          >
            <Toolbar />
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
              <Avatar sx={{ bgcolor: '#fff', color: '#1976d2', width: 64, height: 64, mb: 1 }}>
                <SchoolIcon fontSize="large" />
              </Avatar>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#fff', mb: 2 }}>{SCHOOL_NAME}</Typography>
            </Box>
            <List>
              <ListItem sx={{ borderRadius: 2, mx: 1, my: 0.5, cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.08)' }, background: menu === 'student' ? 'rgba(255,255,255,0.16)' : 'none' }} onClick={() => setMenu('student')}>
                <ListItemIcon sx={{ color: '#fff' }}><PersonAddIcon /></ListItemIcon>
                <ListItemText primary="New Admission" />
              </ListItem>
              <ListItem sx={{ borderRadius: 2, mx: 1, my: 0.5, cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.08)' }, background: menu === 'show' ? 'rgba(255,255,255,0.16)' : 'none' }} onClick={() => setMenu('show')}>
                <ListItemIcon sx={{ color: '#fff' }}><SearchIcon /></ListItemIcon>
                <ListItemText primary="Show Student" />
              </ListItem>
              <ListItem sx={{ borderRadius: 2, mx: 1, my: 0.5, cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.08)' }, background: menu === 'history' ? 'rgba(255,255,255,0.16)' : 'none' }} onClick={() => setMenu('history')}>
                <ListItemIcon sx={{ color: '#fff' }}><HistoryIcon /></ListItemIcon>
                <ListItemText primary="History" />
              </ListItem>
              <ListItem sx={{ borderRadius: 2, mx: 1, my: 0.5, cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.08)' }, background: menu === 'updateDelete' ? 'rgba(255,255,255,0.16)' : 'none' }} onClick={() => setMenu('updateDelete')}>
                <ListItemIcon sx={{ color: '#fff' }}><EditNoteIcon /></ListItemIcon>
                <ListItemText primary="Update/Delete Student" />
              </ListItem>
              <ListItem sx={{ borderRadius: 2, mx: 1, my: 0.5, cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.08)' }, background: menu === 'fee' ? 'rgba(255,255,255,0.16)' : 'none' }} onClick={() => setMenu('fee')}>
                <ListItemIcon sx={{ color: '#fff' }}><PaymentIcon /></ListItemIcon>
                <ListItemText primary="Fee Management" />
              </ListItem>
              <ListItem sx={{ borderRadius: 2, mx: 1, my: 0.5, cursor: 'pointer', '&:hover': { background: 'rgba(255,255,255,0.08)' }, background: menu === 'settings' ? 'rgba(255,255,255,0.16)' : 'none' }} onClick={() => setMenu('settings')}>
                <ListItemIcon sx={{ color: '#fff' }}><SettingsIcon /></ListItemIcon>
                <ListItemText primary="Academic Settings" />
              </ListItem>
            </List>
          </Drawer>
          <Box component="main" sx={{ flexGrow: 1, p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh' }}>
            <Toolbar />
            {menu === 'student' ? (
              <Card sx={{ width: '100%', maxWidth: 600, p: 4, boxShadow: 6, borderRadius: 4, mt: 4 }}>
                <Typography variant="h5" gutterBottom align="center">New Admission</Typography>
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
            {/* Preview Dialog */}
            <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
              <DialogTitle>Confirm Admission</DialogTitle>
              <DialogContent>
                <pre>{JSON.stringify(previewData, null, 2)}</pre>
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                <Button onClick={handleConfirm} variant="contained">Confirm</Button>
              </DialogActions>
            </Dialog>
            {/* Success Message */}
            {successMsg && (
              <Box sx={{ mt: 2, color: 'green', fontWeight: 600, fontSize: 18 }}>{successMsg}</Box>
            )}
          </Box>
    </>
      )}
    </Box>
  );
}

export default App;
