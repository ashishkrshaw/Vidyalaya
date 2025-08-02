import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, MenuItem, Select, InputLabel, FormControl } from '@mui/material';
import Grid from '@mui/material/Grid';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

interface AdmissionFormProps {
  onPreview: (data: any) => void;
  getNextRollNo: (cls: string, section: string) => Promise<number>;
}

const AdmissionForm: React.FC<AdmissionFormProps> = ({ onPreview, getNextRollNo }) => {
  const [form, setForm] = useState({
    name: '',
    fatherName: '',
    motherName: '',
    address: '',
    class: '',
    section: 'A',
    aadhar: '',
    dob: '',
    fatherMobile: '',
    email: '',
    apaar: '',
    note: '',
  });
  const [rollNo, setRollNo] = useState<number | ''>('');

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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<{ name?: string; value: unknown }> | any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPreview({ ...form, rollNo });
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField label="Name" name="name" value={form.name} onChange={handleChange} required fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Father's Name" name="fatherName" value={form.fatherName} onChange={handleChange} required fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Mother's Name" name="motherName" value={form.motherName} onChange={handleChange} required fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Address" name="address" value={form.address} onChange={handleChange} required fullWidth />
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required>
            <InputLabel>Class</InputLabel>
            <Select label="Class" name="class" value={form.class} onChange={handleSelectChange}>
              {classOptions.map(cls => <MenuItem key={cls} value={cls}>{cls}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <FormControl fullWidth required>
            <InputLabel>Section</InputLabel>
            <Select label="Section" name="section" value={form.section} onChange={handleSelectChange}>
              {sectionOptions.map(sec => <MenuItem key={sec} value={sec}>{sec}</MenuItem>)}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={4}>
          <TextField label="Roll No" name="rollNo" value={rollNo} InputProps={{ readOnly: true }} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Aadhar No" name="aadhar" value={form.aadhar} onChange={handleChange} required fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Date of Birth" name="dob" type="date" value={form.dob} onChange={handleChange} required fullWidth InputLabelProps={{ shrink: true }} />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Father's Mobile No" name="fatherMobile" value={form.fatherMobile} onChange={handleChange} required fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Email ID (optional)" name="email" value={form.email} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="APAAR ID (optional)" name="apaar" value={form.apaar} onChange={handleChange} fullWidth />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField label="Note" name="note" value={form.note} onChange={handleChange} fullWidth />
        </Grid>
      </Grid>
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 3 }}>
        Admission
      </Button>
    </Box>
  );
};

export default AdmissionForm; 