import React, { useState, useRef, useEffect } from 'react';
import BadgeIcon from '@mui/icons-material/Badge';
import PersonIcon from '@mui/icons-material/Person';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import PrintIcon from '@mui/icons-material/Print';
import { QRCodeCanvas } from 'qrcode.react';
import { loadPrincipalSignature, getAdmissions, getAdmissionsByClassSection } from './db';
import './StudentIdCard.css';

interface StudentIdCardProps {
  student?: {
    name: string;
    class: string;
    section: string;
    rollNo: string;
    fatherName: string;
    address: string;
    parentMobile: string;
    photo?: string;
    studentId?: string;
    gender?: string;
  };
  onUpdatePhoto?: (photo: string) => void;
  onGenerateId?: () => void;
}

const classOptions = ['Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
const sectionOptions = ['A', 'B', 'C'];

const StudentIdCard: React.FC<StudentIdCardProps> = ({ student: propStudent, onUpdatePhoto }) => {
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(propStudent || null);
  const [photo, setPhoto] = useState<string | undefined>(propStudent?.photo);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSignature();
  }, []);

  useEffect(() => {
    if (cls && section) {
      fetchStudents();
    }
  }, [cls, section]);

  const fetchSignature = async () => {
    const sig = await loadPrincipalSignature();
    if (sig) {
      if (typeof sig !== 'string' && sig.type?.startsWith('image/')) {
        setSignatureUrl(URL.createObjectURL(sig));
      } else if (typeof sig === 'string') {
        setSignatureUrl(sig);
      }
    }
  };

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const list = await getAdmissionsByClassSection(cls, section);
      setStudentsList(list.sort((a: any, b: any) => Number(a.rollNo) - Number(b.rollNo)));
    } catch (e) {
      setStudentsList([]);
    }
    setLoading(false);
  };

  const handleStudentSelect = (student: any) => {
    setSelectedStudent(student);
    setPhoto(student.photo || student.photoData);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const photoData = ev.target?.result as string;
        setPhoto(photoData);
        onUpdatePhoto?.(photoData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownload = async () => {
    if (!cardRef.current) return;
    const html2canvas = (await import('html2canvas')).default;
    const canvas = await html2canvas(cardRef.current, { scale: 2 });
    const link = document.createElement('a');
    link.download = `ID_Card_${selectedStudent?.name?.replace(/\s+/g, '_') || 'student'}.png`;
    link.href = canvas.toDataURL();
    link.click();
  };

  const handlePrint = () => {
    window.print();
  };

  const currentYear = new Date().getFullYear();
  const session = `${currentYear}-${(currentYear + 1).toString().slice(-2)}`;

  return (
    <div className="idcard-page">
      {/* Header */}
      <div className="idcard-header">
        <h1 className="idcard-title">
          <BadgeIcon />
          Student ID Card
        </h1>
        <p className="idcard-subtitle">Generate and download student ID cards</p>
      </div>

      {/* Search Section */}
      <div className="idcard-search">
        <div className="idcard-search-row">
          <div className="idcard-search-field">
            <label>Class</label>
            <select value={cls} onChange={(e) => { setCls(e.target.value); setSelectedStudent(null); }}>
              <option value="">Select Class</option>
              {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="idcard-search-field">
            <label>Section</label>
            <select value={section} onChange={(e) => { setSection(e.target.value); setSelectedStudent(null); }}>
              <option value="">Select Section</option>
              {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="idcard-search-field" style={{ flex: 2 }}>
            <label>Student</label>
            <select
              value={selectedStudent?.studentId || ''}
              onChange={(e) => {
                const student = studentsList.find(s => s.studentId === e.target.value);
                if (student) handleStudentSelect(student);
              }}
              disabled={!cls || !section || loading}
            >
              <option value="">
                {loading ? 'Loading...' : studentsList.length === 0 ? 'No students' : 'Select Student'}
              </option>
              {studentsList.map(s => (
                <option key={s.studentId} value={s.studentId}>
                  {s.rollNo}. {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ID Card Display */}
      <div className="idcard-container">
        {selectedStudent ? (
          <>
            {/* ID Card */}
            <div className="idcard-card" ref={cardRef}>
              <div className="idcard-card-inner">
                {/* Top Bar */}
                <div className="idcard-card-top">
                  <span className="idcard-school-name">Vidyalaya School</span>
                  <span className="idcard-session">{session}</span>
                </div>

                {/* Body */}
                <div className="idcard-card-body">
                  {/* Photo */}
                  <div className="idcard-photo-frame">
                    {photo ? (
                      <img src={photo} alt={selectedStudent.name} />
                    ) : (
                      <div className="idcard-photo-placeholder">
                        <PersonIcon style={{ fontSize: 32 }} />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="idcard-info">
                    <h2 className="idcard-student-name">{selectedStudent.name}</h2>
                    <div className="idcard-info-row">
                      <span className="idcard-info-label">ID:</span>
                      <span className="idcard-info-value" style={{ fontSize: 10 }}>{selectedStudent.studentId}</span>
                    </div>
                    <div className="idcard-info-row">
                      <span className="idcard-info-label">Class:</span>
                      <span className="idcard-info-value">{selectedStudent.class} - {selectedStudent.section}</span>
                    </div>
                    <div className="idcard-info-row">
                      <span className="idcard-info-label">Roll No:</span>
                      <span className="idcard-info-value">{selectedStudent.rollNo}</span>
                    </div>
                    <div className="idcard-info-row">
                      <span className="idcard-info-label">Father:</span>
                      <span className="idcard-info-value">{selectedStudent.fatherName || '-'}</span>
                    </div>
                    <div className="idcard-info-row">
                      <span className="idcard-info-label">Mobile:</span>
                      <span className="idcard-info-value">{selectedStudent.fatherMobile || '-'}</span>
                    </div>
                    <div className="idcard-info-row">
                      <span className="idcard-info-label">Address:</span>
                      <span className="idcard-info-value" style={{ fontSize: 9 }}>{selectedStudent.address || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Bar */}
                <div className="idcard-card-bottom">
                  {/* QR Code - Real scannable with complete student data */}
                  <div className="idcard-qr">
                    <QRCodeCanvas
                      value={JSON.stringify({
                        id: selectedStudent.studentId,
                        name: selectedStudent.name,
                        class: selectedStudent.class,
                        section: selectedStudent.section,
                        rollNo: selectedStudent.rollNo,
                        father: selectedStudent.fatherName || '',
                        mobile: selectedStudent.fatherMobile || '',
                        address: (selectedStudent.address || '').slice(0, 50)
                      })}
                      size={55}
                      bgColor="#ffffff"
                      fgColor="#172B4D"
                      level="M"
                    />
                  </div>

                  {/* Signature */}
                  <div className="idcard-signature">
                    <div className="idcard-signature-line">
                      {signatureUrl && <img src={signatureUrl} alt="Signature" />}
                    </div>
                    <span className="idcard-signature-label">Principal</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="idcard-actions">
              <label className="idcard-btn idcard-btn-secondary">
                <CameraAltIcon />
                {photo ? 'Change Photo' : 'Upload Photo'}
                <input type="file" accept="image/*" onChange={handlePhotoUpload} hidden />
              </label>
              <button className="idcard-btn idcard-btn-primary" onClick={handleDownload}>
                <DownloadIcon />
                Download Card
              </button>
              <button className="idcard-btn idcard-btn-success" onClick={handlePrint}>
                <PrintIcon />
                Print
              </button>
            </div>
          </>
        ) : (
          <div className="idcard-empty">
            <BadgeIcon />
            <h3>No Student Selected</h3>
            <p>Select a class, section, and student to generate ID card</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentIdCard;
