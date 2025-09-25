import React, { useState } from 'react';
import Grid from '@mui/material/Grid'; // Corrected import
import { 
  Box, TextField, Button, MenuItem, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Select, InputLabel, FormControl, 
  Dialog, DialogTitle, DialogContent, DialogActions, Card, Avatar, Menu, 
  CircularProgress, IconButton, Chip, Divider 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { getAdmissions, getAdmissionsByClassSection, deleteAdmission, updateAdmission } from './db';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    '& fieldset': {
      borderColor: 'rgba(0, 0, 0, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: '#1976d2',
    },
    '&.Mui-focused fieldset': {
      borderColor: '#1976d2',
    },
  },
};

const ShowStudent: React.FC = () => {
  const [studentId, setStudentId] = useState('');
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [searchType, setSearchType] = useState<'id' | 'roll' | 'class' | 'classSection' | 'all'>('id');
  const [loading, setLoading] = useState(false);
  const [dialogStudent, setDialogStudent] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const [exportAllAnchorEl, setExportAllAnchorEl] = useState<null | HTMLElement>(null);

  const handleSearch = async () => {
    setLoading(true);
    let found: any[] = [];
    try {
      if (searchType === 'id' && studentId) {
        const all = await getAdmissions();
        found = all.filter((s: any) => s.studentId === studentId.trim());
      } else if (searchType === 'roll' && cls && section && rollNo) {
        const all = await getAdmissionsByClassSection(cls, section);
        found = all.filter((s: any) => String(s.rollNo) === rollNo.trim());
      } else if (searchType === 'class' && cls) {
        const all = await getAdmissions();
        found = all.filter((s: any) => s.class === cls);
      } else if (searchType === 'classSection' && cls && section) {
        found = await getAdmissionsByClassSection(cls, section);
      } else if (searchType === 'all') {
        found = await getAdmissions();
      }
    } catch (e) {
      console.error(e);
    }
    setResults(found);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (dialogStudent) {
      await deleteAdmission(dialogStudent.studentId, dialogStudent);
      setDialogStudent(null);
      setDeleteConfirm(false);
      handleSearch(); // Refresh results
    }
  };

  const handleEditOpen = () => {
    setEditData(dialogStudent);
    setEditMode(true);
  };

  const handleEditChange = (key: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleEditSave = async () => {
    await updateAdmission(editData, dialogStudent);
    setDialogStudent(editData);
    setEditMode(false);
    handleSearch(); // Refresh results
  };

  const handleExportPDF = () => {
    // PDF export logic for a single student
    setExportAnchorEl(null);
  };

  const handleExportExcel = () => {
    // Excel export logic for a single student
    setExportAnchorEl(null);
  };

  const handleExportAllPDF = () => {
    // PDF export logic for all results
    setExportAllAnchorEl(null);
  };

  const handleExportAllExcel = () => {
    // Excel export logic for all results
    setExportAllAnchorEl(null);
  };

  const renderSearchFields = () => {
    switch (searchType) {
      case 'id':
        return <Grid item xs={12} sm={9}><TextField label="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} fullWidth sx={commonTextFieldStyles} /></Grid>;
      case 'roll':
        return (
          <>
            <Grid item xs={12} sm={3}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={cls} label="Class" onChange={e => setCls(e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={3}><FormControl fullWidth><InputLabel>Section</InputLabel><Select value={section} label="Section" onChange={e => setSection(e.target.value)} sx={commonTextFieldStyles}>{sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={3}><TextField label="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} fullWidth sx={commonTextFieldStyles} /></Grid>
          </>
        );
      case 'class':
        return <Grid item xs={12} sm={9}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={cls} label="Class" onChange={e => setCls(e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>;
      case 'classSection':
        return (
          <>
            <Grid item xs={12} sm={4.5}><FormControl fullWidth><InputLabel>Class</InputLabel><Select value={cls} label="Class" onChange={e => setCls(e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12} sm={4.5}><FormControl fullWidth><InputLabel>Section</InputLabel><Select value={section} label="Section" onChange={e => setSection(e.target.value)} sx={commonTextFieldStyles}>{sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
          </>
        );
      case 'all':
      default:
        return null;
    }
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 1200, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 700, mb: 4 }}>
        Student Search
      </Typography>

      <Card sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 4, boxShadow: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Search By</InputLabel>
              <Select value={searchType} label="Search By" onChange={e => setSearchType(e.target.value as any)} sx={commonTextFieldStyles}>
                <MenuItem value="id">Student ID</MenuItem>
                <MenuItem value="roll">Class, Section & Roll</MenuItem>
                <MenuItem value="class">Entire Class</MenuItem>
                <MenuItem value="classSection">Class & Section</MenuItem>
                <MenuItem value="all">All Students</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {renderSearchFields()}
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSearch} fullWidth disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />} sx={{ height: 56 }}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {results.length > 0 && (
        <Card sx={{ p: { xs: 1, sm: 2 }, borderRadius: 2, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, px: 2 }}>
            <Typography variant="h6">Search Results ({results.length})</Typography>
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={e => setExportAllAnchorEl(e.currentTarget)}>
              Export All
            </Button>
            <Menu anchorEl={exportAllAnchorEl} open={!!exportAllAnchorEl} onClose={() => setExportAllAnchorEl(null)}>
              <MenuItem onClick={handleExportAllPDF}><PictureAsPdfIcon sx={{ mr: 1 }} /> As PDF</MenuItem>
              <MenuItem onClick={handleExportAllExcel}><TableChartIcon sx={{ mr: 1 }} /> As Excel</MenuItem>
            </Menu>
          </Box>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& .MuiTableCell-head': { fontWeight: 'bold' } }}>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Father's Name</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row) => (
                  <TableRow key={row.studentId} hover>
                    <TableCell>{row.studentId}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.class} '{row.section}'</TableCell>
                    <TableCell>{row.rollNo}</TableCell>
                    <TableCell>{row.fatherName}</TableCell>
                    <TableCell>{row.fatherMobile}</TableCell>
                    <TableCell align="right">
                      <IconButton onClick={() => setDialogStudent(row)} color="primary"><VisibilityIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      )}

      {!loading && results.length === 0 && (
        <Paper sx={{ textAlign: 'center', p: 8, borderRadius: 2, boxShadow: 3 }}>
          <Typography variant="h6" color="text.secondary">No results to display</Typography>
          <Typography color="text.secondary">Start a new search to see student records.</Typography>
        </Paper>
      )}

      {dialogStudent && (
        <Dialog open={!!dialogStudent} onClose={() => setDialogStudent(null)} maxWidth="md" fullWidth>
          <DialogTitle sx={{ pb: 1 }}>Student Profile</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80 }}><PersonIcon sx={{ fontSize: 50 }} /></Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>{dialogStudent.name}</Typography>
                <Chip label={`ID: ${dialogStudent.studentId}`} size="small" />
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">ACADEMIC</Typography></Divider></Grid>
              <Grid item xs={12} sm={4}><Typography><b>Class:</b> {dialogStudent.class}</Typography></Grid>
              <Grid item xs={12} sm={4}><Typography><b>Section:</b> {dialogStudent.section}</Typography></Grid>
              <Grid item xs={12} sm={4}><Typography><b>Roll No:</b> {dialogStudent.rollNo}</Typography></Grid>
              
              <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">PERSONAL</Typography></Divider></Grid>
              <Grid item xs={12} sm={6}><Typography><b>DOB:</b> {dialogStudent.dob}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography><b>Aadhar:</b> {dialogStudent.aadhar}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography><b>APAAR ID:</b> {dialogStudent.apaar}</Typography></Grid>
              <Grid item xs={12}><Typography><b>Address:</b> {dialogStudent.address}</Typography></Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">GUARDIAN</Typography></Divider></Grid>
              <Grid item xs={12} sm={6}><Typography><b>Father:</b> {dialogStudent.fatherName}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography><b>Mother:</b> {dialogStudent.motherName}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography><b>Mobile:</b> {dialogStudent.fatherMobile}</Typography></Grid>
              <Grid item xs={12} sm={6}><Typography><b>Email:</b> {dialogStudent.email}</Typography></Grid>
              <Grid item xs={12}><Typography><b>Note:</b> {dialogStudent.note}</Typography></Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }}><Typography variant="caption">FINANCIAL</Typography></Divider></Grid>
              <Grid item xs={12}>
                <Typography variant="h6">Current Dues: <Chip label={`₹${dialogStudent.dues || 0}`} color={dialogStudent.dues > 0 ? 'error' : 'success'} /></Typography>
                <Typography variant="subtitle1" sx={{ mt: 2, mb: 1 }}>Payment History:</Typography>
                {(dialogStudent.feeHistory && dialogStudent.feeHistory.length > 0) ? (
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Months</TableCell><TableCell>Amount</TableCell><TableCell>Dues After</TableCell></TableRow></TableHead>
                      <TableBody>
                        {dialogStudent.feeHistory.slice().reverse().map((p: any, idx: number) => (
                          <TableRow key={idx}><TableCell>{p.date ? new Date(p.date).toLocaleDateString() : ''}</TableCell><TableCell>{Array.isArray(p.months) ? p.months.join(', ') : ''}</TableCell><TableCell>₹{p.amount}</TableCell><TableCell>₹{typeof p.dues === 'number' ? p.dues : ''}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                ) : <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>No fee payments recorded.</Typography>}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
            <Box>
              <Button onClick={handleEditOpen} startIcon={<EditIcon />} color="primary">Edit</Button>
              <Button onClick={() => setDeleteConfirm(true)} startIcon={<DeleteIcon />} color="error">Delete</Button>
            </Box>
            <Box>
              <Button onClick={e => setExportAnchorEl(e.currentTarget)} startIcon={<DownloadIcon />}>Export</Button>
              <Button onClick={() => setDialogStudent(null)} variant="contained">Close</Button>
            </Box>
          </DialogActions>
        </Dialog>
      )}

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><Typography>Are you sure you want to permanently delete this student record? This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete Forever</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Student Information</DialogTitle>
        <DialogContent>
          {editData && (
            <Grid container spacing={2} sx={{pt: 1}}>
              <Grid item xs={12} sm={6}><TextField label="Student ID" value={editData.studentId} fullWidth margin="dense" InputProps={{ readOnly: true }} sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Roll No" value={editData.rollNo} fullWidth margin="dense" InputProps={{ readOnly: true }} sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12}><TextField label="Name" value={editData.name} onChange={e => handleEditChange('name', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><FormControl fullWidth margin="dense"><InputLabel>Class</InputLabel><Select value={editData.class} label="Class" onChange={e => handleEditChange('class', e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>
              <Grid item xs={12} sm={6}><FormControl fullWidth margin="dense"><InputLabel>Section</InputLabel><Select value={editData.section} label="Section" onChange={e => handleEditChange('section', e.target.value)} sx={commonTextFieldStyles}>{sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
              <Grid item xs={12} sm={6}><TextField label="Father's Name" value={editData.fatherName} onChange={e => handleEditChange('fatherName', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Mother's Name" value={editData.motherName} onChange={e => handleEditChange('motherName', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12}><TextField label="Address" value={editData.address} onChange={e => handleEditChange('address', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Aadhar No" value={editData.aadhar} onChange={e => handleEditChange('aadhar', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="DOB" type="date" value={editData.dob} onChange={e => handleEditChange('dob', e.target.value)} fullWidth margin="dense" InputLabelProps={{ shrink: true }} sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Father's Mobile" value={editData.fatherMobile} onChange={e => handleEditChange('fatherMobile', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Email" value={editData.email} onChange={e => handleEditChange('email', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="APAAR ID" value={editData.apaar} onChange={e => handleEditChange('apaar', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
              <Grid item xs={12} sm={6}><TextField label="Note" value={editData.note} onChange={e => handleEditChange('note', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} /></Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditMode(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      <Menu anchorEl={exportAnchorEl} open={!!exportAnchorEl} onClose={() => setExportAnchorEl(null)}>
        <MenuItem onClick={handleExportPDF}><PictureAsPdfIcon sx={{ mr: 1 }} /> Export as PDF</MenuItem>
        <MenuItem onClick={handleExportExcel}><TableChartIcon sx={{ mr: 1 }} /> Export as Excel</MenuItem>
      </Menu>
    </Box>
  );
};

export default ShowStudent;
