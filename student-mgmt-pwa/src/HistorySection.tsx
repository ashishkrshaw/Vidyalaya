import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Card, Chip, useTheme } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getHistory } from './db';

const actionColors: Record<string, { main: string, light: string }> = {
  update: { main: '#2196f3', light: '#e3f2fd' }, // Blue
  delete: { main: '#f44336', light: '#ffebee' }, // Red
  admission_added: { main: '#4caf50', light: '#e8f5e9' }, // Green
};

const HistorySection: React.FC = () => {
  const theme = useTheme();
  const [history, setHistory] = useState<any[]>([]);
  const [openRows, setOpenRows] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getHistory().then(data => {
      // Sort by timestamp descending
      const sortedData = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(sortedData);
    });
  }, []);

  const toggleRow = (id: string) => {
    setOpenRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{
        fontWeight: 700,
        color: theme.palette.text.primary,
        mb: 4,
        textTransform: 'uppercase',
        letterSpacing: '0.1em'
      }}>
        Change History
      </Typography>
      <TableContainer component={Paper} sx={{
        background: theme.palette.background.paper,
        borderRadius: 2,
        boxShadow: theme.shadows[3],
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{
              borderBottom: `2px solid ${theme.palette.divider}`,
            }}>
              <TableCell sx={{ border: 'none', width: '5%' }} />
              <TableCell sx={{ border: 'none', color: theme.palette.text.primary, fontWeight: 'bold', fontSize: '1rem' }}>Action</TableCell>
              <TableCell sx={{ border: 'none', color: theme.palette.text.primary, fontWeight: 'bold', fontSize: '1rem' }}>Student ID</TableCell>
              <TableCell sx={{ border: 'none', color: theme.palette.text.primary, fontWeight: 'bold', fontSize: '1rem' }}>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ border: 'none', py: 5, color: theme.palette.text.secondary }}>
                  No history records found.
                </TableCell>
              </TableRow>
            ) : (
              history.map((row, idx) => {
                const rowId = row.id || `${row.studentId}-${row.timestamp}`;
                const colors = actionColors[row.action] || { main: theme.palette.text.secondary, light: theme.palette.action.hover };
                return (
                  <React.Fragment key={rowId}>
                    <TableRow hover sx={{
                      '&:hover': {
                        backgroundColor: theme.palette.action.hover,
                      },
                      borderBottom: `1px solid ${theme.palette.divider}`,
                      '&:last-child > td, &:last-child > th': { border: 0 }
                    }}>
                      <TableCell sx={{ border: 'none' }}>
                        <IconButton size="small" onClick={() => toggleRow(rowId)} sx={{ color: theme.palette.text.secondary }}>
                          {openRows[rowId] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                        </IconButton>
                      </TableCell>
                      <TableCell sx={{ border: 'none' }}>
                        <Chip 
                          label={row.action.replace('_', ' ').toUpperCase()} 
                          sx={{ 
                            backgroundColor: colors.light,
                            color: colors.main,
                            fontWeight: 'bold',
                            border: `1px solid ${colors.main}`
                          }} 
                        />
                      </TableCell>
                      <TableCell sx={{ border: 'none', color: theme.palette.text.primary }}>{row.studentId}</TableCell>
                      <TableCell sx={{ border: 'none', color: theme.palette.text.secondary }}>{new Date(row.timestamp).toLocaleString()}</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell style={{ padding: 0, border: 'none' }} colSpan={4}>
                        <Collapse in={openRows[rowId]} timeout="auto" unmountOnExit>
                          <Box sx={{ 
                            p: 3, 
                            background: theme.palette.action.selected,
                          }}>
                            <Box sx={{ display: 'flex', gap: 3 }}>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ color: theme.palette.error.main, fontWeight: 'bold', mb: 1 }}>BEFORE</Typography>
                                <Card sx={{ p: 2, background: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                  <pre style={{ margin: 0, fontSize: 13, color: theme.palette.text.primary, whiteSpace: 'pre-wrap' }}>{JSON.stringify(row.before, null, 2)}</pre>
                                </Card>
                              </Box>
                              <Box sx={{ flex: 1 }}>
                                <Typography variant="subtitle2" sx={{ color: theme.palette.success.main, fontWeight: 'bold', mb: 1 }}>AFTER</Typography>
                                <Card sx={{ p: 2, background: theme.palette.background.default, border: `1px solid ${theme.palette.divider}`, borderRadius: 2 }}>
                                  <pre style={{ margin: 0, fontSize: 13, color: theme.palette.text.primary, whiteSpace: 'pre-wrap' }}>{JSON.stringify(row.after, null, 2)}</pre>
                                </Card>
                              </Box>
                            </Box>
                          </Box>
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HistorySection;