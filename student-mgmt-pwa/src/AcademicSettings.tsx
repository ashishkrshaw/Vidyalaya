import React, { useState, useEffect } from 'react';
import Grid from '@mui/material/Grid'; // Corrected import
import {
  Box, Typography, Card, TextField, Button, MenuItem, FormControl, InputLabel, 
  Select, Alert, Dialog, DialogTitle, DialogContent, DialogActions, Chip, Divider, CircularProgress
} from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import SaveIcon from '@mui/icons-material/Save';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import DriveFolderUploadIcon from '@mui/icons-material/DriveFolderUpload';
import {
  saveFeeMap,
  loadFeeMap,
  savePromotionDate,
  loadPromotionDate,
  savePrincipalSignature,
  loadPrincipalSignature,
  getDb,
  getAdmissions,
  getHistory
} from './db';

// Type definitions
interface FeeMap { [className: string]: string; }
interface Admission { id?: string; updatedAt?: string; timestamp?: string; createdAt?: string; dob?: string; [key: string]: any; }
interface History { id?: string; timestamp?: string; [key: string]: any; }
type PrincipalSignature = File | string | null;
type PromotionDate = string;
type ResetType = 'login' | 'confirm' | null;
type PendingAction = 'promotion' | 'fee' | null;
interface SyncData { admissions: Admission[]; history: History[]; feeMap: FeeMap; promotionDate: PromotionDate; principalSignature: PrincipalSignature; db: any; }
declare global { interface Window { showDirectoryPicker: () => Promise<any>; } }

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

const commonTextFieldStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
  },
};

const AcademicSettings: React.FC = () => {
  const [promotionDate, setPromotionDate] = useState<string>('');
  const [feeClass, setFeeClass] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<string>('');
  const [feeMap, setFeeMap] = useState<FeeMap>({});
  const [msg, setMsg] = useState<string>('');
  const [signature, setSignature] = useState<PrincipalSignature>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [checkingConnection, setCheckingConnection] = useState<boolean>(true);
  const [backupMsg, setBackupMsg] = useState<string>('');
  const [syncMsg, setSyncMsg] = useState<string>('');
  const [syncWarning, setSyncWarning] = useState<string>('');
  const [syncPending, setSyncPending] = useState<SyncData | null>(null);
  const [loginPassword, setLoginPassword] = useState<string>('825419');
  const [confirmPassword, setConfirmPassword] = useState<string>('123456');
  const [resetType, setResetType] = useState<ResetType>(null);
  const [oldPassInput, setOldPassInput] = useState<string>('');
  const [newPassInput, setNewPassInput] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');
  const [resetMsg, setResetMsg] = useState<string>('');
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);

  const handleLogout = (): void => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('schoolName');
    window.location.reload();
  };

  useEffect(() => {
    const initializeData = async () => {
      try {
        const [loadedFeeMap, loadedPromotionDate, loadedSignature] = await Promise.all([
          loadFeeMap(),
          loadPromotionDate(),
          loadPrincipalSignature()
        ]);

        setFeeMap(loadedFeeMap);
        setPromotionDate(loadedPromotionDate);
        setSignature(loadedSignature);

        if (loadedSignature) {
          if (typeof loadedSignature !== 'string' && loadedSignature.type?.startsWith('image/')) {
            setSignatureUrl(URL.createObjectURL(loadedSignature));
          } else if (typeof loadedSignature === 'string') {
            setSignatureUrl(loadedSignature);
          }
        }

        await checkDriveConnection();
      } catch (error) {
        console.error('Error initializing data:', error);
      }
    };

    initializeData();
  }, []);

  const showTempMessage = (setter: React.Dispatch<React.SetStateAction<string>>, message: string, duration = 3000) => {
    setter(message);
    setTimeout(() => setter(''), duration);
  };

  const handlePromotionSave = async (): Promise<void> => {
    try {
      await savePromotionDate(promotionDate);
      showTempMessage(setMsg, 'Promotion date saved!');
    } catch (error) {
      console.error('Error saving promotion date:', error);
      showTempMessage(setMsg, 'Error saving promotion date');
    }
  };

  const handlePromotionSaveRequest = (): void => {
    setPendingAction('promotion');
    setPasswordDialogOpen(true);
  };

  const handleFeeSave = async (): Promise<void> => {
    if (feeClass && feeAmount) {
      try {
        const newMap = { ...feeMap, [feeClass]: feeAmount };
        setFeeMap(newMap);
        await saveFeeMap(newMap);
        showTempMessage(setMsg, `Fee for class ${feeClass} set to ₹${feeAmount}/month!`);
        setFeeClass('');
        setFeeAmount('');
      } catch (error) {
        console.error('Error saving fee:', error);
        showTempMessage(setMsg, 'Error saving fee');
      }
    }
  };

  const handleFeeSaveRequest = (): void => {
    setPendingAction('fee');
    setPasswordDialogOpen(true);
  };

  const handlePasswordConfirm = (): void => {
    if (passwordInput === confirmPassword) {
      setPasswordDialogOpen(false);
      setPasswordInput('');
      setPasswordError('');
      
      if (pendingAction === 'promotion') handlePromotionSave();
      if (pendingAction === 'fee') handleFeeSave();
      
      setPendingAction(null);
    } else {
      setPasswordError('Incorrect password.');
    }
  };

  const closePasswordDialog = (): void => {
    setPasswordDialogOpen(false);
    setPasswordInput('');
    setPasswordError('');
    setPendingAction(null);
  };

  const handleResetPassword = (): void => {
    if (resetType === 'login') {
      if (oldPassInput !== loginPassword) {
        setResetError('Old login password incorrect.');
        return;
      }
      setLoginPassword(newPassInput);
      showTempMessage(setResetMsg, 'Login password updated!');
    } else if (resetType === 'confirm') {
      if (oldPassInput !== confirmPassword) {
        setResetError('Old confirmation password incorrect.');
        return;
      }
      setConfirmPassword(newPassInput);
      showTempMessage(setResetMsg, 'Confirmation password updated!');
    }

    setOldPassInput('');
    setNewPassInput('');
    setResetError('');
  };

  const cancelPasswordReset = (): void => {
    setResetType(null);
    setOldPassInput('');
    setNewPassInput('');
    setResetError('');
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await savePrincipalSignature(file);
      setSignature(file);
      
      if (file.type.startsWith('image/')) {
        setSignatureUrl(URL.createObjectURL(file));
      } else {
        setSignatureUrl(file.name);
      }
    } catch (error) {
      console.error('Error saving signature:', error);
    }
  };

  const handleRemoveSignature = async (): Promise<void> => {
    try {
      await savePrincipalSignature('');
      setSignature(null);
      setSignatureUrl('');
    } catch (error) {
      console.error('Error removing signature:', error);
    }
  };

  const backupData = async (): Promise<void> => {
    if (!('showDirectoryPicker' in window)) {
      showTempMessage(setBackupMsg, 'Backup not supported in this browser.');
      return;
    }

    try {
      const dir = await window.showDirectoryPicker();
      
      const [admissions, history, feeMapData, promotionDateData, principalSignatureData] = await Promise.all([
        getAdmissions(),
        getHistory(),
        loadFeeMap(),
        loadPromotionDate(),
        loadPrincipalSignature(),
      ]);

      const files = [
        { name: 'admissions.json', data: admissions },
        { name: 'history.json', data: history },
        { name: 'feeMap.json', data: feeMapData },
        { name: 'promotionDate.json', data: promotionDateData },
        { name: 'principalSignature', data: principalSignatureData },
      ];

      await Promise.all(files.map(async (f) => {
        if (f.data === undefined) return;
        
        const handle = await dir.getFileHandle(f.name, { create: true });
        const writable = await handle.createWritable();
        
        if (f.name === 'principalSignature' && f.data) {
          await writable.write(f.data);
        } else {
          await writable.write(JSON.stringify(f.data));
        }
        
        await writable.close();
      }));

      showTempMessage(setBackupMsg, 'Backup successful!', 3000);
    } catch (error) {
      setBackupMsg('Backup failed: ' + (error as Error).message);
    }
  };

  const syncData = async (): Promise<void> => {
    if (!('showDirectoryPicker' in window)) {
      showTempMessage(setSyncMsg, 'Sync not supported in this browser.');
      return;
    }

    try {
      const dir = await window.showDirectoryPicker();
      
      const admissionsFile = await (await dir.getFileHandle('admissions.json')).getFile();
      const historyFile = await (await dir.getFileHandle('history.json')).getFile();
      
      const admissions = JSON.parse(await admissionsFile.text());
      const history = JSON.parse(await historyFile.text());
      const feeMapData = JSON.parse(await (await (await dir.getFileHandle('feeMap.json')).getFile()).text());
      const promotionDateData = JSON.parse(await (await (await dir.getFileHandle('promotionDate.json')).getFile()).text());
      
      let principalSignatureData = undefined;
      try {
        principalSignatureData = await (await (await dir.getFileHandle('principalSignature')).getFile());
      } catch {}

      const backupLatest = Math.max(
        ...admissions.map((a: Admission) => new Date(a.updatedAt || a.timestamp || a.createdAt || a.dob || 0).getTime()),
        ...history.map((h: History) => new Date(h.timestamp || 0).getTime()),
        admissionsFile.lastModified,
        historyFile.lastModified
      );

      const db = await getDb();
      const currentAdmissions = await db.getAll('admissions');
      const currentHistory = await db.getAll('history');
      
      const appLatest = Math.max(
        ...currentAdmissions.map((a: Admission) => new Date(a.updatedAt || a.timestamp || a.createdAt || a.dob || 0).getTime()),
        ...currentHistory.map((h: History) => new Date(h.timestamp || 0).getTime())
      );

      if (backupLatest <= appLatest) {
        setSyncWarning('Backup data is not newer than current app data. Sync may cause data loss. Proceed?');
        setSyncPending({ admissions, history, feeMap: feeMapData, promotionDate: promotionDateData, principalSignature: principalSignatureData, db });
        return;
      }

      await doSync({ admissions, history, feeMap: feeMapData, promotionDate: promotionDateData, principalSignature: principalSignatureData, db });
      
      showTempMessage(setSyncMsg, 'Sync successful!', 3000);
    } catch (error) {
      setSyncMsg('Sync failed: ' + (error as Error).message);
    }
  };

  const doSync = async ({ admissions, history, feeMap: feeMapData, promotionDate: promotionDateData, principalSignature: principalSignatureData, db }: SyncData): Promise<void> => {
    await Promise.all([
      db.clear('admissions'),
      db.clear('history'),
      db.clear('settings'),
    ]);

    await Promise.all(admissions.map((a) => db.put('admissions', a)));
    await Promise.all(history.map((h) => db.put('history', h)));
    await db.put('settings', feeMapData, 'feeMap');
    await db.put('settings', promotionDateData, 'promotionDate');
    
    if (principalSignatureData) {
      await db.put('settings', principalSignatureData, 'principalSignature');
    }
  };

  const handleSyncConfirm = async (): Promise<void> => {
    if (!syncPending) return;

    try {
      await doSync(syncPending);
      showTempMessage(setSyncMsg, 'Sync successful!', 3000);
    } catch (error) {
      setSyncMsg('Sync failed: ' + (error as Error).message);
    }
    
    setSyncWarning('');
    setSyncPending(null);
  };

  const handleSyncCancel = (): void => {
    setSyncWarning('');
    setSyncPending(null);
  };

  const checkDriveConnection = async (): Promise<void> => {
    const username = "admin";
    const BASE_URL = import.meta.env.VITE_BASE_URL || "https://gdrive-backend-1.onrender.com";

    try {
      const response = await fetch(`${BASE_URL}/check-connection/${username}`);
      const data = await response.json();
      setDriveConnected(data.connected);
    } catch (error) {
      console.log("Connection check failed:", error);
      setDriveConnected(false);
    }
    
    setCheckingConnection(false);
  };

  const connectGoogleDrive = (): void => {
    const username = "admin";
    const BASE_URL = import.meta.env.VITE_BASE_URL || "https://gdrive-backend-1.onrender.com";

    window.open(`${BASE_URL}/auth/google?username=${username}`, '_blank', 'width=500,height=600');

    setTimeout(() => {
      checkDriveConnection();
    }, 3000);
  };

  const backupToDrive = async (): Promise<void> => {
    const username = "admin";
    const BASE_URL = import.meta.env.VITE_BASE_URL || "https://gdrive-backend-1.onrender.com";

    try {
      const [admissions, history, feeMapData, promotionDateData, principalSignatureData] = await Promise.all([
        getAdmissions() as Promise<Admission[]>,
        getHistory() as Promise<History[]>,
        loadFeeMap() as Promise<FeeMap>,
        loadPromotionDate() as Promise<PromotionDate>,
        loadPrincipalSignature() as Promise<PrincipalSignature>,
      ]);

      const files = [
        { name: "admissions.json", data: admissions },
        { name: "history.json", data: history },
        { name: "feeMap.json", data: feeMapData },
        { name: "promotionDate.json", data: promotionDateData },
        { name: "principalSignature", data: principalSignatureData },
      ];

      for (const f of files) {
        if (!f.data) continue;

        let content: string;

        if (f.name === "principalSignature" && f.data instanceof File) {
          content = await f.data.text();
        } else {
          content = JSON.stringify(f.data);
        }

        await fetch(`${BASE_URL}/upload-drive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, name: f.name, content }),
        });
      }

      showTempMessage(setBackupMsg, "Backup uploaded to Google Drive!", 3000);
    } catch (error) {
      setBackupMsg("Drive backup failed: " + (error as Error).message);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 900, mx: 'auto', mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>Academic Settings</Typography>
        <Button variant="outlined" color="error" onClick={handleLogout}>Logout</Button>
      </Box>

      {msg && <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>{msg}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>Fees & Promotions</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Set Class Fee</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <FormControl fullWidth sx={{ flex: 2 }}><InputLabel>Class</InputLabel><Select value={feeClass} label="Class" onChange={(e) => setFeeClass(e.target.value)} sx={commonTextFieldStyles}>{classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl>
                  <TextField label="Amount" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} fullWidth sx={{ ...commonTextFieldStyles, flex: 2 }} />
                  <Button variant="contained" onClick={handleFeeSaveRequest} sx={{ flex: 1, height: 56 }}><SaveIcon /></Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Set Promotion Date</Typography>
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                  <TextField type="date" value={promotionDate} onChange={(e) => setPromotionDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} sx={{ ...commonTextFieldStyles, flex: 3 }} />
                  <Button variant="contained" onClick={handlePromotionSaveRequest} sx={{ flex: 1, height: 56 }}><SaveIcon /></Button>
                </Box>
              </Grid>
            </Grid>
            {Object.keys(feeMap).length > 0 && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" gutterBottom>Current Fee Structure (₹/month)</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {Object.entries(feeMap).map(([c, a]) => <Chip key={c} label={`${c}: ₹${a}`} />)}
                </Box>
              </Box>
            )}
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>Data Management</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Local Backup & Sync</Typography>
                {typeof window !== 'undefined' && 'showDirectoryPicker' in window ? (
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="outlined" startIcon={<CloudUploadIcon />} onClick={backupData}>Backup</Button>
                    <Button variant="outlined" color="secondary" startIcon={<CloudDownloadIcon />} onClick={syncData}>Sync</Button>
                  </Box>
                ) : <Alert severity="info">Local backup/sync is not supported in your browser.</Alert>}
                {backupMsg && <Alert severity="info" sx={{ mt: 2 }}>{backupMsg}</Alert>}
                {syncMsg && <Alert severity="info" sx={{ mt: 2 }}>{syncMsg}</Alert>}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Google Drive</Typography>
                {checkingConnection ? <CircularProgress size={24} /> : (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Chip label={driveConnected ? "Connected" : "Not Connected"} color={driveConnected ? "success" : "error"} />
                    {!driveConnected && <Button variant="contained" onClick={connectGoogleDrive}>Connect</Button>}
                    {driveConnected && <Button variant="contained" color="success" startIcon={<DriveFolderUploadIcon />} onClick={backupToDrive}>Backup to Drive</Button>}
                  </Box>
                )}
              </Grid>
            </Grid>
            {syncWarning && <Alert severity="warning" action={<><Button color="inherit" size="small" onClick={handleSyncConfirm}>Proceed</Button><Button color="inherit" size="small" onClick={handleSyncCancel}>Cancel</Button></>} sx={{ mt: 2 }}>{syncWarning}</Alert>}
          </Card>
        </Grid>

        <Grid item xs={12}>
          <Card sx={{ p: 3, borderRadius: 2, boxShadow: 3 }}>
            <Typography variant="h6" gutterBottom>Security</Typography>
            <Divider sx={{ my: 2 }} />
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Principal's Signature</Typography>
                <Button variant="contained" component="label" sx={{ mb: 1 }}>Upload Signature<input type="file" accept="image/*,application/pdf" hidden onChange={handleSignatureUpload} /></Button>
                {signature && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                    {signatureUrl && signature instanceof File && signature.type?.startsWith('image/') ? <img src={signatureUrl} alt="Signature" style={{ maxWidth: 120, height: 'auto', border: '1px solid #ddd' }} /> : <Typography variant="body2">{signature instanceof File ? signature.name : signatureUrl}</Typography>}
                    <Button variant="outlined" color="error" size="small" onClick={handleRemoveSignature}>Remove</Button>
                  </Box>
                )}
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" gutterBottom>Password Management</Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" startIcon={<VpnKeyIcon />} onClick={() => setResetType('login')}>Login Password</Button>
                  <Button variant="outlined" startIcon={<LockIcon />} onClick={() => setResetType('confirm')}>Action Password</Button>
                </Box>
              </Grid>
            </Grid>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={!!resetType} onClose={cancelPasswordReset}>
        <DialogTitle>Reset {resetType === 'login' ? 'Login' : 'Action Confirmation'} Password</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField label="Old Password" type="password" value={oldPassInput} onChange={(e) => setOldPassInput(e.target.value)} fullWidth autoFocus sx={commonTextFieldStyles} />
            <TextField label="New Password" type="password" value={newPassInput} onChange={(e) => setNewPassInput(e.target.value)} fullWidth sx={commonTextFieldStyles} />
            {resetError && <Alert severity="error">{resetError}</Alert>}
            {resetMsg && <Alert severity="success">{resetMsg}</Alert>}
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={cancelPasswordReset}>Cancel</Button>
          <Button onClick={handleResetPassword} variant="contained">Update</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={passwordDialogOpen} onClose={closePasswordDialog}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LockIcon /> Password Required</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Enter action confirmation password.</Typography>
          <TextField label="Password" type="password" value={passwordInput} onChange={(e) => setPasswordInput(e.target.value)} fullWidth autoFocus onKeyDown={(e) => { if (e.key === 'Enter') handlePasswordConfirm(); }} error={!!passwordError} helperText={passwordError} sx={commonTextFieldStyles} />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={closePasswordDialog}>Cancel</Button>
          <Button onClick={handlePasswordConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
        <Typography variant="caption" color="text.secondary">© All rights reserved | ASK Ltd</Typography>
      </Box>
    </Box>
  );
};

export default AcademicSettings;
