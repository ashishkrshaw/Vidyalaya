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
