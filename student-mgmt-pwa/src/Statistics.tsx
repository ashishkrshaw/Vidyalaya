import { useState, useEffect } from 'react';
import { Box, Card, Typography, Divider } from '@mui/material';

const Statistics = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get admissions and fee map from local storage
        const admissions = await (await import('./db')).getAdmissions();
  // Removed unused feeMap
        let totalStudents = admissions.length;
        let totalFee = 0;
        let totalDues = 0;
        admissions.forEach(student => {
          // Sum all payments
          if (Array.isArray(student.feeHistory)) {
            totalFee += student.feeHistory.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
          }
          totalDues += Number(student.dues) || 0;
        });
        setStats({ totalStudents, totalFee, totalDues });
      } catch (e) {
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <Box sx={{ mt: 4, mb: 4, width: '100%', maxWidth: 700, mx: 'auto' }}>
      <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>School Statistics</Typography>
        <Divider sx={{ my: 2 }} />
        {loading ? (
          <Typography variant="body2">Loading statistics...</Typography>
        ) : stats ? (
          <Box>
            <Typography variant="body1">Total Students: {stats.totalStudents}</Typography>
            <Typography variant="body1">Total Fee Collected: ₹{stats.totalFee}</Typography>
            <Typography variant="body1">Outstanding Dues: ₹{stats.totalDues}</Typography>
            {/* Add more stats as needed */}
          </Box>
        ) : (
          <Typography variant="body2" color="error">Failed to load statistics.</Typography>
        )}
      </Card>
    </Box>
  );
};

export default Statistics;
