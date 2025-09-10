import React, { useState } from 'react';
import { Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, Card, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Grid, CircularProgress, Alert } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import { getAdmissions, getAdmissionsByClassSection, updateAdmission, deleteAdmission } from './db';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': {
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

const UpdateDeleteStudent: React.FC = () => {
  const [searchType, setSearchType] = useState<'id' | 'roll'>('id');
  const [studentId, setStudentId] = useState('');
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');
  const [rollNo, setRollNo] = useState('');
  const [student, setStudent] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const showMessage = (setter: React.Dispatch<React.SetStateAction<string>>, message: string) => {
    setter(message);
    setTimeout(() => setter(''), 3000);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setStudent(null);
    try {
      let found: any[] = [];
      if (searchType === 'id' && studentId) {
        const all = await getAdmissions();
        found = all.filter((s: any) => s.studentId === studentId.trim());
      } else if (searchType === 'roll' && cls && section && rollNo) {
        const all = await getAdmissionsByClassSection(cls, section);
        found = all.filter((s: any) => String(s.rollNo) === rollNo.trim());
      }
      
      if (found.length > 0) {
        setStudent(found[0]);
      } else {
        showMessage(setError, 'No student found with the provided details.');
      }
    } catch (e) {
      showMessage(setError, 'An error occurred during search.');
    }
    setLoading(false);
  };

  const handleEditOpen = () => {
    setPendingAction('edit');
    setPasswordDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    setPendingAction('delete');
    setPasswordDialogOpen(true);
  };

  const handlePasswordConfirm = () => {
    if (passwordInput === '123456') {
      setPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      if (pendingAction === 'edit') {
        setEditData(student);
        setEditMode(true);
      } else if (pendingAction === 'delete') {
        setDeleteConfirm(true);
      }
      setPendingAction(null);
    } else {
      setPasswordError('Incorrect password.');
    }
  };

  const handleEditChange = (key: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleEditSave = async () => {
    await updateAdmission(editData, student);
    setStudent(editData);
    setEditMode(false);
    showMessage(setMsg, 'Student updated successfully!');
  };

  const handleDelete = async () => {
    await deleteAdmission(student.studentId, student);
    setStudent(null);
    setDeleteConfirm(false);
    showMessage(setMsg, 'Student deleted successfully!');
  };

  const closePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordInput('');
    setPasswordError('');
    setPendingAction(null);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 800, mx: 'auto', mt: 4 }}>
      <Typography variant="h4" gutterBottom align="center" sx={{ fontWeight: 700, mb: 4 }}>
        Manage Student Record
      </Typography>
      
      {/* Search Panel */}
      <Card sx={{ p: 4, borderRadius: 2, mb: 4, boxShadow: 3 }}>
        <Grid container spacing={2} alignItems="flex-end">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Search By</InputLabel>
              <Select value={searchType} label="Search By" onChange={e => setSearchType(e.target.value as any)} sx={commonTextFieldStyles}>
                <MenuItem value="id">Student ID</MenuItem>
                <MenuItem value="roll">Class, Section & Roll No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {searchType === 'id' ? (
            <Grid item xs={12} sm={8}>
              <TextField label="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} fullWidth variant="outlined" sx={commonTextFieldStyles} />
            </Grid>
          ) : (
            <>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Class</InputLabel>
                  <Select value={cls} label="Class" onChange={e => setCls(e.target.value)} sx={commonTextFieldStyles}>
                    {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={2}>
                <FormControl fullWidth variant="outlined">
                  <InputLabel>Section</InputLabel>
                  <Select value={section} label="Section" onChange={e => setSection(e.target.value)} sx={commonTextFieldStyles}>
                    {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} fullWidth variant="outlined" sx={commonTextFieldStyles} />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={searchType === 'id' ? 12 : 4}>
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              fullWidth 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
              sx={{ 
                height: 56,
              }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      {msg && <Alert severity="success" sx={{ mb: 3 }}>{msg}</Alert>}

      {/* Student Display Card */}
      {student && (
        <Card sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80 }}>
              <PersonIcon sx={{ fontSize: 50 }} />
            </Avatar>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>{student.name}</Typography>
              <Typography variant="h6" color="primary">{student.studentId}</Typography>
            </Box>
          </Box>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}><Typography><b>Class:</b> {student.class}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Section:</b> {student.section}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Roll No:</b> {student.rollNo}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>DOB:</b> {student.dob}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Father's Name:</b> {student.fatherName}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Mother's Name:</b> {student.motherName}</Typography></Grid>
            <Grid item xs={12}><Typography><b>Address:</b> {student.address}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Aadhar No:</b> {student.aadhar}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Father's Mobile:</b> {student.fatherMobile}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>Email:</b> {student.email}</Typography></Grid>
            <Grid item xs={12} sm={6}><Typography><b>APAAR ID:</b> {student.apaar}</Typography></Grid>
            <Grid item xs={12}><Typography><b>Note:</b> {student.note}</Typography></Grid>
          </Grid>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button onClick={handleEditOpen} color="primary" variant="contained" startIcon={<EditIcon />}>Edit</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" startIcon={<DeleteIcon />}>Delete</Button>
          </Box>
        </Card>
      )}

      {/* Dialogs */}
      <Dialog open={editMode} onClose={() => setEditMode(false)}>
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

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent><Typography>Are you sure you want to permanently delete this student record? This action cannot be undone.</Typography></DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete Forever</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordDialogOpen} onClose={closePasswordDialog}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LockIcon /> Password Required</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Enter password to confirm this action.</Typography>
          <TextField label="Password" type="password" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} fullWidth autoFocus onKeyDown={e => { if (e.key === 'Enter') handlePasswordConfirm(); }} error={!!passwordError} helperText={passwordError} sx={commonTextFieldStyles} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closePasswordDialog}>Cancel</Button>
          <Button onClick={handlePasswordConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UpdateDeleteStudent;
