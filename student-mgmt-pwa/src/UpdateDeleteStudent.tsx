import React, { useState, useRef, useEffect } from 'react';
import { 
  Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, 
  Select, Card, Dialog, DialogTitle, DialogContent, DialogActions, Avatar, 
  CircularProgress, Alert, Divider, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import SearchIcon from '@mui/icons-material/Search';
import { getAdmissions, getAdmissionsByClassSection, updateAdmission, deleteAdmission, addAdmission } from './db';

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
  const [lastDeletedStudent, setLastDeletedStudent] = useState<any | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const showMessage = (setter: React.Dispatch<React.SetStateAction<string>>, message: string) => {
    setter(message);
    setTimeout(() => setter(''), 4000);
  };

  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setStudent(null);
    setLastDeletedStudent(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
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
    if (passwordInput === '123456') { // In a real app, use a secure method
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
    if (!student) return;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    setLastDeletedStudent(student);
    await deleteAdmission(student.studentId, student);
    setStudent(null);
    setDeleteConfirm(false);

    undoTimeoutRef.current = setTimeout(() => {
      setLastDeletedStudent(null);
      showMessage(setMsg, `Permanently deleted student: ${lastDeletedStudent?.name}`);
    }, 5 * 60 * 1000);
  };

  const handleUndoDelete = async () => {
    if (lastDeletedStudent) {
      await addAdmission(lastDeletedStudent);
      showMessage(setMsg, `Student ${lastDeletedStudent.name} has been restored.`);
      setLastDeletedStudent(null);
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    }
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
      
      <Card sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, mb: 4, boxShadow: 3 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-end' }}>
            <Box sx={{ minWidth: { xs: '100%', sm: '200px' }, flexGrow: 1 }}>
              <FormControl fullWidth variant="outlined">
                <InputLabel>Search By</InputLabel>
                <Select value={searchType} label="Search By" onChange={e => setSearchType(e.target.value as any)} sx={commonTextFieldStyles}>
                  <MenuItem value="id">Student ID</MenuItem>
                  <MenuItem value="roll">Class, Section & Roll No</MenuItem>
                </Select>
              </FormControl>
            </Box>
            {searchType === 'id' ? (
              <Box sx={{ minWidth: { xs: '100%', sm: '300px' }, flexGrow: 2 }}>
                <TextField label="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} fullWidth variant="outlined" sx={commonTextFieldStyles} />
              </Box>
            ) : (
              <>
                <Box sx={{ minWidth: { xs: '100%', sm: '120px' }, flexGrow: 1 }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Class</InputLabel>
                    <Select value={cls} label="Class" onChange={e => setCls(e.target.value)} sx={commonTextFieldStyles}>
                      {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: { xs: '100%', sm: '100px' }, flexGrow: 0.5 }}>
                  <FormControl fullWidth variant="outlined">
                    <InputLabel>Section</InputLabel>
                    <Select value={section} label="Section" onChange={e => setSection(e.target.value)} sx={commonTextFieldStyles}>
                      {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ minWidth: { xs: '100%', sm: '120px' }, flexGrow: 1 }}>
                  <TextField label="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} fullWidth variant="outlined" sx={commonTextFieldStyles} />
                </Box>
              </>
            )}
            <Box sx={{ minWidth: { xs: '100%', sm: '140px' } }}>
              <Button variant="contained" onClick={handleSearch} fullWidth disabled={loading} startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />} sx={{ height: 56 }}>
                {loading ? 'Searching...' : 'Search'}
              </Button>
            </Box>
          </Box>
        </Box>
      </Card>

      {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
      {msg && !lastDeletedStudent && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{msg}</Alert>}
      {lastDeletedStudent && (
        <Alert severity="warning" action={<Button color="inherit" size="small" onClick={handleUndoDelete}>UNDO</Button>} sx={{ mb: 3, borderRadius: 2 }}>
          Student {lastDeletedStudent.name} deleted.
        </Alert>
      )}

      {student && (
        <Card sx={{ p: { xs: 2, sm: 4 }, borderRadius: 2, boxShadow: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 3 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 80, height: 80 }}><PersonIcon sx={{ fontSize: 50 }} /></Avatar>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>{student.name}</Typography>
              <Chip label={`ID: ${student.studentId}`} size="small" />
            </Box>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Divider sx={{ my: 1 }}><Typography variant="caption">ACADEMIC</Typography></Divider>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 200px' }}><Typography><b>Class:</b> {student.class}</Typography></Box>
              <Box sx={{ flex: '1 1 200px' }}><Typography><b>Section:</b> {student.section}</Typography></Box>
              <Box sx={{ flex: '1 1 200px' }}><Typography><b>Roll No:</b> {student.rollNo}</Typography></Box>
            </Box>
            
            <Divider sx={{ my: 1 }}><Typography variant="caption">PERSONAL</Typography></Divider>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px' }}><Typography><b>Gender:</b> {student.gender || 'N/A'}</Typography></Box>
              <Box sx={{ flex: '1 1 300px' }}><Typography><b>DOB:</b> {student.dob}</Typography></Box>
              <Box sx={{ flex: '1 1 300px' }}><Typography><b>Aadhar:</b> {student.aadhar}</Typography></Box>
              <Box sx={{ flex: '1 1 300px' }}><Typography><b>APAAR ID:</b> {student.apaar}</Typography></Box>
            </Box>
            <Box><Typography><b>Address:</b> {student.address}</Typography></Box>

            <Divider sx={{ my: 1 }}><Typography variant="caption">GUARDIAN</Typography></Divider>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ flex: '1 1 300px' }}><Typography><b>Father:</b> {student.fatherName}</Typography></Box>
              <Box sx={{ flex: '1 1 300px' }}><Typography><b>Mother:</b> {student.motherName}</Typography></Box>
              <Box sx={{ flex: '1 1 300px' }}><Typography><b>Mobile:</b> {student.fatherMobile}</Typography></Box>
              <Box sx={{ flex: '1 1 300px' }}><Typography><b>Email:</b> {student.email}</Typography></Box>
            </Box>
            <Box><Typography><b>Note:</b> {student.note}</Typography></Box>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
            <Button onClick={handleEditOpen} color="primary" variant="contained" startIcon={<EditIcon />}>Edit</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" startIcon={<DeleteIcon />}>Delete</Button>
          </Box>
        </Card>
      )}

      <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Student Information</DialogTitle>
        <DialogContent>
          {editData && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="Student ID" value={editData.studentId} fullWidth margin="dense" InputProps={{ readOnly: true }} sx={commonTextFieldStyles} />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="Roll No" value={editData.rollNo} fullWidth margin="dense" InputProps={{ readOnly: true }} sx={commonTextFieldStyles} />
                </Box>
              </Box>
              
              <TextField label="Name" value={editData.name} onChange={e => handleEditChange('name', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Gender</InputLabel>
                    <Select value={editData.gender || ''} label="Gender" onChange={e => handleEditChange('gender', e.target.value)} sx={commonTextFieldStyles}>
                      <MenuItem value="Male">Male</MenuItem>
                      <MenuItem value="Female">Female</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Class</InputLabel>
                    <Select value={editData.class} label="Class" onChange={e => handleEditChange('class', e.target.value)} sx={commonTextFieldStyles}>
                      {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel>Section</InputLabel>
                    <Select value={editData.section} label="Section" onChange={e => handleEditChange('section', e.target.value)} sx={commonTextFieldStyles}>
                      {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="Father's Name" value={editData.fatherName} onChange={e => handleEditChange('fatherName', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="Mother's Name" value={editData.motherName} onChange={e => handleEditChange('motherName', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
                </Box>
              </Box>
              
              <TextField label="Address" value={editData.address} onChange={e => handleEditChange('address', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="Aadhar No" value={editData.aadhar} onChange={e => handleEditChange('aadhar', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="DOB" type="date" value={editData.dob} onChange={e => handleEditChange('dob', e.target.value)} fullWidth margin="dense" InputLabelProps={{ shrink: true }} sx={commonTextFieldStyles} />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="Father's Mobile" value={editData.fatherMobile} onChange={e => handleEditChange('fatherMobile', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="Email" value={editData.email} onChange={e => handleEditChange('email', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="APAAR ID" value={editData.apaar} onChange={e => handleEditChange('apaar', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
                </Box>
                <Box sx={{ flex: '1 1 300px' }}>
                  <TextField label="Note" value={editData.note} onChange={e => handleEditChange('note', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
                </Box>
              </Box>
            </Box>
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
          <Typography sx={{ mb: 2 }}>Enter password to perform this action.</Typography>
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
