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
import { keyframes } from '@mui/system';

// Mock functions for demo
const getAdmissions = async () => [];
const getAdmissionsByClassSection = async (cls, section) => [];
const deleteAdmission = async (studentId, student) => {};
const updateAdmission = async (editData, dialogStudent) => {};

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

// Animations
const glow = keyframes`
  0% { box-shadow: 0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff; }
  50% { box-shadow: 0 0 20px #00d4ff, 0 0 35px #00d4ff, 0 0 40px #00d4ff; }
  100% { box-shadow: 0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff; }
`;

const pulse = keyframes`
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
`;

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
    <Box sx={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0c0c0c 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #533483 100%)',
      p: 3,
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 20% 80%, rgba(0, 212, 255, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(255, 0, 150, 0.1) 0%, transparent 50%)',
        pointerEvents: 'none',
        zIndex: 0
      }
    }}>
      {/* Header */}
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        mb: 4,
        textAlign: 'center'
      }}>
        <Typography variant="h3" sx={{
          fontWeight: 900,
          background: 'linear-gradient(45deg, #00d4ff, #ff0096, #00d4ff)',
          backgroundSize: '200% 200%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          animation: `${glow} 2s ease-in-out infinite alternate`,
          letterSpacing: 2,
          mb: 1
        }}>
          STUDENT SEARCH PORTAL
        </Typography>
        <Typography variant="h6" sx={{
          color: 'rgba(255, 255, 255, 0.7)',
          fontWeight: 300,
          letterSpacing: 1
        }}>
          Advanced Student Information System
        </Typography>
      </Box>

      {/* Search Panel */}
      <Box sx={{
        position: 'relative',
        zIndex: 1,
        background: 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(20px)',
        borderRadius: 4,
        border: '1px solid rgba(0, 212, 255, 0.2)',
        p: 4,
        mb: 4,
        boxShadow: '0 25px 45px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        '&:hover': {
          border: '1px solid rgba(0, 212, 255, 0.4)',
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.2)',
        }
      }}>
        <Typography variant="h5" sx={{
          fontWeight: 700,
          color: '#00d4ff',
          mb: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}>
          <SearchIcon sx={{ fontSize: 28 }} />
          Search Configuration
        </Typography>
        
        <Grid container spacing={3} alignItems="center">
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth>
              <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Search Method</InputLabel>
              <Select 
                value={searchType} 
                label="Search Method" 
                onChange={e => setSearchType(e.target.value as any)}
                sx={{
                  background: 'rgba(255, 255, 255, 0.1)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'rgba(0, 212, 255, 0.3)',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#00d4ff',
                  },
                  '& .MuiSelect-select': {
                    color: 'white',
                  }
                }}
              >
                <MenuItem value="id">🆔 Student ID</MenuItem>
                <MenuItem value="roll">📝 Class + Section + Roll</MenuItem>
                <MenuItem value="class">🏫 All of Class</MenuItem>
                <MenuItem value="classSection">📚 Class & Section</MenuItem>
                <MenuItem value="all">👥 All Students</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          {searchType === 'id' && (
            <Grid item xs={12} sm={4}>
              <TextField 
                label="Student ID" 
                value={studentId} 
                onChange={e => setStudentId(e.target.value)} 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00d4ff',
                    },
                    '& input': {
                      color: 'white',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  }
                }}
              />
            </Grid>
          )}
          
          {(searchType === 'roll' || searchType === 'class' || searchType === 'classSection') && (
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Class</InputLabel>
                <Select 
                  value={cls} 
                  label="Class" 
                  onChange={e => setCls(e.target.value)}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00d4ff',
                    },
                    '& .MuiSelect-select': {
                      color: 'white',
                    }
                  }}
                >
                  {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {(searchType === 'roll' || searchType === 'classSection') && (
            <Grid item xs={12} sm={2}>
              <FormControl fullWidth>
                <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Section</InputLabel>
                <Select 
                  value={section} 
                  label="Section" 
                  onChange={e => setSection(e.target.value)}
                  sx={{
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#00d4ff',
                    },
                    '& .MuiSelect-select': {
                      color: 'white',
                    }
                  }}
                >
                  {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
          )}
          
          {searchType === 'roll' && (
            <Grid item xs={12} sm={2}>
              <TextField 
                label="Roll No" 
                value={rollNo} 
                onChange={e => setRollNo(e.target.value)} 
                fullWidth
                sx={{
                  '& .MuiOutlinedInput-root': {
                    background: 'rgba(255, 255, 255, 0.1)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 2,
                    '& fieldset': {
                      borderColor: 'rgba(0, 212, 255, 0.3)',
                    },
                    '&:hover fieldset': {
                      borderColor: '#00d4ff',
                    },
                    '& input': {
                      color: 'white',
                    }
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.7)',
                  }
                }}
              />
            </Grid>
          )}
          
          <Grid item xs={12} sm={2}>
            <Button 
              variant="contained" 
              onClick={handleSearch} 
              fullWidth 
              disabled={loading}
              startIcon={<SearchIcon />}
              sx={{
                height: 56,
                background: loading 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'linear-gradient(45deg, #ff0096, #00d4ff)',
                borderRadius: 2,
                fontWeight: 700,
                fontSize: 16,
                boxShadow: loading ? 'none' : '0 0 20px rgba(0, 212, 255, 0.5)',
                animation: loading ? 'none' : `${pulse} 2s infinite`,
                '&:hover': {
                  background: 'linear-gradient(45deg, #00d4ff, #ff0096)',
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.8)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              {loading ? 'SEARCHING...' : 'SEARCH'}
            </Button>
          </Grid>
        </Grid>
      </Box>

      {/* Export Button */}
      {results.length > 0 && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          mb: 2,
          position: 'relative',
          zIndex: 1
        }}>
          <Button
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={e => setExportAllAnchorEl(e.currentTarget)}
            sx={{
              background: 'linear-gradient(45deg, #00d4ff, #ff0096)',
              borderRadius: 25,
              px: 3,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 1,
              boxShadow: '0 10px 20px rgba(0, 212, 255, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #ff0096, #00d4ff)',
                boxShadow: '0 15px 30px rgba(255, 0, 150, 0.4)',
                transform: 'translateY(-3px)'
              }
            }}
          >
            Export All Data
          </Button>
          <Menu 
            anchorEl={exportAllAnchorEl} 
            open={!!exportAllAnchorEl} 
            onClose={() => setExportAllAnchorEl(null)}
            sx={{
              '& .MuiPaper-root': {
                background: 'rgba(26, 26, 46, 0.95)',
                backdropFilter: 'blur(20px)',
                borderRadius: 2,
                border: '1px solid rgba(0, 212, 255, 0.2)',
                boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
              }
            }}
          >
            <MenuItem onClick={handleExportAllPDF} sx={{ color: 'white', '&:hover': { background: 'rgba(0, 212, 255, 0.1)' } }}>
              <PictureAsPdfIcon sx={{ mr: 1, color: '#ff0096' }} />Export as PDF
            </MenuItem>
            <MenuItem onClick={handleExportAllExcel} sx={{ color: 'white', '&:hover': { background: 'rgba(0, 212, 255, 0.1)' } }}>
              <TableChartIcon sx={{ mr: 1, color: '#00d4ff' }} />Export as Excel
            </MenuItem>
          </Menu>
        </Box>
      )}

      {/* Results Table */}
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {results.length > 0 ? (
          <TableContainer 
            component={Paper} 
            sx={{
              background: 'rgba(255, 255, 255, 0.03)',
              backdropFilter: 'blur(20px)',
              borderRadius: 3,
              border: '1px solid rgba(0, 212, 255, 0.2)',
              boxShadow: '0 25px 45px rgba(0, 0, 0, 0.3)',
              overflow: 'hidden'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ background: 'rgba(0, 212, 255, 0.1)' }}>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700, fontSize: 16 }}>Student ID</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700, fontSize: 16 }}>Name</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700, fontSize: 16 }}>Class</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700, fontSize: 16 }}>Section</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700, fontSize: 16 }}>Roll No</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700, fontSize: 16 }}>Father</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700, fontSize: 16 }}>Mobile</TableCell>
                  <TableCell sx={{ color: '#00d4ff', fontWeight: 700, fontSize: 16 }}>DOB</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {results.map((row, idx) => (
                  <TableRow 
                    key={row.studentId + idx} 
                    hover 
                    sx={{ 
                      cursor: 'pointer',
                      background: dialogStudent && dialogStudent.studentId === row.studentId 
                        ? 'rgba(0, 212, 255, 0.15)' 
                        : 'transparent',
                      '&:hover': {
                        background: 'rgba(255, 0, 150, 0.1)',
                        transform: 'scale(1.01)',
                        transition: 'all 0.3s ease'
                      },
                      '& .MuiTableCell-root': {
                        color: 'rgba(255, 255, 255, 0.9)',
                        borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
                      }
                    }} 
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
          <Box sx={{
            textAlign: 'center',
            py: 8,
            background: 'rgba(255, 255, 255, 0.03)',
            backdropFilter: 'blur(20px)',
            borderRadius: 3,
            border: '1px solid rgba(0, 212, 255, 0.2)'
          }}>
            <Typography sx={{ 
              color: loading ? '#00d4ff' : 'rgba(255, 255, 255, 0.6)',
              fontSize: 18,
              fontWeight: loading ? 600 : 400
            }}>
              {loading ? '🔍 Searching database...' : '📭 No results to display. Start searching!'}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Student Details Dialog */}
      {dialogStudent && (
        <Dialog 
          open={!!dialogStudent} 
          onClose={() => setDialogStudent(null)}
          maxWidth="md"
          fullWidth
          sx={{
            '& .MuiDialog-paper': {
              background: 'rgba(26, 26, 46, 0.95)',
              backdropFilter: 'blur(30px)',
              borderRadius: 4,
              border: '2px solid rgba(0, 212, 255, 0.3)',
              boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5)',
              maxHeight: '90vh'
            }
          }}
        >
          <DialogTitle sx={{
            background: 'linear-gradient(45deg, #ff0096, #00d4ff)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 900,
            fontSize: 24,
            textAlign: 'center',
            pb: 2
          }}>
            🎓 Student Profile
          </DialogTitle>
          <DialogContent sx={{ p: 0 }}>
            <Card sx={{
              background: 'transparent',
              border: 'none',
              boxShadow: 'none',
              p: 4
            }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
                <Avatar sx={{
                  background: 'linear-gradient(45deg, #00d4ff, #ff0096)',
                  width: 80,
                  height: 80,
                  mb: 2,
                  boxShadow: '0 0 30px rgba(0, 212, 255, 0.5)'
                }}>
                  <PersonIcon fontSize="large" />
                </Avatar>
                <Typography variant="h4" sx={{
                  fontWeight: 900,
                  color: 'white',
                  textAlign: 'center',
                  mb: 1
                }}>
                  {dialogStudent.name}
                </Typography>
                <Typography variant="h6" sx={{
                  color: '#00d4ff',
                  fontWeight: 600,
                  letterSpacing: 1
                }}>
                  ID: {dialogStudent.studentId}
                </Typography>
              </Box>

              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Box sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    p: 3,
                    border: '1px solid rgba(0, 212, 255, 0.2)',
                    height: '100%'
                  }}>
                    <Typography variant="h6" sx={{ color: '#ff0096', fontWeight: 700, mb: 2 }}>
                      📚 Academic Info
                    </Typography>
                    <Typography sx={{ color: 'white', mb: 1 }}><strong>Class:</strong> {dialogStudent.class}</Typography>
                    <Typography sx={{ color: 'white', mb: 1 }}><strong>Section:</strong> {dialogStudent.section}</Typography>
                    <Typography sx={{ color: 'white', mb: 1 }}><strong>Roll No:</strong> {dialogStudent.rollNo}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={6}>
                  <Box sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    p: 3,
                    border: '1px solid rgba(255, 0, 150, 0.2)',
                    height: '100%'
                  }}>
                    <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 700, mb: 2 }}>
                      👥 Family Info
                    </Typography>
                    <Typography sx={{ color: 'white', mb: 1 }}><strong>Father:</strong> {dialogStudent.fatherName}</Typography>
                    <Typography sx={{ color: 'white', mb: 1 }}><strong>Mother:</strong> {dialogStudent.motherName}</Typography>
                    <Typography sx={{ color: 'white', mb: 1 }}><strong>Mobile:</strong> {dialogStudent.fatherMobile}</Typography>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    p: 3,
                    border: '1px solid rgba(0, 212, 255, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#ff0096', fontWeight: 700, mb: 2 }}>
                      📋 Personal Details
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography sx={{ color: 'white', mb: 1 }}><strong>DOB:</strong> {dialogStudent.dob}</Typography>
                        <Typography sx={{ color: 'white', mb: 1 }}><strong>Aadhar:</strong> {dialogStudent.aadhar}</Typography>
                        <Typography sx={{ color: 'white', mb: 1 }}><strong>Email:</strong> {dialogStudent.email}</Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography sx={{ color: 'white', mb: 1 }}><strong>APAAR ID:</strong> {dialogStudent.apaar}</Typography>
                        <Typography sx={{ color: 'white', mb: 1 }}><strong>Address:</strong> {dialogStudent.address}</Typography>
                        <Typography sx={{ color: 'white', mb: 1 }}><strong>Note:</strong> {dialogStudent.note}</Typography>
                      </Grid>
                    </Grid>
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <Box sx={{
                    background: 'rgba(255, 255, 255, 0.05)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 3,
                    p: 3,
                    border: '1px solid rgba(255, 0, 150, 0.2)'
                  }}>
                    <Typography variant="h6" sx={{ color: '#00d4ff', fontWeight: 700, mb: 2 }}>
                      💰 Financial Status
                    </Typography>
                    <Typography variant="h5" sx={{
                      color: dialogStudent.dues > 0 ? '#ff4444' : '#00ff88',
                      fontWeight: 700,
                      mb: 2
                    }}>
                      Current Dues: ₹{dialogStudent.dues || 0}
                    </Typography>
                    
                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 600, mb: 2 }}>
                      💳 Payment History:
                    </Typography>
                    {(dialogStudent.feeHistory && dialogStudent.feeHistory.length > 0) ? (
                      <TableContainer sx={{
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: 2,
                        maxHeight: 200
                      }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Date</TableCell>
                              <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Months</TableCell>
                              <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Amount</TableCell>
                              <TableCell sx={{ color: '#00d4ff', fontWeight: 600 }}>Dues After</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {dialogStudent.feeHistory.slice().reverse().map((p: any, idx: number) => (
                              <TableRow key={idx} sx={{
                                '&:hover': { background: 'rgba(0, 212, 255, 0.1)' }
                              }}>
                                <TableCell sx={{ color: 'white' }}>
                                  {p.date ? new Date(p.date).toLocaleDateString() : ''}
                                </TableCell>
                                <TableCell sx={{ color: 'white' }}>
                                  {Array.isArray(p.months) ? p.months.join(', ') : ''}
                                </TableCell>
                                <TableCell sx={{ color: '#00ff88' }}>₹{p.amount}</TableCell>
                                <TableCell sx={{ color: p.dues > 0 ? '#ff4444' : '#00ff88' }}>
                                  ₹{typeof p.dues === 'number' ? p.dues : ''}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    ) : (
                      <Typography sx={{ 
                        color: 'rgba(255, 255, 255, 0.6)', 
                        fontStyle: 'italic',
                        textAlign: 'center',
                        py: 2
                      }}>
                        💸 No fee payments recorded yet
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>
            </Card>
          </DialogContent>
          <DialogActions sx={{ 
            p: 3, 
            background: 'rgba(0, 0, 0, 0.2)',
            gap: 2
          }}>
            <Button 
              onClick={handleEditOpen} 
              variant="contained"
              startIcon={<EditIcon />}
              sx={{
                background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
                borderRadius: 25,
                px: 3,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: '0 10px 20px rgba(0, 212, 255, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #0099cc, #00d4ff)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Edit
            </Button>
            <Button 
              onClick={() => setDeleteConfirm(true)} 
              variant="contained"
              startIcon={<DeleteIcon />}
              sx={{
                background: 'linear-gradient(45deg, #ff4444, #cc0000)',
                borderRadius: 25,
                px: 3,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                boxShadow: '0 10px 20px rgba(255, 68, 68, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #cc0000, #ff4444)',
                  transform: 'translateY(-2px)'
                }
              }}
            >
              Delete
            </Button>
            <Button 
              onClick={e => setExportAnchorEl(e.currentTarget)} 
              variant="outlined"
              sx={{
                borderColor: '#ff0096',
                color: '#ff0096',
                borderRadius: 25,
                px: 3,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                '&:hover': {
                  borderColor: '#00d4ff',
                  color: '#00d4ff',
                  background: 'rgba(0, 212, 255, 0.1)'
                }
              }}
            >
              Export
            </Button>
            <Button 
              onClick={() => setDialogStudent(null)} 
              variant="outlined"
              sx={{
                borderColor: 'rgba(255, 255, 255, 0.3)',
                color: 'rgba(255, 255, 255, 0.8)',
                borderRadius: 25,
                px: 3,
                py: 1.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                '&:hover': {
                  borderColor: 'white',
                  color: 'white',
                  background: 'rgba(255, 255, 255, 0.1)'
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog 
        open={deleteConfirm} 
        onClose={() => setDeleteConfirm(false)}
        sx={{
          '& .MuiDialog-paper': {
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(30px)',
            borderRadius: 4,
            border: '2px solid rgba(255, 68, 68, 0.5)',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <DialogTitle sx={{
          color: '#ff4444',
          fontWeight: 900,
          fontSize: 24,
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 2
        }}>
          ⚠️ Confirm Deletion
        </DialogTitle>
        <DialogContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography sx={{ 
            color: 'white', 
            fontSize: 18,
            mb: 2
          }}>
            Are you sure you want to permanently delete this student record?
          </Typography>
          <Typography sx={{ 
            color: 'rgba(255, 255, 255, 0.6)', 
            fontSize: 14
          }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          justifyContent: 'center',
          gap: 2
        }}>
          <Button 
            onClick={() => setDeleteConfirm(false)}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              borderRadius: 25,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              '&:hover': {
                borderColor: 'white',
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleDelete} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #ff4444, #cc0000)',
              borderRadius: 25,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              boxShadow: '0 10px 20px rgba(255, 68, 68, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #cc0000, #ff0000)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Delete Forever
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog 
        open={editMode} 
        onClose={() => setEditMode(false)}
        maxWidth="md"
        fullWidth
        sx={{
          '& .MuiDialog-paper': {
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(30px)',
            borderRadius: 4,
            border: '2px solid rgba(0, 212, 255, 0.3)',
            boxShadow: '0 40px 80px rgba(0, 0, 0, 0.5)',
            maxHeight: '90vh'
          }
        }}
      >
        <DialogTitle sx={{
          background: 'linear-gradient(45deg, #00d4ff, #ff0096)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 900,
          fontSize: 24,
          textAlign: 'center',
          pb: 2
        }}>
          ✏️ Edit Student Information
        </DialogTitle>
        <DialogContent sx={{ p: 4 }}>
          {editData && (
            <Box component="form" sx={{ mt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Student ID" 
                    value={editData.studentId} 
                    fullWidth 
                    margin="dense" 
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '& input': {
                          color: 'rgba(255, 255, 255, 0.6)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Roll No" 
                    value={editData.rollNo} 
                    fullWidth 
                    margin="dense" 
                    InputProps={{ readOnly: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.05)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.3)',
                        },
                        '& input': {
                          color: 'rgba(255, 255, 255, 0.6)',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label="Student Name" 
                    value={editData.name} 
                    onChange={e => handleEditChange('name', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': {
                          borderColor: 'rgba(0, 212, 255, 0.3)',
                        },
                        '&:hover fieldset': {
                          borderColor: '#00d4ff',
                        },
                        '& input': {
                          color: 'white',
                        }
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Class</InputLabel>
                    <Select 
                      value={editData.class} 
                      label="Class" 
                      onChange={e => handleEditChange('class', e.target.value)}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 212, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00d4ff',
                        },
                        '& .MuiSelect-select': {
                          color: 'white',
                        }
                      }}
                    >
                      {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth margin="dense">
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Section</InputLabel>
                    <Select 
                      value={editData.section} 
                      label="Section" 
                      onChange={e => handleEditChange('section', e.target.value)}
                      sx={{
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0, 212, 255, 0.3)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#00d4ff',
                        },
                        '& .MuiSelect-select': {
                          color: 'white',
                        }
                      }}
                    >
                      {sectionOptions.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                    </Select>
                  </FormControl>
                </Grid>
                {/* Continue with remaining fields with same styling */}
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Father's Name" 
                    value={editData.fatherName} 
                    onChange={e => handleEditChange('fatherName', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& input': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Mother's Name" 
                    value={editData.motherName} 
                    onChange={e => handleEditChange('motherName', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& input': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField 
                    label="Address" 
                    value={editData.address} 
                    onChange={e => handleEditChange('address', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    multiline
                    rows={2}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& textarea': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Aadhar No" 
                    value={editData.aadhar} 
                    onChange={e => handleEditChange('aadhar', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& input': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Date of Birth" 
                    type="date" 
                    value={editData.dob} 
                    onChange={e => handleEditChange('dob', e.target.value)} 
                    fullWidth 
                    margin="dense" 
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& input': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Father's Mobile" 
                    value={editData.fatherMobile} 
                    onChange={e => handleEditChange('fatherMobile', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& input': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Email" 
                    value={editData.email} 
                    onChange={e => handleEditChange('email', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& input': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="APAAR ID" 
                    value={editData.apaar} 
                    onChange={e => handleEditChange('apaar', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& input': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField 
                    label="Note" 
                    value={editData.note} 
                    onChange={e => handleEditChange('note', e.target.value)} 
                    fullWidth 
                    margin="dense"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        background: 'rgba(255, 255, 255, 0.1)',
                        backdropFilter: 'blur(10px)',
                        borderRadius: 2,
                        '& fieldset': { borderColor: 'rgba(0, 212, 255, 0.3)' },
                        '&:hover fieldset': { borderColor: '#00d4ff' },
                        '& input': { color: 'white' }
                      },
                      '& .MuiInputLabel-root': { color: 'rgba(255, 255, 255, 0.7)' }
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          p: 3, 
          background: 'rgba(0, 0, 0, 0.2)',
          gap: 2
        }}>
          <Button 
            onClick={() => setEditMode(false)}
            variant="outlined"
            sx={{
              borderColor: 'rgba(255, 255, 255, 0.3)',
              color: 'white',
              borderRadius: 25,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              '&:hover': {
                borderColor: 'white',
                background: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditSave} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #00d4ff, #0099cc)',
              borderRadius: 25,
              px: 4,
              py: 1.5,
              fontWeight: 700,
              textTransform: 'uppercase',
              boxShadow: '0 10px 20px rgba(0, 212, 255, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #0099cc, #00d4ff)',
                transform: 'translateY(-2px)'
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Export Menu */}
      <Menu 
        anchorEl={exportAnchorEl} 
        open={!!exportAnchorEl} 
        onClose={() => setExportAnchorEl(null)}
        sx={{
          '& .MuiPaper-root': {
            background: 'rgba(26, 26, 46, 0.95)',
            backdropFilter: 'blur(20px)',
            borderRadius: 2,
            border: '1px solid rgba(0, 212, 255, 0.2)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)'
          }
        }}
      >
        <MenuItem 
          onClick={handleExportPDF} 
          sx={{ 
            color: 'white', 
            '&:hover': { background: 'rgba(255, 0, 150, 0.1)' },
            py: 1.5,
            px: 3
          }}
        >
          <PictureAsPdfIcon sx={{ mr: 2, color: '#ff0096' }} />
          Export as PDF
        </MenuItem>
        <MenuItem 
          onClick={handleExportExcel} 
          sx={{ 
            color: 'white', 
            '&:hover': { background: 'rgba(0, 212, 255, 0.1)' },
            py: 1.5,
            px: 3
          }}
        >
          <TableChartIcon sx={{ mr: 2, color: '#00d4ff' }} />
          Export as Excel
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default ShowStudent;