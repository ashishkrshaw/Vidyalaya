import React, { useState } from 'react';
import { Box, Typography, Card, TextField, Button, MenuItem, FormControl, InputLabel, Select, Alert, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
   import Grid from '@mui/material/Grid';
import { saveFeeMap, loadFeeMap, savePromotionDate, loadPromotionDate, savePrincipalSignature, loadPrincipalSignature, getDb } from './db';
import { useEffect } from 'react';
import LockIcon from '@mui/icons-material/Lock';

const classOptions = [
  'Nursery', 'KG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'
];

const AcademicSettings: React.FC = () => {
  const [promotionDate, setPromotionDate] = useState('');
  const [feeClass, setFeeClass] = useState('');
  const [feeAmount, setFeeAmount] = useState('');
  const [feeMap, setFeeMap] = useState<{ [cls: string]: string }>({});
  const [msg, setMsg] = useState('');
  const [signature, setSignature] = useState<any>(null);
  const [signatureUrl, setSignatureUrl] = useState<string>('');
  const [backupMsg, setBackupMsg] = useState('');
  const [syncMsg, setSyncMsg] = useState('');
  const [syncWarning, setSyncWarning] = useState('');
  const [syncPending, setSyncPending] = useState<any>(null);

  // Password state for reset
  const [loginPassword, setLoginPassword] = useState('825419');
  const [confirmPassword, setConfirmPassword] = useState('123456');
  const [resetType, setResetType] = useState<'login' | 'confirm' | null>(null);
  const [oldPassInput, setOldPassInput] = useState('');
  const [newPassInput, setNewPassInput] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetMsg, setResetMsg] = useState('');

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [pendingAction, setPendingAction] = useState<'promotion' | 'fee' | null>(null);

  useEffect(() => {
    loadFeeMap().then(setFeeMap);
    loadPromotionDate().then(setPromotionDate);
    loadPrincipalSignature().then(sig => {
      setSignature(sig);
      if (sig && typeof sig !== 'string' && sig.type && sig.type.startsWith('image/')) {
        setSignatureUrl(URL.createObjectURL(sig));
      } else if (typeof sig === 'string') {
        setSignatureUrl(sig);
      } else {
        setSignatureUrl('');
      }
    });
  }, []);

  const handlePromotionSave = async () => {
    await savePromotionDate(promotionDate);
    setMsg('Promotion date saved!');
    setTimeout(() => setMsg(''), 2000);
  };

  const handleFeeSave = async () => {
    if (feeClass && feeAmount) {
      const newMap = { ...feeMap, [feeClass]: feeAmount };
      setFeeMap(newMap);
      await saveFeeMap(newMap);
      setMsg(`Fee for class ${feeClass} set to ₹${feeAmount}/month!`);
      setTimeout(() => setMsg(''), 2000);
      setFeeClass('');
      setFeeAmount('');
    }
  };

  const handlePromotionSaveRequest = () => {
    setPendingAction('promotion');
    setPasswordDialogOpen(true);
  };
  const handleFeeSaveRequest = () => {
    setPendingAction('fee');
    setPasswordDialogOpen(true);
  };
  const handlePasswordConfirm = () => {
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

  // Password reset logic
  const handleResetPassword = () => {
    if (resetType === 'login') {
      if (oldPassInput !== loginPassword) {
        setResetError('Old login password incorrect.');
        return;
      }
      setLoginPassword(newPassInput);
      setResetMsg('Login password updated!');
    } else if (resetType === 'confirm') {
      if (oldPassInput !== confirmPassword) {
        setResetError('Old confirmation password incorrect.');
        return;
      }
      setConfirmPassword(newPassInput);
      setResetMsg('Confirmation password updated!');
    }
    setOldPassInput('');
    setNewPassInput('');
    setResetError('');
    setTimeout(() => setResetMsg(''), 2000);
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await savePrincipalSignature(file);
    setSignature(file);
    if (file.type.startsWith('image/')) {
      setSignatureUrl(URL.createObjectURL(file));
    } else {
      setSignatureUrl(file.name);
    }
  };

  const handleRemoveSignature = async () => {
    await savePrincipalSignature("");
    setSignature(null);
    setSignatureUrl('');
  };

  async function backupData() {
    if (!('showDirectoryPicker' in window)) {
      setBackupMsg('Backup not supported in this browser.');
      return;
    }
    try {
      const dir = await (window as any).showDirectoryPicker();
      // Export all stores
      const [admissions, history, feeMap, promotionDate, principalSignature] = await Promise.all([
        (await import('./db')).getAdmissions(),
        (await import('./db')).getHistory(),
        (await import('./db')).loadFeeMap(),
        (await import('./db')).loadPromotionDate(),
        (await import('./db')).loadPrincipalSignature(),
      ]);
      // Write files
      const files = [
        { name: 'admissions.json', data: admissions },
        { name: 'history.json', data: history },
        { name: 'feeMap.json', data: feeMap },
        { name: 'promotionDate.json', data: promotionDate },
        { name: 'principalSignature', data: principalSignature },
      ];
      await Promise.all(files.map(async f => {
        if (f.data === undefined) return;
        const handle = await dir.getFileHandle(f.name, { create: true });
        const writable = await handle.createWritable();
        if (f.name === 'principalSignature' && f.data) {
          // Save as blob
          await writable.write(f.data);
        } else {
          await writable.write(JSON.stringify(f.data));
        }
        await writable.close();
      }));
      setBackupMsg('Backup successful!');
      setTimeout(() => setBackupMsg(''), 3000);
    } catch (e) {
      setBackupMsg('Backup failed: ' + (e as any).message);
    }
  }

  async function syncData() {
    if (!('showDirectoryPicker' in window)) {
      setSyncMsg('Sync not supported in this browser.');
      return;
    }
    try {
      const dir = await (window as any).showDirectoryPicker();
      // Read files
      const admissionsFile = await (await dir.getFileHandle('admissions.json')).getFile();
      const historyFile = await (await dir.getFileHandle('history.json')).getFile();
      const admissions = JSON.parse(await admissionsFile.text());
      const history = JSON.parse(await historyFile.text());
      const feeMap = JSON.parse(await (await (await dir.getFileHandle('feeMap.json')).getFile()).text());
      const promotionDate = JSON.parse(await (await (await dir.getFileHandle('promotionDate.json')).getFile()).text());
      let principalSignature = undefined;
      try {
        principalSignature = await (await (await dir.getFileHandle('principalSignature')).getFile());
      } catch {}
      // Get latest timestamp in backup
      const backupLatest = Math.max(
        ...admissions.map((a: any) => new Date(a.updatedAt || a.timestamp || a.createdAt || a.dob || 0).getTime()),
        ...history.map((h: any) => new Date(h.timestamp || 0).getTime()),
        admissionsFile.lastModified,
        historyFile.lastModified
      );
      // Get latest timestamp in current app data
      const db = await getDb();
      const currentAdmissions = await db.getAll('admissions');
      const currentHistory = await db.getAll('history');
      const appLatest = Math.max(
        ...currentAdmissions.map((a: any) => new Date(a.updatedAt || a.timestamp || a.createdAt || a.dob || 0).getTime()),
        ...currentHistory.map((h: any) => new Date(h.timestamp || 0).getTime())
      );
      if (backupLatest <= appLatest) {
        setSyncWarning('Backup data is not newer than current app data. Sync may cause data loss. Proceed?');
        setSyncPending({ admissions, history, feeMap, promotionDate, principalSignature, db });
        return;
      }
      // Proceed with sync
      await doSync({ admissions, history, feeMap, promotionDate, principalSignature, db });
      setSyncMsg('Sync successful!');
      setTimeout(() => setSyncMsg(''), 3000);
    } catch (e) {
      setSyncMsg('Sync failed: ' + (e as any).message);
    }
  }
  async function doSync({ admissions, history, feeMap, promotionDate, principalSignature, db }: any) {
    await Promise.all([
      db.clear('admissions'),
      db.clear('history'),
      db.clear('settings'),
    ]);
    await Promise.all(admissions.map((a: any) => db.put('admissions', a)));
    await Promise.all(history.map((h: any) => db.put('history', h)));
    await db.put('settings', feeMap, 'feeMap');
    await db.put('settings', promotionDate, 'promotionDate');
    if (principalSignature) await db.put('settings', principalSignature, 'principalSignature');
  }
  function handleSyncConfirm() {
    if (!syncPending) return;
    // If user confirms, overwrite app data with backup
    doSync(syncPending).then(() => {
      setSyncMsg('Sync successful!');
      setTimeout(() => setSyncMsg(''), 3000);
    });
    setSyncWarning('');
    setSyncPending(null);
  }
  function handleSyncCancel() {
    setSyncWarning('');
    setSyncPending(null);
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 700, mx: 'auto', mt: 4 }}>
      <Typography variant="h5" gutterBottom align="center">Academic Settings</Typography>
      {/* Password Reset Section */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Password Reset</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="outlined" onClick={() => { setResetType('login'); setResetError(''); setResetMsg(''); }}>Reset Login Password</Button>
          <Button variant="outlined" onClick={() => { setResetType('confirm'); setResetError(''); setResetMsg(''); }}>Reset Confirmation Password</Button>
        </Box>
        {resetType && (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 2 }}>
            <TextField label="Old Password" type="password" value={oldPassInput} onChange={e => setOldPassInput(e.target.value)} fullWidth />
            <TextField label="New Password" type="password" value={newPassInput} onChange={e => setNewPassInput(e.target.value)} fullWidth />
            {resetError && <Alert severity="error">{resetError}</Alert>}
            <Button variant="contained" onClick={handleResetPassword}>Update Password</Button>
            <Button onClick={() => { setResetType(null); setOldPassInput(''); setNewPassInput(''); setResetError(''); }}>Cancel</Button>
            {resetMsg && <Alert severity="success">{resetMsg}</Alert>}
          </Box>
        )}
      </Card>
      {typeof window !== 'undefined' && 'showDirectoryPicker' in window && (
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button variant="contained" color="primary" onClick={backupData}>Backup Data</Button>
          <Button variant="contained" color="secondary" onClick={syncData}>Sync Data</Button>
          {backupMsg && <Alert severity="success">{backupMsg}</Alert>}
          {syncMsg && <Alert severity="success">{syncMsg}</Alert>}
        </Box>
      )}
      {syncWarning && (
        <Alert severity="warning" action={
          <Box>
            <Button color="inherit" size="small" onClick={handleSyncConfirm}>Proceed (Restore from Backup)</Button>
            <Button color="inherit" size="small" onClick={handleSyncCancel}>Cancel</Button>
          </Box>
        }>{syncWarning}</Alert>
      )}
      {/* Promotion Date and Fee Settings with password confirmation */}
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Promotion Date</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField label="Promotion Date" type="date" value={promotionDate} onChange={e => setPromotionDate(e.target.value)} fullWidth InputLabelProps={{ shrink: true }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <Button variant="contained" onClick={handlePromotionSaveRequest}>Save Promotion Date</Button>
          </Grid>
        </Grid>
      </Card>
      <Card sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Fee Settings</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormControl fullWidth>
              <InputLabel>Class</InputLabel>
              <Select value={feeClass} label="Class" onChange={e => setFeeClass(e.target.value)}>
                {classOptions.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
              </Select>
            </FormControl>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <TextField label="Fee Amount" value={feeAmount} onChange={e => setFeeAmount(e.target.value)} fullWidth />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Button variant="contained" onClick={handleFeeSaveRequest}>Save Fee</Button>
          </Grid>
        </Grid>
      </Card>
      {/* Password Confirmation Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); setPendingAction(null); }}>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}><LockIcon /> Password Required</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>Enter confirmation password to proceed.</Typography>
          <TextField
            label="Password"
            type="password"
            value={passwordInput}
            onChange={e => setPasswordInput(e.target.value)}
            fullWidth
            autoFocus
            onKeyDown={e => { if (e.key === 'Enter') handlePasswordConfirm(); }}
            error={!!passwordError}
            helperText={passwordError}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setPasswordDialogOpen(false); setPasswordInput(''); setPasswordError(''); setPendingAction(null); }}>Cancel</Button>
          <Button onClick={handlePasswordConfirm} variant="contained">Confirm</Button>
        </DialogActions>
      </Dialog>
      {/* Principal Signature Upload Section */}
      <Box sx={{ width: '100%' }}>
        <Card sx={{ p: 3, borderRadius: 3, boxShadow: 4, mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Principal/Head Signature (Image or PDF)</Typography>
          <Button variant="contained" component="label" sx={{ mb: 2 }}>
            Upload Signature
            <input type="file" accept="image/*,application/pdf" hidden onChange={handleSignatureUpload} />
          </Button>
          {signature && (
            <Box sx={{ mt: 2 }}>
              {signature.type && signature.type.startsWith('image/') && signatureUrl ? (
                <img src={signatureUrl} alt="Signature Preview" style={{ maxWidth: 180, maxHeight: 80, display: 'block', marginBottom: 8 }} />
              ) : (
                <Typography>PDF Uploaded: {signature.name || signatureUrl}</Typography>
              )}
              <Button variant="outlined" color="error" onClick={handleRemoveSignature} sx={{ mt: 1 }}>Remove</Button>
            </Box>
          )}
        </Card>
      </Box>
      {msg && (
        <Alert severity="success" sx={{ mt: 3 }}>{msg}</Alert>
      )}
      <Box sx={{ width: '100%', textAlign: 'center', mt: 4 }}>
        <Typography variant="caption" color="text.secondary">© All rights reserved | ASK Ltd</Typography>
      </Box>
    </Box>
  );
};

export default AcademicSettings;
