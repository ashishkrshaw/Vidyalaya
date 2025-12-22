import React, { useState, useRef, useEffect } from 'react';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import DownloadIcon from '@mui/icons-material/Download';
import { QRCodeCanvas } from 'qrcode.react';
import { loadPrincipalSignature, loadSchoolInfo, loadSchoolLogo, getAdmissionsByClassSection } from './db';
import './StudentIdCard.css';

const classOptions = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sectionOptions = ['A', 'B', 'C'];

const StudentIdCard: React.FC = () => {
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [schoolLogo, setSchoolLogo] = useState<string | null>(null);
  const [schoolInfo, setSchoolInfo] = useState({ name: 'School Name', address: '', phone: '', email: '', website: '' });
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (cls && section) {
      fetchStudents();
    } else {
      setStudentsList([]);
    }
  }, [cls, section]);

  const loadSettings = async () => {
    // Load principal signature
    const sig = await loadPrincipalSignature();
    if (sig) {
      if (typeof sig !== 'string' && sig.type?.startsWith('image/')) {
        setSignatureUrl(URL.createObjectURL(sig));
      } else if (typeof sig === 'string') {
        setSignatureUrl(sig);
      }
    }

    // Load school logo
    const logo = await loadSchoolLogo();
    if (logo && typeof logo === 'string') {
      setSchoolLogo(logo);
    } else if (logo instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => setSchoolLogo(e.target?.result as string);
      reader.readAsDataURL(logo);
    }

    // Load school info
    const info = await loadSchoolInfo();
    setSchoolInfo(info);
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const list = await getAdmissionsByClassSection(cls, section);
      setStudentsList(list.sort((a: any, b: any) => Number(a.rollNo) - Number(b.rollNo)));
    } catch {
      setStudentsList([]);
    }
    setLoading(false);
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardRef.current, {
      scale: 3,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff'
    });
    const link = document.createElement('a');
    link.download = `ID_Card_${selectedStudent?.name?.replace(/\s+/g, '_') || 'student'}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Get student photo
  const getStudentPhoto = () => {
    return selectedStudent?.photoData || selectedStudent?.photo || null;
  };

  // Generate QR data with detailed info
  const getQRData = () => {
    if (!selectedStudent) return '';
    return JSON.stringify({
      id: selectedStudent.studentId,
      name: selectedStudent.name,
      class: `${selectedStudent.class}-${selectedStudent.section}`,
      roll: selectedStudent.rollNo,
      guardian: selectedStudent.fatherName || '-',
      address: selectedStudent.address || '-',
      mobile: selectedStudent.fatherMobile || selectedStudent.parentMobile || '-',
      dob: selectedStudent.dob || '-'
    });
  };

  // Get expiry date (end of current academic year)
  const getExpiryDate = () => {
    const now = new Date();
    const year = now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
    return `Mar ${year}`;
  };

  // Get first letter of school name
  const getSchoolInitial = () => {
    return schoolInfo.name?.charAt(0)?.toUpperCase() || 'S';
  };

  return (
    <div className="idcard-page">
      {/* Header */}
      <div className="idcard-header">
        <h1 className="idcard-title">
          <BadgeIcon />
          Student ID Card
        </h1>
        <p className="idcard-subtitle">Generate professional ID cards for students</p>
      </div>

      {/* Search Section */}
      <div className="idcard-search">
        <div className="idcard-search-row">
          <div className="idcard-search-field">
            <label>Class</label>
            <select value={cls} onChange={(e) => setCls(e.target.value)}>
              <option value="">Select Class</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="idcard-search-field">
            <label>Section</label>
            <select value={section} onChange={(e) => setSection(e.target.value)}>
              <option value="">Select Section</option>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Students List */}
      {studentsList.length > 0 && (
        <div className="idcard-students-list">
          {studentsList.map((student) => (
            <div
              key={student.studentId}
              className={`idcard-student-item ${selectedStudent?.studentId === student.studentId ? 'selected' : ''}`}
              onClick={() => handleStudentSelect(student)}
            >
              <div className="idcard-student-thumb">
                {(student.photoData || student.photo) ? (
                  <img src={student.photoData || student.photo} alt={student.name} />
                ) : (
                  <PersonIcon style={{ color: '#94a3b8' }} />
                )}
              </div>
              <div className="idcard-student-info">
                <h4>{student.name}</h4>
                <span>Roll No: {student.rollNo} | ID: {student.studentId}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading && <p style={{ textAlign: 'center', color: '#64748b' }}>Loading students...</p>}

      {/* ID Card Display */}
      <div className="idcard-container">
        {selectedStudent ? (
          <>
            {/* The Card */}
            <div className="idcard-card" ref={cardRef}>

              {/* Header with geometric background */}
              <div className="idcard-header-bg">
                <div className="idcard-accent-shape"></div>
                <div className="idcard-school-info">
                  <div className="idcard-school-logo">
                    <div className="idcard-logo-box">
                      {schoolLogo ? (
                        <img src={schoolLogo} alt="Logo" />
                      ) : (
                        getSchoolInitial()
                      )}
                    </div>
                    <span className="idcard-school-name">{schoolInfo.name}</span>
                  </div>
                  <h1 className="idcard-card-type">STUDENT ID</h1>
                </div>
              </div>

              {/* Photo */}
              <div className="idcard-photo-frame">
                {getStudentPhoto() ? (
                  <img src={getStudentPhoto()} alt="Student" className="idcard-photo-img" />
                ) : (
                  <div className="idcard-photo-placeholder">
                    <PersonIcon style={{ fontSize: 32 }} />
                    <span>No Photo</span>
                  </div>
                )}
              </div>

              {/* Student Name */}
              <div className="idcard-name-section">
                <h2 className="idcard-student-name">{selectedStudent.name}</h2>
                <p className="idcard-class-label">Class {selectedStudent.class} - {selectedStudent.section}</p>
              </div>

              {/* Data Grid */}
              <div className="idcard-data-grid">
                <div className="idcard-data-row">
                  <div className="idcard-data-item">
                    <p className="idcard-data-label">Student ID</p>
                    <p className="idcard-data-value">{selectedStudent.studentId || '-'}</p>
                  </div>
                  <div className="idcard-data-item right">
                    <p className="idcard-data-label">Roll No</p>
                    <p className="idcard-data-value">{selectedStudent.rollNo || '-'}</p>
                  </div>
                </div>
                <div className="idcard-data-row">
                  <div className="idcard-data-item">
                    <p className="idcard-data-label">Date of Birth</p>
                    <p className="idcard-data-value">{selectedStudent.dob || '-'}</p>
                  </div>
                  <div className="idcard-data-item right">
                    <p className="idcard-data-label">Valid Till</p>
                    <p className="idcard-data-value expires">{getExpiryDate()}</p>
                  </div>
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="idcard-emergency">
                <p>
                  <span>Emergency:</span> {selectedStudent.fatherMobile || selectedStudent.parentMobile || '-'}
                </p>
              </div>

              {/* Footer */}
              <div className="idcard-footer">
                {/* QR Code with detailed info */}
                <div className="idcard-qr-code">
                  <QRCodeCanvas
                    value={getQRData()}
                    size={45}
                    bgColor="#f8fafc"
                    fgColor="#0f172a"
                    level="M"
                  />
                </div>

                {/* Signature */}
                <div className="idcard-signature-area">
                  {signatureUrl ? (
                    <img src={signatureUrl} alt="Signature" className="idcard-sign-img" />
                  ) : (
                    <span className="idcard-sign-font">Principal</span>
                  )}
                  <p className="idcard-sign-label">Principal</p>
                </div>
              </div>

              {/* Bottom Accent */}
              <div className="idcard-bottom-accent"></div>
            </div>

            {/* Actions */}
            <div className="idcard-actions">
              <button className="idcard-btn idcard-btn-primary" onClick={handleDownload}>
                <DownloadIcon style={{ fontSize: 18 }} />
                Download ID Card
              </button>
            </div>
          </>
        ) : (
          <div className="idcard-empty">
            <BadgeIcon />
            <h3>No Student Selected</h3>
            <p>Select a class and section, then choose a student to generate their ID card</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentIdCard;
