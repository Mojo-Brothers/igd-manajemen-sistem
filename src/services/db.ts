import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy,
  addDoc,
  where
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Doctor, AppSettings, OnCallSchedule, Specialist, MonthlyScheduleItem } from '../types';
import { writeBatch } from 'firebase/firestore';

// DOCTORS
export const getDoctors = async (): Promise<Doctor[]> => {
  const q = query(collection(db, 'doctors'), orderBy('order', 'asc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Doctor));
};

export const addDoctor = async (doctor: Omit<Doctor, 'id'>): Promise<string> => {
  const docRef = doc(collection(db, 'doctors'));
  await setDoc(docRef, doctor);
  return docRef.id;
};

export const updateDoctor = async (id: string, data: Partial<Doctor>): Promise<void> => {
  const docRef = doc(db, 'doctors', id);
  await updateDoc(docRef, data);
};

export const deleteDoctor = async (id: string): Promise<void> => {
  const docRef = doc(db, 'doctors', id);
  await deleteDoc(docRef);
};

// SLOTS (Doctor Jaga 1, dll)
export const updateDoctorSlot = async (slotId: string, doctorId: string | null): Promise<void> => {
  const docRef = doc(db, 'slots', slotId);
  await setDoc(docRef, { doctorId }, { merge: true });
};

// SETTINGS
export const updateSettings = async (settings: Partial<AppSettings>): Promise<void> => {
  const docRef = doc(db, 'settings', 'global');
  await setDoc(docRef, settings, { merge: true });
};

// ON-CALL SCHEDULES
export const addOnCallSchedule = async (schedule: Omit<OnCallSchedule, 'id'>) => {
  const docRef = await addDoc(collection(db, 'onCallSchedules'), schedule);
  return docRef.id;
};

export const updateOnCallSchedule = async (id: string, data: Partial<OnCallSchedule>) => {
  const docRef = doc(db, 'onCallSchedules', id);
  await updateDoc(docRef, data);
};

export const deleteOnCallSchedule = async (id: string) => {
  const docRef = doc(db, 'onCallSchedules', id);
  await deleteDoc(docRef);
};

// ==========================================
// SPECIALISTS (Master Dokter On-Call)
// ==========================================
export const addSpecialist = async (specialist: Omit<Specialist, 'id'>) => {
  const docRef = await addDoc(collection(db, 'specialists'), specialist);
  return docRef.id;
};

export const updateSpecialist = async (id: string, data: Partial<Specialist>) => {
  const docRef = doc(db, 'specialists', id);
  await updateDoc(docRef, data);
};

export const deleteSpecialist = async (id: string) => {
  const docRef = doc(db, 'specialists', id);
  await deleteDoc(docRef);
};

// ==========================================
// MONTHLY SCHEDULES
// ==========================================
export const saveMonthlySchedules = async (schedules: MonthlyScheduleItem[]) => {
  // We use batch to write all daily schedules at once
  const batch = writeBatch(db);
  
  for (const schedule of schedules) {
    // Document ID is the date string e.g., '2026-08-01'
    const docRef = doc(db, 'monthlySchedules', schedule.date);
    batch.set(docRef, schedule);
  }
  
  await batch.commit();
};

export const getMonthlySchedulesByMonth = async (year: number, month: number): Promise<MonthlyScheduleItem[]> => {
  const monthStr = String(month).padStart(2, '0');
  const startDate = `${year}-${monthStr}-01`;
  const endDate = `${year}-${monthStr}-31`;

  const q = query(
    collection(db, 'monthlySchedules'),
    where('date', '>=', startDate),
    where('date', '<=', endDate)
  );

  const snapshot = await getDocs(q);
  const items = snapshot.docs.map(doc => doc.data() as MonthlyScheduleItem);
  items.sort((a, b) => a.date.localeCompare(b.date)); // Ensure sorted by date
  return items;
};
