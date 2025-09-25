import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  useTheme,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import HistoryIcon from '@mui/icons-material/History';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PaymentIcon from '@mui/icons-material/Payment';
import SettingsIcon from '@mui/icons-material/Settings';

const menuItems = [
  { key: 'student', label: 'New Admission', icon: <PersonAddIcon fontSize="large" />, emoji: '👨‍🎓' },
  { key: 'show', label: 'Show Student', icon: <SearchIcon fontSize="large" />, emoji: '🔍' },
  { key: 'history', label: 'History', icon: <HistoryIcon fontSize="large" />, emoji: '📚' },
  { key: 'updateDelete', label: 'Update/Delete Student', icon: <EditNoteIcon fontSize="large" />, emoji: '✏️' },
  { key: 'fee', label: 'Fee Management', icon: <PaymentIcon fontSize="large" />, emoji: '💰' },
  { key: 'settings', label: 'Academic Settings', icon: <SettingsIcon fontSize="large" />, emoji: '⚙️' },
];

interface DashboardProps {
  onMenuClick: (menu: string) => void;
  styles: any;
}

const Dashboard: React.FC<DashboardProps> = ({ onMenuClick, styles }) => {
  const theme = useTheme();

  return (
    <Box sx={{ flexGrow: 1, p: 3, width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 4, fontWeight: 700, textAlign: 'center', color: theme.palette.text.primary }}>
        School Dashboard
      </Typography>
      <Grid container spacing={4} justifyContent="center">
        {menuItems.map((item) => (
          <Grid item xs={12} sm={6} md={4} key={item.key}>
            <Card 
              sx={{
                ...styles.mainCard,
                cursor: 'pointer',
                transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-10px)',
                  boxShadow: theme.shadows[10],
                },
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                minHeight: 200,
              }}
              onClick={() => onMenuClick(item.key)}
            >
              <CardContent sx={{ textAlign: 'center', p: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ fontSize: '3.5rem' }}>{item.emoji}</Typography>
                <Typography variant="h6" component="div" sx={{ mt: 2, fontWeight: 600, color: theme.palette.text.primary }}>
                  {item.label}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Dashboard;