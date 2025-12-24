import React, { useState, useEffect } from 'react';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import SaveIcon from '@mui/icons-material/Save';
import BadgeIcon from '@mui/icons-material/Badge';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
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
    dob: '',
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const getFormattedDob = () => {
    if (selectedDate) {
      return selectedDate.format('DD/MM/YYYY');
    }
    return '';
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
      dob: getFormattedDob(),
      admissionDate: new Date().toISOString().split('T')[0],
      photoData: photoPreview,
    };
    onPreview(fullData);
  };

  return (
    <div className="admission-page">
      {/* Header */}
      <div className="admission-header">
        <div className="admission-header-content">
          <h1 className="admission-title">
            <PersonAddIcon />
            New Student Admission
          </h1>
          <p className="admission-subtitle">Fill in all the required information below</p>
        </div>
        {form.class && form.section && rollNo && (
          <div className="admission-roll-badge">
            <BadgeIcon />
            <span>Roll No:</span>
            <strong>#{rollNo}</strong>
          </div>
        )}
      </div>

      {/* Main Form Container */}
      <div className="admission-form-container">
        <div className="admission-form-grid-layout">

          {/* Left Column */}
          <div className="admission-form-column">

            {/* Personal Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon blue">
                  <PersonIcon />
                </div>
                <h3>Personal Information</h3>
              </div>
              <div className="form-section-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name <span className="required">*</span></label>
                    <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter student's full name" />
                  </div>
                  <div className="form-group">
                    <label>Gender <span className="required">*</span></label>
                    <select name="gender" value={form.gender} onChange={handleChange}>
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Date of Birth <span className="required">*</span></label>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DatePicker
                        value={selectedDate}
                        onChange={(newValue) => setSelectedDate(newValue)}
                        format="DD/MM/YYYY"
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            placeholder: 'Select Date',
                            size: 'small'
                          },
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                  <div className="form-group">
                    <label>Aadhar Number</label>
                    <input type="text" name="aadhar" value={form.aadhar} onChange={handleChange} placeholder="12-digit Aadhar" maxLength={12} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>APAAR ID</label>
                    <input type="text" name="apaar" value={form.apaar} onChange={handleChange} placeholder="APAAR/ABC ID" />
                  </div>
                </div>
              </div>
            </div>

            {/* Academic Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon green">
                  <SchoolIcon />
                </div>
                <h3>Academic Information</h3>
              </div>
              <div className="form-section-body">
                <div className="form-row three-col">
                  <div className="form-group">
                    <label>Class <span className="required">*</span></label>
                    <select name="class" value={form.class} onChange={handleChange}>
                      <option value="">Select Class</option>
                      {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Section <span className="required">*</span></label>
                    <select name="section" value={form.section} onChange={handleChange}>
                      <option value="">Select Section</option>
                      {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Roll Number</label>
                    <input type="text" value={rollNo || 'Auto-assigned'} disabled className="disabled" />
                  </div>
                </div>
              </div>
            </div>

            {/* Guardian Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon purple">
                  <FamilyRestroomIcon />
                </div>
                <h3>Guardian Information</h3>
              </div>
              <div className="form-section-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Father's Name <span className="required">*</span></label>
                    <input type="text" name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Enter father's full name" />
                  </div>
                  <div className="form-group">
                    <label>Mother's Name</label>
                    <input type="text" name="motherName" value={form.motherName} onChange={handleChange} placeholder="Enter mother's full name" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="admission-form-column">

            {/* Contact Information Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon orange">
                  <ContactPhoneIcon />
                </div>
                <h3>Contact Information</h3>
              </div>
              <div className="form-section-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Father's Mobile <span className="required">*</span></label>
                    <input type="tel" name="fatherMobile" value={form.fatherMobile} onChange={handleChange} placeholder="10-digit mobile" maxLength={10} />
                  </div>
                  <div className="form-group">
                    <label>Mother's Mobile</label>
                    <input type="tel" name="motherMobile" value={form.motherMobile} onChange={handleChange} placeholder="10-digit mobile" maxLength={10} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Email Address</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="parent@email.com" />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group full-width">
                    <label>Full Address</label>
                    <textarea name="address" value={form.address} onChange={handleChange} placeholder="Enter complete address" rows={3} />
                  </div>
                </div>
              </div>
            </div>

            {/* Photo Upload Section */}
            <div className="form-section">
              <div className="form-section-header">
                <div className="form-section-icon teal">
                  <CameraAltIcon />
                </div>
                <h3>Student Photo</h3>
              </div>
              <div className="form-section-body">
                <div className="photo-upload-area">
                  <div className={`photo-preview ${photoPreview ? 'has-photo' : ''}`}>
                    {photoPreview ? (
                      <img src={photoPreview} alt="Student" />
                    ) : (
                      <div className="photo-placeholder">
                        <CameraAltIcon />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>
                  <div className="photo-actions">
                    <label className="photo-upload-btn">
                      <CameraAltIcon />
                      {photoPreview ? 'Change Photo' : 'Upload Photo'}
                      <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                    </label>
                    <span className="photo-hint">Passport-size, max 2MB</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Notes */}
            <div className="form-section">
              <div className="form-section-body">
                <div className="form-group full-width">
                  <label>Additional Notes</label>
                  <textarea name="note" value={form.note} onChange={handleChange} placeholder="Any special notes about the student..." rows={3} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="admission-submit-area">
          <button
            type="button"
            className="admission-submit-btn"
            onClick={handleSubmit}
            disabled={!isFormValid()}
          >
            <SaveIcon />
            Submit Admission
          </button>
          <span className="admission-required-note">* Required fields</span>
        </div>
      </div>
    </div>
  );
};

export default AdmissionForm;