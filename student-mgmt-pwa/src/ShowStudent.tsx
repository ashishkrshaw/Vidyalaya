import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import { Box, TextField, Button, MenuItem, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, Card, Avatar, Menu } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import { getAdmissions, getAdmissionsByClassSection, deleteAdmission, updateAdmission } from './db';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

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
    if (searchType === 'id' && studentId) {
      const all = await getAdmissions();
      found = all.filter((s: any) => s.studentId === studentId);
    } else if (searchType === 'roll' && cls && section && rollNo) {
      const all = await getAdmissionsByClassSection(cls, section);
      found = all.filter((s: any) => String(s.rollNo) === rollNo);
    } else if (searchType === 'class' && cls) {
      const all = await getAdmissions();
      found = all.filter((s: any) => s.class === cls);
    } else if (searchType === 'classSection' && cls && section) {
      found = await getAdmissionsByClassSection(cls, section);
    } else if (searchType === 'all') {
      found = await getAdmissions();
    }
    setResults(found);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (dialogStudent) {
      await deleteAdmission(dialogStudent.studentId, dialogStudent);
      setDialogStudent(null);
      setDeleteConfirm(false);
      handleSearch();
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
    handleSearch();
  };

  const handleExportPDF = () => {
    if (!dialogStudent) return;
    const doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('Student Details', 105, 18, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(12);
    let y = 30;
    doc.text(`Name: ${dialogStudent.name}`, 20, y); y += 8;
    doc.text(`Student ID: ${dialogStudent.studentId}`, 20, y); y += 8;
    doc.text(`Class: ${dialogStudent.class}   Section: ${dialogStudent.section}   Roll No: ${dialogStudent.rollNo}`, 20, y); y += 8;
    doc.text(`Father: ${dialogStudent.fatherName}`, 20, y); y += 8;
    doc.text(`Mother: ${dialogStudent.motherName}`, 20, y); y += 8;
    doc.text(`Address: ${dialogStudent.address}`, 20, y); y += 8;
    doc.text(`Aadhar: ${dialogStudent.aadhar}`, 20, y); y += 8;
    doc.text(`DOB: ${dialogStudent.dob}`, 20, y); y += 8;
    doc.text(`Father's Mobile: ${dialogStudent.fatherMobile}`, 20, y); y += 8;
    doc.text(`Email: ${dialogStudent.email}`, 20, y); y += 8;
    doc.text(`APAAR ID: ${dialogStudent.apaar}`, 20, y); y += 8;
    doc.text(`Note: ${dialogStudent.note}`, 20, y); y += 8;
    doc.text(`Current Dues: ₹${dialogStudent.dues || 0}`, 20, y); y += 10;
    doc.setFont('times', 'bold');
    doc.text('Last Payment:', 20, y); y += 8;
    doc.setFont('times', 'normal');
    const lastPayment = (dialogStudent.feeHistory && dialogStudent.feeHistory.length > 0) ? dialogStudent.feeHistory[dialogStudent.feeHistory.length - 1] : null;
    if (lastPayment) {
      doc.text(`Date: ${lastPayment.date ? new Date(lastPayment.date).toLocaleDateString() : ''}`, 20, y); y += 8;
      doc.text(`Months: ${Array.isArray(lastPayment.months) ? lastPayment.months.join(', ') : ''}`, 20, y); y += 8;
      doc.text(`Amount: ₹${lastPayment.amount}`, 20, y); y += 8;
      doc.text(`Dues After: ₹${typeof lastPayment.dues === 'number' ? lastPayment.dues : ''}`, 20, y); y += 8;
    } else {
      doc.text('No payments yet.', 20, y); y += 8;
    }
    doc.save(`Student_${dialogStudent.name}_${dialogStudent.studentId}.pdf`);
    setExportAnchorEl(null);
  };
  const handleExportExcel = () => {
    if (!dialogStudent) return;
    const lastPayment = (dialogStudent.feeHistory && dialogStudent.feeHistory.length > 0) ? dialogStudent.feeHistory[dialogStudent.feeHistory.length - 1] : null;
    const data = [
      {
        'Name': dialogStudent.name,
        'Student ID': dialogStudent.studentId,
        'Class': dialogStudent.class,
        'Section': dialogStudent.section,
        'Roll No': dialogStudent.rollNo,
        'Father': dialogStudent.fatherName,
        'Mother': dialogStudent.motherName,
        'Address': dialogStudent.address,
        'Aadhar': dialogStudent.aadhar,
        'DOB': dialogStudent.dob,
        "Father's Mobile": dialogStudent.fatherMobile,
        'Email': dialogStudent.email,
        'APAAR ID': dialogStudent.apaar,
        'Note': dialogStudent.note,
        'Current Dues': dialogStudent.dues || 0,
        'Last Payment Date': lastPayment ? (lastPayment.date ? new Date(lastPayment.date).toLocaleDateString() : '') : '',
        'Last Payment Months': lastPayment && Array.isArray(lastPayment.months) ? lastPayment.months.join(', ') : '',
        'Last Payment Amount': lastPayment ? lastPayment.amount : '',
        'Last Payment Dues After': lastPayment && typeof lastPayment.dues === 'number' ? lastPayment.dues : '',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Student Details');
    XLSX.writeFile(wb, `Student_${dialogStudent.name}_${dialogStudent.studentId}.xlsx`);
    setExportAnchorEl(null);
  };

  const handleExportAllPDF = () => {
    if (!results.length) return;
    const doc = new jsPDF();
    doc.setFont('times', 'bold');
    doc.setFontSize(16);
    doc.text('All Students', 105, 18, { align: 'center' });
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    let y = 28;
    results.forEach((student, idx) => {
      if (y > 270) { doc.addPage(); y = 18; }
      doc.text(`Name: ${student.name} | ID: ${student.studentId} | Class: ${student.class} | Section: ${student.section} | Roll: ${student.rollNo}`, 10, y); y += 6;
      doc.text(`Father: ${student.fatherName} | Mother: ${student.motherName} | Dues: ₹${student.dues || 0}`, 10, y); y += 6;
      const lastPayment = (student.feeHistory && student.feeHistory.length > 0) ? student.feeHistory[student.feeHistory.length - 1] : null;
      if (lastPayment) {
        doc.text(`Last Payment: ${lastPayment.date ? new Date(lastPayment.date).toLocaleDateString() : ''} | Months: ${Array.isArray(lastPayment.months) ? lastPayment.months.join(', ') : ''} | Amount: ₹${lastPayment.amount} | Dues After: ₹${typeof lastPayment.dues === 'number' ? lastPayment.dues : ''}`, 10, y); y += 6;
      } else {
        doc.text('No payments yet.', 10, y); y += 6;
      }
      y += 2;
    });
    doc.save('All_Students.pdf');
    setExportAllAnchorEl(null);
  };
  const handleExportAllExcel = () => {
    if (!results.length) return;
    const data = results.map(student => {
      const lastPayment = (student.feeHistory && student.feeHistory.length > 0) ? student.feeHistory[student.feeHistory.length - 1] : null;
      return {
        'Name': student.name,
        'Student ID': student.studentId,
        'Class': student.class,
        'Section': student.section,
        'Roll No': student.rollNo,
        'Father': student.fatherName,
        'Mother': student.motherName,
        'Address': student.address,
        'Aadhar': student.aadhar,
        'DOB': student.dob,
        "Father's Mobile": student.fatherMobile,
        'Email': student.email,
        'APAAR ID': student.apaar,
        'Note': student.note,
        'Current Dues': student.dues || 0,
        'Last Payment Date': lastPayment ? (lastPayment.date ? new Date(lastPayment.date).toLocaleDateString() : '') : '',
        'Last Payment Months': lastPayment && Array.isArray(lastPayment.months) ? lastPayment.months.join(', ') : '',
        'Last Payment Amount': lastPayment ? lastPayment.amount : '',
        'Last Payment Dues After': lastPayment && typeof lastPayment.dues === 'number' ? lastPayment.dues : '',
      };
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'All Students');
    XLSX.writeFile(wb, 'All_Students.xlsx');
    setExportAllAnchorEl(null);
  };

  return (
    <Box>
      <Box sx={{
        background: 'linear-gradient(90deg, #e3f0ff 60%, #f9f9f9 100%)',
        p: 3,
        borderRadius: 3,
        boxShadow: 2,
        mb: 3,
      }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 700, letterSpacing: 1, color: 'primary.main' }}>Search Student</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Search By</InputLabel>
              <Select value={searchType} label="Search By" onChange={e => setSearchType(e.target.value as any)}>
                <MenuItem value="id">Student ID</MenuItem>
                <MenuItem value="roll">Class + Section + Roll No</MenuItem>
                <MenuItem value="class">All of Class</MenuItem>
                <MenuItem value="classSection">All of Class & Section</MenuItem>
                <MenuItem value="all">All Students</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          {searchType === 'id' && (
            <Grid item xs={12} sm={4}>
              <TextField label="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} fullWidth />
            </Grid>
          )}
          {(searchType === 'roll' || searchType === 'class' || searchType === 'classSection') && (
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select value={cls} label="Class" onChange={e => setCls(e.target.value)}>
                  {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}
          {(searchType === 'roll' || searchType === 'classSection') && (
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel>Section</InputLabel>
                <Select value={section} label="Section" onChange={e => setSection(e.target.value)}>
                  {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}
          {searchType === 'roll' && (
            <Grid item xs={12} sm={2}>
              <TextField label="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} fullWidth />
            </Grid>
          )}
          <Grid item xs={12} sm={2}>
            <Button variant="contained" onClick={handleSearch} fullWidth disabled={loading} sx={{ height: 56 }}>
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Box>
      {results.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={e => setExportAllAnchorEl(e.currentTarget)}
            sx={{ fontWeight: 600 }}
          >
            Export All
          </Button>
          <Menu anchorEl={exportAllAnchorEl} open={!!exportAllAnchorEl} onClose={() => setExportAllAnchorEl(null)}>
            <MenuItem onClick={handleExportAllPDF}><PictureAsPdfIcon sx={{ mr: 1 }} />Export as PDF</MenuItem>
            <MenuItem onClick={handleExportAllExcel}><TableChartIcon sx={{ mr: 1 }} />Export as Excel</MenuItem>
          </Menu>
        </Box>
      )}
      <Box sx={{ mt: 4 }}>
        {results.length > 0 ? (
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Roll No</TableCell>
                  <TableCell>Father</TableCell>
                  <TableCell>Mobile</TableCell>
                  <TableCell>DOB</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row, idx) => (
                  <TableRow key={row.studentId + idx} hover sx={{ cursor: 'pointer', background: dialogStudent && dialogStudent.studentId === row.studentId ? 'rgba(33,203,243,0.08)' : undefined }} onClick={() => setDialogStudent(row)}>
                    <TableCell>{row.studentId}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.class}</TableCell>
                    <TableCell>{row.section}</TableCell>
                    <TableCell>{row.rollNo}</TableCell>
                    <TableCell>{row.fatherName}</TableCell>
                    <TableCell>{row.fatherMobile}</TableCell>
                    <TableCell>{row.dob}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Typography sx={{ mt: 2, color: 'text.secondary' }}>
            {loading ? 'Searching...' : 'No results to display.'}
          </Typography>
        )}
      </Box>
      {/* Student Details Dialog */}
      {dialogStudent && (
        <Dialog open={!!dialogStudent} onClose={() => setDialogStudent(null)}>
          <DialogTitle>Student Details</DialogTitle>
          <DialogContent>
            <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, minWidth: 320, maxWidth: 400, mx: 'auto', mt: 2 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
                <Avatar sx={{ bgcolor: 'primary.main', width: 64, height: 64, mb: 1 }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>{dialogStudent.name}</Typography>
                <Typography variant="body2" color="text.secondary">{dialogStudent.studentId}</Typography>
              </Box>
              <Box sx={{ mt: 2 }}>
                <Typography><b>Class:</b> {dialogStudent.class}</Typography>
                <Typography><b>Section:</b> {dialogStudent.section}</Typography>
                <Typography><b>Roll No:</b> {dialogStudent.rollNo}</Typography>
                <Typography><b>Father's Name:</b> {dialogStudent.fatherName}</Typography>
                <Typography><b>Mother's Name:</b> {dialogStudent.motherName}</Typography>
                <Typography><b>Address:</b> {dialogStudent.address}</Typography>
                <Typography><b>Aadhar No:</b> {dialogStudent.aadhar}</Typography>
                <Typography><b>DOB:</b> {dialogStudent.dob}</Typography>
                <Typography><b>Father's Mobile:</b> {dialogStudent.fatherMobile}</Typography>
                <Typography><b>Email:</b> {dialogStudent.email}</Typography>
                <Typography><b>APAAR ID:</b> {dialogStudent.apaar}</Typography>
                <Typography><b>Note:</b> {dialogStudent.note}</Typography>
              </Box>
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Current Dues: ₹{dialogStudent.dues || 0}</Typography>
                <Typography variant="subtitle2" sx={{ mt: 2 }}>Fee Payment History:</Typography>
                {(dialogStudent.feeHistory && dialogStudent.feeHistory.length > 0) ? (
                  <Box sx={{ maxHeight: 180, overflow: 'auto', mt: 1 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Date</TableCell>
                          <TableCell>Months</TableCell>
                          <TableCell>Amount</TableCell>
                          <TableCell>Dues After</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {dialogStudent.feeHistory.slice().reverse().map((p: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{p.date ? new Date(p.date).toLocaleDateString() : ''}</TableCell>
                            <TableCell>{Array.isArray(p.months) ? p.months.join(', ') : ''}</TableCell>
                            <TableCell>₹{p.amount}</TableCell>
                            <TableCell>₹{typeof p.dues === 'number' ? p.dues : ''}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                ) : (
                  <Typography color="text.secondary" sx={{ fontSize: 14, mt: 1 }}>No fee payments yet.</Typography>
                )}
              </Box>
            </Card>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleEditOpen} color="primary" variant="contained" startIcon={<EditIcon />} sx={{ fontWeight: 600 }}>Edit</Button>
            <Button onClick={() => setDeleteConfirm(true)} color="error" variant="contained" startIcon={<DeleteIcon />} sx={{ fontWeight: 600 }}>Delete</Button>
            <Button onClick={() => setDialogStudent(null)} variant="outlined" color="primary">Close</Button>
            <Button onClick={e => setExportAnchorEl(e.currentTarget)} variant="outlined" color="primary">Export</Button>
          </DialogActions>
        </Dialog>
      )}
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
      {/* Export Menu */}
      <Menu anchorEl={exportAnchorEl} open={!!exportAnchorEl} onClose={() => setExportAnchorEl(null)}>
        <MenuItem onClick={handleExportPDF}>Export as PDF</MenuItem>
        <MenuItem onClick={handleExportExcel}>Export as Excel</MenuItem>
      </Menu>
    </Box>
  );
};

export default ShowStudent; 