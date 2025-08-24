import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  TextField,
  Button,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip
} from '@mui/material';
import Grid from '@mui/material/Grid';
import LockIcon from '@mui/icons-material/Lock';
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
interface FeeMap {
  [className: string]: string;
}

interface Admission {
  id?: string;
  updatedAt?: string;
  timestamp?: string;
  createdAt?: string;
  dob?: string;
  [key: string]: any;
}

interface History {
  id?: string;
  timestamp?: string;
  [key: string]: any;
}

type PrincipalSignature = File | string | null;
type PromotionDate = string;
type ResetType = 'login' | 'confirm' | null;
type PendingAction = 'promotion' | 'fee' | null;

interface SyncData {
  admissions: Admission[];
  history: History[];
  feeMap: FeeMap;
  promotionDate: PromotionDate;
  principalSignature: PrincipalSignature;
  db: any;
}

declare global {
  interface Window {
    showDirectoryPicker: () => Promise<any>;
  }
}

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

const AcademicSettings: React.FC = () => {
  // State for promotion date and fees
  const [promotionDate, setPromotionDate] = useState<string>('');
  const [feeClass, setFeeClass] = useState<string>('');
  const [feeAmount, setFeeAmount] = useState<string>('');
  const [feeMap, setFeeMap] = useState<FeeMap>({});
  const [msg, setMsg] = useState<string>('');

  // State for signature
  const [signature, setSignature] = useState<PrincipalSignature>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>('');

  // State for Google Drive
  const [driveConnected, setDriveConnected] = useState<boolean>(false);
  const [checkingConnection, setCheckingConnection] = useState<boolean>(true);

  // State for backup/sync
  const [backupMsg, setBackupMsg] = useState<string>('');
  const [syncMsg, setSyncMsg] = useState<string>('');
  const [syncWarning, setSyncWarning] = useState<string>('');
  const [syncPending, setSyncPending] = useState<SyncData | null>(null);

  // State for password management
  const [loginPassword, setLoginPassword] = useState<string>('825419');
  const [confirmPassword, setConfirmPassword] = useState<string>('123456');
  const [resetType, setResetType] = useState<ResetType>(null);
  const [oldPassInput, setOldPassInput] = useState<string>('');
  const [newPassInput, setNewPassInput] = useState<string>('');
  const [resetError, setResetError] = useState<string>('');
  const [resetMsg, setResetMsg] = useState<string>('');

  // State for password confirmation dialog
  const [passwordDialogOpen, setPasswordDialogOpen] = useState<boolean>(false);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [pendingAction, setPendingAction] = useState<PendingAction>(null);
  // Add this function inside AcademicSettings component
  const handleLogout = (): void => {
    localStorage.removeItem('loggedIn');
    localStorage.removeItem('schoolName');
    window.location.reload(); // reload karega aur login screen dikhayega
  };


  // Initialize data on component mount
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

        // Handle signature URL
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

  // Helper function to show temporary messages
  const showTempMessage = (setter: React.Dispatch<React.SetStateAction<string>>, message: string, duration = 2000) => {
    setter(message);
    setTimeout(() => setter(''), duration);
  };

  // Promotion date handlers
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

  // Fee management handlers
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

  // Password confirmation handlers
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

  // Password reset handlers
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

  // Signature handlers
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

  // Backup and sync handlers
  const backupData = async (): Promise<void> => {
    if (!('showDirectoryPicker' in window)) {
      showTempMessage(setBackupMsg, 'Backup not supported in this browser.');
      return;
    }

    try {
      const dir = await window.showDirectoryPicker();
      
      // Export all stores
      const [admissions, history, feeMapData, promotionDateData, principalSignatureData] = await Promise.all([
        getAdmissions(),
        getHistory(),
        loadFeeMap(),
        loadPromotionDate(),
        loadPrincipalSignature(),
      ]);

      // Write files
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
      
      // Read files
      const admissionsFile = await (await dir.getFileHandle('admissions.json')).getFile();
      const historyFile = await (await dir.getFileHandle('history.json')).getFile();
      
      const admissions = JSON.parse(await admissionsFile.text());
      const history = JSON.parse(await historyFile.text());
      const feeMapData = JSON.parse(await (await (await dir.getFileHandle('feeMap.json')).getFile()).text());
      const promotionDateData = JSON.parse(await (await (await dir.getFileHandle('promotionDate.json')).getFile()).text());
      
      let principalSignatureData = undefined;
      try {
        principalSignatureData = await (await (await dir.getFileHandle('principalSignature')).getFile());
      } catch {
        // File doesn't exist, that's okay
      }

      // Get latest timestamp in backup
      const backupLatest = Math.max(
        ...admissions.map((a: Admission) => new Date(a.updatedAt || a.timestamp || a.createdAt || a.dob || 0).getTime()),
        ...history.map((h: History) => new Date(h.timestamp || 0).getTime()),
        admissionsFile.lastModified,
        historyFile.lastModified
      );

      // Get latest timestamp in current app data
      const db = await getDb();
      const currentAdmissions = await db.getAll('admissions');
      const currentHistory = await db.getAll('history');
      
      const appLatest = Math.max(
        ...currentAdmissions.map((a: Admission) => new Date(a.updatedAt || a.timestamp || a.createdAt || a.dob || 0).getTime()),
        ...currentHistory.map((h: History) => new Date(h.timestamp || 0).getTime())
      );

      if (backupLatest <= appLatest) {
        setSyncWarning('Backup data is not newer than current app data. Sync may cause data loss. Proceed?');
        setSyncPending({ 
          admissions, 
          history, 
          feeMap: feeMapData, 
          promotionDate: promotionDateData, 
          principalSignature: principalSignatureData, 
          db 
        });
        return;
      }

      // Proceed with sync
      await doSync({ 
        admissions, 
        history, 
        feeMap: feeMapData, 
        promotionDate: promotionDateData, 
        principalSignature: principalSignatureData, 
        db 
      });
      
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

  // Google Drive handlers
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

    // Check connection after a delay
    setTimeout(() => {
      checkDriveConnection();
    }, 3000);
  };

  const backupToDrive = async (): Promise<void> => {
    const username = "admin";
    const BASE_URL = import.meta.env.VITE_BASE_URL || "https://gdrive-backend-1.onrender.com";

    try {
      // Load all app data
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

        // Handle signature file conversion
        if (f.name === "principalSignature" && f.data instanceof File) {
          content = await f.data.text();
        } else {
          content = JSON.stringify(f.data);
        }

        await fetch(`${BASE_URL}/upload-drive`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            name: f.name,
            content,
          }),
        });
      }

      showTempMessage(setBackupMsg, "Backup uploaded to Google Drive!", 3000);
    } catch (error) {
      setBackupMsg("Drive backup failed: " + (error as Error).message);
    }
  };

  return (
    <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Academic Settings
        </Typography>
        <Button 
          variant="outlined" 
          color="error" 
          onClick={handleLogout}
        >
          Logout
        </Button>
      </Box>



      {/* Password Reset Section */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Password Reset
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => { 
              setResetType('login'); 
              setResetError(''); 
              setResetMsg(''); 
            }}
          >
            Reset Login Password
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => { 
              setResetType('confirm'); 
              setResetError(''); 
              setResetMsg(''); 
            }}
          >
            Reset Confirmation Password
          </Button>
        </Box>

        {resetType && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <TextField
              label="Old Password"
              type="password"
              value={oldPassInput}
              onChange={(e) => setOldPassInput(e.target.value)}
              fullWidth
            />
            <TextField
              label="New Password"
              type="password"
              value={newPassInput}
              onChange={(e) => setNewPassInput(e.target.value)}
              fullWidth
            />
            {resetError && <Alert severity="error">{resetError}</Alert>}
            <Button variant="contained" onClick={handleResetPassword}>
              Update Password
            </Button>
            <Button onClick={cancelPasswordReset}>Cancel</Button>
            {resetMsg && <Alert severity="success">{resetMsg}</Alert>}
          </Box>
        )}
      </Card>

      {/* Backup/Sync Section */}
      {typeof window !== 'undefined' && 'showDirectoryPicker' in window && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" color="primary" onClick={backupData}>
            Backup to Local
          </Button>
          <Button variant="contained" color="secondary" onClick={syncData}>
            Sync from Local
          </Button>
          {backupMsg && <Alert severity="success">{backupMsg}</Alert>}
          {syncMsg && <Alert severity="success">{syncMsg}</Alert>}
        </Box>
      )}

      {/* Google Drive Section */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Google Drive Backup
        </Typography>
        
        {checkingConnection ? (
          <Typography>Checking Google Drive connection...</Typography>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <Chip
              label={driveConnected ? "Connected to Google Drive" : "Not Connected"}
              color={driveConnected ? "success" : "error"}
              variant="outlined"
            />
            {!driveConnected && (
              <Button
                variant="contained"
                color="primary"
                onClick={connectGoogleDrive}
              >
                Connect Google Drive
              </Button>
            )}
          </Box>
        )}
        
        <Button
          variant="contained"
          color="success"
          onClick={backupToDrive}
          disabled={!driveConnected}
        >
          {driveConnected ? "Backup to Google Drive" : "Connect Drive First"}
        </Button>
      </Card>

      {/* Sync Warning */}
      {syncWarning && (
        <Alert 
          severity="warning" 
          action={
            <Box>
              <Button color="inherit" size="small" onClick={handleSyncConfirm}>
                Proceed (Restore from Backup)
              </Button>
              <Button color="inherit" size="small" onClick={handleSyncCancel}>
                Cancel
              </Button>
            </Box>
          }
        >
          {syncWarning}
        </Alert>
      )}

      {/* Promotion Date Section */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Promotion Date
        </Typography>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} sm={6}>
            <TextField
              label="Promotion Date"
              type="date"
              value={promotionDate}
              onChange={(e) => setPromotionDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <Button variant="contained" onClick={handlePromotionSaveRequest}>
              Save Promotion Date
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Fee Settings Section */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Fee Settings
        </Typography>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid item xs={12} sm={4}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select
                value={feeClass}
                label="Class"
                onChange={(e) => setFeeClass(e.target.value)}
              >
                {classOptions.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Fee Amount"
              value={feeAmount}
              onChange={(e) => setFeeAmount(e.target.value)}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button variant="contained" onClick={handleFeeSaveRequest}>
              Save Fee
            </Button>
          </Grid>
        </Grid>
      </Card>

      {/* Password Confirmation Dialog */}
      <Dialog open={passwordDialogOpen} onClose={closePasswordDialog}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <LockIcon /> Password Required
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            Enter confirmation password to proceed.
          </Typography>
          <TextField
            label="Password"
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            fullWidth
            autoFocus
            onKeyDown={(e) => { 
              if (e.key === 'Enter') handlePasswordConfirm(); 
            }}
            error={!!passwordError}
            helperText={passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closePasswordDialog}>Cancel</Button>
          <Button onClick={handlePasswordConfirm} variant="contained">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Principal Signature Upload Section */}
      <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Principal/Head Signature (Image or PDF)
        </Typography>
        
        <Button variant="contained" component="label" sx={{ mb: 2 }}>
          Upload Signature
          <input
            type="file"
            accept="image/*,application/pdf"
            hidden
            onChange={handleSignatureUpload}
          />
        </Button>
        
        {signature && (
          <Box sx={{ mt: 2 }}>
            {signature.type && signature.type.startsWith('image/') && signatureUrl ? (
              <img
                src={signatureUrl}
                alt="Signature Preview"
                style={{
                  maxWidth: 180,
                  maxHeight: 80,
                  display: 'block',
                  marginBottom: 8
                }}
              />
            ) : (
              <Typography>
                PDF Uploaded: {signature.name || signatureUrl}
              </Typography>
            )}
            <Button
              variant="outlined"
              color="error"
              onClick={handleRemoveSignature}
              sx={{ mt: 1 }}
            >
              Remove
            </Button>
          </Box>
        )}
      </Card>

      {/* Success Messages */}
      {msg && (
        <Alert severity="success" sx={{ mt: 3 }}>
          {msg}
        </Alert>
      )}

      {/* Footer */}
      <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
        <Typography variant="caption" color="text.secondary">
          © All rights reserved | ASK Ltd
        </Typography>
      </Box>
    </Box>
  );
};

export default AcademicSettings;