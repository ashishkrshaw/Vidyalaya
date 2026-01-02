import React, { useState, useEffect } from 'react';
import {
  Box, Grid, Typography, Card, CardContent,
  Button, TextField, MenuItem, IconButton,
  InputAdornment, Avatar,
  Stack, Chip
} from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Dayjs } from 'dayjs';

// Icons
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom'; // For Guardian
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SaveIcon from '@mui/icons-material/Save';
import BadgeIcon from '@mui/icons-material/Badge';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import PhoneIcon from '@mui/icons-material/Phone';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

import './AdmissionForm.css';

interface AdmissionFormProps {
  onPreview: (data: any) => void;
  getNextRollNo: (cls: string, section: string) => Promise<number>;
  styles?: any;
}

const classOptions = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sectionOptions = ['A', 'B', 'C'];

const AdmissionForm: React.FC<AdmissionFormProps> = ({ onPreview, getNextRollNo }) => {
  const [rollNo, setRollNo] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(null);

  const [form, setForm] = useState({
    name: '',
    gender: '',
    class: '',
    section: '',
    aadhar: '',
    apaar: '',
    fatherName: '',
    motherName: '',
    fatherMobile: '',
    motherMobile: '',
    email: '',
    address: '',
    note: '',
    admissionFee: '',
    monthlyFee: '',
    photo: null as File | null,
  });

  useEffect(() => {
    if (form.class && form.section) {
      fetchRollNo();
    }
  }, [form.class, form.section]);

  const fetchRollNo = async () => {
    const roll = await getNextRollNo(form.class, form.section);
    setRollNo(roll);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setForm(prev => ({ ...prev, photo: file }));
      const reader = new FileReader();
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const generateStudentId = () => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `S${year}-${month}-${random}`;
  };

  const isFormValid = () => {
    return form.name && form.gender && selectedDate && form.class && form.section && (form.fatherName || form.motherName) && form.fatherMobile;
  };

  const handleSubmit = () => {
    const studentId = generateStudentId();
    const fullData = {
      ...form,
      studentId,
      rollNo,
      dob: selectedDate ? selectedDate.format('DD/MM/YYYY') : '',
      admissionDate: new Date().toISOString().split('T')[0],
      photoData: photoPreview,
    };
    onPreview(fullData);
  };

  return (
    <Box className="admission-container">
      {/* Neo-Glass Header */}
      <div className="admission-header">
        <Box>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <div className="admission-icon-box">
              <PersonAddIcon sx={{ fontSize: 32 }} />
            </div>
            <Typography variant="h4" sx={{ fontWeight: 800, textShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>New Student Admission</Typography>
          </Stack>
          <Typography variant="body1" sx={{ opacity: 0.9, ml: 1, fontWeight: 500 }}>
            Fill in the details below to register a new student.
          </Typography>
        </Box>
        {rollNo && (
          <Chip
            icon={<BadgeIcon />}
            label={`Roll No: #${rollNo}`}
            className="admission-roll-chip"
          />
        )}
      </div>

      <Grid container spacing={3}>
        {/* LEFT COLUMN */}
        <Grid size={{ xs: 12, lg: 8 }}>

          {/* 1. Student Details */}
          <Card className="admission-card">
            <CardContent className="admission-card-content">
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <div className="section-icon-box personal">
                  <PersonIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Personal Information</Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Full Name" name="name"
                    value={form.name} onChange={handleChange} required
                    placeholder="Student's Name"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select fullWidth label="Gender" name="gender"
                    value={form.gender} onChange={handleSelectChange} required
                  >
                    {['Male', 'Female', 'Other'].map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <DatePicker
                      label="Date of Birth"
                      value={selectedDate}
                      onChange={(newValue) => setSelectedDate(newValue)}
                      format="DD/MM/YYYY"
                      slotProps={{ textField: { fullWidth: true, required: true, placeholder: "DD/MM/YYYY" } }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Aadhar Number" name="aadhar"
                    value={form.aadhar} onChange={handleChange}
                    inputProps={{ maxLength: 12 }} placeholder="12-digit number"
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth label="APAAR ID (ABC ID)" name="apaar"
                    value={form.apaar} onChange={handleChange}
                    placeholder="Optional"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 2. Academic Details */}
          <Card className="admission-card">
            <CardContent className="admission-card-content">
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <div className="section-icon-box academic">
                  <SchoolIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Academic Details</Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select fullWidth label="Class" name="class"
                    value={form.class} onChange={handleSelectChange} required
                  >
                    {classOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    select fullWidth label="Section" name="section"
                    value={form.section} onChange={handleSelectChange} required
                  >
                    {sectionOptions.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <TextField
                    fullWidth label="Roll Number"
                    value={rollNo ? `#${rollNo}` : 'Auto-generated'}
                    disabled
                    sx={{
                      '& .MuiInputBase-input': {
                        WebkitTextFillColor: '#334155 !important',
                        fontWeight: 700
                      }
                    }}
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <div className="fee-config-box">
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <CurrencyRupeeIcon sx={{ fontSize: 20, color: '#64748b' }} />
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'var(--text-secondary)' }}>Fee Configuration</Typography>
                    </Stack>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth label="Admission Fee" name="admissionFee"
                          value={form.admissionFee} onChange={handleChange}
                          type="number" InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth label="Monthly Fee (Override)" name="monthlyFee"
                          value={form.monthlyFee} onChange={handleChange}
                          type="number" placeholder="Default if empty"
                          InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                        />
                      </Grid>
                    </Grid>
                  </div>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* 3. Guardian Details */}
          <Card className="admission-card">
            <CardContent className="admission-card-content">
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <div className="section-icon-box guardian">
                  <FamilyRestroomIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Parents / Guardian Info</Typography>
              </Stack>

              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Father's Name" name="fatherName"
                    value={form.fatherName} onChange={handleChange} required
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth label="Mother's Name" name="motherName"
                    value={form.motherName} onChange={handleChange}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

        </Grid>

        {/* RIGHT COLUMN */}
        <Grid size={{ xs: 12, lg: 4 }}>

          {/* 4. Photo Upload */}
          <Card className="admission-card">
            <CardContent className="admission-card-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="photo-upload-box">
                <Avatar
                  variant="rounded"
                  src={photoPreview || undefined}
                  className="photo-avatar"
                >
                  {!photoPreview && <CameraAltIcon sx={{ fontSize: 40, color: '#cbd5e1' }} />}
                </Avatar>
                <IconButton
                  component="label"
                  className="upload-icon-btn"
                >
                  <input hidden accept="image/*" type="file" onChange={handlePhotoUpload} />
                  <CameraAltIcon fontSize="small" />
                </IconButton>
              </div>
              <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>Student Photo</Typography>
              <Typography variant="caption" color="textSecondary">Supported: JPG, PNG (Max 2MB)</Typography>
            </CardContent>
          </Card>

          {/* 5. Contact Info */}
          <Card className="admission-card">
            <CardContent className="admission-card-content">
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <div className="section-icon-box contact">
                  <ContactPhoneIcon />
                </div>
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Contact Details</Typography>
              </Stack>

              <Stack spacing={3}>
                <TextField
                  fullWidth label="Father's Mobile" name="fatherMobile"
                  value={form.fatherMobile} onChange={handleChange} required
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }}
                />
                <TextField
                  fullWidth label="Mother's Mobile" name="motherMobile"
                  value={form.motherMobile} onChange={handleChange}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" /></InputAdornment> }}
                />
                <TextField
                  fullWidth label="Email Address" name="email"
                  value={form.email} onChange={handleChange}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" /></InputAdornment> }}
                />
                <TextField
                  fullWidth label="Residential Address" name="address"
                  value={form.address} onChange={handleChange} multiline rows={3}
                  InputProps={{ startAdornment: <InputAdornment position="start" sx={{ mt: 1 }}><HomeIcon fontSize="small" /></InputAdornment> }}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Submit */}
          <Button
            fullWidth
            variant="contained"
            size="large"
            onClick={handleSubmit}
            disabled={!isFormValid()}
            startIcon={<SaveIcon />}
            className="submit-btn"
          >
            Save Admission
          </Button>

        </Grid>
      </Grid>
    </Box>
  );
};

export default AdmissionForm;
