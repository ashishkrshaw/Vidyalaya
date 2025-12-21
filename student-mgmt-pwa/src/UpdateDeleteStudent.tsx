import React, { useState, useRef, useEffect } from 'react';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Close';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import SchoolIcon from '@mui/icons-material/School';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import HomeIcon from '@mui/icons-material/Home';
import BadgeIcon from '@mui/icons-material/Badge';
import UndoIcon from '@mui/icons-material/Undo';
import { getAdmissions, getAdmissionsByClassSection, updateAdmission, deleteAdmission, addAdmission } from './db';
import './UpdateDeleteStudent.css';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];
const sectionOptions = ['A', 'B', 'C'];

const ManageStudents: React.FC = () => {
  // Search State
  const [searchMethod, setSearchMethod] = useState<'dropdown' | 'id'>('dropdown');
  const [cls, setCls] = useState('');
  const [section, setSection] = useState('');
  const [studentsList, setStudentsList] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [studentId, setStudentId] = useState('');

  // UI State
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');

  // Edit State
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<any | null>(null);

  // Password & Delete State
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'edit' | 'delete' | null>(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [lastDeletedStudent, setLastDeletedStudent] = useState<any | null>(null);
  const undoTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    };
  }, []);

  // Fetch students when class/section changes
  useEffect(() => {
    if (cls && section && searchMethod === 'dropdown') {
      fetchStudentsList();
    }
  }, [cls, section]);

  const fetchStudentsList = async () => {
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
    setEditData(null);
    setEditMode(false);
  };

  const handleIdSearch = async () => {
    if (!studentId.trim()) return;
    setLoading(true);
    setError('');
    try {
      const all = await getAdmissions();
      const found = all.find((s: any) => s.studentId === studentId.trim());
      if (found) {
        setSelectedStudent(found);
        setMsg('');
      } else {
        setError('No student found with this ID');
        setSelectedStudent(null);
      }
    } catch (e) {
      setError('Search failed');
    }
    setLoading(false);
  };

  const showMessage = (type: 'msg' | 'error', message: string) => {
    if (type === 'msg') { setMsg(message); setError(''); }
    else { setError(message); setMsg(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  // Action Password Handlers
  const handleEditRequest = () => {
    setPendingAction('edit');
    setPasswordDialogOpen(true);
  };

  const handleDeleteRequest = () => {
    setPendingAction('delete');
    setPasswordDialogOpen(true);
  };

  const handlePasswordConfirm = () => {
    // Action Password: 123456 (should be configurable in settings)
    if (passwordInput === '123456') {
      setPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      if (pendingAction === 'edit') {
        setEditData({ ...selectedStudent });
        setEditMode(true);
      } else if (pendingAction === 'delete') {
        setDeleteConfirm(true);
      }
      setPendingAction(null);
    } else {
      setPasswordError('Incorrect Action Password');
    }
  };

  const closePasswordDialog = () => {
    setPasswordDialogOpen(false);
    setPasswordInput('');
    setPasswordError('');
    setPendingAction(null);
  };

  // Edit Handlers
  const handleEditChange = (key: string, value: any) => {
    setEditData((prev: any) => ({ ...prev, [key]: value }));
  };

  const handleEditSave = async () => {
    await updateAdmission(editData, selectedStudent);
    setSelectedStudent(editData);
    setEditMode(false);
    setEditData(null);
    showMessage('msg', 'Student updated successfully!');
    if (cls && section) fetchStudentsList();
  };

  const handleEditCancel = () => {
    setEditMode(false);
    setEditData(null);
  };

  // Delete Handlers
  const handleDelete = async () => {
    if (!selectedStudent) return;
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);

    setLastDeletedStudent(selectedStudent);
    await deleteAdmission(selectedStudent.studentId, selectedStudent);
    setSelectedStudent(null);
    setDeleteConfirm(false);
    showMessage('msg', 'Student deleted. You can undo within 5 minutes.');
    if (cls && section) fetchStudentsList();

    undoTimeoutRef.current = setTimeout(() => {
      setLastDeletedStudent(null);
    }, 5 * 60 * 1000);
  };

  const handleUndoDelete = async () => {
    if (lastDeletedStudent) {
      await addAdmission(lastDeletedStudent);
      showMessage('msg', `${lastDeletedStudent.name} has been restored!`);
      setLastDeletedStudent(null);
      if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
      if (cls && section) fetchStudentsList();
    }
  };

  return (
    <div className="manage-page">
      {/* Header */}
      <div className="manage-header">
        <h1 className="manage-title">
          <ManageAccountsIcon />
          Manage Students
        </h1>
        <p className="manage-subtitle">Search, view, edit or remove student records securely</p>
      </div>

      {/* Undo Banner */}
      {lastDeletedStudent && (
        <div className="manage-undo-banner">
          <span>🗑️ {lastDeletedStudent.name} was deleted</span>
          <button className="manage-undo-btn" onClick={handleUndoDelete}>
            <UndoIcon style={{ fontSize: 16 }} />
            Undo
          </button>
        </div>
      )}

      {/* Messages */}
      {msg && <div className="manage-alert manage-alert-success">{msg}</div>}
      {error && <div className="manage-alert manage-alert-error">{error}</div>}

      {/* Search Section */}
      <div className="manage-search-section">
        <div className="manage-search-tabs">
          <button
            className={`manage-tab ${searchMethod === 'dropdown' ? 'active' : ''}`}
            onClick={() => { setSearchMethod('dropdown'); setSelectedStudent(null); }}
          >
            <SchoolIcon style={{ fontSize: 18 }} />
            By Class & Section
          </button>
          <button
            className={`manage-tab ${searchMethod === 'id' ? 'active' : ''}`}
            onClick={() => { setSearchMethod('id'); setSelectedStudent(null); setStudentsList([]); }}
          >
            <BadgeIcon style={{ fontSize: 18 }} />
            By Student ID
          </button>
        </div>

        <div className="manage-search-body">
          {searchMethod === 'dropdown' ? (
            <div className="manage-dropdown-search">
              <div className="manage-search-row">
                <div className="manage-search-field">
                  <label>Class</label>
                  <select value={cls} onChange={(e) => { setCls(e.target.value); setSelectedStudent(null); }}>
                    <option value="">Select Class</option>
                    {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="manage-search-field">
                  <label>Section</label>
                  <select value={section} onChange={(e) => { setSection(e.target.value); setSelectedStudent(null); }}>
                    <option value="">Select Section</option>
                    {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div className="manage-search-field" style={{ flex: 2 }}>
                  <label>Select Student</label>
                  <select
                    value={selectedStudent?.studentId || ''}
                    onChange={(e) => {
                      const student = studentsList.find(s => s.studentId === e.target.value);
                      handleStudentSelect(student || null);
                    }}
                    disabled={!cls || !section || studentsList.length === 0}
                  >
                    <option value="">
                      {loading ? 'Loading...' : studentsList.length === 0 ? 'No students found' : 'Choose a student'}
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
          ) : (
            <div className="manage-id-search">
              <div className="manage-search-field" style={{ flex: 1 }}>
                <label>Student ID</label>
                <input
                  type="text"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter Student ID (e.g., S24-01-0001)"
                  onKeyDown={(e) => e.key === 'Enter' && handleIdSearch()}
                />
              </div>
              <button className="manage-search-btn" onClick={handleIdSearch} disabled={loading}>
                <SearchIcon style={{ fontSize: 20 }} />
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Student Profile Card */}
      {selectedStudent && !editMode && (
        <div className="manage-profile-card">
          <div className="manage-profile-header">
            <div className="manage-profile-avatar">
              {selectedStudent.photo ? (
                <img src={selectedStudent.photo} alt={selectedStudent.name} />
              ) : (
                <PersonIcon style={{ fontSize: 48, color: '#6B778C' }} />
              )}
            </div>
            <div className="manage-profile-info">
              <h2>{selectedStudent.name}</h2>
              <span className="manage-profile-id">{selectedStudent.studentId}</span>
              <div className="manage-profile-badges">
                <span className="manage-badge">Class {selectedStudent.class}</span>
                <span className="manage-badge">Section {selectedStudent.section}</span>
                <span className="manage-badge primary">Roll #{selectedStudent.rollNo}</span>
              </div>
            </div>
            <div className="manage-profile-actions">
              <button className="manage-action-btn edit" onClick={handleEditRequest}>
                <EditIcon style={{ fontSize: 18 }} />
                Edit
              </button>
              <button className="manage-action-btn delete" onClick={handleDeleteRequest}>
                <DeleteIcon style={{ fontSize: 18 }} />
                Delete
              </button>
            </div>
          </div>

          <div className="manage-profile-body">
            <div className="manage-info-grid">
              <div className="manage-info-section">
                <h3>👤 Personal Details</h3>
                <div className="manage-info-row">
                  <span className="manage-info-label">Gender</span>
                  <span className="manage-info-value">{selectedStudent.gender || 'N/A'}</span>
                </div>
                <div className="manage-info-row">
                  <span className="manage-info-label">Date of Birth</span>
                  <span className="manage-info-value">{selectedStudent.dob || 'N/A'}</span>
                </div>
                <div className="manage-info-row">
                  <span className="manage-info-label">Aadhar No.</span>
                  <span className="manage-info-value">{selectedStudent.aadhar || 'N/A'}</span>
                </div>
                <div className="manage-info-row">
                  <span className="manage-info-label">APAAR ID</span>
                  <span className="manage-info-value">{selectedStudent.apaar || 'N/A'}</span>
                </div>
              </div>

              <div className="manage-info-section">
                <h3>👨‍👩‍👧 Guardian Details</h3>
                <div className="manage-info-row">
                  <span className="manage-info-label">Father's Name</span>
                  <span className="manage-info-value">{selectedStudent.fatherName || 'N/A'}</span>
                </div>
                <div className="manage-info-row">
                  <span className="manage-info-label">Mother's Name</span>
                  <span className="manage-info-value">{selectedStudent.motherName || 'N/A'}</span>
                </div>
                <div className="manage-info-row">
                  <span className="manage-info-label"><PhoneIcon style={{ fontSize: 14 }} /> Mobile</span>
                  <span className="manage-info-value">{selectedStudent.fatherMobile || 'N/A'}</span>
                </div>
                <div className="manage-info-row">
                  <span className="manage-info-label"><EmailIcon style={{ fontSize: 14 }} /> Email</span>
                  <span className="manage-info-value">{selectedStudent.email || 'N/A'}</span>
                </div>
              </div>

              <div className="manage-info-section full-width">
                <h3><HomeIcon style={{ fontSize: 16 }} /> Address</h3>
                <p className="manage-address">{selectedStudent.address || 'No address provided'}</p>
              </div>

              {selectedStudent.note && (
                <div className="manage-info-section full-width">
                  <h3>📝 Notes</h3>
                  <p className="manage-note">{selectedStudent.note}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Mode */}
      {editMode && editData && (
        <div className="manage-edit-card">
          <div className="manage-edit-header">
            <h2>✏️ Edit Student Information</h2>
            <p>Student ID: {editData.studentId} (cannot be changed)</p>
          </div>

          <div className="manage-edit-body">
            <div className="manage-edit-grid">
              <div className="manage-edit-field">
                <label>Full Name *</label>
                <input type="text" value={editData.name || ''} onChange={(e) => handleEditChange('name', e.target.value)} />
              </div>
              <div className="manage-edit-field">
                <label>Gender</label>
                <select value={editData.gender || ''} onChange={(e) => handleEditChange('gender', e.target.value)}>
                  <option value="">Select</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div className="manage-edit-field">
                <label>Class</label>
                <select value={editData.class || ''} onChange={(e) => handleEditChange('class', e.target.value)}>
                  {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="manage-edit-field">
                <label>Section</label>
                <select value={editData.section || ''} onChange={(e) => handleEditChange('section', e.target.value)}>
                  {sectionOptions.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div className="manage-edit-field">
                <label>Roll Number</label>
                <input type="text" value={editData.rollNo || ''} readOnly disabled />
              </div>
              <div className="manage-edit-field">
                <label>Date of Birth</label>
                <input type="date" value={editData.dob || ''} onChange={(e) => handleEditChange('dob', e.target.value)} />
              </div>
              <div className="manage-edit-field">
                <label>Father's Name</label>
                <input type="text" value={editData.fatherName || ''} onChange={(e) => handleEditChange('fatherName', e.target.value)} />
              </div>
              <div className="manage-edit-field">
                <label>Mother's Name</label>
                <input type="text" value={editData.motherName || ''} onChange={(e) => handleEditChange('motherName', e.target.value)} />
              </div>
              <div className="manage-edit-field">
                <label>Mobile Number</label>
                <input type="tel" value={editData.fatherMobile || ''} onChange={(e) => handleEditChange('fatherMobile', e.target.value)} />
              </div>
              <div className="manage-edit-field">
                <label>Email</label>
                <input type="email" value={editData.email || ''} onChange={(e) => handleEditChange('email', e.target.value)} />
              </div>
              <div className="manage-edit-field">
                <label>Aadhar Number</label>
                <input type="text" value={editData.aadhar || ''} onChange={(e) => handleEditChange('aadhar', e.target.value)} />
              </div>
              <div className="manage-edit-field">
                <label>APAAR ID</label>
                <input type="text" value={editData.apaar || ''} onChange={(e) => handleEditChange('apaar', e.target.value)} />
              </div>
              <div className="manage-edit-field full-width">
                <label>Address</label>
                <textarea value={editData.address || ''} onChange={(e) => handleEditChange('address', e.target.value)} rows={2} />
              </div>
              <div className="manage-edit-field full-width">
                <label>Notes</label>
                <textarea value={editData.note || ''} onChange={(e) => handleEditChange('note', e.target.value)} rows={2} />
              </div>
            </div>

            <div className="manage-edit-actions">
              <button className="manage-btn manage-btn-secondary" onClick={handleEditCancel}>
                <CloseIcon style={{ fontSize: 18 }} />
                Cancel
              </button>
              <button className="manage-btn manage-btn-primary" onClick={handleEditSave}>
                <CheckCircleIcon style={{ fontSize: 18 }} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Dialog */}
      {passwordDialogOpen && (
        <div className="manage-dialog-overlay" onClick={closePasswordDialog}>
          <div className="manage-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="manage-dialog-icon">
              <LockIcon style={{ fontSize: 32, color: '#0052CC' }} />
            </div>
            <h3 className="manage-dialog-title">Action Password Required</h3>
            <p className="manage-dialog-text">
              Enter the action password to {pendingAction === 'edit' ? 'edit' : 'delete'} this student record.
            </p>
            <input
              type="password"
              className="manage-dialog-input"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordConfirm()}
              placeholder="Enter password"
              autoFocus
            />
            {passwordError && <p className="manage-dialog-error">{passwordError}</p>}
            <div className="manage-dialog-actions">
              <button className="manage-btn manage-btn-secondary" onClick={closePasswordDialog}>Cancel</button>
              <button className="manage-btn manage-btn-primary" onClick={handlePasswordConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <div className="manage-dialog-overlay" onClick={() => setDeleteConfirm(false)}>
          <div className="manage-dialog danger" onClick={(e) => e.stopPropagation()}>
            <div className="manage-dialog-icon danger">
              <DeleteIcon style={{ fontSize: 32, color: '#DE350B' }} />
            </div>
            <h3 className="manage-dialog-title">Delete Student?</h3>
            <p className="manage-dialog-text">
              Are you sure you want to delete <strong>{selectedStudent?.name}</strong>?
              You can undo this action within 5 minutes.
            </p>
            <div className="manage-dialog-actions">
              <button className="manage-btn manage-btn-secondary" onClick={() => setDeleteConfirm(false)}>Cancel</button>
              <button className="manage-btn manage-btn-danger" onClick={handleDelete}>Delete Student</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageStudents;
