import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { Doctor, AppSettings } from '../types';

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
