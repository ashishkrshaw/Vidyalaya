import React, { useState } from 'react';
import Grid from '@mui/material/Grid';
import { Box, TextField, Button, MenuItem, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Select, InputLabel, FormControl, Dialog, DialogTitle, DialogContent, DialogActions, Card, Avatar, Menu } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TableChartIcon from '@mui/icons-material/TableChart';
import SearchIcon from '@mui/icons-material/Search';

// Mock functions for demo
const getAdmissions = async () => [];
const getAdmissionsByClassSection = async (cls: any, section: any) => [];
const deleteAdmission = async (studentId: any, student: any) => {};
const updateAdmission = async (editData: any, dialogStudent: any) => {};

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
    // PDF export logic
    setExportAnchorEl(null);
  };

  const handleExportExcel = () => {
    // Excel export logic
    setExportAnchorEl(null);
  };

  const handleExportAllPDF = () => {
    // PDF export logic for all
    setExportAllAnchorEl(null);
  };

  const handleExportAllExcel = () => {
    // Excel export logic for all
    setExportAllAnchorEl(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, textAlign: 'center', fontWeight: 'bold' }}>
        Student Search
      </Typography>

      <Card sx={{ p: 3, mb: 4, boxShadow: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel>Search By</InputLabel>
              <Select
                value={searchType}
                label="Search By"
                onChange={e => setSearchType(e.target.value as any)}
              >
                <MenuItem value="id">Student ID</MenuItem>
                <MenuItem value="roll">Class + Section + Roll</MenuItem>
                <MenuItem value="class">All of Class</MenuItem>
                <MenuItem value="classSection">Class & Section</MenuItem>
                <MenuItem value="all">All Students</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {searchType === 'id' && (
            <Grid item xs={12} sm={9}>
              <TextField
                label="Student ID"
                value={studentId}
                onChange={e => setStudentId(e.target.value)}
                fullWidth
              />
            </Grid>
          )}

          {(searchType === 'roll' || searchType === 'class' || searchType === 'classSection') && (
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Class</InputLabel>
                <Select
                  value={cls}
                  label="Class"
                  onChange={e => setCls(e.target.value)}
                >
                  {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}

          {(searchType === 'roll' || searchType === 'classSection') && (
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth>
                <InputLabel>Section</InputLabel>
                <Select
                  value={section}
                  label="Section"
                  onChange={e => setSection(e.target.value)}
                >
                  {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}

          {searchType === 'roll' && (
            <Grid item xs={12} sm={3}>
              <TextField
                label="Roll No"
                value={rollNo}
                onChange={e => setRollNo(e.target.value)}
                fullWidth
              />
            </Grid>
          )}

          <Grid item xs={12}>
            <Button
              variant="contained"
              onClick={handleSearch}
              fullWidth
              disabled={loading}
              startIcon={<SearchIcon />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Searching...' : 'Search'}
            </Button>
          </Grid>
        </Grid>
      </Card>

      {results.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={e => setExportAllAnchorEl(e.currentTarget)}
          >
            Export All Data
          </Button>
          <Menu
            anchorEl={exportAllAnchorEl}
            open={!!exportAllAnchorEl}
            onClose={() => setExportAllAnchorEl(null)}
          >
            <MenuItem onClick={handleExportAllPDF}>
              <PictureAsPdfIcon sx={{ mr: 1 }} />
              Export as PDF
            </MenuItem>
            <MenuItem onClick={handleExportAllExcel}>
              <TableChartIcon sx={{ mr: 1 }} />
              Export as Excel
            </MenuItem>
          </Menu>
        </Box>
      )}

      {results.length > 0 ? (
        <TableContainer component={Paper}>
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
                <TableRow
                  key={row.studentId + idx}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => setDialogStudent(row)}
                >
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
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography color="text.secondary">
            {loading ? 'Searching database...' : 'No results to display. Start searching!'}
          </Typography>
        </Box>
      )}

      {dialogStudent && (
        <Dialog
          open={!!dialogStudent}
          onClose={() => setDialogStudent(null)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>Student Profile</DialogTitle>
          <DialogContent>
            <Card sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{ width: 80, height: 80, mr: 3 }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Box>
                  <Typography variant="h4">{dialogStudent.name}</Typography>
                  <Typography variant="h6" color="text.secondary">ID: {dialogStudent.studentId}</Typography>
                </Box>
              </Box>

              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <Typography><b>Class:</b> {dialogStudent.class}</Typography>
                  <Typography><b>Section:</b> {dialogStudent.section}</Typography>
                  <Typography><b>Roll No:</b> {dialogStudent.rollNo}</Typography>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Typography><b>Father:</b> {dialogStudent.fatherName}</Typography>
                  <Typography><b>Mother:</b> {dialogStudent.motherName}</Typography>
                  <Typography><b>Mobile:</b> {dialogStudent.fatherMobile}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography><b>DOB:</b> {dialogStudent.dob}</Typography>
                  <Typography><b>Aadhar:</b> {dialogStudent.aadhar}</Typography>
                  <Typography><b>Email:</b> {dialogStudent.email}</Typography>
                  <Typography><b>APAAR ID:</b> {dialogStudent.apaar}</Typography>
                  <Typography><b>Address:</b> {dialogStudent.address}</Typography>
                  <Typography><b>Note:</b> {dialogStudent.note}</Typography>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="h6">Financial Status</Typography>
                  <Typography variant="h5" color={dialogStudent.dues > 0 ? 'error' : 'success'}>
                    Current Dues: ₹{dialogStudent.dues || 0}
                  </Typography>

                  <Typography variant="subtitle1" sx={{ mt: 2 }}>Payment History:</Typography>
                  {(dialogStudent.feeHistory && dialogStudent.feeHistory.length > 0) ? (
                    <TableContainer component={Paper} sx={{ mt: 1 }}>
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
                    </TableContainer>
                  ) : (
                    <Typography sx={{ fontStyle: 'italic', color: 'text.secondary' }}>
                      No fee payments recorded yet
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </Card>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleEditOpen} startIcon={<EditIcon />}>Edit</Button>
            <Button onClick={() => setDeleteConfirm(true)} startIcon={<DeleteIcon />} color="error">Delete</Button>
            <Button onClick={e => setExportAnchorEl(e.currentTarget)} startIcon={<DownloadIcon />}>Export</Button>
            <Button onClick={() => setDialogStudent(null)}>Close</Button>
          </DialogActions>
        </Dialog>
      )}

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this student record?</Typography>
          <Typography color="text.secondary">This action cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDelete} color="error">Delete Forever</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Student Information</DialogTitle>
        <DialogContent>
          {editData && (
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <TextField label="Student ID" value={editData.studentId} fullWidth margin="dense" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Roll No" value={editData.rollNo} fullWidth margin="dense" InputProps={{ readOnly: true }} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Student Name" value={editData.name} onChange={e => handleEditChange('name', e.target.value)} fullWidth margin="dense" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Class</InputLabel>
                  <Select value={editData.class} label="Class" onChange={e => handleEditChange('class', e.target.value)}>
                    {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth margin="dense">
                  <InputLabel>Section</InputLabel>
                  <Select value={editData.section} label="Section" onChange={e => handleEditChange('section', e.target.value)}>
                    {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Father's Name" value={editData.fatherName} onChange={e => handleEditChange('fatherName', e.target.value)} fullWidth margin="dense" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Mother's Name" value={editData.motherName} onChange={e => handleEditChange('motherName', e.target.value)} fullWidth margin="dense" />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Address" value={editData.address} onChange={e => handleEditChange('address', e.target.value)} fullWidth margin="dense" multiline rows={2} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Aadhar No" value={editData.aadhar} onChange={e => handleEditChange('aadhar', e.target.value)} fullWidth margin="dense" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Date of Birth" type="date" value={editData.dob} onChange={e => handleEditChange('dob', e.target.value)} fullWidth margin="dense" InputLabelProps={{ shrink: true }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Father's Mobile" value={editData.fatherMobile} onChange={e => handleEditChange('fatherMobile', e.target.value)} fullWidth margin="dense" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" value={editData.email} onChange={e => handleEditChange('email', e.target.value)} fullWidth margin="dense" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="APAAR ID" value={editData.apaar} onChange={e => handleEditChange('apaar', e.target.value)} fullWidth margin="dense" />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Note" value={editData.note} onChange={e => handleEditChange('note', e.target.value)} fullWidth margin="dense" />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditMode(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save Changes</Button>
        </DialogActions>
      </Dialog>

      <Menu
        anchorEl={exportAnchorEl}
        open={!!exportAnchorEl}
        onClose={() => setExportAnchorEl(null)}
      >
        <MenuItem onClick={handleExportPDF}>
          <PictureAsPdfIcon sx={{ mr: 1 }} />
          Export as PDF
        </MenuItem>
        <MenuItem onClick={handleExportExcel}>
          <TableChartIcon sx={{ mr: 1 }} />
          Export as Excel
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ShowStudent;
