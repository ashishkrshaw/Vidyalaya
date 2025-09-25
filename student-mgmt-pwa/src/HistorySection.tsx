import React, { useEffect, useState } from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Collapse, Card, Chip, useTheme, Grid } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { getHistory } from './db';

const actionColors: Record<string, { main: string, light: string }> = {
  update: { main: '#2196f3', light: '#e3f2fd' }, // Blue
  delete: { main: '#f44336', light: '#ffebee' }, // Red
  admission_added: { main: '#4caf50', light: '#e8f5e9' }, // Green
};

const renderDetails = (data: any, compareData: any = null) => {
  if (!data || typeof data !== 'object') {
    return <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>No Details</Typography>;
  }

  return (
    <Box>
      {Object.entries(data).map(([key, value]) => {
        const oldValue = compareData ? compareData[key] : undefined;
        const isChanged = compareData && JSON.stringify(value) !== JSON.stringify(oldValue);

        return (
          <Typography key={key} variant="body2" sx={{ mb: 0.5 }}>
            <strong style={{ textTransform: 'capitalize' }}>{key.replace(/_/g, ' ')}: </strong>
            {isChanged && compareData && (
              <Chip label={JSON.stringify(oldValue)} size="small" color="error" variant="outlined" sx={{ mr: 1 }} />
            )}
            <Chip label={JSON.stringify(value)} size="small" color={isChanged ? 'success' : 'default'} variant={isChanged ? 'filled' : 'outlined'} />
          </Typography>
        );
      })}
    </Box>
  );
};

const Row: React.FC<{ row: any }> = ({ row }) => {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const colors = actionColors[row.action] || { main: theme.palette.text.secondary, light: theme.palette.action.hover };

  return (
    <React.Fragment>
      <TableRow hover sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell sx={{ width: '5%' }}>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell>
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
        <TableCell>{row.studentId}</TableCell>
        <TableCell>{new Date(row.timestamp).toLocaleString()}</TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ padding: 0 }} colSpan={4}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ p: 2, background: theme.palette.mode === 'dark' ? 'rgba(0,0,0,0.2)' : '#fafafa' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>Before</Typography>
                  <Paper variant="outlined" sx={{ p: 2, background: theme.palette.background.default }}>
                    {renderDetails(row.before)}
                  </Paper>
                </Grid>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>After</Typography>
                  <Paper variant="outlined" sx={{ p: 2, background: theme.palette.background.default }}>
                    {renderDetails(row.after, row.before)}
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
};

const HistorySection: React.FC = () => {
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    getHistory().then(data => {
      const sortedData = data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setHistory(sortedData);
    });
  }, []);

  return (
    <Box sx={{ width: '100%', maxWidth: 1100, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 700, mb: 4 }}>
        Change History
      </Typography>
      <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
        <TableContainer>
          <Table aria-label="collapsible table">
            <TableHead>
              <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 'bold' } }}>
                <TableCell />
                <TableCell>Action</TableCell>
                <TableCell>Student ID</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {history.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No history records found.
                  </TableCell>
                </TableRow>
              ) : (
                history.map((row) => <Row key={row.id} row={row} />)
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </Box>
  );
};

export default HistorySection;