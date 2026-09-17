import React, { useState, useEffect, useRef } from 'react';
import {
  FaTimes,
  FaHospital,
  FaMapMarkerAlt,
  FaSearch,
  FaCrosshairs,
  FaCheck,
  FaSpinner,
  FaUndo,
} from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { HospitalBaseLocation } from '../../types/ambulance';
import {
  subscribeHospitalBaseLocation,
  setHospitalBaseLocation,
} from '../../services/ambulanceService';
import { HOSPITAL_BASE_COORDS } from '../../utils/ambulanceConstants';

interface AmbulanceBaseLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBaseUpdated?: (newBase: HospitalBaseLocation) => void;
}

// Custom Leaflet DivIcon for Base Hospital Marker
const createHospitalMarkerIcon = (name: string) =>
  L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #1d4ed8; color: white; padding: 6px 12px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 14px rgba(29,78,216,0.5); display: flex; align-items: center; gap: 5px; border: 2px solid white; white-space: nowrap;">
          <span>🏥</span>
          <span>${name || 'Pangkalan Ambulans'}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 7px solid transparent; border-right: 7px solid transparent; border-top: 9px solid #1d4ed8; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

export const AmbulanceBaseLocationModal: React.FC<AmbulanceBaseLocationModalProps> = ({
  isOpen,
  onClose,
  onBaseUpdated,
}) => {
  const { currentUser } = useAuth();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const hospitalMarkerRef = useRef<L.Marker | null>(null);

  const [baseName, setBaseName] = useState<string>(HOSPITAL_BASE_COORDS.name);
  const [address, setAddress] = useState<string>('');
  const [lat, setLat] = useState<number>(HOSPITAL_BASE_COORDS.lat);
  const [lng, setLng] = useState<number>(HOSPITAL_BASE_COORDS.lng);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // Subscribe to current configured base location
  useEffect(() => {
    if (!isOpen) return;

    const unsubscribe = subscribeHospitalBaseLocation((base) => {
      setBaseName(base.name);
      setAddress(base.address || '');
      setLat(base.lat);
      setLng(base.lng);
    });

    return () => unsubscribe();
  }, [isOpen]);

  // Sync marker icon when baseName is updated
  useEffect(() => {
    if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.setIcon(createHospitalMarkerIcon(baseName));
    }
  }, [baseName]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const currentLat = lat || HOSPITAL_BASE_COORDS.lat;
    const currentLng = lng || HOSPITAL_BASE_COORDS.lng;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([currentLat, currentLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Draggable Hospital Marker
    const marker = L.marker([currentLat, currentLng], {
      icon: createHospitalMarkerIcon(baseName),
      draggable: true,
    }).addTo(map);

    hospitalMarkerRef.current = marker;

    // Handle marker drag end
    marker.on('dragend', (e) => {
      const position = e.target.getLatLng();
      updateCoordinates(position.lat, position.lng, true);
    });

    // Handle map click to reposition
    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      marker.setLatLng([clickLat, clickLng]);
      updateCoordinates(clickLat, clickLng, true);
    });

    mapInstanceRef.current = map;

    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  // Update position and reverse geocode
  const updateCoordinates = async (
    newLat: number,
    newLng: number,
    fetchAddress: boolean = true
  ) => {
    setLat(newLat);
    setLng(newLng);

    if (fetchAddress) {
      try {
        setIsReverseGeocoding(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${newLat}&lon=${newLng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            setAddress(data.display_name);
          }
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err);
      } finally {
        setIsReverseGeocoding(false);
      }
    }
  };

  // Search location
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    try {
      setIsSearching(true);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          searchQuery.trim()
        )}&countrycodes=id&limit=5`,
        { headers: { 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' } }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchResults(data || []);
      }
    } catch (err) {
      console.error('Search error:', err);
      toast.error('Gagal mencari lokasi');
    } finally {
      setIsSearching(false);
    }
  };

  // Pick from search result
  const handleSelectSearchResult = (item: any) => {
    const itemLat = parseFloat(item.lat);
    const itemLng = parseFloat(item.lon);
    setLat(itemLat);
    setLng(itemLng);
    setAddress(item.display_name);
    setSearchResults([]);
    setSearchQuery('');

    if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.setLatLng([itemLat, itemLng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([itemLat, itemLng], 16);
    }
  };

  // Detect GPS Location
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Browser Anda tidak mendukung geolokasi GPS');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const myLat = pos.coords.latitude;
        const myLng = pos.coords.longitude;
        updateCoordinates(myLat, myLng, true);

        if (hospitalMarkerRef.current) {
          hospitalMarkerRef.current.setLatLng([myLat, myLng]);
        }
        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([myLat, myLng], 16);
        }
        toast.success('Pangkalan diarahkan ke lokasi GPS saat ini');
      },
      (err) => {
        console.warn('Geolocation error:', err);
        toast.error('Tidak dapat mengakses lokasi GPS. Pastikan izin lokasi aktif.');
      }
    );
  };

  // Reset to default Primaya
  const handleResetToDefault = () => {
    setBaseName(HOSPITAL_BASE_COORDS.name);
    setAddress('Jl. H. Noer Ali No.Kav. 17-18, RT.001/RW.023, Kayuringin Jaya, Kec. Bekasi Sel., Kota Bks, Jawa Barat 17144');
    setLat(HOSPITAL_BASE_COORDS.lat);
    setLng(HOSPITAL_BASE_COORDS.lng);

    if (hospitalMarkerRef.current) {
      hospitalMarkerRef.current.setLatLng([HOSPITAL_BASE_COORDS.lat, HOSPITAL_BASE_COORDS.lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([HOSPITAL_BASE_COORDS.lat, HOSPITAL_BASE_COORDS.lng], 15);
    }
    toast.success('Lokasi pangkalan dikembalikan ke default Primaya Hospital');
  };

  // Handle manual input of Lat / Lng
  const handleManualLatChange = (valStr: string) => {
    const val = parseFloat(valStr);
    setLat(val);
    if (!isNaN(val) && hospitalMarkerRef.current && mapInstanceRef.current) {
      hospitalMarkerRef.current.setLatLng([val, lng]);
      mapInstanceRef.current.setView([val, lng]);
    }
  };

  const handleManualLngChange = (valStr: string) => {
    const val = parseFloat(valStr);
    setLng(val);
    if (!isNaN(val) && hospitalMarkerRef.current && mapInstanceRef.current) {
      hospitalMarkerRef.current.setLatLng([lat, val]);
      mapInstanceRef.current.setView([lat, val]);
    }
  };

  // Save base location to Firestore
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!baseName.trim()) {
      toast.error('Nama pangkalan tidak boleh kosong');
      return;
    }
    if (isNaN(lat) || isNaN(lng)) {
      toast.error('Koordinat GPS tidak valid');
      return;
    }

    try {
      setIsSaving(true);
      const author = currentUser?.displayName || currentUser?.email || 'Administrator IGD';
      await setHospitalBaseLocation(
        {
          name: baseName.trim(),
          address: address.trim(),
          lat: Number(lat),
          lng: Number(lng),
        },
        author
      );

      toast.success('Lokasi pangkalan ambulance berhasil diperbarui!');
      if (onBaseUpdated) {
        onBaseUpdated({
          name: baseName.trim(),
          address: address.trim(),
          lat: Number(lat),
          lng: Number(lng),
        });
      }
      onClose();
    } catch (err: any) {
      console.error('Save base location error:', err);
      toast.error(`Gagal menyimpan: ${err.message || 'Terjadi kesalahan'}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/65 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[94vh] max-h-[820px] border border-gray-100">
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-900 via-primary to-blue-800 text-white flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-xs flex items-center justify-center text-white shrink-0 shadow-xs">
              <FaHospital size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/20 text-blue-100">
                  Konfigurasi GPS
                </span>
                <span className="text-[10px] text-blue-200 font-semibold">
                  Titik Awal Jarak (KM)
                </span>
              </div>
              <h3 className="font-extrabold text-base sm:text-lg leading-tight mt-0.5">
                Atur Lokasi Pangkalan Ambulans
              </h3>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            title="Tutup Modal"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Top Search & Actions Bar */}
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari rumah sakit, jalan, atau gedung pangkalan baru..."
                className="w-full h-10 pl-9 pr-3 text-xs sm:text-sm bg-white border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none shadow-2xs"
              />
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-400">
                <FaSearch size={13} />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching || !searchQuery.trim()}
              className="px-4 h-10 bg-primary hover:bg-blue-800 active:scale-95 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs disabled:opacity-50 shrink-0"
            >
              {isSearching ? <FaSpinner size={12} className="animate-spin" /> : <span>Cari</span>}
            </button>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="px-3 h-10 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Arahkan ke Lokasi GPS Saat Ini"
            >
              <FaCrosshairs size={12} className="text-emerald-600" />
              <span className="hidden sm:inline">GPS Saya</span>
            </button>

            <button
              type="button"
              onClick={handleResetToDefault}
              className="px-3 h-10 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
              title="Reset ke Default Primaya Hospital"
            >
              <FaUndo size={11} className="text-amber-600" />
              <span className="hidden sm:inline">Reset Default</span>
            </button>
          </form>

          {/* Search Results Dropdown List */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-xl shadow-lg p-1.5 space-y-1 max-h-40 overflow-y-auto">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">
                Pilih Hasil Pencarian:
              </span>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-xs text-gray-800 flex items-start gap-2 transition-colors cursor-pointer"
                >
                  <FaMapMarkerAlt className="text-primary mt-0.5 shrink-0" size={12} />
                  <span className="line-clamp-1">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Map Canvas Area */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Overlay Guide Badge */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none bg-white/95 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-[11px] text-gray-700 font-medium flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            <span>Geser pin biru atau klik di peta untuk menentukan pangkalan baru</span>
          </div>
        </div>

        {/* Bottom Form Fields & Save Action */}
        <form onSubmit={handleSave} className="p-4 sm:p-5 bg-white border-t border-gray-200 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            {/* Nama Pangkalan */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nama Pangkalan / Rumah Sakit <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={baseName}
                onChange={(e) => setBaseName(e.target.value)}
                placeholder="Contoh: Primaya Hospital Bekasi Barat"
                className="w-full h-10 px-3.5 py-2 text-xs sm:text-sm font-bold bg-slate-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
              />
            </div>

            {/* Latitude */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Latitude (Garis Lintang)
              </label>
              <input
                type="number"
                step="any"
                required
                value={lat}
                onChange={(e) => handleManualLatChange(e.target.value)}
                className="w-full h-10 px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Longitude */}
            <div className="sm:col-span-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Longitude (Garis Bujur)
              </label>
              <input
                type="number"
                step="any"
                required
                value={lng}
                onChange={(e) => handleManualLngChange(e.target.value)}
                className="w-full h-10 px-3 py-2 text-xs font-mono font-bold bg-slate-50 border border-gray-300 rounded-xl focus:bg-white focus:ring-2 focus:ring-primary outline-none"
              />
            </div>

            {/* Alamat Terdeteksi */}
            <div className="sm:col-span-4 bg-blue-50/60 p-2.5 rounded-xl border border-blue-100 flex items-start gap-2">
              <FaMapMarkerAlt className="text-primary mt-0.5 shrink-0" size={13} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-blue-900 uppercase tracking-wide">
                    Alamat Fisik Terdeteksi
                  </span>
                  {isReverseGeocoding && (
                    <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                      <FaSpinner size={10} className="animate-spin" /> Membaca alamat...
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Alamat lengkap pangkalan..."
                  className="mt-0.5 w-full bg-transparent text-xs text-gray-700 border-none outline-none focus:bg-white focus:ring-1 focus:ring-primary rounded px-1"
                />
              </div>
            </div>
          </div>

          {/* Footer Action Buttons */}
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-gray-500 hidden sm:block">
              Lokasi ini menjadi titik awal kalkulasi estimasi jarak (KM) setiap rute ambulans.
            </p>
            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-primary hover:bg-blue-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? (
                  <FaSpinner size={12} className="animate-spin" />
                ) : (
                  <FaCheck size={12} />
                )}
                <span>{isSaving ? 'Menyimpan...' : 'Simpan Lokasi Pangkalan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
