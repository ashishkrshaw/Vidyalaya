import React, { useState } from 'react';
import { Box, Typography, TextField, Button, MenuItem, FormControl, InputLabel, Select, Card, Dialog, DialogTitle, DialogContent, DialogActions, Avatar } from '@mui/material';
import Grid from '@mui/material/Grid';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import { getAdmissions, getAdmissionsByClassSection, updateAdmission, deleteAdmission } from './db';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

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
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleSearch = async () => {
    let found: any[] = [];
    if (searchType === 'id' && studentId) {
      const all = await getAdmissions();
      found = all.filter((s: any) => s.studentId === studentId);
    } else if (searchType === 'roll' && cls && section && rollNo) {
      const all = await getAdmissionsByClassSection(cls, section);
      found = all.filter((s: any) => String(s.rollNo) === rollNo);
    }
    setStudent(found[0] || null);
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
    setMsg('Student updated successfully!');
    setTimeout(() => setMsg(''), 2000);
  };

  const handleDelete = async () => {
    await deleteAdmission(student.studentId, student);
    setStudent(null);
    setDeleteConfirm(false);
    setMsg('Student deleted successfully!');
    setTimeout(() => setMsg(''), 2000);
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">Update/Delete Student</Typography>
      <Box sx={{ background: 'linear-gradient(90deg, #e3f0ff 60%, #f9f9f9 100%)', p: 3, borderRadius: 3, boxShadow: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Search By</InputLabel>
              <Select value={searchType} label="Search By" onChange={e => setSearchType(e.target.value as any)}>
                <MenuItem value="id">Student ID</MenuItem>
                <MenuItem value="roll">Class + Section + Roll No</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {searchType === 'id' && (
            <Grid item xs={12} sm={8}>
              <TextField label="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} fullWidth />
            </Grid>
          )}
          {searchType === 'roll' && (
            <>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Class</InputLabel>
                  <Select value={cls} label="Class" onChange={e => setCls(e.target.value)}>
                    {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth>
                  <InputLabel>Section</InputLabel>
                  <Select value={section} label="Section" onChange={e => setSection(e.target.value)}>
                    {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={3}>
                <TextField label="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} fullWidth />
              </Grid>
            </>
          )}
          <Grid item xs={12} sm={2}>
            <Button variant="contained" onClick={handleSearch} fullWidth sx={{ height: 56 }}>Search</Button>
          </Grid>
        </Grid>
      </Box>
      {student && (
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, mt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mb: 1 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>{student.name}</Typography>
            <Typography variant="body2" color="text.secondary">{student.studentId}</Typography>
          </Box>
          <Box sx={{ mt: 2 }}>
            <Typography><b>Class:</b> {student.class}</Typography>
            <Typography><b>Section:</b> {student.section}</Typography>
            <Typography><b>Roll No:</b> {student.rollNo}</Typography>
            <Typography><b>Father's Name:</b> {student.fatherName}</Typography>
            <Typography><b>Mother's Name:</b> {student.motherName}</Typography>
            <Typography><b>Address:</b> {student.address}</Typography>
            <Typography><b>Aadhar No:</b> {student.aadhar}</Typography>
            <Typography><b>DOB:</b> {student.dob}</Typography>
            <Typography><b>Father's Mobile:</b> {student.fatherMobile}</Typography>
            <Typography><b>Email:</b> {student.email}</Typography>
            <Typography><b>APAAR ID:</b> {student.apaar}</Typography>
            <Typography><b>Note:</b> {student.note}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 3 }}>
            <Button onClick={handleEditOpen} color="primary" variant="contained" startIcon={<EditIcon />} sx={{ fontWeight: 600 }}>Edit</Button>
            <Button onClick={handleDeleteConfirm} color="error" variant="contained" startIcon={<DeleteIcon />} sx={{ fontWeight: 600 }}>Delete</Button>
          </Box>
        </Card>
      )}
      {/* Edit Student Dialog */}
      <Dialog open={editMode} onClose={() => setEditMode(false)}>
        <DialogTitle>Edit Student</DialogTitle>
        <DialogContent>
          {editData && (
            <Box component="form" sx={{ mt: 1 }}>
              <TextField label="Student ID" value={editData.studentId} fullWidth margin="dense" InputProps={{ readOnly: true }} />
              <TextField label="Roll No" value={editData.rollNo} fullWidth margin="dense" InputProps={{ readOnly: true }} />
              <TextField label="Name" value={editData.name} onChange={e => handleEditChange('name', e.target.value)} fullWidth margin="dense" />
              <FormControl fullWidth margin="dense">
                <InputLabel>Class</InputLabel>
                <Select value={editData.class} label="Class" onChange={e => handleEditChange('class', e.target.value)}>
                  {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth margin="dense">
                <InputLabel>Section</InputLabel>
                <Select value={editData.section} label="Section" onChange={e => handleEditChange('section', e.target.value)}>
                  {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Father's Name" value={editData.fatherName} onChange={e => handleEditChange('fatherName', e.target.value)} fullWidth margin="dense" />
              <TextField label="Mother's Name" value={editData.motherName} onChange={e => handleEditChange('motherName', e.target.value)} fullWidth margin="dense" />
              <TextField label="Address" value={editData.address} onChange={e => handleEditChange('address', e.target.value)} fullWidth margin="dense" />
              <TextField label="Aadhar No" value={editData.aadhar} onChange={e => handleEditChange('aadhar', e.target.value)} fullWidth margin="dense" />
              <TextField label="DOB" type="date" value={editData.dob} onChange={e => handleEditChange('dob', e.target.value)} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
              <TextField label="Father's Mobile" value={editData.fatherMobile} onChange={e => handleEditChange('fatherMobile', e.target.value)} fullWidth margin="dense" />
              <TextField label="Email" value={editData.email} onChange={e => handleEditChange('email', e.target.value)} fullWidth margin="dense" />
              <TextField label="APAAR ID" value={editData.apaar} onChange={e => handleEditChange('apaar', e.target.value)} fullWidth margin="dense" />
              <TextField label="Note" value={editData.note} onChange={e => handleEditChange('note', e.target.value)} fullWidth margin="dense" />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditMode(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 700 }}>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this student?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" sx={{ fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>
      {/* Password Confirmation Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); setPendingAction(null); }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LockIcon /> Password Required</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Enter password to confirm this action.</Typography>
          <TextField
            label="Password"
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            fullWidth
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handlePasswordConfirm(); }}
            error={!!passwordError}
            helperText={passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); setPendingAction(null); }}>Cancel</Button>
          <Button onClick={handlePasswordConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
      {msg && (
        <Box sx={{ mt: 2, color: 'green', fontWeight: 600, fontSize: 18, textAlign: 'center' }}>{msg}</Box>
      )}
    </Box>
  );
};

export default UpdateDeleteStudent;