import React, { useState } from 'react';
import {
  Box, TextField, Button, MenuItem, Typography, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Paper, Select, InputLabel, FormControl,
  Dialog, DialogTitle, DialogContent, DialogActions, Avatar, Menu, ListItemIcon, ListItemText,
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
import BadgeIcon from '@mui/icons-material/Badge';
import ReceiptIcon from '@mui/icons-material/Receipt';
import { getAdmissions, getAdmissionsByClassSection, deleteAdmission, updateAdmission, loadSchoolInfo, loadSchoolLogo, loadPrincipalSignature } from './db';
import jsPDF from 'jspdf';
import QRCode from 'qrcode';
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

  // Password protection state
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
  const [pendingStudent, setPendingStudent] = useState<any | null>(null);

  // Request password for sensitive actions
  const requestPassword = (action: 'edit' | 'delete', student: any) => {
    setPendingAction(action);
    setPendingStudent(student);
    setPasswordDialogOpen(true);
    setPasswordInput('');
    setPasswordError('');
  };

  // Verify password and execute action
  const handlePasswordConfirm = () => {
    const storedPassword = localStorage.getItem('actionPassword') || '123456';
    if (passwordInput === storedPassword) {
      setPasswordDialogOpen(false);
      if (pendingAction === 'edit' && pendingStudent) {
        setEditMode(true);
        setEditData(pendingStudent);
      } else if (pendingAction === 'delete' && pendingStudent) {
        setDeleteConfirm(true);
        setDialogStudent(pendingStudent);
      }
      setPendingAction(null);
      setPendingStudent(null);
      setPasswordInput('');
    } else {
      setPasswordError('Incorrect password');
    }
  };

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

  // Download Admission Receipt PDF
  const downloadAdmissionReceipt = async (student: any) => {
    if (!student) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageWidth = 210;
    const margin = 15;

    const schoolInfo = await loadSchoolInfo();
    const schoolLogo = await loadSchoolLogo();

    // Generate QR code with all student info
    const qrData = JSON.stringify({
      id: String(student.studentId || ''),
      name: String(student.name || ''),
      class: String(student.class || ''),
      section: String(student.section || ''),
      roll: String(student.rollNo || ''),
      dob: String(student.dob || ''),
      father: String(student.fatherName || ''),
      mother: String(student.motherName || ''),
      mobile: String(student.fatherMobile || student.parentMobile || ''),
      address: String(student.address || ''),
      aadhar: String(student.aadhar || '')
    });

    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: { dark: '#1e3a8a', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
    } catch (e) {
      console.error('QR generation failed:', e);
    }

    let y = 15;

    // Logo
    if (schoolLogo && typeof schoolLogo === 'string' && schoolLogo.startsWith('data:')) {
      try { doc.addImage(schoolLogo, 'PNG', margin, y, 20, 20); } catch (e) {
        doc.setFillColor(30, 58, 138); doc.rect(margin, y, 20, 20, 'F');
      }
    } else {
      doc.setFillColor(30, 58, 138); doc.rect(margin, y, 20, 20, 'F');
    }

    // School name
    doc.setTextColor(30, 58, 138);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(String(schoolInfo.name || '').toUpperCase(), 105, y + 7, { align: 'center' });

    doc.setTextColor(85, 85, 85);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(String(schoolInfo.address || ''), 105, y + 13, { align: 'center' });
    doc.text(`Ph: ${String(schoolInfo.phone || '')} | Email: ${String(schoolInfo.email || '')}`, 105, y + 18, { align: 'center' });

    // Student Photo with proper border box
    const photoX = pageWidth - margin - 22;
    const photoY = y;
    const photoW = 22;
    const photoH = 28;

    // Draw photo border first
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.rect(photoX, photoY, photoW, photoH);

    if (student.photoData || student.photo) {
      try {
        doc.addImage(student.photoData || student.photo, 'JPEG', photoX + 1, photoY + 1, photoW - 2, photoH - 2);
      } catch (e) {
        doc.setFillColor(245, 245, 245);
        doc.rect(photoX + 1, photoY + 1, photoW - 2, photoH - 2, 'F');
        doc.setTextColor(150);
        doc.setFontSize(6);
        doc.text('Photo', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
      }
    } else {
      doc.setFillColor(245, 245, 245);
      doc.rect(photoX + 1, photoY + 1, photoW - 2, photoH - 2, 'F');
      doc.setTextColor(150);
      doc.setFontSize(6);
      doc.text('Photo', photoX + photoW / 2, photoY + photoH / 2, { align: 'center' });
    }

    // Separator
    y = 45;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(0.8);
    doc.line(margin, y, pageWidth - margin, y);

    // Title
    y = 53;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(70, y - 3, 70, 10, 2, 2, 'F');
    doc.setTextColor(55, 65, 81);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('ADMISSION RECEIPT', 105, y + 4, { align: 'center' });

    // Details
    y = 72;
    const labelWidth = 45;
    const details = [
      { label: 'Admission Date', value: student.admissionDate || new Date().toLocaleDateString('en-IN') },
      { label: 'Student ID', value: student.studentId },
      { label: 'Student Name', value: student.name },
      { label: 'Class / Section', value: `${student.class} - ${student.section}` },
      { label: 'Roll Number', value: student.rollNo || '-' },
      { label: 'Date of Birth', value: student.dob || '-' },
      { label: "Father's Name", value: student.fatherName || '-' },
      { label: "Mother's Name", value: student.motherName || '-' },
      { label: 'Contact Number', value: student.fatherMobile || student.parentMobile || '-' },
      { label: 'Address', value: student.address || '-' },
    ];

    doc.setFontSize(10);
    details.forEach((item) => {
      doc.setTextColor(75, 85, 99);
      doc.setFont('helvetica', 'bold');
      doc.text(item.label + ':', margin, y);
      doc.setTextColor(0, 0, 0);
      doc.setFont('helvetica', 'normal');
      doc.text(String(item.value || '-'), margin + labelWidth, y);
      y += 8;
    });

    // Footer with QR Code
    y = 165;
    doc.setDrawColor(200, 200, 200);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(margin, y, pageWidth - margin, y);
    doc.setLineDashPattern([], 0);

    // QR Code on left
    if (qrDataUrl) {
      try {
        doc.addImage(qrDataUrl, 'PNG', margin, y + 5, 30, 30);
      } catch (e) {
        doc.setDrawColor(200);
        doc.rect(margin, y + 5, 30, 30);
      }
      doc.setTextColor(100, 116, 139);
      doc.setFontSize(7);
      doc.text('Scan for verification', margin + 15, y + 40, { align: 'center' });
    }

    // Principal signature on the right
    doc.setDrawColor(0);
    doc.setLineWidth(0.3);
    doc.line(pageWidth - margin - 60, y + 30, pageWidth - margin, y + 30);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(51, 51, 51);
    doc.text('Principal / Authorized Signatory', pageWidth - margin - 30, y + 36, { align: 'center' });

    // Footer note
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('This is a computer generated admission receipt.', 105, 215, { align: 'center' });

    doc.save(`Admission_Receipt_${String(student.name || 'Student')}_${String(student.studentId || 'ID')}.pdf`);
  };
  // Download ID Card PDF
  const downloadIdCard = async (student: any) => {
    if (!student) return;

    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [85, 130] });
    const pageWidth = 85;
    const margin = 5;

    const schoolInfo = await loadSchoolInfo();
    const schoolLogo = await loadSchoolLogo();
    const principalSig = await loadPrincipalSignature();

    // Generate QR Code data with all student info
    const qrData = JSON.stringify({
      id: String(student.studentId || ''),
      name: String(student.name || ''),
      class: String(student.class || ''),
      section: String(student.section || ''),
      roll: String(student.rollNo || ''),
      dob: String(student.dob || ''),
      father: String(student.fatherName || ''),
      mother: String(student.motherName || ''),
      mobile: String(student.fatherMobile || student.parentMobile || ''),
      address: String(student.address || ''),
      aadhar: String(student.aadhar || '')
    });

    // Generate actual scannable QR code using qrcode library
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(qrData, {
        width: 200,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
        errorCorrectionLevel: 'M'
      });
    } catch (e) {
      console.error('QR generation failed:', e);
    }

    // Header
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, 35, 'F');

    // Accent
    doc.setFillColor(20, 184, 166);
    doc.circle(pageWidth + 5, -5, 25, 'F');

    // Logo
    if (schoolLogo && typeof schoolLogo === 'string' && schoolLogo.startsWith('data:')) {
      try { doc.addImage(schoolLogo, 'PNG', 8, 8, 10, 10); } catch (e) {
        doc.setFillColor(20, 184, 166); doc.roundedRect(8, 8, 10, 10, 1, 1, 'F');
      }
    } else {
      doc.setFillColor(20, 184, 166); doc.roundedRect(8, 8, 10, 10, 1, 1, 'F');
    }

    // School name
    doc.setTextColor(45, 212, 191);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(String(schoolInfo.name || '').toUpperCase(), pageWidth / 2 + 5, 13, { align: 'center' });

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('STUDENT ID', pageWidth / 2, 24, { align: 'center' });

    // Photo
    const photoSize = 26;
    const photoX = (pageWidth - photoSize) / 2;
    const photoY = 32;

    doc.setFillColor(255, 255, 255);
    doc.roundedRect(photoX - 2, photoY - 2, photoSize + 4, photoSize + 4, 2, 2, 'F');

    if (student.photoData || student.photo) {
      try { doc.addImage(student.photoData || student.photo, 'JPEG', photoX, photoY, photoSize, photoSize); } catch (e) { }
    }

    // Name
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(String(student.name || ''), pageWidth / 2, 68, { align: 'center' });

    doc.setTextColor(13, 148, 136);
    doc.setFontSize(9);
    doc.text(`Class ${String(student.class || '')} - ${String(student.section || '')}`, pageWidth / 2, 74, { align: 'center' });

    // Data Grid - Larger fonts
    let y = 82;
    doc.setFontSize(6);
    doc.setTextColor(148, 163, 184);
    doc.text('STUDENT ID', margin + 2, y);
    doc.text('ROLL NO', pageWidth - margin - 2, y, { align: 'right' });
    y += 4;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(String(student.studentId || '-'), margin + 2, y);
    doc.text(String(student.rollNo || '-'), pageWidth - margin - 2, y, { align: 'right' });

    y += 7;
    doc.setFontSize(6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text('DATE OF BIRTH', margin + 2, y);
    doc.text('VALID TILL', pageWidth - margin - 2, y, { align: 'right' });
    y += 4;
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.text(String(student.dob || '-'), margin + 2, y);
    const expiryYear = new Date().getMonth() >= 3 ? new Date().getFullYear() + 1 : new Date().getFullYear();
    doc.setTextColor(239, 68, 68);
    doc.text(`Mar ${expiryYear}`, pageWidth - margin - 2, y, { align: 'right' });

    // Footer with QR Code
    const footerY = 102;
    doc.setFillColor(248, 250, 252);
    doc.rect(0, footerY, pageWidth, 28, 'F');

    // QR Code placeholder on left
    try {
      doc.addImage(qrDataUrl, 'PNG', margin + 2, footerY + 3, 18, 18);
    } catch (e) {
      doc.setDrawColor(200);
      doc.rect(margin + 2, footerY + 3, 18, 18);
    }
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text('SCAN FOR INFO', margin + 11, footerY + 24, { align: 'center' });

    // Emergency contact in center
    doc.setTextColor(100, 116, 139);
    doc.setFontSize(6);
    doc.text('Emergency:', pageWidth / 2, footerY + 8, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(String(student.fatherMobile || student.parentMobile || '-'), pageWidth / 2, footerY + 14, { align: 'center' });

    // Principal signature on right
    if (principalSig && typeof principalSig === 'string') {
      try { doc.addImage(principalSig, 'PNG', pageWidth - margin - 22, footerY + 3, 20, 10); } catch (e) { }
    }
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(5);
    doc.setFont('helvetica', 'normal');
    doc.text('PRINCIPAL', pageWidth - margin - 12, footerY + 18, { align: 'center' });

    // Bottom accent
    doc.setFillColor(20, 184, 166);
    doc.rect(0, 128, pageWidth, 2, 'F');

    doc.save(`ID_Card_${String(student.name || 'Student')}_${String(student.studentId || 'ID')}.pdf`);
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
                      {(student.photoData || student.photo) ? (
                        <img src={student.photoData || student.photo} alt={student.name} />
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
                        <button className="action-btn edit" onClick={() => requestPassword('edit', student)}>
                          <EditIcon style={{ fontSize: 16 }} /> Edit
                        </button>
                        <button className="action-btn delete" onClick={() => requestPassword('delete', student)}>
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
                {(dialogStudent.photoData || dialogStudent.photo) ? (
                  <Avatar
                    src={dialogStudent.photoData || dialogStudent.photo}
                    sx={{ width: 80, height: 80, border: '3px solid #0052CC' }}
                  />
                ) : (
                  <Avatar sx={{ bgcolor: '#0052CC', width: 80, height: 80 }}>
                    <PersonIcon sx={{ fontSize: 40 }} />
                  </Avatar>
                )}
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
            <DialogActions sx={{ p: 2, flexDirection: 'column', gap: 1.5 }}>
              {/* Download Row */}
              <Box sx={{ display: 'flex', gap: 1, width: '100%', justifyContent: 'center', pb: 1, borderBottom: '1px solid #eee' }}>
                <Button
                  startIcon={<ReceiptIcon />}
                  onClick={() => downloadAdmissionReceipt(dialogStudent)}
                  variant="outlined"
                  sx={{ borderColor: '#1e3a8a', color: '#1e3a8a' }}
                >
                  Admission Receipt
                </Button>
                <Button
                  startIcon={<BadgeIcon />}
                  onClick={() => downloadIdCard(dialogStudent)}
                  variant="outlined"
                  sx={{ borderColor: '#14b8a6', color: '#14b8a6' }}
                >
                  ID Card
                </Button>
              </Box>

              {/* Action Row */}
              <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button startIcon={<EditIcon />} onClick={() => { setEditData(dialogStudent); setEditMode(true); }}>Edit</Button>
                  <Button startIcon={<DeleteIcon />} color="error" onClick={() => setDeleteConfirm(true)}>Delete</Button>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button startIcon={<DownloadIcon />} onClick={e => setExportAnchorEl(e.currentTarget)}>Export</Button>
                  <Button onClick={() => setDialogStudent(null)} variant="contained" sx={{ bgcolor: '#0052CC' }}>Close</Button>
                </Box>
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
        <MenuItem onClick={() => {
          if (dialogStudent) downloadAdmissionReceipt(dialogStudent);
          setExportAnchorEl(null);
        }}>
          <ListItemIcon><PictureAsPdfIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export as PDF (Receipt)</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => {
          if (dialogStudent) {
            // Export single student as CSV
            const data = [
              'Name,Student ID,Roll No,Class,Section,DOB,Father,Mother,Mobile,Address',
              `"${dialogStudent.name}","${dialogStudent.studentId}","${dialogStudent.rollNo}","${dialogStudent.class}","${dialogStudent.section}","${dialogStudent.dob || ''}","${dialogStudent.fatherName || ''}","${dialogStudent.motherName || ''}","${dialogStudent.fatherMobile || dialogStudent.parentMobile || ''}","${dialogStudent.address || ''}"`
            ].join('\n');
            const blob = new Blob([data], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${dialogStudent.name}_${dialogStudent.studentId}.csv`;
            a.click();
            URL.revokeObjectURL(url);
          }
          setExportAnchorEl(null);
        }}>
          <ListItemIcon><TableChartIcon fontSize="small" /></ListItemIcon>
          <ListItemText>Export as Excel (CSV)</ListItemText>
        </MenuItem>
      </Menu>

      {/* Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          🔒 Password Required
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
            Please enter your password to {pendingAction === 'edit' ? 'edit' : 'delete'} this student record.
          </Typography>
          <TextField
            type="password"
            label="Password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handlePasswordConfirm()}
            fullWidth
            autoFocus
            error={!!passwordError}
            helperText={passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); }}>
            Cancel
          </Button>
          <Button onClick={handlePasswordConfirm} variant="contained" sx={{ bgcolor: '#0052CC' }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ShowStudent;
