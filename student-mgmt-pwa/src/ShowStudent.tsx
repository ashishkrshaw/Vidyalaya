import React, { useState } from 'react';
import {
  Box, TextField, Button, MenuItem, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Select, InputLabel, FormControl,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Menu,
  CircularProgress, Chip
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
import './ShowStudent.css';

const classOptions = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sectionOptions = ['A', 'B', 'C'];

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
  const [searchType, setSearchType] = useState<'id' | 'roll' | 'class' | 'classSection' | 'all'>('all');
  const [loading, setLoading] = useState(false);
  const [dialogStudent, setDialogStudent] = useState<any | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);

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
      handleSearch();
    }
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

  return (
    <div className="show-student-page">
      {/* Search Section */}
      <div className="search-container">
        <div className="search-card">
          <div className="search-header">
            <div className="search-icon">
              <SearchIcon style={{ fontSize: 20 }} />
            </div>
            <h2 className="search-title">Search Students</h2>
          </div>

          <div className="search-form">
            <div className="search-field">
              <FormControl fullWidth size="small">
                <InputLabel>Search Type</InputLabel>
                <Select value={searchType} label="Search Type" onChange={e => setSearchType(e.target.value as any)}>
                  <MenuItem value="all">All Students</MenuItem>
                  <MenuItem value="id">By Student ID</MenuItem>
                  <MenuItem value="roll">By Roll No</MenuItem>
                  <MenuItem value="class">By Class</MenuItem>
                  <MenuItem value="classSection">By Class & Section</MenuItem>
                </Select>
              </FormControl>
            </div>

            {searchType === 'id' && (
              <div className="search-field">
                <TextField label="Student ID" value={studentId} onChange={e => setStudentId(e.target.value)} fullWidth size="small" />
              </div>
            )}

            {(searchType === 'roll' || searchType === 'class' || searchType === 'classSection') && (
              <div className="search-field">
                <FormControl fullWidth size="small">
                  <InputLabel>Class</InputLabel>
                  <Select value={cls} label="Class" onChange={e => setCls(e.target.value)}>
                    {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>
            )}

            {(searchType === 'roll' || searchType === 'classSection') && (
              <div className="search-field">
                <FormControl fullWidth size="small">
                  <InputLabel>Section</InputLabel>
                  <Select value={section} label="Section" onChange={e => setSection(e.target.value)}>
                    {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                  </Select>
                </FormControl>
              </div>
            )}

            {searchType === 'roll' && (
              <div className="search-field">
                <TextField label="Roll No" value={rollNo} onChange={e => setRollNo(e.target.value)} fullWidth size="small" />
              </div>
            )}

            <button className="search-btn" onClick={handleSearch}>
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="results-container">
        {loading ? (
          <div className="loading-container">
            <CircularProgress />
          </div>
        ) : results.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3 className="empty-title">No students found</h3>
            <p className="empty-text">Try searching with different criteria</p>
          </div>
        ) : (
          <>
            <div className="results-header">
              <span className="results-count">{results.length} student{results.length !== 1 ? 's' : ''} found</span>
            </div>
            <div className="results-grid">
              {results.map(student => (
                <div key={student.studentId} className="student-card">
                  <div className="student-card-header">
                    <div className="student-avatar">
                      {student.photo ? (
                        <img src={student.photo} alt={student.name} />
                      ) : (
                        <PersonIcon style={{ fontSize: 24 }} />
                      )}
                    </div>
                    <div className="student-info">
                      <h4 className="student-name">{student.name}</h4>
                      <p className="student-meta">Class {student.class}-{student.section} | Roll: {student.rollNo}</p>
                      <p className="student-id">{student.studentId}</p>
                    </div>
                  </div>
                  <div className="student-card-actions">
                    {!idCardMode ? (
                      <>
                        <button className="action-btn view" onClick={() => setDialogStudent(student)}>
                          <VisibilityIcon style={{ fontSize: 16 }} /> View
                        </button>
                        <button className="action-btn edit" onClick={() => { setEditMode(true); setEditData(student); }}>
                          <EditIcon style={{ fontSize: 16 }} /> Edit
                        </button>
                        <button className="action-btn delete" onClick={() => { setDeleteConfirm(true); setDialogStudent(student); }}>
                          <DeleteIcon style={{ fontSize: 16 }} />
                        </button>
                      </>
                    ) : (
                      <button className="action-btn id-card" onClick={() => onSelectStudent && onSelectStudent(student)}>
                        <CardMembershipIcon style={{ fontSize: 16 }} /> Generate ID Card
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* View Student Dialog */}
      <Dialog open={!!dialogStudent && !deleteConfirm} onClose={() => setDialogStudent(null)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0052CC 0%, #6554C0 100%)', color: 'white' }}>
          Student Profile
        </DialogTitle>
        {dialogStudent && (
          <>
            <DialogContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
                <Avatar sx={{ bgcolor: '#0052CC', width: 64, height: 64 }}>
                  <PersonIcon sx={{ fontSize: 32 }} />
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={600}>{dialogStudent.name}</Typography>
                  <Chip label={`ID: ${dialogStudent.studentId}`} size="small" sx={{ mt: 0.5 }} />
                </Box>
              </Box>

              <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' } }}>
                <Box><Typography variant="caption" color="text.secondary">Class</Typography><Typography fontWeight={500}>{dialogStudent.class}-{dialogStudent.section}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Roll No</Typography><Typography fontWeight={500}>{dialogStudent.rollNo}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Gender</Typography><Typography fontWeight={500}>{dialogStudent.gender || 'N/A'}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Date of Birth</Typography><Typography fontWeight={500}>{dialogStudent.dob}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Aadhar</Typography><Typography fontWeight={500}>{dialogStudent.aadhar}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">APAAR ID</Typography><Typography fontWeight={500}>{dialogStudent.apaar || 'N/A'}</Typography></Box>
                <Box sx={{ gridColumn: '1 / -1' }}><Typography variant="caption" color="text.secondary">Address</Typography><Typography fontWeight={500}>{dialogStudent.address}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Father's Name</Typography><Typography fontWeight={500}>{dialogStudent.fatherName}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Mother's Name</Typography><Typography fontWeight={500}>{dialogStudent.motherName}</Typography></Box>
                <Box><Typography variant="caption" color="text.secondary">Mobile</Typography><Typography fontWeight={500}>{dialogStudent.parentMobile || dialogStudent.fatherMobile}</Typography></Box>
              </Box>

              {dialogStudent.feeHistory?.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1 }}>Payment History</Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead><TableRow><TableCell>Date</TableCell><TableCell>Months</TableCell><TableCell>Amount</TableCell></TableRow></TableHead>
                      <TableBody>
                        {dialogStudent.feeHistory.slice(-5).reverse().map((p: any, idx: number) => (
                          <TableRow key={idx}>
                            <TableCell>{p.date ? new Date(p.date).toLocaleDateString() : ''}</TableCell>
                            <TableCell>{Array.isArray(p.months) ? p.months.join(', ') : ''}</TableCell>
                            <TableCell>₹{p.amount}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2, justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<EditIcon />} onClick={() => { setEditData(dialogStudent); setEditMode(true); }}>Edit</Button>
                <Button startIcon={<DeleteIcon />} color="error" onClick={() => setDeleteConfirm(true)}>Delete</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button startIcon={<DownloadIcon />} onClick={e => setExportAnchorEl(e.currentTarget)}>Export</Button>
                <Button onClick={() => setDialogStudent(null)} variant="contained" sx={{ bgcolor: '#0052CC' }}>Close</Button>
              </Box>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle sx={{ color: '#DE350B' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to permanently delete this student record? This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete Forever</Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editMode} onClose={() => setEditMode(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #0052CC 0%, #6554C0 100%)', color: 'white' }}>
          Edit Student Information
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          {editData && (
            <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' } }}>
              <TextField label="Student ID" value={editData.studentId} fullWidth InputProps={{ readOnly: true }} size="small" />
              <TextField label="Roll No" value={editData.rollNo} fullWidth InputProps={{ readOnly: true }} size="small" />
              <TextField label="Name" value={editData.name} onChange={e => handleEditChange('name', e.target.value)} fullWidth size="small" />
              <FormControl fullWidth size="small">
                <InputLabel>Gender</InputLabel>
                <Select value={editData.gender || ''} label="Gender" onChange={e => handleEditChange('gender', e.target.value)}>
                  <MenuItem value="Male">Male</MenuItem>
                  <MenuItem value="Female">Female</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Class</InputLabel>
                <Select value={editData.class} label="Class" onChange={e => handleEditChange('class', e.target.value)}>
                  {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl fullWidth size="small">
                <InputLabel>Section</InputLabel>
                <Select value={editData.section} label="Section" onChange={e => handleEditChange('section', e.target.value)}>
                  {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Father's Name" value={editData.fatherName} onChange={e => handleEditChange('fatherName', e.target.value)} fullWidth size="small" />
              <TextField label="Mother's Name" value={editData.motherName} onChange={e => handleEditChange('motherName', e.target.value)} fullWidth size="small" />
              <TextField label="Address" value={editData.address} onChange={e => handleEditChange('address', e.target.value)} fullWidth size="small" sx={{ gridColumn: '1 / -1' }} />
              <TextField label="Aadhar No" value={editData.aadhar} onChange={e => handleEditChange('aadhar', e.target.value)} fullWidth size="small" />
              <TextField label="DOB" type="date" value={editData.dob} onChange={e => handleEditChange('dob', e.target.value)} fullWidth size="small" InputLabelProps={{ shrink: true }} />
              <TextField label="Mobile" value={editData.parentMobile || editData.fatherMobile} onChange={e => handleEditChange('parentMobile', e.target.value)} fullWidth size="small" />
              <TextField label="Email" value={editData.email} onChange={e => handleEditChange('email', e.target.value)} fullWidth size="small" />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setEditMode(false)}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained" sx={{ bgcolor: '#0052CC' }}>Save Changes</Button>
        </DialogActions>
      </Dialog>

      {/* Export Menu */}
      <Menu anchorEl={exportAnchorEl} open={!!exportAnchorEl} onClose={() => setExportAnchorEl(null)}>
        <MenuItem onClick={() => setExportAnchorEl(null)}><PictureAsPdfIcon sx={{ mr: 1 }} /> Export as PDF</MenuItem>
        <MenuItem onClick={() => setExportAnchorEl(null)}><TableChartIcon sx={{ mr: 1 }} /> Export as Excel</MenuItem>
      </Menu>
    </div>
  );
};

export default ShowStudent;
