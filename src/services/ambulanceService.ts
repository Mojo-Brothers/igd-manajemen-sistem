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
import {
  AmbulanceExpedition,
  AmbulanceFleet,
  AmbulanceDriver,
  HospitalBaseLocation,
} from '../types/ambulance';
import {
  AMBULANCE_COLLECTION,
  DRIVERS_COLLECTION,
  DEFAULT_DRIVERS,
  FLEETS_COLLECTION,
  DEFAULT_AMBULANCE_FLEETS,
  SETTINGS_COLLECTION,
  AMBULANCE_CONFIG_DOC,
  DEFAULT_AMBULANCE_PIN,
  HOSPITAL_BASE_COORDS,
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

  const colRef = collection(db, DRIVERS_COLLECTION);
  const existingSnap = await getDocs(query(colRef, where('name', '==', trimmed)));
  if (!existingSnap.empty) {
    return existingSnap.docs[0].id;
  }

  const docRef = doc(colRef);
  await setDoc(docRef, {
    name: trimmed,
    createdAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Real-time listener lengkap untuk manajemen data driver ambulance (dengan ID, No. Telp, Status, & Catatan).
 * Jika Firestore belum memiliki data driver, secara otomatis melakukan seeding driver default (Acun, Aldy, Azis, Johari, Edy).
 */
export const subscribeAmbulanceDriverDetails = (
  callback: (drivers: AmbulanceDriver[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const colRef = collection(db, DRIVERS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Otomatis seeding driver default jika koleksi belum ada data
        try {
          for (const defaultName of DEFAULT_DRIVERS) {
            const docRef = doc(db, DRIVERS_COLLECTION, `default_${defaultName.toLowerCase()}`);
            await setDoc(docRef, {
              name: defaultName,
              phone: '',
              status: 'Aktif',
              notes: 'Driver Standby IGD',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (e) {
          console.warn('Seeding default drivers skipped:', e);
        }
        callback(
          DEFAULT_DRIVERS.map((name) => ({
            id: `default_${name.toLowerCase()}`,
            name,
            phone: '',
            status: 'Aktif',
            notes: 'Driver Standby IGD',
          }))
        );
        return;
      }

      const items: AmbulanceDriver[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          phone: data.phone || '',
          status: data.status || 'Aktif',
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });

      items.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      callback(items);
    },
    (err) => {
      console.error('Error subscribing to ambulance driver details:', err);
      callback(
        DEFAULT_DRIVERS.map((name) => ({
          id: name,
          name,
          phone: '',
          status: 'Aktif',
        }))
      );
      if (onError) onError(err);
    }
  );
};

/**
 * Menambahkan driver ambulance lengkap (nama, telp, status, catatan)
 */
export const addAmbulanceDriverDetail = async (
  driver: Omit<AmbulanceDriver, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const cleanName = driver.name.trim();
  if (!cleanName) {
    throw new Error('Nama driver tidak boleh kosong');
  }

  const colRef = collection(db, DRIVERS_COLLECTION);
  const existingSnap = await getDocs(query(colRef, where('name', '==', cleanName)));
  if (!existingSnap.empty) {
    throw new Error(`Driver "${cleanName}" sudah terdaftar`);
  }

  const docRef = doc(colRef);
  await setDoc(docRef, {
    name: cleanName,
    phone: driver.phone?.trim() || '',
    status: driver.status || 'Aktif',
    notes: driver.notes?.trim() || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Mengupdate data driver ambulance yang sudah ada di Firestore
 */
export const updateAmbulanceDriver = async (
  id: string,
  data: Partial<Omit<AmbulanceDriver, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const docRef = doc(db, DRIVERS_COLLECTION, id);
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (data.name !== undefined) {
    const trimmed = data.name.trim();
    if (!trimmed) throw new Error('Nama driver tidak boleh kosong');
    updateData.name = trimmed;
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone.trim();
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes.trim();
  }

  await updateDoc(docRef, updateData);
};

/**
 * Menghapus driver ambulance dari Firestore
 */
export const deleteAmbulanceDriver = async (id: string): Promise<void> => {
  const docRef = doc(db, DRIVERS_COLLECTION, id);
  await deleteDoc(docRef);
};

/**
 * Real-time listener untuk daftar armada ambulance (nama saja, kompatibel dengan dropdown).
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
      if (snapshot.empty) {
        callback(DEFAULT_AMBULANCE_FLEETS);
        return;
      }
      const fleets = snapshot.docs
        .map((docSnap) => docSnap.data().name as string)
        .filter(Boolean);

      const unique = Array.from(new Set(fleets));
      unique.sort((a, b) => a.localeCompare(b, 'id'));
      callback(unique);
    },
    (err) => {
      console.error('Error subscribing to ambulance fleets:', err);
      callback(DEFAULT_AMBULANCE_FLEETS);
      if (onError) onError(err);
    }
  );
};

/**
 * Real-time listener lengkap untuk manajemen armada ambulance (dengan ID, Plat Nomor, Status, & Catatan).
 * Jika Firestore belum memiliki data armada, secara otomatis melakukan seeding armada default (EVALIA, BSI, PHC).
 */
export const subscribeAmbulanceFleetDetails = (
  callback: (fleets: AmbulanceFleet[]) => void,
  onError?: (error: Error) => void
): (() => void) => {
  const colRef = collection(db, FLEETS_COLLECTION);
  const q = query(colRef);

  return onSnapshot(
    q,
    async (snapshot) => {
      if (snapshot.empty) {
        // Otomatis seeding armada default jika koleksi belum ada data
        try {
          for (const defaultName of DEFAULT_AMBULANCE_FLEETS) {
            const docRef = doc(db, FLEETS_COLLECTION, `default_${defaultName.toLowerCase()}`);
            await setDoc(docRef, {
              name: defaultName,
              plateNumber: '',
              status: 'Aktif',
              notes: 'Armada Standby IGD',
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }
        } catch (e) {
          console.warn('Seeding default fleets skipped:', e);
        }
        callback(
          DEFAULT_AMBULANCE_FLEETS.map((name) => ({
            id: name,
            name,
            status: 'Aktif',
          }))
        );
        return;
      }

      const items: AmbulanceFleet[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          name: data.name || '',
          plateNumber: data.plateNumber || '',
          status: data.status || 'Aktif',
          notes: data.notes || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt,
        };
      });

      items.sort((a, b) => a.name.localeCompare(b.name, 'id'));
      callback(items);
    },
    (err) => {
      console.error('Error subscribing to ambulance fleet details:', err);
      callback(
        DEFAULT_AMBULANCE_FLEETS.map((name) => ({
          id: name,
          name,
          status: 'Aktif',
        }))
      );
      if (onError) onError(err);
    }
  );
};

/**
 * Menambahkan armada ambulance baru ke Firestore
 */
export const addAmbulanceFleet = async (
  fleetOrName: string | Omit<AmbulanceFleet, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  const payload: Record<string, any> =
    typeof fleetOrName === 'string'
      ? {
          name: fleetOrName.trim().toUpperCase(),
          plateNumber: '',
          status: 'Aktif',
          notes: '',
        }
      : {
          name: fleetOrName.name.trim().toUpperCase(),
          plateNumber: fleetOrName.plateNumber?.trim().toUpperCase() || '',
          status: fleetOrName.status || 'Aktif',
          notes: fleetOrName.notes?.trim() || '',
        };

  if (!payload.name) {
    throw new Error('Nama armada ambulance tidak boleh kosong');
  }

  const colRef = collection(db, FLEETS_COLLECTION);
  const existingSnap = await getDocs(query(colRef, where('name', '==', payload.name)));
  if (!existingSnap.empty) {
    return existingSnap.docs[0].id;
  }

  const docRef = doc(colRef);
  await setDoc(docRef, {
    ...payload,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return docRef.id;
};

/**
 * Mengupdate data armada ambulance yang sudah ada
 */
export const updateAmbulanceFleet = async (
  id: string,
  data: Partial<Omit<AmbulanceFleet, 'id' | 'createdAt' | 'updatedAt'>>
): Promise<void> => {
  const docRef = doc(db, FLEETS_COLLECTION, id);
  const updateData: Record<string, any> = {
    updatedAt: serverTimestamp(),
  };

  if (data.name !== undefined) {
    const trimmed = data.name.trim().toUpperCase();
    if (!trimmed) throw new Error('Nama armada tidak boleh kosong');
    updateData.name = trimmed;
  }
  if (data.plateNumber !== undefined) {
    updateData.plateNumber = data.plateNumber.trim().toUpperCase();
  }
  if (data.status !== undefined) {
    updateData.status = data.status;
  }
  if (data.notes !== undefined) {
    updateData.notes = data.notes.trim();
  }

  await updateDoc(docRef, updateData);
};

/**
 * Menghapus armada ambulance dari Firestore
 */
export const deleteAmbulanceFleet = async (id: string): Promise<void> => {
  const docRef = doc(db, FLEETS_COLLECTION, id);
  await deleteDoc(docRef);
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

const BASE_LOCATION_STORAGE_KEY = 'ambulance_hospital_base_location';

/**
 * Mengambil lokasi pangkalan rumah sakit dari localStorage (sinkron & instan tanpa jeda jaringan).
 * Sangat penting agar modal peta langsung merender pangkalan yang benar sejak milidetik pertama.
 */
export const getCachedHospitalBaseLocation = (): HospitalBaseLocation => {
  try {
    const saved = localStorage.getItem(BASE_LOCATION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (
        parsed &&
        typeof parsed.lat === 'number' &&
        typeof parsed.lng === 'number' &&
        !isNaN(parsed.lat) &&
        !isNaN(parsed.lng)
      ) {
        return {
          name: parsed.name || HOSPITAL_BASE_COORDS.name,
          address: parsed.address || '',
          lat: Number(parsed.lat),
          lng: Number(parsed.lng),
          updatedAt: parsed.updatedAt,
          updatedBy: parsed.updatedBy,
        };
      }
    }
  } catch (e) {
    console.warn('Failed to read cached base location:', e);
  }
  return {
    name: HOSPITAL_BASE_COORDS.name,
    address: 'Jl. H. Noer Ali No.Kav. 17-18, RT.001/RW.023, Kayuringin Jaya, Kec. Bekasi Sel., Kota Bks, Jawa Barat 17144',
    lat: HOSPITAL_BASE_COORDS.lat,
    lng: HOSPITAL_BASE_COORDS.lng,
  };
};

/**
 * Menyimpan data lokasi pangkalan rumah sakit ke cache localStorage lokal
 */
export const setCachedHospitalBaseLocation = (base: HospitalBaseLocation): void => {
  try {
    localStorage.setItem(BASE_LOCATION_STORAGE_KEY, JSON.stringify(base));
  } catch (e) {
    console.warn('Failed to cache base location to localStorage:', e);
  }
};

/**
 * Real-time listener untuk data lokasi pangkalan ambulance (Primaya Hospital Base)
 * Default fallback: getCachedHospitalBaseLocation()
 */
export const subscribeHospitalBaseLocation = (
  callback: (base: HospitalBaseLocation) => void,
  onError?: (error: Error) => void
): (() => void) => {
  // Langsung kirimkan versi cache lokal terlebih dahulu jika ada
  const cached = getCachedHospitalBaseLocation();
  callback(cached);

  const configRef = doc(db, SETTINGS_COLLECTION, AMBULANCE_CONFIG_DOC);

  return onSnapshot(
    configRef,
    (snap) => {
      if (snap.exists() && snap.data()?.baseLocation) {
        const data = snap.data().baseLocation;
        const result: HospitalBaseLocation = {
          name: data.name || HOSPITAL_BASE_COORDS.name,
          address: data.address || '',
          lat: typeof data.lat === 'number' ? data.lat : HOSPITAL_BASE_COORDS.lat,
          lng: typeof data.lng === 'number' ? data.lng : HOSPITAL_BASE_COORDS.lng,
          updatedAt: data.updatedAt,
          updatedBy: data.updatedBy,
        };
        setCachedHospitalBaseLocation(result);
        callback(result);
      } else {
        const fallback = getCachedHospitalBaseLocation();
        callback(fallback);
      }
    },
    (err) => {
      console.warn('Error subscribing to base location, using cached/default:', err);
      const fallback = getCachedHospitalBaseLocation();
      callback(fallback);
      if (onError) onError(err);
    }
  );
};

/**
 * Mengambil data lokasi pangkalan ambulance secara one-shot
 */
export const getHospitalBaseLocation = async (): Promise<HospitalBaseLocation> => {
  try {
    const configRef = doc(db, SETTINGS_COLLECTION, AMBULANCE_CONFIG_DOC);
    const snap = await getDoc(configRef);
    if (snap.exists() && snap.data()?.baseLocation) {
      const data = snap.data().baseLocation;
      const result: HospitalBaseLocation = {
        name: data.name || HOSPITAL_BASE_COORDS.name,
        address: data.address || '',
        lat: typeof data.lat === 'number' ? data.lat : HOSPITAL_BASE_COORDS.lat,
        lng: typeof data.lng === 'number' ? data.lng : HOSPITAL_BASE_COORDS.lng,
        updatedAt: data.updatedAt,
        updatedBy: data.updatedBy,
      };
      setCachedHospitalBaseLocation(result);
      return result;
    }
  } catch (err) {
    console.warn('Gagal memuat base location, menggunakan cache/default:', err);
  }
  return getCachedHospitalBaseLocation();
};

/**
 * Menyimpan / memperbarui data lokasi pangkalan ambulance di Firestore
 */
export const setHospitalBaseLocation = async (
  base: { name: string; address?: string; lat: number; lng: number },
  updatedBy: string = 'Administrator'
): Promise<void> => {
  if (!base.name.trim()) {
    throw new Error('Nama pangkalan tidak boleh kosong');
  }
  if (isNaN(base.lat) || isNaN(base.lng)) {
    throw new Error('Koordinat Latitude dan Longitude harus berupa angka valid');
  }

  // Update cache lokal langsung
  setCachedHospitalBaseLocation({
    name: base.name.trim(),
    address: (base.address || '').trim(),
    lat: Number(base.lat),
    lng: Number(base.lng),
    updatedBy,
  });

  const configRef = doc(db, SETTINGS_COLLECTION, AMBULANCE_CONFIG_DOC);
  await setDoc(
    configRef,
    {
      baseLocation: {
        name: base.name.trim(),
        address: (base.address || '').trim(),
        lat: Number(base.lat),
        lng: Number(base.lng),
        updatedAt: serverTimestamp(),
        updatedBy,
      },
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
};


