import React, { useState, useEffect, useRef } from 'react';
import {
  FaTimes,
  FaSearch,
  FaMapMarkerAlt,
  FaHospital,
  FaRoute,
  FaCheck,
  FaCrosshairs,
  FaSpinner,
} from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  POPULAR_DESTINATIONS,
} from '../../utils/ambulanceConstants';
import { calculateEstimatedDistance } from '../../utils/ambulanceUtils';
import { HospitalBaseLocation } from '../../types/ambulance';
import {
  getCachedHospitalBaseLocation,
  subscribeHospitalBaseLocation,
} from '../../services/ambulanceService';

export interface MapSelectedLocation {
  address: string;
  lat: number;
  lng: number;
  estimatedDistanceKm: number;
}

interface AmbulanceMapPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation: (location: MapSelectedLocation) => void;
  initialLocationName?: string;
  initialLat?: number;
  initialLng?: number;
  baseLocation?: HospitalBaseLocation;
}

// Custom Leaflet DivIcon for Destination Marker
const createDestinationIcon = () =>
  L.divIcon({
    className: 'custom-map-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #dc2626; color: white; padding: 6px 10px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 12px rgba(220,38,38,0.45); display: flex; items-center; gap: 4px; border: 2px solid white; white-space: nowrap;">
          <span>📍 Lokasi Tujuan</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #dc2626; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

// Custom Leaflet DivIcon for Base Hospital Marker
const createHospitalBaseIcon = (name: string) =>
  L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #1d4ed8; color: white; padding: 5px 9px; border-radius: 9999px; font-weight: 800; font-size: 10px; box-shadow: 0 4px 12px rgba(29,78,216,0.45); display: flex; items-center; gap: 4px; border: 2px solid white; white-space: nowrap;">
          <span>🏥 ${name || 'Pangkalan IGD'}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #1d4ed8; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

export const AmbulanceMapPickerModal: React.FC<AmbulanceMapPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  initialLocationName = '',
  initialLat,
  initialLng,
  baseLocation: initialBaseProp,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const baseMarkerRef = useRef<L.Marker | null>(null);
  const destinationMarkerRef = useRef<L.Marker | null>(null);
  const routeLineRef = useRef<L.Polyline | null>(null);

  // Ambil data pangkalan dari prop atau cache lokal (seketika & instan)
  const [baseLocation, setBaseLocation] = useState<HospitalBaseLocation>(() =>
    initialBaseProp || getCachedHospitalBaseLocation()
  );

  // Sinkronkan jika prop baseLocation berubah
  useEffect(() => {
    if (initialBaseProp) {
      setBaseLocation(initialBaseProp);
    }
  }, [initialBaseProp]);

  // Tetap berlangganan Firestore secara real-time
  useEffect(() => {
    const unsub = subscribeHospitalBaseLocation((base) => {
      setBaseLocation(base);
    });
    return () => unsub();
  }, []);

  const [selectedLat, setSelectedLat] = useState<number>(
    initialLat || (initialBaseProp || getCachedHospitalBaseLocation()).lat + 0.015
  );
  const [selectedLng, setSelectedLng] = useState<number>(
    initialLng || (initialBaseProp || getCachedHospitalBaseLocation()).lng + 0.012
  );
  const [addressInput, setAddressInput] = useState<string>(initialLocationName);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [isReverseGeocoding, setIsReverseGeocoding] = useState<boolean>(false);
  const [estimatedKm, setEstimatedKm] = useState<number>(0);

  // Inisialisasi posisi tujuan saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      const lat = initialLat || baseLocation.lat + 0.015;
      const lng = initialLng || baseLocation.lng + 0.012;
      setSelectedLat(lat);
      setSelectedLng(lng);
      setAddressInput(initialLocationName || 'Lokasi Tujuan Ambulance');
      const km = calculateEstimatedDistance(
        baseLocation.lat,
        baseLocation.lng,
        lat,
        lng
      );
      setEstimatedKm(km);
      setSearchQuery('');
      setSearchResults([]);
    }
  }, [isOpen, initialLat, initialLng, initialLocationName]);

  // Leaflet Map Initialization (dieksekusi sekali saat modal dibuka)
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Bersihkan instance lama jika ada
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const currentBase = baseLocation;
    const destLat = selectedLat;
    const destLng = selectedLng;

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([destLat, destLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Marker Pangkalan Rumah Sakit
    const baseMarker = L.marker([currentBase.lat, currentBase.lng], {
      icon: createHospitalBaseIcon(currentBase.name),
      interactive: true,
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-size: 12px; font-weight: bold; text-align: center;">🏥 ${currentBase.name}<br/><span style="font-weight: normal; color: #64748b; font-size: 10px;">${currentBase.address || 'Pangkalan Asal IGD'}</span></div>`
      );
    baseMarkerRef.current = baseMarker;

    // Marker Tujuan (Dapat digeser)
    const destMarker = L.marker([destLat, destLng], {
      icon: createDestinationIcon(),
      draggable: true,
    }).addTo(map);
    destinationMarkerRef.current = destMarker;

    // Garis Rute dari Pangkalan ke Tujuan
    const routeLine = L.polyline(
      [
        [currentBase.lat, currentBase.lng],
        [destLat, destLng],
      ],
      {
        color: '#dc2626',
        dashArray: '6, 8',
        weight: 3,
        opacity: 0.8,
      }
    ).addTo(map);
    routeLineRef.current = routeLine;

    // Event drag marker tujuan
    destMarker.on('dragend', (e) => {
      const marker = e.target;
      const position = marker.getLatLng();
      updateSelectedPosition(position.lat, position.lng, true);
    });

    // Event klik di peta untuk menentukan tujuan
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      destMarker.setLatLng([lat, lng]);
      updateSelectedPosition(lat, lng, true);
    });

    mapInstanceRef.current = map;

    // Pastikan ukuran peta sesuai kontainer modal
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      clearTimeout(resizeTimer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      baseMarkerRef.current = null;
      destinationMarkerRef.current = null;
      routeLineRef.current = null;
    };
  }, [isOpen]);

  // Sinkronisasi dinamis posisi marker pangkalan & garis rute jika pangkalan terupdate
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (baseMarkerRef.current) {
      baseMarkerRef.current.setLatLng([baseLocation.lat, baseLocation.lng]);
      baseMarkerRef.current.setIcon(createHospitalBaseIcon(baseLocation.name));
      baseMarkerRef.current.setPopupContent(
        `<div style="font-size: 12px; font-weight: bold; text-align: center;">🏥 ${baseLocation.name}<br/><span style="font-weight: normal; color: #64748b; font-size: 10px;">${baseLocation.address || 'Pangkalan Asal IGD'}</span></div>`
      );
    }

    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([
        [baseLocation.lat, baseLocation.lng],
        [selectedLat, selectedLng],
      ]);
    }

    const km = calculateEstimatedDistance(
      baseLocation.lat,
      baseLocation.lng,
      selectedLat,
      selectedLng
    );
    setEstimatedKm(km);
  }, [baseLocation, selectedLat, selectedLng]);

  // Update selected position & trigger reverse geocoding
  const updateSelectedPosition = async (
    lat: number,
    lng: number,
    fetchAddress: boolean = false
  ) => {
    setSelectedLat(lat);
    setSelectedLng(lng);

    // Update route line
    if (routeLineRef.current) {
      routeLineRef.current.setLatLngs([
        [baseLocation.lat, baseLocation.lng],
        [lat, lng],
      ]);
    }

    // Recalculate distance
    const km = calculateEstimatedDistance(
      baseLocation.lat,
      baseLocation.lng,
      lat,
      lng
    );
    setEstimatedKm(km);

    // Reverse geocode with OpenStreetMap Nominatim
    if (fetchAddress) {
      try {
        setIsReverseGeocoding(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
          { headers: { 'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8' } }
        );
        if (res.ok) {
          const data = await res.json();
          if (data && data.display_name) {
            // Build a human-friendly short address
            const addr = data.address || {};
            const place =
              data.name ||
              addr.hospital ||
              addr.amenity ||
              addr.building ||
              addr.road ||
              '';
            const area = addr.suburb || addr.city_district || addr.city || '';
            const friendlyName =
              place && area
                ? `${place}, ${area}`
                : data.display_name.split(',').slice(0, 3).join(', ');
            setAddressInput(friendlyName.trim());
          }
        }
      } catch (err) {
        console.warn('Reverse geocode error:', err);
      } finally {
        setIsReverseGeocoding(false);
      }
    }
  };

  // Handle Search Query
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
      console.error('Map search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  // Choose location from search results or popular shortcut
  const handleChooseLocation = (item: {
    name?: string;
    display_name?: string;
    lat: string | number;
    lon?: string | number;
    lng?: number;
  }) => {
    const lat = typeof item.lat === 'string' ? parseFloat(item.lat) : item.lat;
    const lng =
      item.lng !== undefined
        ? item.lng
        : typeof item.lon === 'string'
        ? parseFloat(item.lon)
        : Number(item.lon);

    const name =
      item.name ||
      (item.display_name
        ? item.display_name.split(',').slice(0, 3).join(', ')
        : 'Lokasi Tujuan');

    setAddressInput(name);
    setSelectedLat(lat);
    setSelectedLng(lng);
    setSearchResults([]);
    setSearchQuery('');

    if (destinationMarkerRef.current) {
      destinationMarkerRef.current.setLatLng([lat, lng]);
    }
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], 15);
    }

    updateSelectedPosition(lat, lng, false);
  };

  // Reset view to hospital base
  const handleCenterToBase = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView(
        [baseLocation.lat, baseLocation.lng],
        14
      );
    }
  };

  // Submit selected location
  const handleConfirm = () => {
    onSelectLocation({
      address: addressInput.trim() || 'Lokasi Tujuan',
      lat: selectedLat,
      lng: selectedLng,
      estimatedDistanceKm: estimatedKm,
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col h-[94vh] max-h-[780px] border border-gray-100">
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-blue-700 to-primary text-white flex items-center justify-between shrink-0 shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center text-white shrink-0">
              <FaMapMarkerAlt size={16} />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight">
                Pilih Lokasi Tujuan dari Map
              </h3>
              <p className="text-[11px] text-blue-100 flex items-center gap-1.5 mt-0.5">
                <span>Pangkalan Asal:</span>
                <span className="bg-white/20 px-2 py-0.5 rounded font-bold text-white shadow-2xs">
                  🏥 {baseLocation.name}
                </span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Tutup Peta"
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Search Bar & Shortcuts Area */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0 space-y-2">
          <form onSubmit={handleSearch} className="relative flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari rumah sakit, jalan, atau nama tempat tujuan..."
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
              {isSearching ? (
                <FaSpinner size={12} className="animate-spin" />
              ) : (
                <span>Cari</span>
              )}
            </button>

            <button
              type="button"
              onClick={handleCenterToBase}
              className="px-3 h-10 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors cursor-pointer shadow-2xs shrink-0"
              title={`Arahkan ke Pangkalan ${baseLocation.name}`}
            >
              <FaCrosshairs size={12} className="text-blue-600" />
              <span className="hidden sm:inline">Pangkalan</span>
            </button>
          </form>

          {/* Search Results Dropdown List */}
          {searchResults.length > 0 && (
            <div className="bg-white border border-blue-200 rounded-xl shadow-lg p-1.5 space-y-1 max-h-40 overflow-y-auto">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">
                Hasil Pencarian:
              </span>
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleChooseLocation(item)}
                  className="w-full text-left px-2.5 py-1.5 rounded-lg hover:bg-blue-50 text-xs text-gray-800 flex items-start gap-2 transition-colors cursor-pointer"
                >
                  <FaMapMarkerAlt className="text-red-500 mt-0.5 shrink-0" size={12} />
                  <span className="line-clamp-1">{item.display_name}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Hospital Destinations Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 pt-0.5 scrollbar-none">
            <span className="text-[10px] font-bold text-gray-500 shrink-0 flex items-center gap-1">
              <FaHospital size={10} className="text-blue-600" /> Rujukan Populer:
            </span>
            {POPULAR_DESTINATIONS.map((h, i) => (
              <button
                key={i}
                type="button"
                onClick={() => handleChooseLocation(h)}
                className="text-[11px] font-semibold px-2.5 py-1 bg-white hover:bg-blue-50 hover:border-blue-300 active:scale-95 text-gray-700 rounded-lg border border-gray-200 transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-2xs"
              >
                {h.name.replace('RSUD dr. ', 'RSUD ').replace('RS Mitra Keluarga ', 'RS Mitra ')}
              </button>
            ))}
          </div>
        </div>

        {/* Map Canvas */}
        <div className="relative flex-1 bg-slate-100 overflow-hidden">
          <div ref={mapContainerRef} className="w-full h-full z-10" />

          {/* Map Overlay Helper */}
          <div className="absolute top-3 left-3 z-20 pointer-events-none bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-gray-200 shadow-sm text-[11px] text-gray-700 font-medium flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
            <span>Klik peta atau geser pin merah untuk menentukan tujuan</span>
          </div>
        </div>

        {/* Bottom Details & Action Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shrink-0 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {/* Nama / Alamat Lokasi */}
            <div className="sm:col-span-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col justify-center">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide flex items-center gap-1">
                  <FaMapMarkerAlt className="text-red-500" size={11} />
                  Lokasi Tujuan Terpilih
                </span>
                {isReverseGeocoding && (
                  <span className="text-[10px] text-blue-600 font-medium flex items-center gap-1">
                    <FaSpinner size={10} className="animate-spin" /> Mengambil alamat...
                  </span>
                )}
              </div>
              <input
                type="text"
                value={addressInput}
                onChange={(e) => setAddressInput(e.target.value)}
                placeholder="Nama lokasi / alamat tujuan..."
                className="mt-1 w-full bg-transparent font-bold text-xs sm:text-sm text-gray-900 border-none outline-none focus:bg-white focus:ring-1 focus:ring-primary rounded px-1 py-0.5"
              />
            </div>

            {/* Estimasi Jarak */}
            <div className="bg-blue-50/70 p-2.5 rounded-xl border border-blue-200/80 flex items-center justify-between sm:flex-col sm:items-start sm:justify-center">
              <span className="text-[10px] font-bold text-blue-800 uppercase tracking-wide flex items-center gap-1">
                <FaRoute className="text-blue-600" size={11} />
                Estimasi Jarak
              </span>
              <span className="font-extrabold text-sm sm:text-base text-blue-950 mt-0.5">
                🚗 {estimatedKm} KM
              </span>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FaCheck size={12} />
              <span>Gunakan Lokasi Ini</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
