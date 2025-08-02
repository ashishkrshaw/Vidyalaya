import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Card, Chip } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getHistory } from './db';

const actionColors: Record<string, 'primary' | 'error'> = {
  update: 'primary',
  delete: 'error',
};

const HistorySection: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [openRows, setOpenRows] = useState<Record<number, boolean>>({});

  useEffect(() => {
    getHistory().then(setHistory);
  }, []);

  const toggleRow = (id: number) => {
    setOpenRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">Change History</Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell />
              <TableCell>Action</TableCell>
              <TableCell>Student ID</TableCell>
              <TableCell>Timestamp</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center">No history to display.</TableCell>
              </TableRow>
            ) : (
              history.slice().reverse().map((row, idx) => (
                <React.Fragment key={row.id || idx}>
                  <TableRow hover>
                    <TableCell>
                      <IconButton size="small" onClick={() => toggleRow(row.id || idx)}>
                        {openRows[row.id || idx] ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell>
                      <Chip label={row.action.toUpperCase()} color={actionColors[row.action] || 'default'} />
                    </TableCell>
                    <TableCell>{row.studentId}</TableCell>
                    <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={4}>
                      <Collapse in={openRows[row.id || idx]} timeout="auto" unmountOnExit>
                        <Box sx={{ m: 2 }}>
                          <Typography variant="subtitle2">Before:</Typography>
                          <Card sx={{ p: 2, mb: 2, background: '#f5f5f5' }}>
                            <pre style={{ margin: 0, fontSize: 13 }}>{JSON.stringify(row.before, null, 2)}</pre>
                          </Card>
                          <Typography variant="subtitle2">After:</Typography>
                          <Card sx={{ p: 2, background: '#f5f5f5' }}>
                            <pre style={{ margin: 0, fontSize: 13 }}>{JSON.stringify(row.after, null, 2)}</pre>
                          </Card>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default HistorySection; 