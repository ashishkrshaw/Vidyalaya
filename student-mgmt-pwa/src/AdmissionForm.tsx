import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  type SelectChangeEvent,
  Paper,
  InputAdornment,
  Chip,
  Stack,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  Person as PersonIcon,
  School as SchoolIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  Home as HomeIcon,
  CalendarMonth as CalendarIcon,
  Badge as BadgeIcon,
  Notes as NotesIcon,
  People as FamilyIcon,
  ContactMail as ContactIcon,
  PhotoCamera as PhotoIcon,
  CardMembership as CardMembershipIcon,
  Download as DownloadIcon,
  Wc as GenderIcon
} from '@mui/icons-material';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

interface AdmissionFormProps {
  onPreview: (data: any) => void;
  getNextRollNo: (cls: string, section: string) => Promise<number>;
  styles: any;
}

const AdmissionForm: React.FC<AdmissionFormProps> = ({ onPreview, getNextRollNo, styles }) => {
  const [form, setForm] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    address: '',
    class: '',
    section: 'A',
    aadhar: '',
    dob: '',
    parentMobile: '',
    email: '',
    apaar: '',
    note: '',
    gender: '',
  });
  const [rollNo, setRollNo] = useState<number | '' >('');
  const [activeStep, setActiveStep] = useState(0);
  const [studentPhoto, setStudentPhoto] = useState<string | null>(null);
  const [showIdCard, setShowIdCard] = useState(false);
  const [generatedStudentId, setGeneratedStudentId] = useState('');

  const steps = ['Personal Info', 'Academic Info', 'Contact & Documents', 'Additional Info'];

  useEffect(() => {
    const fetchRollNo = async () => {
      if (form.class && form.section) {
        const next = await getNextRollNo(form.class, form.section);
        setRollNo(next);
      } else {
        setRollNo('');
      }
    };
    fetchRollNo();
  }, [form.class, form.section, getNextRollNo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name as string]: value }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setStudentPhoto(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const classCode = form.class.padStart(2, '0');
    const rollCode = rollNo.toString().padStart(3, '0');
    const randomCode = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `STU${year}${classCode}${rollCode}${randomCode}`;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const studentId = generateStudentId();
    setGeneratedStudentId(studentId);
    
    // Show the ID card preview
    setShowIdCard(true);
    
    // Call the original onPreview function
    onPreview({ ...form, rollNo, studentPhoto, studentId });
  };

  const handleGenerateIdCard = () => {
    if (form.name && form.class && rollNo && form.fatherName && form.address) {
      const studentId = generateStudentId();
      setGeneratedStudentId(studentId);
      setShowIdCard(true);
    }
  };

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (activeStep > 0) {
      setActiveStep(prev => prev - 1);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 0:
        return form.name.trim() && form.fatherName.trim() && form.motherName.trim() && form.address.trim() && form.dob && form.gender;
      case 1:
        return form.class && form.section && form.dob;
      case 2:
        return form.parentMobile.trim() && form.aadhar.trim();
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '1200px', 
      mx: 'auto',
      px: 0 // Remove extra padding as mainCard already has padding
    }}>
      {/* Header Section */}
      <Box sx={{ mb: { xs: 2, md: 4 }, textAlign: 'center' }}>
        <Avatar sx={{ 
          bgcolor: 'primary.main', 
          width: { xs: 60, md: 80 }, 
          height: { xs: 60, md: 80 }, 
          mx: 'auto', 
          mb: { xs: 1, md: 2 },
          fontSize: { xs: '1.5rem', md: '2rem' }
        }}>
          <PersonIcon fontSize="large" />
        </Avatar>
        <Typography variant="h4" gutterBottom sx={{ 
          fontWeight: 600, 
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' }, // Responsive font size
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          backgroundClip: 'text',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}>
          Student Admission Form
        </Typography>
        <Typography variant="subtitle1" color="text.secondary" sx={{ 
          mb: { xs: 2, md: 3 },
          fontSize: { xs: '0.875rem', md: '1rem' }, // Smaller text on mobile
          px: { xs: 1, md: 0 } // Padding on mobile
        }}>
          Please fill out all required information to complete the admission process
        </Typography>
        
        {/* Progress Stepper */}
        <Paper elevation={2} sx={{ 
          p: { xs: 2, md: 3 }, 
          mb: { xs: 2, md: 4 }, 
          borderRadius: 3 
        }}>
          <Stepper activeStep={activeStep} alternativeLabel>
            {steps.map((label, index) => (
              <Step key={label} completed={index < activeStep}>
                <StepLabel>
                  <Typography variant="caption" sx={{ 
                    fontWeight: 500,
                    fontSize: { xs: '0.6rem', sm: '0.75rem' }, // Smaller text on mobile
                    display: { xs: 'none', sm: 'block' } // Hide on very small screens
                  }}>
                    {label}
                  </Typography>
                  {/* Show step numbers on mobile */}
                  <Typography variant="caption" sx={{ 
                    fontWeight: 500,
                    fontSize: '0.7rem',
                    display: { xs: 'block', sm: 'none' }
                  }}>
                    {index + 1}
                  </Typography>
                </StepLabel>
              </Step>
            ))}
          </Stepper>
        </Paper>
      </Box>

      <Box component="form" onSubmit={handleSubmit}>
        {/* Personal Information Section */}
        {activeStep === 0 && (
            <Card elevation={3} sx={{ mb: { xs: 2, md: 4 }, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              background: 'linear-gradient(45deg, #FF6B6B, #4ECDC4)',
                p: { xs: 2, md: 3 },
              color: 'white'
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                  <FamilyIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                  <Typography variant="h5" sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', md: '1.5rem' }
                  }}>
                    Personal Information
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ 
                  mt: 1, 
                  opacity: 0.9,
                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                }}>
                Enter student's basic personal details
              </Typography>
            </Box>
            <CardContent sx={{ p: { xs: 2, md: 4 } }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
                <Box sx={{ 
                  display: 'flex', 
                  gap: { xs: 1, md: 2 }, 
                  flexWrap: 'wrap',
                  flexDirection: { xs: 'column', sm: 'row' } // Stack on mobile
                }}>
                  <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '300px' } }}>
                    <TextField
                      label="Student Name *"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          fontSize: { xs: '0.875rem', md: '1rem' }, // Responsive label
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& input': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                      inputProps={{ pattern: "[A-Za-z\\s]+" }}
                      title="Only letters and spaces are allowed."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <TextField
                      label="Father's Name *"
                      name="fatherName"
                      value={form.fatherName}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& input': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                      inputProps={{ pattern: "[A-Za-z\\s]+" }}
                      title="Only letters and spaces are allowed."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <TextField
                      label="Mother's Name *"
                      name="motherName"
                      value={form.motherName}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& input': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                      inputProps={{ pattern: "[A-Za-z\\s]+" }}
                      title="Only letters and spaces are allowed."
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PersonIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <TextField
                      label="Date of Birth *"
                      name="dob"
                      type="date"
                      value={form.dob}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& input': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                      InputLabelProps={{
                        shrink: true,
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <CalendarIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      inputProps={{
                        max: new Date().toISOString().split('T')[0], // Prevent future dates
                        min: new Date(new Date().getFullYear() - 25, 0, 1).toISOString().split('T')[0], // Min 25 years ago
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    <FormControl 
                      fullWidth 
                      required 
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& .MuiSelect-select': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                    >
                      <InputLabel>Gender *</InputLabel>
                      <Select
                        name="gender"
                        value={form.gender}
                        label="Gender *"
                        onChange={handleChange}
                        startAdornment={
                          <InputAdornment position="start">
                            <GenderIcon color="action" />
                          </InputAdornment>
                        }
                      >
                        <MenuItem value="Male">
                          <Chip 
                            label="♂" 
                            size="small" 
                            color="primary" 
                            sx={{ mr: 1 }}
                          />
                          Male
                        </MenuItem>
                        <MenuItem value="Female">
                          <Chip 
                            label="♀" 
                            size="small" 
                            sx={{ mr: 1, bgcolor: '#E91E63', color: 'white' }}
                          />
                          Female
                        </MenuItem>
                        <MenuItem value="Other">
                          <Chip 
                            label="⚧" 
                            size="small" 
                            sx={{ mr: 1, bgcolor: '#9C27B0', color: 'white' }}
                          />
                          Other
                        </MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '300px' }}>
                    {/* Empty box for spacing */}
                  </Box>
                </Box>
                <Box>
                  <TextField
                    label="Address *"
                    name="address"
                    value={form.address}
                    onChange={handleChange}
                    required
                    fullWidth
                    multiline
                    rows={3}
                    variant="outlined"
                    sx={{
                      '& .MuiInputLabel-root': {
                        color: 'rgba(0, 0, 0, 0.6)',
                        backgroundColor: 'white',
                        padding: '0 8px',
                        '&.Mui-focused': {
                          color: '#2196F3',
                        },
                      },
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'white',
                        '& textarea': {
                          color: '#000000 !important',
                          fontSize: '16px',
                        },
                      }
                    }}
                    placeholder="Enter complete address with city, state, and pin code"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <HomeIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Academic Information Section */}
        {activeStep === 1 && (
            <Card elevation={3} sx={{ mb: { xs: 2, md: 4 }, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
                p: { xs: 2, md: 3 },
              color: 'white'
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                  <SchoolIcon sx={{ fontSize: { xs: 24, md: 28 } }} />
                  <Typography variant="h5" sx={{ 
                    fontWeight: 600,
                    fontSize: { xs: '1.25rem', md: '1.5rem' }
                  }}>
                  Academic Information
                </Typography>
              </Stack>
                <Typography variant="body2" sx={{ 
                  mt: 1, 
                  opacity: 0.9,
                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                }}>
                Academic details and class information
              </Typography>
            </Box>
              <CardContent sx={{ p: { xs: 2, md: 4 } }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 2, md: 3 } }}>
                  <Box sx={{ 
                    display: 'flex', 
                    gap: { xs: 1, md: 2 }, 
                    flexWrap: 'wrap',
                    flexDirection: { xs: 'column', sm: 'row' }
                  }}>
                    <Box sx={{ flex: 1, minWidth: { xs: '100%', sm: '250px' } }}>
                    <FormControl 
                      fullWidth 
                      required 
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& .MuiSelect-select': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                    >
                      <InputLabel>Class *</InputLabel>
                      <Select
                        name="class"
                        value={form.class}
                        label="Class *"
                        onChange={handleChange}
                      >
                        {classOptions.map(option => (
                          <MenuItem key={option} value={option}>
                            <Chip 
                              label={option} 
                              size="small" 
                              variant="outlined" 
                              sx={{ mr: 1 }}
                            />
                            Class {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '250px' }}>
                    <FormControl 
                      fullWidth 
                      required 
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& .MuiSelect-select': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                    >
                      <InputLabel>Section *</InputLabel>
                      <Select
                        name="section"
                        value={form.section}
                        label="Section *"
                        onChange={handleChange}
                      >
                        {sectionOptions.map(option => (
                          <MenuItem key={option} value={option}>
                            <Chip 
                              label={option} 
                              size="small" 
                              color="primary" 
                              sx={{ mr: 1 }}
                            />
                            Section {option}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '250px' }}>
                    <TextField
                      label="Roll Number (1-50)"
                      name="rollNo"
                      value={rollNo}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '' || (Number(value) >= 1 && Number(value) <= 50)) {
                          setRollNo(value === '' ? '' : Number(value));
                        }
                      }}
                      type="number"
                      inputProps={{ min: 1, max: 50, step: 1 }}
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: '#f5f5f5',
                          '& input': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Enter roll number (1-50) or leave blank for auto-generation"
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Contact & Documents Section */}
        {activeStep === 2 && (
          <Card elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              background: 'linear-gradient(45deg, #f093fb, #f5576c)',
              p: 3,
              color: 'white'
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <ContactIcon sx={{ fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Contact & Documents
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Contact information and important documents
              </Typography>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {/* Photo Upload Section */}
                <Box sx={{ textAlign: 'center', mb: { xs: 1.5, md: 2 } }}>
                  <Typography variant="h6" gutterBottom color="primary" sx={{
                    fontSize: { xs: '1.1rem', md: '1.25rem' }
                  }}>
                    Student Photo (Optional)
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: { xs: 1.5, md: 2 } }}>
                    {studentPhoto ? (
                      <Avatar
                        src={studentPhoto}
                        sx={{ 
                          width: { xs: 100, md: 120 }, 
                          height: { xs: 100, md: 120 }, 
                          border: '3px solid #2196F3' 
                        }}
                      />
                    ) : (
                      <Avatar sx={{ 
                        width: { xs: 100, md: 120 }, 
                        height: { xs: 100, md: 120 }, 
                        bgcolor: 'grey.300' 
                      }}>
                        <PhotoIcon sx={{ fontSize: { xs: 35, md: 40 } }} />
                      </Avatar>
                    )}
                    <input
                      accept="image/*"
                      style={{ display: 'none' }}
                      id="photo-upload"
                      type="file"
                      onChange={handlePhotoUpload}
                    />
                    <label htmlFor="photo-upload">
                      <Button
                        variant="outlined"
                        component="span"
                        startIcon={<PhotoIcon />}
                          size="small"
                        sx={{ 
                          borderRadius: 3,
                          fontSize: { xs: '0.8rem', md: '0.875rem' }
                        }}
                      >
                        {studentPhoto ? 'Change Photo' : 'Upload Photo'}
                      </Button>
                    </label>
                  </Box>
                </Box>

                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: '250px' }}>
                    <TextField
                      label="Parent's Mobile *"
                      name="parentMobile"
                      value={form.parentMobile}
                      onChange={handleChange}
                      required
                      fullWidth
                      type="tel"
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& input': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                      inputProps={{ pattern: "[0-9]{10}", maxLength: 10 }}
                      title="Please enter a 10-digit mobile number."
                      placeholder="Enter 10-digit mobile number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <PhoneIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '250px' }}>
                    <TextField
                      label="Email ID"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      sx={{
                        ...styles.formTextField,
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                        }
                      }}
                      placeholder="Enter email address (optional)"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <EmailIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Box sx={{ flex: 1, minWidth: '250px' }}>
                    <TextField
                      label="Aadhar Number *"
                      name="aadhar"
                      value={form.aadhar}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                          '& input': {
                            color: '#000000 !important',
                            fontSize: '16px',
                          },
                        }
                      }}
                      inputProps={{ pattern: "[0-9]{12}", maxLength: 12 }}
                      title="Please enter a 12-digit Aadhar number."
                      placeholder="Enter 12-digit Aadhar number"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                    />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: '250px' }}>
                    <TextField
                      label="APAAR ID"
                      name="apaar"
                      value={form.apaar}
                      onChange={handleChange}
                      fullWidth
                      variant="outlined"
                      sx={{
                        ...styles.formTextField,
                        '& .MuiInputLabel-root': {
                          color: 'rgba(0, 0, 0, 0.6)',
                          backgroundColor: 'white',
                          padding: '0 8px',
                          '&.Mui-focused': {
                            color: '#2196F3',
                          },
                        },
                        '& .MuiOutlinedInput-root': {
                          backgroundColor: 'white',
                        }
                      }}
                      placeholder="Academic Performance ID (optional)"
                      InputProps={{
                        startAdornment: (
                          <InputAdornment position="start">
                            <BadgeIcon color="action" />
                          </InputAdornment>
                        ),
                      }}
                      helperText="Optional - Academic Performance ID"
                    />
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Additional Information Section */}
        {activeStep === 3 && (
          <Card elevation={3} sx={{ mb: 4, borderRadius: 3, overflow: 'hidden' }}>
            <Box sx={{ 
              background: 'linear-gradient(45deg, #4facfe, #00f2fe)',
              p: 3,
              color: 'white'
            }}>
              <Stack direction="row" alignItems="center" spacing={2}>
                <NotesIcon sx={{ fontSize: 28 }} />
                <Typography variant="h5" sx={{ fontWeight: 600 }}>
                  Additional Information
                </Typography>
              </Stack>
              <Typography variant="body2" sx={{ mt: 1, opacity: 0.9 }}>
                Any special notes or additional information
              </Typography>
            </Box>
            <CardContent sx={{ p: 4 }}>
              <Box>
                <TextField
                  label="Special Notes"
                  name="note"
                  value={form.note}
                  onChange={handleChange}
                  fullWidth
                  multiline
                  rows={4}
                  variant="outlined"
                  sx={{
                    ...styles.formTextField,
                    '& .MuiInputLabel-root': {
                      color: 'rgba(0, 0, 0, 0.6)',
                      backgroundColor: 'white',
                      padding: '0 8px',
                      '&.Mui-focused': {
                        color: '#2196F3',
                      },
                    },
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'white',
                    }
                  }}
                  placeholder="Any medical conditions, special requirements, allergies, or other important information about the student..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <NotesIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Navigation Buttons */}
        {/* Summary Card and Navigation Buttons */}
        {activeStep === steps.length - 1 && (
          <Card elevation={2} sx={{ mb: 3, borderRadius: 3, p: { xs: 2, md: 3 }, background: 'linear-gradient(135deg, #e0eafc 0%, #cfdef3 100%)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <CardMembershipIcon color="primary" sx={{ fontSize: 32 }} />
              <Typography variant="h6" sx={{ fontWeight: 600, fontSize: { xs: '1rem', md: '1.25rem' } }}>
                Student ID Card Preview
              </Typography>
            </Box>
            <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
              You can preview your Student ID Card before submitting the application.
            </Typography>
            <Button
              onClick={handleGenerateIdCard}
              variant="outlined"
              startIcon={<CardMembershipIcon />}
              sx={{ mb: 2, borderRadius: 2, fontWeight: 500 }}
            >
              Preview Student ID Card
            </Button>
          </Card>
        )}
        <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mt: { xs: 2, md: 4 }, borderRadius: 3 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems="center" spacing={{ xs: 2, sm: 0 }}>
            <Button
              onClick={handleBack}
              disabled={activeStep === 0}
              variant="outlined"
              size="medium"
              sx={{ minWidth: { xs: '100%', sm: 120 }, order: { xs: 2, sm: 1 } }}
            >
              Back
            </Button>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, order: { xs: 1, sm: 2 } }}>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: '0.75rem', md: '0.875rem' } }}>
                Step {activeStep + 1} of {steps.length}
              </Typography>
            </Box>
            {activeStep === steps.length - 1 ? (
              <Button 
                type="submit" 
                variant="contained" 
                size="medium"
                sx={{ minWidth: { xs: '100%', sm: 160 }, fontSize: { xs: '0.8rem', md: '0.875rem' }, background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)', boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)', '&:hover': { background: 'linear-gradient(45deg, #1976D2 30%, #1BA9D9 90%)' } }}
              >
                Submit Application
              </Button>
            ) : (
              <Button
                onClick={() => {
                  handleNext();
                }}
                disabled={!isStepValid(activeStep)}
                variant="contained"
                size="medium"
                sx={{ minWidth: { xs: '100%', sm: 120 }, order: { xs: 3, sm: 3 }, fontSize: { xs: '0.8rem', md: '0.875rem' } }}
              >
                Next
              </Button>
            )}
          </Stack>
        </Paper>

        {/* Student ID Card Preview Dialog */}
        <Dialog 
          open={showIdCard} 
          onClose={() => setShowIdCard(false)} 
          maxWidth="sm" 
          fullWidth
          PaperProps={{
            sx: { 
              borderRadius: 3,
              m: { xs: 1, sm: 2 } // Margin on mobile
            }
          }}
        >
          <DialogTitle sx={{ 
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            color: 'white',
            textAlign: 'center',
            p: { xs: 2, md: 3 }
          }}>
            <Stack direction="row" alignItems="center" justifyContent="center" spacing={2}>
              <CardMembershipIcon sx={{ fontSize: { xs: 20, md: 24 } }} />
              <Typography variant="h6" sx={{ fontSize: { xs: '1.1rem', md: '1.25rem' } }}>
                Student ID Card
              </Typography>
            </Stack>
          </DialogTitle>
          
          <DialogContent sx={{ p: { xs: 2, md: 3 } }}>
            {/* ID Card Design */}
            <Box sx={{
              width: '100%',
              maxWidth: { xs: 300, sm: 350 },
              mx: 'auto',
              p: { xs: 2, md: 3 },
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              borderRadius: 3,
              color: 'white',
              position: 'relative',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }}>
              {/* School Header */}
              <Box sx={{ textAlign: 'center', mb: { xs: 1.5, md: 2 } }}>
                <Typography variant="h6" sx={{ 
                  fontWeight: 'bold', 
                  fontSize: { xs: '16px', md: '18px' }
                }}>
                  SCHOOL NAME
                </Typography>
                <Typography variant="body2" sx={{ 
                  opacity: 0.9,
                  fontSize: { xs: '0.75rem', md: '0.875rem' }
                }}>
                  Student Identity Card
                </Typography>
              </Box>

              {/* Student Photo and Info */}
              <Box sx={{ 
                display: 'flex', 
                gap: { xs: 1.5, md: 2 }, 
                mb: { xs: 1.5, md: 2 },
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: { xs: 'center', sm: 'flex-start' }
              }}>
                <Avatar
                  src={studentPhoto || undefined}
                  sx={{ 
                    width: { xs: 70, md: 80 }, 
                    height: { xs: 70, md: 80 }, 
                    border: '3px solid white',
                    bgcolor: studentPhoto ? 'transparent' : 'rgba(255,255,255,0.3)'
                  }}
                >
                  {!studentPhoto && <PersonIcon sx={{ fontSize: { xs: 35, md: 40 } }} />}
                </Avatar>
                
                <Box sx={{ 
                  flex: 1,
                  textAlign: { xs: 'center', sm: 'left' }
                }}>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold', 
                    mb: 0.5,
                    fontSize: { xs: '1rem', md: '1.25rem' }
                  }}>
                    {form.name || 'Student Name'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Class: {form.class || 'N/A'} - {form.section || 'N/A'}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    opacity: 0.9,
                    fontSize: { xs: '0.75rem', md: '0.875rem' }
                  }}>
                    Roll No: {rollNo || 'N/A'} | {form.gender || 'N/A'}
                  </Typography>
                </Box>
              </Box>

              {/* Additional Info */}
              <Box sx={{ 
                borderTop: '1px solid rgba(255,255,255,0.3)', 
                pt: { xs: 1.5, md: 2 }
              }}>
                <Typography variant="body2" sx={{ 
                  mb: 0.5,
                  fontSize: { xs: '0.7rem', md: '0.875rem' }
                }}>
                  <strong>Father:</strong> {form.fatherName || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ 
                  mb: 0.5,
                  fontSize: { xs: '0.7rem', md: '0.875rem' }
                }}>
                  <strong>Address:</strong> {form.address || 'N/A'}
                </Typography>
                <Typography variant="body2" sx={{ 
                  mb: 1,
                  fontSize: { xs: '0.7rem', md: '0.875rem' }
                }}>
                  <strong>Mobile:</strong> {form.parentMobile || 'N/A'}
                </Typography>
                
                {/* Student ID */}
                <Box sx={{ 
                  background: 'rgba(255,255,255,0.2)', 
                  p: { xs: 0.8, md: 1 }, 
                  borderRadius: 1,
                  textAlign: 'center'
                }}>
                  <Typography variant="caption" sx={{ 
                    opacity: 0.8,
                    fontSize: { xs: '0.6rem', md: '0.75rem' }
                  }}>
                    Student ID
                  </Typography>
                  <Typography variant="h6" sx={{ 
                    fontWeight: 'bold',
                    fontSize: { xs: '0.9rem', md: '1.25rem' }
                  }}>
                    {generatedStudentId || 'STU2024-0-0-0000'}
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ 
            p: { xs: 2, md: 3 }, 
            pt: 0,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 1, sm: 0 }
          }}>
            <Button 
              onClick={() => setShowIdCard(false)} 
              variant="outlined"
                size="medium"
              sx={{ 
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 2, sm: 1 }
              }}
            >
              Close
            </Button>
            <Button 
              variant="contained" 
              startIcon={<DownloadIcon />}
                size="medium"
              sx={{
                width: { xs: '100%', sm: 'auto' },
                order: { xs: 1, sm: 2 },
                background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1976D2 30%, #1BA9D9 90%)',
                }
              }}
              onClick={() => {
                // Here you could implement download functionality
                alert('Download functionality can be implemented here');
              }}
            >
              Download
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default AdmissionForm;