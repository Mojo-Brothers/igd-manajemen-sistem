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
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { AmbulanceExpedition } from '../types/ambulance';
import {
  AMBULANCE_COLLECTION,
  DRIVERS_COLLECTION,
  DEFAULT_DRIVERS,
  FLEETS_COLLECTION,
  DEFAULT_AMBULANCE_FLEETS,
  SETTINGS_COLLECTION,
  AMBULANCE_CONFIG_DOC,
  DEFAULT_AMBULANCE_PIN,
} from '../utils/ambulanceConstants';
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
  // Scan collection directly without Firestore index dependency, sort in-memory
  const q = query(colRef);

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
          ambulance: data.ambulance || 'EVALIA',
          driver: data.driver || '',
          startTime: data.startTime || '00:00',
          endTime: data.endTime || '00:00',
          durationMinutes: data.durationMinutes || 0,
          durationFormatted: data.durationFormatted || '-',
          distanceKm: Number(data.distanceKm) || 0,
          destination: data.destination || '',
          destinationLat: data.destinationLat !== undefined ? Number(data.destinationLat) : undefined,
          destinationLng: data.destinationLng !== undefined ? Number(data.destinationLng) : undefined,
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
          createdBy: data.createdBy || '',
          createdByName: data.createdByName || '',
          updatedBy: data.updatedBy || '',
        } as AmbulanceExpedition;
      });

      // Urutkan berdasarkan tanggal terbaru dan jam mulai terbaru secara in-memory
      items.sort((a, b) => {
        if (b.date !== a.date) return b.date.localeCompare(a.date);
        return (b.startTime || '').localeCompare(a.startTime || '');
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
  const snapshot = await getDocs(colRef);

  const items = snapshot.docs.map((docSnap) => {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
    } as AmbulanceExpedition;
  });

  items.sort((a, b) => {
    if (b.date !== a.date) return (b.date || '').localeCompare(a.date || '');
    return (b.startTime || '').localeCompare(a.startTime || '');
  });

  return items;
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
  const prefix = `AMB-${dateStr.replace(/-/g, '')}-`;
  try {
    const colRef = collection(db, AMBULANCE_COLLECTION);
    // Query hanya dokumen pada tanggal tersebut agar cepat dan hemat kuota
    const q = query(colRef, where('date', '==', dateStr));
    const snapshot = await getDocs(q);

    let maxSeq = 0;
    snapshot.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const expNum = data.expeditionNumber as string;
      if (expNum && expNum.startsWith(prefix)) {
        const seqStr = expNum.replace(prefix, '');
        const seq = parseInt(seqStr, 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    });

    return generateExpeditionNumber(dateStr, maxSeq + 1);
  } catch (err) {
    console.warn('Fallback generating expedition number due to network/browser restriction:', err);
    // Fallback: pastikan tidak pernah crash jika query jaringan terganggu di mobile
    const seq = Math.floor((Date.now() / 1000) % 900) + 100;
    return `${prefix}${seq}`;
  }
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
  
  const rawPayload = {
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

  // Bersihkan field undefined agar tidak pernah ditolak Firestore di browser apa pun
  const payload: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

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

  const rawPayload: Record<string, any> = {
    ...data,
    updatedAt: serverTimestamp(),
    updatedBy: userMetadata?.nameOrEmail || userMetadata?.uid || 'Admin',
  };

  if (durationMinutes !== undefined) rawPayload.durationMinutes = durationMinutes;
  if (durationFormatted !== undefined) rawPayload.durationFormatted = durationFormatted;
  if (data.distanceKm !== undefined) rawPayload.distanceKm = Number(data.distanceKm) || 0;

  // Hapus field id jika ada dalam payload
  delete rawPayload.id;

  // Bersihkan field undefined
  const payload: Record<string, any> = {};
  for (const [key, value] of Object.entries(rawPayload)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  await updateDoc(docRef, payload);
};

/**
 * Menghapus data kegiatan ekspedisi
 */
export const deleteAmbulanceExpedition = async (id: string): Promise<void> => {
  const docRef = doc(db, AMBULANCE_COLLECTION, id);
  await deleteDoc(docRef);
};

/**
 * Real-time listener untuk daftar driver ambulance.
 * Menggabungkan driver default (Acun, Aldy, Azis, Johari, Edy) dengan driver baru dari Firestore.
 */
export const subscribeAmbulanceDrivers = (
  callback: (drivers: string[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const colRef = collection(db, DRIVERS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const customDrivers = snapshot.docs
        .map((docSnap) => docSnap.data().name as string)
        .filter(Boolean);

      const combined = Array.from(new Set([...DEFAULT_DRIVERS, ...customDrivers]));
      combined.sort((a, b) => a.localeCompare(b, 'id'));
      callback(combined);
    },
    (err) => {
      console.error('Error subscribing to ambulance drivers:', err);
      callback(DEFAULT_DRIVERS);
      if (onError) onError(err);
    }
  );
};

/**
 * Menambahkan driver baru ke Firestore
 */
export const addAmbulanceDriver = async (name: string): Promise<string> => {
  const trimmed = name.trim();
  if (!trimmed) throw new Error('Nama driver tidak boleh kosong');

  const docRef = doc(collection(db, DRIVERS_COLLECTION));
  await setDoc(docRef, {
    name: trimmed,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Real-time listener untuk daftar armada ambulance.
 * Menggabungkan armada default (EVALIA, BSI, PHC) dengan armada baru dari Firestore.
 */
export const subscribeAmbulanceFleets = (
  callback: (fleets: string[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const colRef = collection(db, FLEETS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    (snapshot) => {
      const customFleets = snapshot.docs
        .map((docSnap) => docSnap.data().name as string)
        .filter(Boolean);

      const combined = Array.from(new Set([...DEFAULT_AMBULANCE_FLEETS, ...customFleets]));
      combined.sort((a, b) => a.localeCompare(b, 'id'));
      callback(combined);
    },
    (err) => {
      console.error('Error subscribing to ambulance fleets:', err);
      callback(DEFAULT_AMBULANCE_FLEETS);
      if (onError) onError(err);
    }
  );
};

/**
 * Menambahkan armada ambulance baru ke Firestore
 */
export const addAmbulanceFleet = async (name: string): Promise<string> => {
  const trimmed = name.trim().toUpperCase();
  if (!trimmed) throw new Error('Nama armada ambulance tidak boleh kosong');

  const docRef = doc(collection(db, FLEETS_COLLECTION));
  await setDoc(docRef, {
    name: trimmed,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Mengambil PIN Otorisasi 6 Angka untuk Akses Front Ekspedisi Ambulance
 * Default fallback: '123456'
 */
export const getAmbulancePin = async (): Promise<string> => {
  try {
    const configRef = doc(db, SETTINGS_COLLECTION, AMBULANCE_CONFIG_DOC);
    const snap = await getDoc(configRef);
    if (snap.exists() && snap.data()?.ambulancePin) {
      return String(snap.data().ambulancePin).trim();
    }
  } catch (error) {
    console.warn('Menggunakan PIN default untuk akses ambulance:', error);
  }
  return DEFAULT_AMBULANCE_PIN;
};

/**
 * Mengubah PIN Otorisasi 6 Angka untuk Akses Front Ekspedisi Ambulance
 */
export const setAmbulancePin = async (
  newPin: string,
  updatedBy: string = 'Administrator'
): Promise<void> => {
  const sanitizedPin = newPin.trim();
  if (!/^\d{6}$/.test(sanitizedPin)) {
    throw new Error('PIN harus terdiri dari tepat 6 digit angka numerik (0-9)');
  }
  const configRef = doc(db, SETTINGS_COLLECTION, AMBULANCE_CONFIG_DOC);
  await setDoc(
    configRef,
    {
      ambulancePin: sanitizedPin,
      updatedAt: serverTimestamp(),
      updatedBy,
    },
    { merge: true }
  );
};

/**
 * Verifikasi apakah PIN yang dimasukkan cocok dengan PIN Ambulance yang tersimpan
 */
export const verifyAmbulancePin = async (inputPin: string): Promise<boolean> => {
  const currentPin = await getAmbulancePin();
  return inputPin.trim() === currentPin.trim();
};


