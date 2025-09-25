import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Grid,
  TextField,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Divider,
  type SelectChangeEvent
} from '@mui/material';

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
  });
  const [rollNo, setRollNo] = useState<number | '' >('');

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPreview({ ...form, rollNo });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%', p: 1 }}>

      {/* Personal Information Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Personal Information</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <TextField
              label="Student Name"
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              fullWidth
              sx={styles.formTextField}
              inputProps={{ pattern: "[A-Za-z\\s]+" }}
              title="Only letters and spaces are allowed."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Father's Name"
              name="fatherName"
              value={form.fatherName}
              onChange={handleChange}
              required
              fullWidth
              sx={styles.formTextField}
              inputProps={{ pattern: "[A-Za-z\\s]+" }}
              title="Only letters and spaces are allowed."
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <TextField
              label="Mother's Name"
              name="motherName"
              value={form.motherName}
              onChange={handleChange}
              required
              fullWidth
              sx={styles.formTextField}
              inputProps={{ pattern: "[A-Za-z\\s]+" }}
              title="Only letters and spaces are allowed."
            />
          </Grid>
          <Grid item xs={12} md={12}>
            <TextField
              label="Address"
              name="address"
              value={form.address}
              onChange={handleChange}
              required
              fullWidth
              multiline
              rows={2}
              sx={styles.formTextField}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Academic Information Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Academic Information</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required sx={styles.formTextField}>
              <InputLabel>Class</InputLabel>
              <Select
                name="class"
                value={form.class}
                label="Class"
                onChange={handleChange}
              >
                {classOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth required sx={styles.formTextField}>
              <InputLabel>Section</InputLabel>
              <Select
                name="section"
                value={form.section}
                label="Section"
                onChange={handleChange}
              >
                {sectionOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Roll Number"
              name="rollNo"
              value={rollNo}
              fullWidth
              sx={styles.formTextField}
              InputProps={{
                readOnly: true,
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Date of Birth"
              name="dob"
              type="date"
              value={form.dob}
              onChange={handleChange}
              required
              fullWidth
              sx={styles.formTextField}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Contact & Documents Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Contact & Documents</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Parent's Mobile"
              name="parentMobile"
              value={form.parentMobile}
              onChange={handleChange}
              required
              fullWidth
              type="tel"
              sx={styles.formTextField}
              inputProps={{ pattern: "[0-9]{10}", maxLength: 10 }}
              title="Please enter a 10-digit mobile number."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Email ID"
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              fullWidth
              sx={styles.formTextField}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Aadhar Number"
              name="aadhar"
              value={form.aadhar}
              onChange={handleChange}
              required
              fullWidth
              sx={styles.formTextField}
              inputProps={{ pattern: "[0-9]{12}", maxLength: 12 }}
              title="Please enter a 12-digit Aadhar number."
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              label="APAAR ID"
              name="apaar"
              value={form.apaar}
              onChange={handleChange}
              fullWidth
              sx={styles.formTextField}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Additional Information Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6" gutterBottom>Additional Information</Typography>
        <Divider sx={{ mb: 3 }} />
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="Special Notes"
              name="note"
              value={form.note}
              onChange={handleChange}
              fullWidth
              multiline
              rows={3}
              sx={styles.formTextField}
            />
          </Grid>
        </Grid>
      </Box>

      {/* Submit Button */}
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <Button type="submit" variant="contained" size="large" sx={styles.loginButton}>
          Preview & Submit
        </Button>
      </Box>

    </Box>
  );
};

export default AdmissionForm;