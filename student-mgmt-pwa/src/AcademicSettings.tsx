import React, { useState, useEffect } from 'react';
import SettingsIcon from '@mui/icons-material/Settings';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import DrawIcon from '@mui/icons-material/Draw';
import LockIcon from '@mui/icons-material/Lock';
import BackupIcon from '@mui/icons-material/Backup';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import InfoIcon from '@mui/icons-material/Info';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadIcon from '@mui/icons-material/Download';
import FolderIcon from '@mui/icons-material/Folder';
import CloudIcon from '@mui/icons-material/Cloud';
import RestoreIcon from '@mui/icons-material/Restore';
import DocumentScannerIcon from '@mui/icons-material/DocumentScanner';
import Tesseract from 'tesseract.js';
import {
  saveFeeMap,
  loadFeeMap,
  savePromotionDate,
  loadPromotionDate,
  savePrincipalSignature,
  loadPrincipalSignature,
  getAdmissions,
  getHistory,
  saveSchoolLogo,
  loadSchoolLogo,
  saveSchoolInfo,
  loadSchoolInfo,
  bulkRestoreAdmissions,
  bulkRestoreHistory,
  saveFeeMap as saveFeeMapToDb
} from './db';
import type { SchoolInfo } from './db';
import {
  initGapiClient,
  initGisClient,
  isSignedIn,
  signIn,
  uploadToDrive,
  listBackupFiles,
  downloadFromDrive
} from './googleDrive';
import './AcademicSettings.css';

interface FeeMap { [className: string]: string; }

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

const Settings: React.FC = () => {
  // Fee State
  const [feeMap, setFeeMap] = useState<FeeMap>({});
  const [editingFees, setEditingFees] = useState<FeeMap>({});

  // Promotion State
  const [promotionDate, setPromotionDate] = useState('');

  // Signature State
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);

  // Password State
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<string | null>(null);

  // Reset Password State
  const [resetMode, setResetMode] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI State
  const [msg, setMsg] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [driveConnected, setDriveConnected] = useState(false);
  const [backupType, setBackupType] = useState<'download' | 'local' | 'drive' | null>(null);

  // Backup Preview State
  const [backupDialogOpen, setBackupDialogOpen] = useState(false);
  const [backupData, setBackupData] = useState<any>(null);
  const [backupBlob, setBackupBlob] = useState<Blob | null>(null);

  // Google Drive State
  const [googleReady, setGoogleReady] = useState(false);
  const [googleSignedIn, setGoogleSignedIn] = useState(false);
  const [driveFiles, setDriveFiles] = useState<Array<{ id: string; name: string; modifiedTime: string }>>([]);
  const [driveDialogOpen, setDriveDialogOpen] = useState(false);
  const [driveLoading, setDriveLoading] = useState(false);

  // School Branding State
  const [schoolInfo, setSchoolInfo] = useState<SchoolInfo>({
    name: 'Sunrise Public School',
    address: '123 Main Road, City - 110001',
    phone: '+91-9876543210',
    email: 'info@school.edu',
    website: 'www.school.edu'
  });
  const [schoolLogoPreview, setSchoolLogoPreview] = useState<string | null>(null);

  // OCR State
  const [ocrFile, setOcrFile] = useState<File | null>(null);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [ocrText, setOcrText] = useState('');
  const [parsedStudents, setParsedStudents] = useState<any[]>([]);
  const [ocrLoading, setOcrLoading] = useState(false);

  useEffect(() => {
    loadAllSettings();
  }, []);

  // Initialize Google APIs
  useEffect(() => {
    const initGoogle = async () => {
      try {
        await initGapiClient();
        await initGisClient();
        setGoogleReady(true);
        setGoogleSignedIn(isSignedIn());
      } catch (err) {
        console.log('Google API init failed:', err);
      }
    };

    // Wait for scripts to load
    const timer = setTimeout(initGoogle, 1000);
    return () => clearTimeout(timer);
  }, []);

  const loadAllSettings = async () => {
    const fees = await loadFeeMap();
    setFeeMap(fees);
    setEditingFees(fees);

    const date = await loadPromotionDate();
    setPromotionDate(date || '');

    const sig = await loadPrincipalSignature();
    if (sig && sig instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => setSignaturePreview(e.target?.result as string);
      reader.readAsDataURL(sig);
    }

    // Load school branding
    const info = await loadSchoolInfo();
    setSchoolInfo(info);

    const logo = await loadSchoolLogo();
    if (logo && typeof logo === 'string') {
      setSchoolLogoPreview(logo);
    } else if (logo instanceof Blob) {
      const reader = new FileReader();
      reader.onload = (e) => setSchoolLogoPreview(e.target?.result as string);
      reader.readAsDataURL(logo);
    }
  };

  const showMessage = (type: 'success' | 'error', message: string) => {
    if (type === 'success') { setMsg(message); setError(''); }
    else { setError(message); setMsg(''); }
    setTimeout(() => { setMsg(''); setError(''); }, 4000);
  };

  // Password Protection
  const requestPasswordAction = (action: string) => {
    setPendingAction(action);
    setPasswordDialogOpen(true);
  };

  const handlePasswordConfirm = () => {
    const storedPassword = localStorage.getItem('actionPassword') || '123456';
    if (passwordInput === storedPassword) {
      setPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');

      if (pendingAction === 'saveFees') saveFees();
      else if (pendingAction === 'savePromotion') savePromotion();
      else if (pendingAction === 'saveOcr') saveOcrStudents();

      setPendingAction(null);
    } else {
      setPasswordError('Incorrect action password');
    }
  };

  // Fee Handlers
  const handleFeeChange = (cls: string, value: string) => {
    setEditingFees(prev => ({ ...prev, [cls]: value }));
  };

  const saveFees = async () => {
    await saveFeeMap(editingFees);
    setFeeMap(editingFees);
    showMessage('success', 'Fee structure saved successfully!');
  };

  // Promotion Handlers
  const savePromotion = async () => {
    await savePromotionDate(promotionDate);
    showMessage('success', 'Promotion date saved!');
  };

  // Signature Handlers
  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await savePrincipalSignature(file);
      const reader = new FileReader();
      reader.onload = (ev) => setSignaturePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
      showMessage('success', 'Signature uploaded successfully!');
    }
  };

  const removeSignature = async () => {
    await savePrincipalSignature(null as any);
    setSignaturePreview(null);
    showMessage('success', 'Signature removed');
  };

  // School Branding Handlers
  const handleSchoolInfoChange = (field: keyof SchoolInfo, value: string) => {
    setSchoolInfo(prev => ({ ...prev, [field]: value }));
  };

  const saveSchoolBranding = async () => {
    await saveSchoolInfo(schoolInfo);
    showMessage('success', 'School information saved successfully!');
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const dataUrl = ev.target?.result as string;
        await saveSchoolLogo(dataUrl);
        setSchoolLogoPreview(dataUrl);
        showMessage('success', 'School logo uploaded successfully!');
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = async () => {
    await saveSchoolLogo('');
    setSchoolLogoPreview(null);
    showMessage('success', 'School logo removed');
  };

  // Password Reset
  const handlePasswordReset = () => {
    if (!oldPassword || !newPassword || !confirmPassword) {
      showMessage('error', 'Please fill all password fields');
      return;
    }
    const storedPassword = localStorage.getItem('actionPassword') || '123456';
    if (oldPassword !== storedPassword) {
      showMessage('error', 'Current password is incorrect');
      return;
    }
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      showMessage('error', 'Password must be at least 6 characters');
      return;
    }
    // Save the new password
    localStorage.setItem('actionPassword', newPassword);
    showMessage('success', 'Password changed successfully!');
    setResetMode(false);
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  // Backup Handler - Prepare backup data (no auto-download)
  const handleBackup = async () => {
    setLoading(true);
    setBackupProgress(0);
    setBackupType('download');

    try {
      const admissions = await getAdmissions();
      setBackupProgress(30);
      const history = await getHistory();
      setBackupProgress(60);

      const data = {
        admissions,
        history,
        feeMap,
        promotionDate,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      setBackupData(data);
      setBackupBlob(blob);
      setBackupProgress(100);
      setBackupDialogOpen(true);
    } catch (err) {
      showMessage('error', 'Backup preparation failed');
    }

    setLoading(false);
    setTimeout(() => { setBackupProgress(0); setBackupType(null); }, 2000);
  };

  // Confirm download backup
  const confirmDownload = () => {
    if (!backupBlob) return;
    const url = URL.createObjectURL(backupBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `school_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupDialogOpen(false);
    showMessage('success', 'Backup downloaded successfully!');
  };

  // Local Folder Backup - Using File System Access API
  const handleLocalBackup = async () => {
    setLoading(true);
    setBackupProgress(0);
    setBackupType('local');

    try {
      // Check if File System Access API is supported
      if (!('showDirectoryPicker' in window)) {
        showMessage('error', 'Your browser does not support folder selection. Use Chrome or Edge.');
        setLoading(false);
        return;
      }

      // Let user pick a folder
      const dirHandle = await (window as any).showDirectoryPicker({ mode: 'readwrite' });
      setBackupProgress(20);

      const admissions = await getAdmissions();
      setBackupProgress(40);
      const history = await getHistory();
      setBackupProgress(60);

      const backupData = {
        admissions,
        history,
        feeMap,
        promotionDate,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      // Create file in selected folder
      const fileName = `school_backup_${new Date().toISOString().split('T')[0]}.json`;
      const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(JSON.stringify(backupData, null, 2));
      await writable.close();

      setBackupProgress(100);
      showMessage('success', `Backup saved to folder: ${fileName}`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showMessage('error', 'Folder selection cancelled');
      } else {
        showMessage('error', 'Local backup failed: ' + err.message);
      }
    }

    setLoading(false);
    setTimeout(() => { setBackupProgress(0); setBackupType(null); }, 2000);
  };

  // Google Drive Backup - Prepare data (no auto-download)
  const handleDriveBackup = async () => {
    setLoading(true);
    setBackupProgress(0);
    setBackupType('drive');

    try {
      const admissions = await getAdmissions();
      setBackupProgress(30);
      const history = await getHistory();
      setBackupProgress(60);

      const data = {
        admissions,
        history,
        feeMap,
        promotionDate,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      setBackupData(data);
      setBackupBlob(blob);
      setBackupProgress(100);
      setBackupDialogOpen(true);
      setDriveConnected(true);
    } catch (err: any) {
      showMessage('error', 'Drive backup preparation failed: ' + err.message);
    }

    setLoading(false);
    setTimeout(() => { setBackupProgress(0); setBackupType(null); }, 2000);
  };

  // Upload backup to Google Drive
  const handleUploadToDrive = async () => {
    setDriveLoading(true);
    try {
      // Sign in if not already
      if (!isSignedIn()) {
        await signIn();
        setGoogleSignedIn(true);
      }

      const fileName = `school_backup_${new Date().toISOString().split('T')[0]}.json`;
      const result = await uploadToDrive(backupData, fileName);

      setBackupDialogOpen(false);
      showMessage('success', `✓ Backup uploaded to Google Drive: ${result.name}`);
    } catch (err: any) {
      if (err.message?.includes('popup')) {
        showMessage('error', 'Sign-in popup was blocked. Please allow popups.');
      } else {
        showMessage('error', 'Drive upload failed: ' + err.message);
      }
    }
    setDriveLoading(false);
  };

  // Open restore from Drive dialog
  const handleRestoreFromDrive = async () => {
    setDriveLoading(true);
    try {
      // Sign in if not already
      if (!isSignedIn()) {
        await signIn();
        setGoogleSignedIn(true);
      }

      // List backup files
      const files = await listBackupFiles();
      setDriveFiles(files);
      setDriveDialogOpen(true);
    } catch (err: any) {
      showMessage('error', 'Failed to list Drive backups: ' + err.message);
    }
    setDriveLoading(false);
  };

  // Download and restore a specific file from Drive
  const handleRestoreFromDriveFile = async (fileId: string, fileName: string) => {
    setDriveLoading(true);
    try {
      const data = await downloadFromDrive(fileId);

      if (!data.version || !data.admissions) {
        showMessage('error', 'Invalid backup file format');
        setDriveLoading(false);
        return;
      }

      // Restore admissions
      const admissionResult = await bulkRestoreAdmissions(data.admissions);

      // Restore history if present
      let historyAdded = 0;
      if (data.history && data.history.length > 0) {
        historyAdded = await bulkRestoreHistory(data.history);
      }

      // Restore fee map if present
      if (data.feeMap) {
        await saveFeeMapToDb(data.feeMap);
        setFeeMap(data.feeMap);
        setEditingFees(data.feeMap);
      }

      // Restore promotion date if present
      if (data.promotionDate) {
        await savePromotionDate(data.promotionDate);
        setPromotionDate(data.promotionDate);
      }

      setDriveDialogOpen(false);
      showMessage('success', `✓ Restored from "${fileName}": ${admissionResult.added} new, ${admissionResult.updated} updated, ${historyAdded} history entries.`);
    } catch (err: any) {
      showMessage('error', 'Restore failed: ' + err.message);
    }
    setDriveLoading(false);
  };

  // Restore from local file
  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || !data.admissions) {
        showMessage('error', 'Invalid backup file format');
        setLoading(false);
        return;
      }

      // Restore admissions
      const admissionResult = await bulkRestoreAdmissions(data.admissions);

      // Restore history if present
      let historyAdded = 0;
      if (data.history && data.history.length > 0) {
        historyAdded = await bulkRestoreHistory(data.history);
      }

      // Restore fee map if present
      if (data.feeMap) {
        await saveFeeMapToDb(data.feeMap);
        setFeeMap(data.feeMap);
        setEditingFees(data.feeMap);
      }

      // Restore promotion date if present
      if (data.promotionDate) {
        await savePromotionDate(data.promotionDate);
        setPromotionDate(data.promotionDate);
      }

      showMessage('success', `✓ Restore complete! ${admissionResult.added} new students, ${admissionResult.updated} updated, ${historyAdded} history entries added.`);
    } catch (err) {
      showMessage('error', 'Failed to read or restore backup file');
    }
    setLoading(false);
  };

  // OCR Functions
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setOcrFile(file);
      setOcrText('');
      setParsedStudents([]);
      setOcrProgress(0);
    }
  };

  const processOCR = async () => {
    if (!ocrFile) return;
    setOcrLoading(true);
    setOcrProgress(0);

    try {
      const result = await Tesseract.recognize(
        ocrFile,
        'eng',
        {
          logger: m => {
            if (m.status === 'recognizing text') {
              setOcrProgress(Math.floor(m.progress * 100));
            }
          }
        }
      );

      setOcrText(result.data.text);
      parseOcrText(result.data.text);
      showMessage('success', 'Text recognized successfully! Please review.');
    } catch (err: any) {
      showMessage('error', 'OCR Failed: ' + err.message);
    }
    setOcrLoading(false);
  };

  const parseOcrText = (text: string) => {
    // Attempt to parse lines. Expected format examples:
    // Name | Class | Section | Father Name | Mobile
    // John Doe, 5, A, Mr. Doe, 9876543210

    const lines = text.split('\n').filter(line => line.trim().length > 5);
    const students: any[] = [];

    lines.forEach(line => {
      // Basic separator detection (comma, pipe, or tab)
      const parts = line.split(/[,|\t]/).map(p => p.trim());

      if (parts.length >= 3) {
        // Simple heuristic mapping
        // Assuming order: Name, Class, Section, FatherName, Mobile
        const name = parts[0];
        const cls = parts[1] || '';
        const section = parts[2] || '';
        const fatherName = parts[3] || '';
        const mobile = parts[4] || '';

        // Validate minimal requirements
        if (name && cls) {
          students.push({
            name,
            class: cls,
            section: section,
            fatherName: fatherName,
            fatherMobile: mobile,
            status: 'Pending' // For UI
          });
        }
      }
    });

    setParsedStudents(students);
  };

  const saveOcrStudents = async () => {
    if (parsedStudents.length === 0) return;

    setLoading(true);
    try {
      // Enrich data with IDs and Admission Dates
      const year = new Date().getFullYear().toString().slice(-2);
      const month = (new Date().getMonth() + 1).toString().padStart(2, '0');

      const toAdd = parsedStudents.map(s => ({
        ...s,
        studentId: `S${year}-${month}-${Math.floor(1000 + Math.random() * 9000)}`,
        admissionDate: new Date().toISOString().split('T')[0],
        rollNo: 'TBD', // Should be assigned logic
        feeHistory: [],
        dues: 0
      }));

      await bulkRestoreAdmissions(toAdd);
      showMessage('success', `${toAdd.length} students added successfully!`);
      setOcrFile(null);
      setOcrText('');
      setParsedStudents([]);
    } catch (err: any) {
      showMessage('error', 'Failed to save students: ' + err.message);
    }
    setLoading(false);
  };

  // Logout
  const handleLogout = () => {
    localStorage.removeItem('school');
    localStorage.removeItem('user');
    window.location.reload();
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <div className="settings-header-content">
          <h1 className="settings-title">
            <SettingsIcon />
            Settings
          </h1>
          <p className="settings-subtitle">Configure school settings and preferences</p>
        </div>
        <button className="settings-logout-btn" onClick={handleLogout}>
          <LogoutIcon style={{ fontSize: 18 }} />
          Logout
        </button>
      </div>

      {/* Messages */}
      {msg && <div className="settings-alert settings-alert-success"><CheckCircleIcon /> {msg}</div>}
      {error && <div className="settings-alert settings-alert-error">{error}</div>}

      {/* Settings Grid */}
      <div className="settings-grid">
        {/* Fee Structure Card */}
        <div className="settings-card">
          <div className="settings-card-header blue">
            <MonetizationOnIcon />
            <h2>Fee Structure</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-card-desc">Set monthly tuition fees for each class</p>
            <div className="settings-fee-grid">
              {classOptions.map(cls => (
                <div key={cls} className="settings-fee-row">
                  <label>Class {cls}</label>
                  <div className="settings-fee-input-wrap">
                    <span>₹</span>
                    <input
                      type="number"
                      value={editingFees[cls] || ''}
                      onChange={(e) => handleFeeChange(cls, e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </div>
              ))}
            </div>
            <button
              className="settings-btn settings-btn-primary"
              onClick={() => requestPasswordAction('saveFees')}
            >
              <SaveIcon style={{ fontSize: 18 }} />
              Save Fee Structure
            </button>
          </div>
        </div>

        {/* Promotion Date Card */}
        <div className="settings-card">
          <div className="settings-card-header green">
            <CalendarMonthIcon />
            <h2>Promotion Date</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-card-desc">Set the date when students are promoted to next class</p>
            <div className="settings-promotion-input">
              <input
                type="date"
                value={promotionDate}
                onChange={(e) => setPromotionDate(e.target.value)}
              />
            </div>
            <div className="settings-info-box">
              <InfoIcon style={{ fontSize: 16 }} />
              Students will be automatically promoted on this date each year
            </div>
            <button
              className="settings-btn settings-btn-primary"
              onClick={() => requestPasswordAction('savePromotion')}
            >
              <SaveIcon style={{ fontSize: 18 }} />
              Save Date
            </button>
          </div>
        </div>

        {/* Signature Card */}
        <div className="settings-card">
          <div className="settings-card-header purple">
            <DrawIcon />
            <h2>Principal Signature</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-card-desc">Upload signature for ID cards and receipts</p>
            <div className="settings-signature-area">
              {signaturePreview ? (
                <div className="settings-signature-preview">
                  <img src={signaturePreview} alt="Signature" />
                  <button className="settings-signature-remove" onClick={removeSignature}>
                    <DeleteIcon style={{ fontSize: 16 }} />
                  </button>
                </div>
              ) : (
                <label className="settings-signature-upload">
                  <UploadFileIcon style={{ fontSize: 32 }} />
                  <span>Click to upload signature</span>
                  <small>PNG or JPG, max 1MB</small>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleSignatureUpload}
                    hidden
                  />
                </label>
              )}
            </div>
          </div>
        </div>

        {/* School Branding Card */}
        <div className="settings-card" style={{ gridColumn: 'span 2' }}>
          <div className="settings-card-header" style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)' }}>
            <InfoIcon />
            <h2>School Branding</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-card-desc">Configure your school information for receipts and ID cards</p>

            <div style={{ display: 'grid', gridTemplateColumns: '150px 1fr', gap: 24, alignItems: 'flex-start' }}>
              {/* Logo Upload */}
              <div style={{ textAlign: 'center' }}>
                <label style={{ cursor: 'pointer', display: 'block' }}>
                  {schoolLogoPreview ? (
                    <div style={{ position: 'relative', display: 'inline-block' }}>
                      <img src={schoolLogoPreview} alt="School Logo" style={{ width: 120, height: 120, objectFit: 'contain', border: '2px solid #e5e7eb', borderRadius: 8, padding: 8 }} />
                      <button
                        type="button"
                        onClick={(e) => { e.preventDefault(); removeLogo(); }}
                        style={{ position: 'absolute', top: -8, right: -8, background: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <DeleteIcon style={{ fontSize: 14 }} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: 120, height: 120, border: '2px dashed #d1d5db', borderRadius: 8, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#6b7280', background: '#f9fafb' }}>
                      <UploadFileIcon style={{ fontSize: 32, marginBottom: 8 }} />
                      <span style={{ fontSize: 12 }}>Upload Logo</span>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} hidden />
                </label>
                <small style={{ color: '#6b7280', fontSize: 11 }}>Square image, max 500KB</small>
              </div>

              {/* School Info Form */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#374151' }}>School Name *</label>
                  <input
                    type="text"
                    value={schoolInfo.name}
                    onChange={(e) => handleSchoolInfoChange('name', e.target.value)}
                    placeholder="Enter school name"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#374151' }}>Address *</label>
                  <input
                    type="text"
                    value={schoolInfo.address}
                    onChange={(e) => handleSchoolInfoChange('address', e.target.value)}
                    placeholder="Full address with PIN code"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#374151' }}>Phone</label>
                  <input
                    type="text"
                    value={schoolInfo.phone}
                    onChange={(e) => handleSchoolInfoChange('phone', e.target.value)}
                    placeholder="+91-XXXXXXXXXX"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#374151' }}>Email</label>
                  <input
                    type="email"
                    value={schoolInfo.email}
                    onChange={(e) => handleSchoolInfoChange('email', e.target.value)}
                    placeholder="info@school.edu"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', fontWeight: 600, marginBottom: 6, color: '#374151' }}>Website</label>
                  <input
                    type="text"
                    value={schoolInfo.website}
                    onChange={(e) => handleSchoolInfoChange('website', e.target.value)}
                    placeholder="www.school.edu"
                    style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: 6, fontSize: 14 }}
                  />
                </div>
              </div>
            </div>

            <button
              className="settings-btn settings-btn-primary"
              onClick={saveSchoolBranding}
              style={{ marginTop: 20 }}
            >
              <SaveIcon style={{ fontSize: 18 }} />
              Save School Information
            </button>
          </div>
        </div>

        {/* Security Card */}
        <div className="settings-card">
          <div className="settings-card-header orange">
            <LockIcon />
            <h2>Security</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-card-desc">Change your action password</p>
            {!resetMode ? (
              <button
                className="settings-btn settings-btn-secondary full"
                onClick={() => setResetMode(true)}
              >
                <LockIcon style={{ fontSize: 18 }} />
                Change Password
              </button>
            ) : (
              <div className="settings-password-form">
                <input
                  type="password"
                  placeholder="Current Password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                <div className="settings-password-actions">
                  <button
                    className="settings-btn settings-btn-secondary"
                    onClick={() => { setResetMode(false); setOldPassword(''); setNewPassword(''); setConfirmPassword(''); }}
                  >
                    Cancel
                  </button>
                  <button
                    className="settings-btn settings-btn-primary"
                    onClick={handlePasswordReset}
                  >
                    Save Password
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Backup Card */}
        <div className="settings-card wide">
          <div className="settings-card-header teal">
            <BackupIcon />
            <h2>Backup & Restore</h2>
          </div>
          <div className="settings-card-body">
            <p className="settings-card-desc">Save your school data locally or to the cloud</p>

            <div className="settings-backup-grid">
              {/* Download Backup */}
              <div className="settings-backup-option">
                <div className="settings-backup-icon download">
                  <DownloadIcon />
                </div>
                <h4>Quick Backup</h4>
                <p>Prepare backup for download</p>
                <button
                  className="settings-btn settings-btn-primary"
                  onClick={handleBackup}
                  disabled={loading}
                >
                  {backupType === 'download' && loading ? 'Preparing...' : 'Create Backup'}
                </button>
              </div>

              {/* Local Folder Backup */}
              <div className="settings-backup-option">
                <div className="settings-backup-icon folder">
                  <FolderIcon />
                </div>
                <h4>Save to Folder</h4>
                <p>Choose a folder on your computer</p>
                <button
                  className="settings-btn settings-btn-secondary"
                  onClick={handleLocalBackup}
                  disabled={loading}
                >
                  {backupType === 'local' && loading ? 'Saving...' : 'Choose Folder'}
                </button>
              </div>

              {/* Google Drive Backup */}
              <div className="settings-backup-option">
                <div className="settings-backup-icon cloud">
                  <CloudIcon />
                </div>
                <h4>Backup to Drive</h4>
                <p>Save to Google Drive</p>
                <button
                  className="settings-btn settings-btn-secondary"
                  onClick={handleDriveBackup}
                  disabled={loading}
                >
                  {backupType === 'drive' && loading ? 'Preparing...' : 'Backup to Drive'}
                </button>
              </div>

              {/* Restore from File */}
              <div className="settings-backup-option">
                <div className="settings-backup-icon restore">
                  <RestoreIcon />
                </div>
                <h4>Restore from File</h4>
                <p>Restore from local backup</p>
                <label className="settings-btn settings-btn-secondary">
                  Select File
                  <input type="file" accept=".json" onChange={handleRestore} hidden />
                </label>
              </div>

              {/* Restore from Drive */}
              <div className="settings-backup-option">
                <div className="settings-backup-icon cloud">
                  <CloudIcon />
                </div>
                <h4>Restore from Drive</h4>
                <p>Get backup from Google Drive</p>
                <button
                  className="settings-btn settings-btn-secondary"
                  onClick={handleRestoreFromDrive}
                  disabled={driveLoading}
                >
                  {driveLoading ? 'Loading...' : 'Select Backup'}
                </button>
                {googleSignedIn && <span className="settings-backup-status">✓ Connected</span>}
              </div>
            </div>

            {backupProgress > 0 && (
              <div className="settings-progress">
                <div className="settings-progress-bar" style={{ width: `${backupProgress}%` }} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OCR Offline Admission Card */}
      <div className="settings-card wide">
        <div className="settings-card-header blue">
          <DocumentScannerIcon />
          <h2>Offline Admission (OCR)</h2>
        </div>
        <div className="settings-card-body">
          <p className="settings-card-desc">Upload photo of student list to automatically add them</p>

          <div className="settings-ocr-area">
            <div style={{ marginBottom: 16 }}>
              <label className="settings-btn settings-btn-secondary" style={{ width: 'auto', display: 'inline-flex' }}>
                <UploadFileIcon /> Select Image
                <input type="file" accept="image/*" onChange={handleOcrUpload} hidden />
              </label>
              {ocrFile && <span style={{ marginLeft: 10 }}>{ocrFile.name} ({(ocrFile.size / 1024).toFixed(1)} KB)</span>}
            </div>

            {ocrFile && (
              <button
                className="settings-btn settings-btn-primary"
                onClick={processOCR}
                disabled={ocrLoading}
                style={{ marginBottom: 16 }}
              >
                {ocrLoading ? `Processing ${ocrProgress}%...` : 'Extract Text & Parse'}
              </button>
            )}

            {ocrLoading && (
              <div className="settings-progress">
                <div className="settings-progress-bar" style={{ width: `${ocrProgress}%` }} />
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600 }}>Raw Extracted Text</label>
                <textarea
                  value={ocrText}
                  onChange={(e) => {
                    setOcrText(e.target.value);
                    parseOcrText(e.target.value);
                  }}
                  style={{ width: '100%', height: 200, padding: 8, fontSize: 12, fontFamily: 'monospace' }}
                  placeholder="Extracted text will appear here..."
                />
              </div>

              <div>
                <label style={{ display: 'block', marginBottom: 5, fontSize: 12, fontWeight: 600 }}>Parsed Students Preview ({parsedStudents.length})</label>
                <div style={{ height: 200, overflowY: 'auto', border: '1px solid #ccc', background: '#f9f9f9', padding: 8 }}>
                  {parsedStudents.length > 0 ? (
                    parsedStudents.map((s, i) => (
                      <div key={i} style={{ borderBottom: '1px solid #eee', paddingBottom: 4, marginBottom: 4, fontSize: 11 }}>
                        <strong>{s.name}</strong> | Cls: {s.class}-{s.section} <br />
                        <span style={{ color: '#666' }}>Father: {s.fatherName} | Mob: {s.fatherMobile}</span>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: '#999', textAlign: 'center', marginTop: 80 }}>
                      No students parsed. Ensure format: Name, Class, Section...
                    </div>
                  )}
                </div>
              </div>
            </div>

            {parsedStudents.length > 0 && (
              <button
                className="settings-btn settings-btn-primary"
                onClick={() => requestPasswordAction('saveOcr')}
                style={{ marginTop: 16 }}
              >
                Add {parsedStudents.length} Students
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="settings-footer">
        <p>© {new Date().getFullYear()} School Management System | Version 2.0</p>
        <p>Developed by ASK Ltd.</p>
      </div>

      {/* Backup Preview Dialog */}
      {backupDialogOpen && backupData && (
        <div className="settings-dialog-overlay" onClick={() => setBackupDialogOpen(false)}>
          <div className="settings-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="settings-dialog-icon" style={{ background: 'linear-gradient(135deg, #00A3BF, #00B8D9)' }}>
              <BackupIcon style={{ fontSize: 32, color: 'white' }} />
            </div>
            <h3>Backup Ready</h3>
            <div style={{ textAlign: 'left', background: '#F4F5F7', borderRadius: 8, padding: 16, marginBottom: 20 }}>
              <p style={{ margin: '8px 0', fontSize: 14 }}><strong>Students:</strong> {backupData.admissions?.length || 0}</p>
              <p style={{ margin: '8px 0', fontSize: 14 }}><strong>History Records:</strong> {backupData.history?.length || 0}</p>
              <p style={{ margin: '8px 0', fontSize: 14 }}><strong>Date:</strong> {new Date(backupData.exportDate).toLocaleDateString()}</p>
              <p style={{ margin: '8px 0', fontSize: 14 }}><strong>Size:</strong> {backupBlob ? (backupBlob.size / 1024).toFixed(1) + ' KB' : 'N/A'}</p>
            </div>
            <div className="settings-dialog-actions" style={{ flexDirection: 'column', gap: 12 }}>
              <button className="settings-btn settings-btn-primary" style={{ width: '100%' }} onClick={confirmDownload}>
                <DownloadIcon style={{ fontSize: 18 }} />
                Download to Computer
              </button>
              {backupType === 'drive' && (
                <button
                  className="settings-btn settings-btn-secondary"
                  style={{ width: '100%', background: 'linear-gradient(135deg, #4285F4, #34A853)', color: 'white', border: 'none' }}
                  onClick={handleUploadToDrive}
                  disabled={driveLoading}
                >
                  <CloudIcon style={{ fontSize: 18 }} />
                  {driveLoading ? 'Uploading...' : 'Upload to Google Drive'}
                </button>
              )}
              <button className="settings-btn settings-btn-secondary" style={{ width: '100%' }} onClick={() => setBackupDialogOpen(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drive Files Dialog */}
      {driveDialogOpen && (
        <div className="settings-dialog-overlay" onClick={() => setDriveDialogOpen(false)}>
          <div className="settings-dialog" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 550 }}>
            <div className="settings-dialog-icon" style={{ background: 'linear-gradient(135deg, #4285F4, #34A853)' }}>
              <CloudIcon style={{ fontSize: 32, color: 'white' }} />
            </div>
            <h3>Restore from Google Drive</h3>
            <p style={{ marginBottom: 16 }}>Select a backup file to restore</p>

            {driveFiles.length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: '#6B778C' }}>
                No backup files found in your Google Drive.
              </div>
            ) : (
              <div style={{ maxHeight: 300, overflowY: 'auto' }}>
                {driveFiles.map(file => (
                  <div
                    key={file.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 16px',
                      background: '#F4F5F7',
                      borderRadius: 8,
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, color: '#172B4D' }}>{file.name}</div>
                      <div style={{ fontSize: 12, color: '#6B778C' }}>
                        {new Date(file.modifiedTime).toLocaleDateString()} {new Date(file.modifiedTime).toLocaleTimeString()}
                      </div>
                    </div>
                    <button
                      className="settings-btn settings-btn-primary"
                      style={{ padding: '8px 16px', fontSize: 13 }}
                      onClick={() => handleRestoreFromDriveFile(file.id, file.name)}
                      disabled={driveLoading}
                    >
                      {driveLoading ? '...' : 'Restore'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="settings-dialog-actions" style={{ marginTop: 16 }}>
              <button className="settings-btn settings-btn-secondary" onClick={() => setDriveDialogOpen(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Dialog */}
      {passwordDialogOpen && (
        <div className="settings-dialog-overlay" onClick={() => setPasswordDialogOpen(false)}>
          <div className="settings-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="settings-dialog-icon">
              <LockIcon style={{ fontSize: 32 }} />
            </div>
            <h3>Action Password Required</h3>
            <p>Enter your password to save changes</p>
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePasswordConfirm()}
              placeholder="Enter password"
              autoFocus
            />
            {passwordError && <span className="settings-dialog-error">{passwordError}</span>}
            <div className="settings-dialog-actions">
              <button className="settings-btn settings-btn-secondary" onClick={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); }}>Cancel</button>
              <button className="settings-btn settings-btn-primary" onClick={handlePasswordConfirm}>Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
