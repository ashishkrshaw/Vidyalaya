import {
  uploadToDrive,
  listBackupFiles,
  downloadFromDrive,
  initGapiClient,
  initGisClient,
  tryRestoreSession,
  isSignedIn
} from './googleDrive';
import {
  getAdmissions,
  getHistory,
  loadFeeMap,
  loadPromotionDate,
  bulkRestoreAdmissions,
  bulkRestoreHistory,
  saveFeeMap as saveFeeMapToDb,
  savePromotionDate,
  loadSchoolInfo,
  saveSchoolInfo,
  loadSchoolLogo,
  saveSchoolLogo,
  loadPrincipalSignature,
  savePrincipalSignature,
  loadPaytmConfig,
  savePaytmConfig,
  loadNotificationSettings,
  saveNotificationSettings,
  loadMSG91Config,
  saveMSG91Config
} from './db';

// Sync Manager - Coordinates Backup and Restore

export const initDriveSystem = async () => {
  try {
    await initGapiClient();
    await initGisClient();
    const restored = tryRestoreSession();
    console.log('Drive Session Restored:', restored);
    return restored;
  } catch (e) {
    console.error('Drive Init Failed:', e);
    return false;
  }
};

export const performAutoBackup = async () => {
  if (!isSignedIn()) return { success: false, message: 'Not connected to Drive' };

  try {
    // Core Data
    const admissions = await getAdmissions();
    const history = await getHistory();
    const feeMap = await loadFeeMap();
    const promotionDate = await loadPromotionDate();
    const schoolInfo = await loadSchoolInfo();
    
    // Branding Assets
    const schoolLogo = await loadSchoolLogo();
    const principalSignature = await loadPrincipalSignature();
    
    // Configuration Data
    const paytmConfig = await loadPaytmConfig();
    const notificationSettings = await loadNotificationSettings();
    const msg91Config = await loadMSG91Config();

    const data = {
      // Core
      admissions,
      history,
      feeMap,
      promotionDate,
      schoolInfo,
      // Branding
      schoolLogo,
      principalSignature,
      // Config
      paytmConfig,
      notificationSettings,
      msg91Config,
      // Metadata
      exportDate: new Date().toISOString(),
      version: '2.0', // Updated version for new format
      type: 'auto-backup'
    };

    const fileName = `school_auto_backup_${new Date().toISOString().split('T')[0]}.json`;
    await uploadToDrive(data, fileName);
    console.log('Backup complete: All data types included');
    return { success: true, message: 'Backup successful' };
  } catch (error: any) {
    console.error('Auto Backup Error:', error);
    return { success: false, message: error.message };
  }
};

export const performAutoSync = async () => {
  if (!isSignedIn()) return { success: false, message: 'Not connected to Drive' };

  try {
    const files = await listBackupFiles();
    if (files.length === 0) return { success: true, message: 'No backups found' };

    // Get latest file
    const latestFile = files[0];
    const data = await downloadFromDrive(latestFile.id);

    if (!data.admissions) throw new Error('Invalid backup format');

    // Restore Core Data
    await bulkRestoreAdmissions(data.admissions);
    if (data.history) await bulkRestoreHistory(data.history);
    if (data.feeMap) await saveFeeMapToDb(data.feeMap);
    if (data.promotionDate) await savePromotionDate(data.promotionDate);
    if (data.schoolInfo) await saveSchoolInfo(data.schoolInfo);
    
    // Restore Branding Assets
    if (data.schoolLogo) await saveSchoolLogo(data.schoolLogo);
    if (data.principalSignature) await savePrincipalSignature(data.principalSignature);
    
    // Restore Configuration Data
    if (data.paytmConfig) await savePaytmConfig(data.paytmConfig);
    if (data.notificationSettings) await saveNotificationSettings(data.notificationSettings);
    if (data.msg91Config) await saveMSG91Config(data.msg91Config);

    console.log('Sync complete: All data types restored');
    return { 
      success: true, 
      message: `Synced from ${latestFile.name}`,
      details: data.schoolInfo
    };
  } catch (error: any) {
    console.error('Auto Sync Error:', error);
    return { success: false, message: error.message };
  }
};
