import { useState, useEffect } from 'react';
import { Box, Card, Typography, LinearProgress, CircularProgress } from '@mui/material';
import { 
  School, 
  Payment, 
  AccountBalanceWallet, 
  TrendingUp,
  Group,
  AttachMoney
} from '@mui/icons-material';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  percentage?: number;
  mode: 'light' | 'dark';
}

const StatCard = ({ title, value, icon, color, percentage, mode }: StatCardProps) => (
  <Card sx={{ 
    p: { xs: 2, sm: 3 }, 
    borderRadius: 3, 
    background: `linear-gradient(135deg, ${color}15 0%, ${color}08 100%)`,
    border: `1px solid ${color}40`,
    position: 'relative',
    overflow: 'hidden',
    boxShadow: mode === 'dark' 
      ? '0 4px 12px rgba(0,0,0,0.3)' 
      : '0 4px 12px rgba(0,0,0,0.1)',
    backgroundColor: mode === 'dark' 
      ? 'rgba(30, 30, 30, 0.8)' 
      : 'rgba(255, 255, 255, 0.9)',
    '&::before': {
      content: '""',
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '4px',
      background: color,
    }
  }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <Box>
        <Typography variant="h4" fontWeight="bold" sx={{ 
          color: color, 
          textShadow: '0 1px 2px rgba(0,0,0,0.1)',
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }
        }}>
          {value}
        </Typography>
        <Typography variant="subtitle1" sx={{ 
          mt: 0.5, 
          color: mode === 'dark' ? '#ffffff' : '#1a202c', 
          fontWeight: 600,
          fontSize: { xs: '0.875rem', sm: '1rem' }
        }}>
          {title}
        </Typography>
        {percentage !== undefined && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress 
              variant="determinate" 
              value={isNaN(percentage) ? 0 : Math.min(Math.max(percentage, 0), 100)} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: `${color}20`,
                '& .MuiLinearProgress-bar': {
                  backgroundColor: color,
                  borderRadius: 4
                }
              }} 
            />
            <Typography variant="caption" sx={{ 
              mt: 0.5, 
              display: 'block', 
              color: mode === 'dark' ? 'rgba(255, 255, 255, 0.8)' : 'rgba(26, 32, 44, 0.8)', 
              fontWeight: 500 
            }}>
              {isNaN(percentage) ? '0.0' : percentage.toFixed(1)}% of target
            </Typography>
          </Box>
        )}
      </Box>
      <Box sx={{ 
        color: color, 
        opacity: 0.7,
        display: { xs: 'none', sm: 'block' }
      }}>
        {icon}
      </Box>
    </Box>
  </Card>
);

const ClassChart = ({ classData, mode }: { classData: any[], mode: 'light' | 'dark' }) => {
  const maxStudents = Math.max(...classData.map(c => c.count));
  
  return (
    <Card sx={{ 
      p: { xs: 2, sm: 3 }, 
      borderRadius: 3,
      backgroundColor: mode === 'dark' 
        ? 'rgba(30, 30, 30, 0.8)' 
        : 'rgba(255, 255, 255, 0.9)',
      boxShadow: mode === 'dark' 
        ? '0 4px 12px rgba(0,0,0,0.3)' 
        : '0 4px 12px rgba(0,0,0,0.1)',
    }}>
      <Typography variant="h6" fontWeight="bold" gutterBottom sx={{
        color: mode === 'dark' ? '#ffffff' : '#1a202c'
      }}>
        📊 Class-wise Distribution
      </Typography>
      <Box sx={{ mt: 2 }}>
        {classData.map((classItem, index) => (
          <Box key={index} sx={{ mb: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
              <Typography variant="body2" fontWeight="medium" sx={{
                color: mode === 'dark' ? '#ffffff' : '#1a202c'
              }}>
                {classItem.class}
              </Typography>
              <Typography variant="body2" color="primary">
                {classItem.count} students
              </Typography>
            </Box>
            <LinearProgress 
              variant="determinate" 
              value={(classItem.count / maxStudents) * 100} 
              sx={{ 
                height: 8, 
                borderRadius: 4,
                backgroundColor: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0',
                '& .MuiLinearProgress-bar': {
                  background: `linear-gradient(45deg, #2196F3 ${index * 20}%, #21CBF3 ${100 - index * 10}%)`,
                  borderRadius: 4
                }
              }} 
            />
          </Box>
        ))}
      </Box>
    </Card>
  );
};

interface StatisticsProps {
  mode: 'light' | 'dark';
}

const Statistics = ({ mode }: StatisticsProps) => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get admissions and fee map from local storage
        const admissions = await (await import('./db')).getAdmissions();
        
        let totalStudents = admissions.length;
        let totalFee = 0;
        let totalDues = 0;
        let classStats: { [key: string]: number } = {};
        let maleCount = 0;
        let femaleCount = 0;
        
        admissions.forEach(student => {
          // Sum all payments
          if (Array.isArray(student.feeHistory)) {
            totalFee += student.feeHistory.reduce((sum: number, p: any) => sum + (Number(p.amount) || 0), 0);
          }
          totalDues += Number(student.dues) || 0;
          
          // Class statistics
          const className = student.class || 'Unknown';
          classStats[className] = (classStats[className] || 0) + 1;
          
          // Gender statistics
          if (student.gender?.toLowerCase() === 'male') maleCount++;
          else if (student.gender?.toLowerCase() === 'female') femaleCount++;
        });
        
        const classData = Object.entries(classStats).map(([className, count]) => ({
          class: className,
          count: count
        })).sort((a, b) => b.count - a.count);
        
        const collectionRate = (totalFee + totalDues) > 0 ? ((totalFee / (totalFee + totalDues)) * 100) : 0;
        
        setStats({ 
          totalStudents, 
          totalFee, 
          totalDues,
          classData,
          maleCount,
          femaleCount,
          collectionRate
        });
      } catch (e) {
        console.error('Error fetching statistics:', e);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  return (
    <Box sx={{ 
      p: { xs: 2, sm: 3 }, 
      maxWidth: 1200, 
      mx: 'auto',
      color: mode === 'dark' ? '#ffffff' : '#1a202c'
    }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom sx={{ 
        mb: 3,
        color: mode === 'dark' ? '#ffffff' : '#1a202c',
        fontSize: { xs: '1.75rem', sm: '2rem', md: '2.125rem' }
      }}>
        📊 School Statistics Dashboard
      </Typography>
      
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
          <CircularProgress size={60} />
          <Typography variant="h6" sx={{ 
            ml: 2,
            color: mode === 'dark' ? '#ffffff' : '#1a202c'
          }}>Loading statistics...</Typography>
        </Box>
      ) : stats ? (
        <Box>
          {/* Main Statistics Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { 
              xs: '1fr', 
              sm: 'repeat(2, 1fr)', 
              md: 'repeat(4, 1fr)' 
            },
            gap: 3,
            mb: 4 
          }}>
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              icon={<Group sx={{ fontSize: 48 }} />}
              color="#2196F3"
              percentage={Math.min((stats.totalStudents / 1000) * 100, 100)}
              mode={mode}
            />
            
            <StatCard
              title="Fee Collected"
              value={`₹${stats.totalFee.toLocaleString()}`}
              icon={<Payment sx={{ fontSize: 48 }} />}
              color="#4CAF50"
              percentage={isNaN(stats.collectionRate) ? 0 : stats.collectionRate}
              mode={mode}
            />
            
            <StatCard
              title="Outstanding Dues"
              value={`₹${stats.totalDues.toLocaleString()}`}
              icon={<AccountBalanceWallet sx={{ fontSize: 48 }} />}
              color="#FF9800"
              percentage={isNaN(stats.collectionRate) ? 0 : Math.max(100 - stats.collectionRate, 0)}
              mode={mode}
            />
            
            <StatCard
              title="Collection Rate"
              value={`${isNaN(stats.collectionRate) ? '0.0' : stats.collectionRate.toFixed(1)}%`}
              icon={<TrendingUp sx={{ fontSize: 48 }} />}
              color="#9C27B0"
              percentage={isNaN(stats.collectionRate) ? 0 : stats.collectionRate}
              mode={mode}
            />
          </Box>

          {/* Charts Section */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3,
            mb: 4 
          }}>
            <ClassChart classData={stats.classData} mode={mode} />
            
            <Box>
              <Card sx={{ 
                p: { xs: 2, sm: 3 }, 
                borderRadius: 3,
                backgroundColor: mode === 'dark' 
                  ? 'rgba(30, 30, 30, 0.8)' 
                  : 'rgba(255, 255, 255, 0.9)',
                boxShadow: mode === 'dark' 
                  ? '0 4px 12px rgba(0,0,0,0.3)' 
                  : '0 4px 12px rgba(0,0,0,0.1)',
              }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom sx={{
                  color: mode === 'dark' ? '#ffffff' : '#1a202c'
                }}>
                  👥 Gender Distribution
                </Typography>
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      background: '#2196F3',
                      mr: 2 
                    }} />
                    <Typography variant="body2" sx={{ 
                      flex: 1,
                      color: mode === 'dark' ? '#ffffff' : '#1a202c'
                    }}>Male Students</Typography>
                    <Typography variant="h6" color="primary">{stats.maleCount}</Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                    <Box sx={{ 
                      width: 20, 
                      height: 20, 
                      borderRadius: '50%', 
                      background: '#E91E63',
                      mr: 2 
                    }} />
                    <Typography variant="body2" sx={{ 
                      flex: 1,
                      color: mode === 'dark' ? '#ffffff' : '#1a202c'
                    }}>Female Students</Typography>
                    <Typography variant="h6" sx={{ color: '#E91E63' }}>{stats.femaleCount}</Typography>
                  </Box>

                  {/* Simple Pie Chart Visualization */}
                  <Box sx={{ 
                    display: 'flex', 
                    height: 20, 
                    borderRadius: 10,
                    overflow: 'hidden',
                    background: mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0'
                  }}>
                    <Box sx={{ 
                      width: `${(stats.maleCount / (stats.maleCount + stats.femaleCount)) * 100}%`,
                      background: '#2196F3',
                      transition: 'width 1s ease'
                    }} />
                    <Box sx={{ 
                      width: `${(stats.femaleCount / (stats.maleCount + stats.femaleCount)) * 100}%`,
                      background: '#E91E63',
                      transition: 'width 1s ease'
                    }} />
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                    <Typography variant="caption" sx={{
                      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 32, 44, 0.7)'
                    }}>
                      {((stats.maleCount / (stats.maleCount + stats.femaleCount)) * 100).toFixed(1)}%
                    </Typography>
                    <Typography variant="caption" sx={{
                      color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 32, 44, 0.7)'
                    }}>
                      {((stats.femaleCount / (stats.maleCount + stats.femaleCount)) * 100).toFixed(1)}%
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Box>
          </Box>

          {/* Summary Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
            gap: 3 
          }}>
            <Card sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', 
              color: 'white',
              boxShadow: mode === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <School sx={{ fontSize: { xs: 36, sm: 48 }, mr: 2, opacity: 0.8 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}>
                    {stats.classData.length} Classes
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    Active academic divisions
                  </Typography>
                </Box>
              </Box>
            </Card>
            
            <Card sx={{ 
              p: { xs: 2, sm: 3 }, 
              borderRadius: 3, 
              background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', 
              color: 'white',
              boxShadow: mode === 'dark' 
                ? '0 4px 12px rgba(0,0,0,0.3)' 
                : '0 4px 12px rgba(0,0,0,0.1)',
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <AttachMoney sx={{ fontSize: { xs: 36, sm: 48 }, mr: 2, opacity: 0.8 }} />
                <Box>
                  <Typography variant="h5" fontWeight="bold" sx={{
                    fontSize: { xs: '1.25rem', sm: '1.5rem' }
                  }}>
                    ₹{(stats.totalFee + stats.totalDues).toLocaleString()}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }
                  }}>
                    Total fee structure
                  </Typography>
                </Box>
              </Box>
            </Card>
          </Box>
        </Box>
      ) : (
        <Card sx={{ 
          p: { xs: 3, sm: 4 }, 
          textAlign: 'center',
          backgroundColor: mode === 'dark' 
            ? 'rgba(30, 30, 30, 0.8)' 
            : 'rgba(255, 255, 255, 0.9)',
          boxShadow: mode === 'dark' 
            ? '0 4px 12px rgba(0,0,0,0.3)' 
            : '0 4px 12px rgba(0,0,0,0.1)',
        }}>
          <Typography variant="h6" color="error" gutterBottom>
            ⚠️ Failed to load statistics
          </Typography>
          <Typography variant="body2" sx={{
            color: mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(26, 32, 44, 0.7)'
          }}>
            Please check your connection and try again.
          </Typography>
        </Card>
      )}
    </Box>
  );
};

export default Statistics;
