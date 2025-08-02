import { openDB } from 'idb';

const DB_NAME = 'student-mgmt-db';
const STORE_NAME = 'admissions';
const HISTORY_STORE = 'history';
const SETTINGS_STORE = 'settings';

export async function getDb() {
  return openDB(DB_NAME, 3, {
    upgrade(db, oldVersion) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'studentId' });
        store.createIndex('class_section', ['class', 'section']);
      }
      if (oldVersion < 2 && !db.objectStoreNames.contains(HISTORY_STORE)) {
        db.createObjectStore(HISTORY_STORE, { keyPath: 'id', autoIncrement: true });
      }
      if (oldVersion < 3 && !db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
    },
  });
}

export async function addAdmission(admission: any) {
  const db = await getDb();
  // Initialize feeHistory and dues if not present
  const newAdmission = {
    ...admission,
    feeHistory: admission.feeHistory || [],
    dues: admission.dues || 0,
  };
  await db.put(STORE_NAME, newAdmission);
}

export async function updateAdmission(admission: any, before?: any) {
  const db = await getDb();
  await db.put(STORE_NAME, admission);
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
  await db.delete(STORE_NAME, studentId);
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
  return db.getAll(STORE_NAME);
}

export async function getAdmissionsByClassSection(cls: string, section: string) {
  const db = await getDb();
  return db.getAllFromIndex(STORE_NAME, 'class_section', [cls, section]);
}

export async function getNextStudentSeq() {
  const db = await getDb();
  const all = await db.getAll(STORE_NAME);
  if (!all.length) return 1;
  // Find max seq from studentId last 4 digits
  const maxSeq = all.reduce((max, s) => {
    const parts = s.studentId.split(',');
    const seq = parseInt(parts[2], 10);
    return seq > max ? seq : max;
  }, 0);
  return maxSeq + 1;
}

export async function addHistoryEntry(entry: any) {
  const db = await getDb();
  await db.add(HISTORY_STORE, entry);
}

export async function getHistory() {
  const db = await getDb();
  return db.getAll(HISTORY_STORE);
}

export async function saveFeeMap(feeMap: any) {
  const db = await getDb();
  await db.put(SETTINGS_STORE, feeMap, 'feeMap');
}

export async function loadFeeMap() {
  const db = await getDb();
  return (await db.get(SETTINGS_STORE, 'feeMap')) || {};
}

export async function savePromotionDate(date: string) {
  const db = await getDb();
  await db.put(SETTINGS_STORE, date, 'promotionDate');
}

export async function loadPromotionDate() {
  const db = await getDb();
  return (await db.get(SETTINGS_STORE, 'promotionDate')) || '';
}

export async function addFeePayment(studentId: string, payment: any) {
  const db = await getDb();
  const student = await db.get(STORE_NAME, studentId);
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
  const student = await db.get(STORE_NAME, studentId);
  if (!student) return;
  const updated = { ...student, dues };
  await db.put(STORE_NAME, updated);
}

export async function savePrincipalSignature(file: Blob | string) {
  const db = await getDb();
  await db.put(SETTINGS_STORE, file, 'principalSignature');
}

export async function loadPrincipalSignature() {
  const db = await getDb();
  return await db.get(SETTINGS_STORE, 'principalSignature');
} 