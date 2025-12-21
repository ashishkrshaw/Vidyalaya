import React, { useState, useEffect } from 'react';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import SchoolIcon from '@mui/icons-material/School';
import FamilyRestroomIcon from '@mui/icons-material/FamilyRestroom';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
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

const steps = [
  { label: 'Personal', icon: <PersonIcon /> },
  { label: 'Academic', icon: <SchoolIcon /> },
  { label: 'Guardian', icon: <FamilyRestroomIcon /> },
  { label: 'Contact', icon: <ContactPhoneIcon /> },
  { label: 'Photo', icon: <CameraAltIcon /> },
  { label: 'Review', icon: <CheckCircleIcon /> },
];

const AdmissionForm: React.FC<AdmissionFormProps> = ({ onPreview, getNextRollNo }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [rollNo, setRollNo] = useState<number | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // DOB calendar state
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

  // Generate DOB in dd/mm/yyyy format from calendar selection
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

  const isStepValid = (step: number) => {
    switch (step) {
      case 0: return form.name && form.gender && selectedDate;
      case 1: return form.class && form.section;
      case 2: return form.fatherName || form.motherName;
      case 3: return form.fatherMobile || form.email;
      case 4: return true;
      case 5: return true;
      default: return true;
    }
  };

  return (
    <div className="admission-page">
      {/* Header */}
      <div className="admission-header">
        <div>
          <h1 className="admission-title">
            <PersonAddIcon />
            New Admission
          </h1>
          <p className="admission-subtitle">Register a new student in the school management system</p>
        </div>
        {form.class && form.section && rollNo && (
          <div className="admission-id-preview">
            <BadgeIcon />
            <span>Roll Number:</span>
            <strong>#{rollNo}</strong>
          </div>
        )}
      </div>

      {/* Progress Stepper */}
      <div className="admission-stepper">
        {steps.map((step, index) => (
          <React.Fragment key={index}>
            <div
              className={`admission-step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
              onClick={() => index <= activeStep && setActiveStep(index)}
            >
              <div className="admission-step-number">
                {index < activeStep ? '✓' : index + 1}
              </div>
              <span className="admission-step-label">{step.label}</span>
            </div>
            {index < steps.length - 1 && (
              <div className={`admission-step-connector ${index < activeStep ? 'completed' : ''}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      <div className="admission-form-content">
        {/* Step 1: Personal Information */}
        {activeStep === 0 && (
          <div className="admission-section">
            <div className="admission-section-header">
              <div className="admission-section-icon personal">
                <PersonIcon />
              </div>
              <div>
                <h3 className="admission-section-title">Personal Information</h3>
                <p className="admission-section-desc">Enter student's basic details</p>
              </div>
            </div>
            <div className="admission-section-body">
              <div className="admission-form-grid">
                <div className="admission-form-field">
                  <label>Full Name <span className="required">*</span></label>
                  <input type="text" name="name" value={form.name} onChange={handleChange} placeholder="Enter student's full name" />
                </div>
                <div className="admission-form-field">
                  <label>Gender <span className="required">*</span></label>
                  <select name="gender" value={form.gender} onChange={handleChange}>
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="admission-form-field">
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
                          sx: {
                            '& .MuiOutlinedInput-root': {
                              borderRadius: '10px',
                              backgroundColor: '#FAFBFC',
                              '& fieldset': { borderColor: '#DFE1E6', borderWidth: 2 },
                              '&:hover fieldset': { borderColor: '#B3BAC5' },
                              '&.Mui-focused fieldset': { borderColor: '#0052CC' },
                            },
                          },
                        },
                      }}
                    />
                  </LocalizationProvider>
                  {selectedDate && (
                    <span style={{ fontSize: 12, color: '#36B37E', marginTop: 6, display: 'block' }}>
                      ✓ Selected: {getFormattedDob()}
                    </span>
                  )}
                </div>
                <div className="admission-form-field">
                  <label>Aadhar Number</label>
                  <input type="text" name="aadhar" value={form.aadhar} onChange={handleChange} placeholder="12-digit Aadhar number" maxLength={12} />
                </div>
                <div className="admission-form-field">
                  <label>APAAR ID</label>
                  <input type="text" name="apaar" value={form.apaar} onChange={handleChange} placeholder="APAAR/ABC ID" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Academic Information */}
        {activeStep === 1 && (
          <div className="admission-section">
            <div className="admission-section-header">
              <div className="admission-section-icon academic">
                <SchoolIcon />
              </div>
              <div>
                <h3 className="admission-section-title">Academic Information</h3>
                <p className="admission-section-desc">Select class and section</p>
              </div>
            </div>
            <div className="admission-section-body">
              <div className="admission-form-grid">
                <div className="admission-form-field">
                  <label>Class <span className="required">*</span></label>
                  <select name="class" value={form.class} onChange={handleChange}>
                    <option value="">Select Class</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="admission-form-field">
                  <label>Section <span className="required">*</span></label>
                  <select name="section" value={form.section} onChange={handleChange}>
                    <option value="">Select Section</option>
                    {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="admission-form-field">
                  <label>Roll Number (Auto-assigned)</label>
                  <input type="text" value={rollNo || 'Will be assigned'} disabled />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Guardian Information */}
        {activeStep === 2 && (
          <div className="admission-section">
            <div className="admission-section-header">
              <div className="admission-section-icon guardian">
                <FamilyRestroomIcon />
              </div>
              <div>
                <h3 className="admission-section-title">Guardian Information</h3>
                <p className="admission-section-desc">Enter parent/guardian details</p>
              </div>
            </div>
            <div className="admission-section-body">
              <div className="admission-form-grid">
                <div className="admission-form-field">
                  <label>Father's Name <span className="required">*</span></label>
                  <input type="text" name="fatherName" value={form.fatherName} onChange={handleChange} placeholder="Enter father's full name" />
                </div>
                <div className="admission-form-field">
                  <label>Mother's Name</label>
                  <input type="text" name="motherName" value={form.motherName} onChange={handleChange} placeholder="Enter mother's full name" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Contact Information */}
        {activeStep === 3 && (
          <div className="admission-section">
            <div className="admission-section-header">
              <div className="admission-section-icon contact">
                <ContactPhoneIcon />
              </div>
              <div>
                <h3 className="admission-section-title">Contact Information</h3>
                <p className="admission-section-desc">Enter contact details</p>
              </div>
            </div>
            <div className="admission-section-body">
              <div className="admission-form-grid">
                <div className="admission-form-field">
                  <label>Father's Mobile <span className="required">*</span></label>
                  <input type="tel" name="fatherMobile" value={form.fatherMobile} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} />
                </div>
                <div className="admission-form-field">
                  <label>Mother's Mobile</label>
                  <input type="tel" name="motherMobile" value={form.motherMobile} onChange={handleChange} placeholder="10-digit mobile number" maxLength={10} />
                </div>
                <div className="admission-form-field">
                  <label>Email Address</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="parent@email.com" />
                </div>
                <div className="admission-form-field full-width">
                  <label>Full Address</label>
                  <textarea name="address" value={form.address} onChange={handleChange} placeholder="Enter complete address" rows={3} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 5: Photo Upload */}
        {activeStep === 4 && (
          <div className="admission-section">
            <div className="admission-section-header">
              <div className="admission-section-icon photo">
                <CameraAltIcon />
              </div>
              <div>
                <h3 className="admission-section-title">Student Photo</h3>
                <p className="admission-section-desc">Upload a passport-size photo</p>
              </div>
            </div>
            <div className="admission-section-body">
              <div className="admission-photo-upload">
                <div className={`admission-photo-preview ${photoPreview ? 'has-photo' : ''}`}>
                  {photoPreview ? (
                    <img src={photoPreview} alt="Student" />
                  ) : (
                    <div className="admission-photo-placeholder">
                      <CameraAltIcon />
                      <span>No Photo</span>
                    </div>
                  )}
                </div>
                <div className="admission-photo-actions">
                  <label className="admission-photo-btn primary">
                    <CameraAltIcon />
                    {photoPreview ? 'Change Photo' : 'Upload Photo'}
                    <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
                  </label>
                  <p style={{ fontSize: 13, color: '#6B778C', margin: 0 }}>
                    Recommended: Passport-size photo, max 2MB
                  </p>
                </div>
              </div>

              <div className="admission-form-grid" style={{ marginTop: 24 }}>
                <div className="admission-form-field full-width">
                  <label>Additional Notes</label>
                  <textarea name="note" value={form.note} onChange={handleChange} placeholder="Any special notes about the student..." rows={3} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 6: Review */}
        {activeStep === 5 && (
          <div className="admission-section">
            <div className="admission-section-header">
              <div className="admission-section-icon review">
                <CheckCircleIcon />
              </div>
              <div>
                <h3 className="admission-section-title">Review & Submit</h3>
                <p className="admission-section-desc">Verify all information before submission</p>
              </div>
            </div>
            <div className="admission-section-body">
              <div className="admission-review-grid">
                <div className="admission-review-item">
                  <span className="admission-review-label">Full Name</span>
                  <span className="admission-review-value">{form.name || '-'}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Gender</span>
                  <span className="admission-review-value">{form.gender || '-'}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Date of Birth</span>
                  <span className="admission-review-value">{getFormattedDob() || '-'}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Class & Section</span>
                  <span className="admission-review-value">{form.class} - {form.section}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Roll Number</span>
                  <span className="admission-review-value">#{rollNo}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Aadhar No.</span>
                  <span className="admission-review-value">{form.aadhar || '-'}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Father's Name</span>
                  <span className="admission-review-value">{form.fatherName || '-'}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Mother's Name</span>
                  <span className="admission-review-value">{form.motherName || '-'}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Mobile</span>
                  <span className="admission-review-value">{form.fatherMobile || '-'}</span>
                </div>
                <div className="admission-review-item">
                  <span className="admission-review-label">Email</span>
                  <span className="admission-review-value">{form.email || '-'}</span>
                </div>
              </div>

              {photoPreview && (
                <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <img src={photoPreview} alt="Student" style={{ width: 80, height: 100, objectFit: 'cover', borderRadius: 8 }} />
                  <span style={{ color: '#36B37E', fontWeight: 600 }}>✓ Photo Uploaded</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Buttons */}
      <div className="admission-actions">
        <button
          type="button"
          className="admission-btn admission-btn-secondary"
          onClick={handleBack}
          disabled={activeStep === 0}
        >
          <ArrowBackIcon />
          Back
        </button>

        {activeStep < steps.length - 1 ? (
          <button
            type="button"
            className="admission-btn admission-btn-primary"
            onClick={handleNext}
            disabled={!isStepValid(activeStep)}
          >
            Next
            <ArrowForwardIcon />
          </button>
        ) : (
          <button
            type="button"
            className="admission-btn admission-btn-primary"
            onClick={handleSubmit}
          >
            <SaveIcon />
            Submit Admission
          </button>
        )}
      </div>
    </div>
  );
};

export default AdmissionForm;