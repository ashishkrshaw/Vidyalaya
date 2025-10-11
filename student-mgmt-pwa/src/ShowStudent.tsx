import React, { useState } from 'react';
import { Grid } from '@mui/material';
import { 
  Box, TextField, Button, MenuItem, Typography, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Paper, Select, InputLabel, FormControl, 
  Dialog, DialogTitle, DialogContent, DialogActions, Card, Avatar, Menu, 
  CircularProgress, Chip, Divider 
} from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
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

interface ShowStudentProps {
  onSelectStudent?: (student: any) => void;
  idCardMode?: boolean;
}

const ShowStudent: React.FC<ShowStudentProps> = ({ onSelectStudent, idCardMode }) => {
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
  // Removed unused exportAllAnchorEl

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

  // Removed unused handleExportAllPDF and handleExportAllExcel

  const renderSearchFields = () => {
    switch (searchType) {
      case 'id':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <TextField label="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} fullWidth sx={commonTextFieldStyles} />
          </Box>
        );
      case 'roll':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <FormControl fullWidth><InputLabel>Class</InputLabel><Select value={cls} label="Class" onChange={e => setCls(e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl>
            <FormControl fullWidth><InputLabel>Section</InputLabel><Select value={section} label="Section" onChange={e => setSection(e.target.value)} sx={commonTextFieldStyles}>{sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
            <TextField label="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} fullWidth sx={commonTextFieldStyles} />
          </Box>
        );
      case 'class':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <FormControl fullWidth><InputLabel>Class</InputLabel><Select value={cls} label="Class" onChange={e => setCls(e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl>
          </Box>
        );
      case 'classSection':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 2 }}>
            <FormControl fullWidth><InputLabel>Class</InputLabel><Select value={cls} label="Class" onChange={e => setCls(e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl>
            <FormControl fullWidth><InputLabel>Section</InputLabel><Select value={section} label="Section" onChange={e => setSection(e.target.value)} sx={commonTextFieldStyles}>{sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
          </Box>
        );
      case 'all':
      default:
        return null;
    }
  }

  return (
    <Box sx={{ p: { xs: 1, md: 3 }, maxWidth: 1200, mx: 'auto' }}>
      <Card elevation={3} sx={{ mb: 3, borderRadius: 3, p: { xs: 2, md: 3 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <SearchIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h6" fontWeight={600}>Search Student</Typography>
        </Box>
        <Grid container spacing={2}>
          <Box sx={{ width: { xs: '100%', sm: '48%', md: '24%' }, mb: 2 }}>
            <FormControl fullWidth>
              <InputLabel>Search Type</InputLabel>
              <Select value={searchType} label="Search Type" onChange={e => setSearchType(e.target.value as any)}>
                <MenuItem value="id">By Student ID</MenuItem>
                <MenuItem value="roll">By Roll No</MenuItem>
                <MenuItem value="class">By Class</MenuItem>
                <MenuItem value="classSection">By Class & Section</MenuItem>
                <MenuItem value="all">All Students</MenuItem>
              </Select>
            </FormControl>
          </Box>
          {renderSearchFields()}
          <Box sx={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', mt: { xs: 2, md: 0 } }}>
            <Button variant="contained" color="primary" sx={{ borderRadius: 2, fontWeight: 600 }} onClick={handleSearch}>
              Search
            </Button>
          </Box>
        </Grid>
      </Card>
      {/* Results Section */}
      <Box>
        {loading ? (
          <CircularProgress />
        ) : results.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>No students found.</Typography>
        ) : (
          <Grid container spacing={2}>
            {results.map(student => (
              <Box key={student.studentId} sx={{ width: { xs: '100%', sm: '48%', md: '32%' }, mb: 2 }}>
                <Card elevation={2} sx={{ p: 2, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Avatar src={student.photo || undefined} sx={{ width: 56, height: 56, bgcolor: 'primary.light' }}>
                      {!student.photo && <PersonIcon />}
                    </Avatar>
                    <Box>
                      <Typography variant="h6" fontWeight={600}>{student.name}</Typography>
                      <Typography variant="body2">Class: {student.class} - {student.section}</Typography>
                      <Typography variant="body2">Roll No: {student.rollNo}</Typography>
                      <Typography variant="body2">ID: {student.studentId}</Typography>
                    </Box>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {!idCardMode ? (
                      <>
                        <Button size="small" variant="outlined" startIcon={<VisibilityIcon />} onClick={() => setDialogStudent(student)}>
                          View
                        </Button>
                        <Button size="small" variant="outlined" color="primary" startIcon={<EditIcon />} onClick={() => { setEditMode(true); setEditData(student); }}>
                          Edit
                        </Button>
                        <Button size="small" variant="outlined" color="error" startIcon={<DeleteIcon />} onClick={() => { setDeleteConfirm(true); setDialogStudent(student); }}>
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button size="small" variant="contained" color="primary" startIcon={<CardMembershipIcon />} onClick={() => onSelectStudent && onSelectStudent(student)}>
                        Generate ID Card
                      </Button>
                    )}
                  </Box>
                </Card>
              </Box>
            ))}
          </Grid>
        )}
      </Box>

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
            <Box>
              {/* Academic Section */}
              <Divider sx={{ my: 1 }}><Typography variant="caption">ACADEMIC</Typography></Divider>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography sx={{ minWidth: 120 }}><b>Class:</b> {dialogStudent.class}</Typography>
                <Typography sx={{ minWidth: 120 }}><b>Section:</b> {dialogStudent.section}</Typography>
                <Typography sx={{ minWidth: 120 }}><b>Roll No:</b> {dialogStudent.rollNo}</Typography>
              </Box>
              {/* Personal Section */}
              <Divider sx={{ my: 1 }}><Typography variant="caption">PERSONAL</Typography></Divider>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography sx={{ minWidth: 120 }}><b>DOB:</b> {dialogStudent.dob}</Typography>
                <Typography sx={{ minWidth: 120 }}><b>Aadhar:</b> {dialogStudent.aadhar}</Typography>
                <Typography sx={{ minWidth: 120 }}><b>APAAR ID:</b> {dialogStudent.apaar}</Typography>
              </Box>
              <Typography sx={{ mt: 1 }}><b>Address:</b> {dialogStudent.address}</Typography>
              {/* Guardian Section */}
              <Divider sx={{ my: 1 }}><Typography variant="caption">GUARDIAN</Typography></Divider>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
                <Typography sx={{ minWidth: 120 }}><b>Father:</b> {dialogStudent.fatherName}</Typography>
                <Typography sx={{ minWidth: 120 }}><b>Mother:</b> {dialogStudent.motherName}</Typography>
                <Typography sx={{ minWidth: 120 }}><b>Mobile:</b> {dialogStudent.fatherMobile}</Typography>
                <Typography sx={{ minWidth: 120 }}><b>Email:</b> {dialogStudent.email}</Typography>
              </Box>
              <Typography sx={{ mt: 1 }}><b>Note:</b> {dialogStudent.note}</Typography>
              {/* Financial Section */}
              <Divider sx={{ my: 1 }}><Typography variant="caption">FINANCIAL</Typography></Divider>
              <Box>
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
              </Box>
            </Box>
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, pt: 1 }}>
              <TextField label="Student ID" value={editData.studentId} fullWidth margin="dense" InputProps={{ readOnly: true }} sx={commonTextFieldStyles} />
              <TextField label="Roll No" value={editData.rollNo} fullWidth margin="dense" InputProps={{ readOnly: true }} sx={commonTextFieldStyles} />
              <TextField label="Name" value={editData.name} onChange={e => handleEditChange('name', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              <FormControl fullWidth margin="dense"><InputLabel>Class</InputLabel><Select value={editData.class} label="Class" onChange={e => handleEditChange('class', e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl>
              <FormControl fullWidth margin="dense"><InputLabel>Section</InputLabel><Select value={editData.section} label="Section" onChange={e => handleEditChange('section', e.target.value)} sx={commonTextFieldStyles}>{sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl>
              <TextField label="Father's Name" value={editData.fatherName} onChange={e => handleEditChange('fatherName', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              <TextField label="Mother's Name" value={editData.motherName} onChange={e => handleEditChange('motherName', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              <TextField label="Address" value={editData.address} onChange={e => handleEditChange('address', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              <TextField label="Aadhar No" value={editData.aadhar} onChange={e => handleEditChange('aadhar', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              <TextField label="DOB" type="date" value={editData.dob} onChange={e => handleEditChange('dob', e.target.value)} fullWidth margin="dense" InputLabelProps={{ shrink: true }} sx={commonTextFieldStyles} />
              <TextField label="Father's Mobile" value={editData.fatherMobile} onChange={e => handleEditChange('fatherMobile', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              <TextField label="Email" value={editData.email} onChange={e => handleEditChange('email', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              <TextField label="APAAR ID" value={editData.apaar} onChange={e => handleEditChange('apaar', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
              <TextField label="Note" value={editData.note} onChange={e => handleEditChange('note', e.target.value)} fullWidth margin="dense" sx={commonTextFieldStyles} />
            </Box>
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
