import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AmbulanceExpedition } from '../types/ambulance';
import { AMBULANCE_COLLECTION } from '../utils/ambulanceConstants';
import { generateExpeditionNumber, calculateDuration } from '../utils/ambulanceUtils';

/**
 * Real-time listener untuk seluruh data kegiatan ekspedisi ambulance IGD.
 * Diurutkan berdasarkan tanggal terbaru dan waktu mulai terbaru.
 */
export const subscribeAmbulanceExpeditions = (
  callback: (expeditions: AmbulanceExpedition[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const colRef = collection(db, AMBULANCE_COLLECTION);
  // Default query diurutkan dari data terbaru
  const q = query(colRef, orderBy('date', 'desc'), orderBy('startTime', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: AmbulanceExpedition[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          expeditionNumber: data.expeditionNumber || '-',
          date: data.date,
          activityType: data.activityType,
          patientName: data.patientName || '',
          medicalRecordNumber: data.medicalRecordNumber || '',
          initialStatus: data.initialStatus || '',
          finalStatus: data.finalStatus || '',
          ambulance: data.ambulance || 'HIACE',
          driver: data.driver || '',
          startTime: data.startTime || '00:00',
          endTime: data.endTime || '00:00',
          durationMinutes: data.durationMinutes || 0,
          durationFormatted: data.durationFormatted || '-',
          distanceKm: Number(data.distanceKm) || 0,
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || '',
          updatedBy: data.updatedBy || '',
        } as AmbulanceExpedition;
      });
      callback(items);
    },
    (err) => {
      console.error('Error subscribing to ambulance expeditions:', err);
      if (onError) onError(err);
    }
  );
};

/**
 * Mengambil semua ekspedisi sekali (one-time fetch)
 */
export const getAmbulanceExpeditions = async (): Promise<AmbulanceExpedition[]> => {
  const colRef = collection(db, AMBULANCE_COLLECTION);
  const q = query(colRef, orderBy('date', 'desc'), orderBy('startTime', 'desc'));
  const snapshot = await getDocs(q);

  return snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
    } as AmbulanceExpedition;
  });
};

/**
 * Mengambil satu ekspedisi berdasarkan ID
 */
export const getAmbulanceExpeditionById = async (id: string): Promise<AmbulanceExpedition | null> => {
  const docRef = doc(db, AMBULANCE_COLLECTION, id);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as AmbulanceExpedition;
};

/**
 * Menghasilkan nomor ekspedisi unik berikutnya untuk tanggal tertentu
 * Format: AMB-YYYYMMDD-XXX (contoh: AMB-20260912-001)
 */
export const getNextExpeditionNumber = async (dateStr: string): Promise<string> => {
  const colRef = collection(db, AMBULANCE_COLLECTION);
  const q = query(colRef, where('date', '==', dateStr));
  const snapshot = await getDocs(q);

  let maxSeq = 0;
  const prefix = `AMB-${dateStr.replace(/-/g, '')}-`;

  snapshot.docs.forEach((docSnap) => {
    const expNum = docSnap.data().expeditionNumber as string;
    if (expNum && expNum.startsWith(prefix)) {
      const seqStr = expNum.replace(prefix, '');
      const seq = parseInt(seqStr, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  });

  return generateExpeditionNumber(dateStr, maxSeq + 1);
};

/**
 * Menyimpan kegiatan ekspedisi baru ke Firestore
 */
export const createAmbulanceExpedition = async (
  data: Omit<AmbulanceExpedition, 'id' | 'expeditionNumber' | 'createdAt' | 'updatedAt'>,
  userMetadata?: { uid?: string; nameOrEmail?: string }
): Promise<string> => {
  const expeditionNumber = await getNextExpeditionNumber(data.date);

  // Pastikan durasi dihitung secara konsisten
  const durationResult = calculateDuration(data.startTime, data.endTime, data.date);

  const docRef = doc(collection(db, AMBULANCE_COLLECTION));
  
  const payload = {
    ...data,
    expeditionNumber,
    durationMinutes: durationResult.minutes,
    durationFormatted: durationResult.formatted,
    distanceKm: Number(data.distanceKm) || 0,
    createdBy: userMetadata?.uid || '',
    createdByName: userMetadata?.nameOrEmail || 'Admin',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(docRef, payload);
  return docRef.id;
};

/**
 * Mengupdate data ekspedisi yang ada
 */
export const updateAmbulanceExpedition = async (
  id: string,
  data: Partial<AmbulanceExpedition>,
  userMetadata?: { uid?: string; nameOrEmail?: string }
): Promise<void> => {
  const docRef = doc(db, AMBULANCE_COLLECTION, id);

  // Jika waktu diperbarui, hitung ulang durasi
  let durationMinutes = data.durationMinutes;
  let durationFormatted = data.durationFormatted;

  if (data.startTime && data.endTime) {
    const duration = calculateDuration(data.startTime, data.endTime, data.date);
    durationMinutes = duration.minutes;
    durationFormatted = duration.formatted;
  }

  const payload: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userMetadata?.nameOrEmail || userMetadata?.uid || 'Admin',
  };

  if (durationMinutes !== undefined) payload.durationMinutes = durationMinutes;
  if (durationFormatted !== undefined) payload.durationFormatted = durationFormatted;
  if (data.distanceKm !== undefined) payload.distanceKm = Number(data.distanceKm) || 0;

  // Hapus field id jika ada dalam payload
  delete payload.id;

  await updateDoc(docRef, payload);
};

/**
 * Menghapus data kegiatan ekspedisi
 */
export const deleteAmbulanceExpedition = async (id: string): Promise<void> => {
  const docRef = doc(db, AMBULANCE_COLLECTION, id);
  await deleteDoc(docRef);
};
