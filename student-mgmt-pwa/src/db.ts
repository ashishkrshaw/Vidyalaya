import { openDB } from 'idb';

const DB_NAME = 'student-mgmt-db';
const DB_VERSION = 5; // Incremented version to trigger schema upgrade

const STORE_NAME = 'admissions';
const HISTORY_STORE = 'history';
const SETTINGS_STORE = 'settings';

export async function getDb() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion) {
      if (oldVersion < 5) {
        // Create stores if they don't exist to avoid data loss
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const admissionsStore = db.createObjectStore(STORE_NAME, { keyPath: ['schoolId', 'studentId'] });
          admissionsStore.createIndex('by-school', 'schoolId', { unique: false });
          admissionsStore.createIndex('by-class-section', ['schoolId', 'class', 'section'], { unique: false });
        }

        if (!db.objectStoreNames.contains(HISTORY_STORE)) {
          const historyStore = db.createObjectStore(HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
          historyStore.createIndex('by-school', 'schoolId', { unique: false });
        }

        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          const settingsStore = db.createObjectStore(SETTINGS_STORE, { keyPath: ['schoolId', 'key'] });
          settingsStore.createIndex('by-school', 'schoolId', { unique: false });
        }
      }
    },
  });
}

const getSchoolId = () => {
  const schoolId = localStorage.getItem('schoolId');
  if (!schoolId) throw new Error('School ID not found. Please log in again.');
  return schoolId;
};

export async function addAdmission(admission: any) {
  const db = await getDb();
  const schoolId = getSchoolId();
  const newAdmission = {
    ...admission,
    schoolId,
    feeHistory: admission.feeHistory || [],
    dues: admission.dues || 0,
  };
  await db.put(STORE_NAME, newAdmission);
}

// Bulk restore admissions from backup - handles conflicts by merging/overwriting
export async function bulkRestoreAdmissions(admissions: any[]): Promise<{ added: number; updated: number }> {
  const db = await getDb();
  const schoolId = getSchoolId();
  let added = 0;
  let updated = 0;
  
  for (const admission of admissions) {
    const admissionWithSchoolId = {
      ...admission,
      schoolId,
      feeHistory: admission.feeHistory || [],
      dues: admission.dues || 0,
    };
    
    // Check if exists
    const existing = await db.get(STORE_NAME, [schoolId, admission.studentId]);
    if (existing) {
      // Merge: keep newer feeHistory, update other fields
      const mergedFeeHistory = [...(existing.feeHistory || [])];
      const existingDates = new Set(mergedFeeHistory.map((f: any) => f.date));
      
      // Add new fee payments not in existing
      for (const fee of (admission.feeHistory || [])) {
        if (!existingDates.has(fee.date)) {
          mergedFeeHistory.push(fee);
        }
      }
      
      admissionWithSchoolId.feeHistory = mergedFeeHistory;
      updated++;
    } else {
      added++;
    }
    
    await db.put(STORE_NAME, admissionWithSchoolId);
  }
  
  return { added, updated };
}

// Bulk restore history from backup - adds only new entries
export async function bulkRestoreHistory(historyEntries: any[]): Promise<number> {
  const db = await getDb();
  const schoolId = getSchoolId();
  let added = 0;
  
  // Get existing history to avoid duplicates
  const existing = await db.getAllFromIndex(HISTORY_STORE, 'by-school', schoolId);
  const existingTimestamps = new Set(existing.map((h: any) => h.timestamp));
  
  for (const entry of historyEntries) {
    // Only add if timestamp doesn't exist (avoid duplicates)
    if (!existingTimestamps.has(entry.timestamp)) {
      await db.add(HISTORY_STORE, { ...entry, schoolId });
      added++;
    }
  }
  
  return added;
}

export async function updateAdmission(admission: any, before?: any) {
  const db = await getDb();
  const schoolId = getSchoolId();
  const admissionWithSchoolId = { ...admission, schoolId };
  await db.put(STORE_NAME, admissionWithSchoolId);
  if (before) {
    await addHistoryEntry({
      action: 'update',
      studentId: admission.studentId,
      timestamp: new Date().toISOString(),
      before,
      after: admission,
    });
  }
}

export async function deleteAdmission(studentId: string, before?: any) {
  const db = await getDb();
  const schoolId = getSchoolId();
  await db.delete(STORE_NAME, [schoolId, studentId]);
  if (before) {
    await addHistoryEntry({
      action: 'delete',
      studentId,
      timestamp: new Date().toISOString(),
      before,
      after: null,
    });
  }
}

export async function getAdmissions() {
  const db = await getDb();
  const schoolId = getSchoolId();
  return db.getAllFromIndex(STORE_NAME, 'by-school', schoolId);
}

export async function getAdmissionsByClassSection(cls: string, section: string) {
  const db = await getDb();
  const schoolId = getSchoolId();
  return db.getAllFromIndex(STORE_NAME, 'by-class-section', [schoolId, cls, section]);
}

export async function getNextStudentSeq() {
  const db = await getDb();
  const schoolId = getSchoolId();
  const all = await db.getAllFromIndex(STORE_NAME, 'by-school', schoolId);
  if (!all.length) return 1;
  const maxSeq = all.reduce((max, s) => {
    const parts = s.studentId.split('-');
    if (parts.length > 2) {
        const seq = parseInt(parts[2], 10);
        if (!isNaN(seq) && seq > max) {
            return seq;
        }
    }
    return max;
  }, 0);
  return maxSeq + 1;
}

export async function getNextRollNoForClass(className: string, section: string) {
  const db = await getDb();
  const schoolId = getSchoolId();
  const classStudents = await db.getAllFromIndex(STORE_NAME, 'by-class-section', [schoolId, className, section]);
  
  if (!classStudents.length) return 1;
  
  // Find all used roll numbers for this class-section
  const usedRollNos = classStudents
    .map(student => parseInt(student.rollNo, 10))
    .filter(rollNo => !isNaN(rollNo))
    .sort((a, b) => a - b);
  
  // Find the first available roll number from 1 to 50
  for (let i = 1; i <= 50; i++) {
    if (!usedRollNos.includes(i)) {
      return i;
    }
  }
  
  // If all numbers 1-50 are used, return the next sequential number
  return Math.max(...usedRollNos) + 1;
}

export async function getAvailableRollNumbers(className: string, section: string) {
  const db = await getDb();
  const schoolId = getSchoolId();
  const classStudents = await db.getAllFromIndex(STORE_NAME, 'by-class-section', [schoolId, className, section]);
  
  const usedRollNos = classStudents
    .map(student => parseInt(student.rollNo, 10))
    .filter(rollNo => !isNaN(rollNo));
  
  const availableNumbers = [];
  for (let i = 1; i <= 50; i++) {
    if (!usedRollNos.includes(i)) {
      availableNumbers.push(i);
    }
  }
  
  return availableNumbers;
}

export async function addHistoryEntry(entry: any) {
  const db = await getDb();
  const schoolId = getSchoolId();
  await db.add(HISTORY_STORE, { ...entry, schoolId });
}

export async function getHistory() {
  const db = await getDb();
  const schoolId = getSchoolId();
  return db.getAllFromIndex(HISTORY_STORE, 'by-school', schoolId);
}

export async function saveSetting(key: string, value: any) {
    const db = await getDb();
    const schoolId = getSchoolId();
    await db.put(SETTINGS_STORE, { schoolId, key, value });
}

export async function loadSetting(key: string) {
    const db = await getDb();
    const schoolId = getSchoolId();
    const result = await db.get(SETTINGS_STORE, [schoolId, key]);
    return result ? result.value : undefined;
}

export async function saveFeeMap(feeMap: any) {
  await saveSetting('feeMap', feeMap);
}

export async function loadFeeMap() {
  return (await loadSetting('feeMap')) || {};
}

export async function savePromotionDate(date: string) {
  await saveSetting('promotionDate', date);
}

export async function loadPromotionDate() {
  return (await loadSetting('promotionDate')) || '';
}

export async function addFeePayment(studentId: string, payment: any) {
  const db = await getDb();
  const schoolId = getSchoolId();
  const student = await db.get(STORE_NAME, [schoolId, studentId]);
  if (!student) return;
  const updated = {
    ...student,
    feeHistory: [...(student.feeHistory || []), payment],
    dues: typeof payment.dues === 'number' ? payment.dues : (student.dues || 0),
  };
  await db.put(STORE_NAME, updated);
}

export async function updateStudentDues(studentId: string, dues: number) {
  const db = await getDb();
  const schoolId = getSchoolId();
  const student = await db.get(STORE_NAME, [schoolId, studentId]);
  if (!student) return;
  const updated = { ...student, dues };
  await db.put(STORE_NAME, updated);
}

export async function savePrincipalSignature(file: Blob | string) {
  await saveSetting('principalSignature', file);
}

export async function loadPrincipalSignature() {
  return await loadSetting('principalSignature');
}

// School Logo
export async function saveSchoolLogo(file: Blob | string) {
  await saveSetting('schoolLogo', file);
}

export async function loadSchoolLogo() {
  return await loadSetting('schoolLogo');
}

// School Info (stored in DB, fallback to env)
export interface SchoolInfo {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
}

export async function saveSchoolInfo(info: SchoolInfo) {
  await saveSetting('schoolInfo', info);
}

export async function loadSchoolInfo(): Promise<SchoolInfo> {
  const stored = await loadSetting('schoolInfo');
  if (stored) return stored;
  
  // Fallback to environment variables or defaults
  return {
    name: import.meta.env?.VITE_SCHOOL_NAME || 'DAV Public School',
    address: import.meta.env?.VITE_SCHOOL_ADDRESS || '123 Main Road, Knowledge Park, City - 110001',
    phone: import.meta.env?.VITE_SCHOOL_PHONE || '+91-9876543210',
    email: import.meta.env?.VITE_SCHOOL_EMAIL || 'info@school.edu',
    website: import.meta.env?.VITE_SCHOOL_WEBSITE || 'www.school.edu'
  };
}
