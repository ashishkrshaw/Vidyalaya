import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Typography, 
  Card, 
  Button, 
  Grid, 
  AppBar, 
  Toolbar, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  IconButton,
  Divider
} from '@mui/material';
import {
  PersonAdd as PersonAddIcon,
  People as PeopleIcon,
  Payment as PaymentIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Logout as LogoutIcon,
  Menu as MenuIcon
} from '@mui/icons-material';
import AdmissionForm from './AdmissionForm';
import ShowStudent from './ShowStudent';
import FeeManagement from './FeeManagement';
import AcademicSettings from './AcademicSettings';
import HistorySection from './HistorySection';
import { getAdmissionsByClassSection } from './db';

interface SchoolDashboardProps {
  user: any;
  schoolInfo: any;
  onLogout: () => void;
}

const SchoolDashboard: React.FC<SchoolDashboardProps> = ({ user, schoolInfo, onLogout }) => {
  const [currentView, setCurrentView] = useState<'admission' | 'students' | 'fees' | 'settings' | 'history'>('admission');
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Store school info in localStorage for components to access
  useEffect(() => {
    if (schoolInfo) {
      localStorage.setItem('schoolId', schoolInfo.schoolId);
      localStorage.setItem('schoolName', schoolInfo.schoolName);
    }
  }, [schoolInfo]);

  const menuItems = [
    { id: 'admission', label: 'Admission Form', icon: <PersonAddIcon /> },
    { id: 'students', label: 'Student Management', icon: <PeopleIcon /> },
    { id: 'fees', label: 'Fee Management', icon: <PaymentIcon /> },
    { id: 'settings', label: 'Academic Settings', icon: <SettingsIcon /> },
    { id: 'history', label: 'History', icon: <HistoryIcon /> },
  ];

  const getNextRollNo = async (cls: string, section: string): Promise<number> => {
    try {
      const students = await getAdmissionsByClassSection(cls, section);
      if (students.length === 0) return 1;
      const maxRollNo = Math.max(...students.map((s: any) => parseInt(s.rollNo) || 0));
      return maxRollNo + 1;
    } catch (error) {
      console.error('Error getting next roll number:', error);
      return 1;
    }
  };

  const handlePreview = (data: any) => {
    console.log('Preview data:', data);
    // Handle preview logic here
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'admission':
        return <AdmissionForm onPreview={handlePreview} getNextRollNo={getNextRollNo} />;
      case 'students':
        return <ShowStudent />;
      case 'fees':
        return <FeeManagement />;
      case 'settings':
        return <AcademicSettings />;
      case 'history':
        return <HistorySection />;
      default:
        return <AdmissionForm onPreview={handlePreview} getNextRollNo={getNextRollNo} />;
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    onLogout();
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setDrawerOpen(!drawerOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {schoolInfo?.schoolName || 'School Management System'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2">
              Welcome, {user?.username}
            </Typography>
            <Button color="inherit" onClick={handleLogout} startIcon={<LogoutIcon />}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: 240, boxSizing: 'border-box' },
          display: { xs: 'none', sm: 'block' }
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.id}
                onClick={() => setCurrentView(item.id as any)}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: currentView === item.id ? 'primary.light' : 'transparent',
                  '&:hover': {
                    backgroundColor: currentView === item.id ? 'primary.light' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ color: currentView === item.id ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: 240 },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.id}
                onClick={() => {
                  setCurrentView(item.id as any);
                  setDrawerOpen(false);
                }}
                sx={{
                  cursor: 'pointer',
                  backgroundColor: currentView === item.id ? 'primary.light' : 'transparent',
                  '&:hover': {
                    backgroundColor: currentView === item.id ? 'primary.light' : 'action.hover',
                  },
                }}
              >
                <ListItemIcon sx={{ color: currentView === item.id ? 'primary.main' : 'inherit' }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Box sx={{ mt: 2 }}>
          {renderCurrentView()}
        </Box>
      </Box>
    </Box>
  );
};

export default SchoolDashboard; 