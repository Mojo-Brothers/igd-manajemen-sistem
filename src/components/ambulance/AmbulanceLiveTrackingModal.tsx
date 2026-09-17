import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaTimes,
  FaAmbulance,
  FaHospital,
  FaLocationArrow,
  FaCrosshairs,
  FaTachometerAlt,
  FaUser,
  FaClock,
  FaCircle,
  FaBroadcastTower,
  FaRoute,
  FaPlay,
  FaStop,
} from 'react-icons/fa';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AmbulanceLiveLocation,
  HospitalBaseLocation,
} from '../../types/ambulance';
import {
  subscribeAmbulanceLiveLocations,
  subscribeHospitalBaseLocation,
  getCachedHospitalBaseLocation,
} from '../../services/ambulanceService';
import { calculateEstimatedDistance } from '../../utils/ambulanceUtils';
import { LIVE_LOCATIONS_COLLECTION } from '../../utils/ambulanceConstants';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/config';
import toast from 'react-hot-toast';

interface AmbulanceLiveTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Icon pangkalan rumah sakit
const createHospitalBaseIcon = (name: string) =>
  L.divIcon({
    className: 'custom-hospital-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -100%);">
        <div style="background: #1d4ed8; color: white; padding: 6px 12px; border-radius: 9999px; font-weight: 800; font-size: 11px; box-shadow: 0 4px 14px rgba(29,78,216,0.45); display: flex; align-items: center; gap: 5px; border: 2px solid white; white-space: nowrap;">
          <span style="font-size: 13px;">🏥</span>
          <span>${name}</span>
        </div>
        <div style="width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 8px solid #1d4ed8; margin-top: -1px;"></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });

// Icon ambulans live dengan efek radar / pulse
const createAmbulanceLiveIcon = (
  unitName: string,
  driverName?: string,
  speed?: number,
  isOnline: boolean = true,
  isMoving: boolean = false
) => {
  const bgColor = !isOnline
    ? '#64748b'
    : isMoving
    ? '#059669' // Emerald for moving
    : '#d97706'; // Amber for standby

  const pulseRing = isOnline
    ? `<div style="position: absolute; width: 44px; height: 44px; border-radius: 50%; background: ${bgColor}; opacity: 0.25; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; z-index: -1;"></div>`
    : '';

  return L.divIcon({
    className: 'custom-ambulance-live-marker',
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center; transform: translate(-50%, -50%); cursor: pointer;">
        ${pulseRing}
        <div style="width: 38px; height: 38px; border-radius: 50%; background: ${bgColor}; color: white; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 2.5px solid white; box-shadow: 0 4px 16px rgba(0,0,0,0.3); transition: transform 0.2s;">
          🚑
        </div>
        <div style="margin-top: 4px; background: rgba(15, 23, 42, 0.88); color: white; padding: 3px 8px; border-radius: 6px; font-weight: 800; font-size: 10px; white-space: nowrap; border: 1px solid rgba(255,255,255,0.2); box-shadow: 0 2px 6px rgba(0,0,0,0.25); text-align: center;">
          <span>${unitName}</span>
          ${driverName ? `<span style="color: #93c5fd; margin-left: 3px; font-weight: normal;">(${driverName})</span>` : ''}
          ${speed && speed > 0 ? `<span style="color: #6ee7b7; margin-left: 4px;">${speed} km/h</span>` : ''}
        </div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
};


export const AmbulanceLiveTrackingModal: React.FC<AmbulanceLiveTrackingModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [baseLocation, setBaseLocation] = useState<HospitalBaseLocation>(() =>
    getCachedHospitalBaseLocation()
  );
  const [liveLocations, setLiveLocations] = useState<AmbulanceLiveLocation[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationTimerRef = useRef<NodeJS.Timeout | null>(null);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const ambulanceMarkersRef = useRef<Record<string, L.Marker>>({});

  // 1. Berlangganan pangkalan RS
  useEffect(() => {
    const unsub = subscribeHospitalBaseLocation((base) => setBaseLocation(base));
    return () => unsub();
  }, []);

  // 2. Berlangganan data lokasi live GPS real-time dari Firestore
  useEffect(() => {
    if (!isOpen) return;
    const unsub = subscribeAmbulanceLiveLocations((locations) => {
      setLiveLocations(locations);
    });
    return () => unsub();
  }, [isOpen]);

  // 3. Inisialisasi Peta Leaflet saat modal dibuka
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: true,
    }).setView([baseLocation.lat, baseLocation.lng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
    }).addTo(map);

    // Marker Pangkalan Rumah Sakit
    L.marker([baseLocation.lat, baseLocation.lng], {
      icon: createHospitalBaseIcon(baseLocation.name),
    })
      .addTo(map)
      .bindPopup(
        `<div style="font-size: 12px; font-weight: bold; text-align: center;">🏥 ${baseLocation.name}<br/><span style="color: #64748b; font-size: 10px;">Pangkalan Induk Ambulans IGD</span></div>`
      );

    mapInstanceRef.current = map;

    // Trigger map invalidation for proper rendering
    setTimeout(() => {
      map.invalidateSize();
    }, 250);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, baseLocation.lat, baseLocation.lng]);

  // 4. Update Marker Ambulans pada Peta setiap kali liveLocations berubah
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !isOpen) return;

    const currentMarkers = ambulanceMarkersRef.current;
    const currentUnitIds = new Set(liveLocations.map((loc) => loc.id));

    // Hapus marker yang sudah tidak ada
    Object.keys(currentMarkers).forEach((id) => {
      if (!currentUnitIds.has(id)) {
        currentMarkers[id].remove();
        delete currentMarkers[id];
      }
    });

    // Tambah / Update marker setiap unit ambulans
    liveLocations.forEach((loc) => {
      if (!loc.lat || !loc.lng) return;

      const diffSec = loc.updatedAt?.toMillis
        ? Math.round((Date.now() - loc.updatedAt.toMillis()) / 1000)
        : 0;
      const isOnline = diffSec < 180; // Dianggap online jika update < 3 menit
      const isMoving = Boolean(loc.speed && loc.speed > 2);

      const icon = createAmbulanceLiveIcon(
        loc.ambulance,
        loc.driver,
        loc.speed,
        isOnline,
        isMoving
      );

      const distanceKm = calculateEstimatedDistance(
        baseLocation.lat,
        baseLocation.lng,
        loc.lat,
        loc.lng
      );

      const popupContent = `
        <div style="font-family: sans-serif; min-width: 180px; padding: 4px;">
          <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 6px;">
            <span style="font-weight: 800; font-size: 13px; color: #1e293b;">🚑 ${loc.ambulance}</span>
            <span style="font-size: 10px; font-weight: 700; padding: 2px 6px; border-radius: 6px; background: ${isOnline ? '#dcfce7' : '#f1f5f9'}; color: ${isOnline ? '#15803d' : '#64748b'};">
              ${isOnline ? (isMoving ? '🟢 Bergerak' : '🟡 Standby') : '⚪ Offline'}
            </span>
          </div>
          <div style="font-size: 11px; color: #475569; line-height: 1.5;">
            <div>👤 <b>Driver:</b> ${loc.driver || 'Driver Mobile'}</div>
            <div>⚡ <b>Kecepatan:</b> ${loc.speed || 0} km/jam</div>
            <div>📍 <b>Jarak Pangkalan:</b> ~${distanceKm} KM</div>
            <div>⏱️ <b>Update:</b> ${diffSec < 60 ? 'Baru saja' : `${Math.floor(diffSec / 60)} m lalu`}</div>
          </div>
        </div>
      `;

      if (currentMarkers[loc.id]) {
        currentMarkers[loc.id].setLatLng([loc.lat, loc.lng]);
        currentMarkers[loc.id].setIcon(icon);
        currentMarkers[loc.id].setPopupContent(popupContent);
      } else {
        const marker = L.marker([loc.lat, loc.lng], { icon })
          .addTo(map)
          .bindPopup(popupContent);

        marker.on('click', () => {
          setSelectedUnit(loc.id);
        });

        currentMarkers[loc.id] = marker;
      }
    });
  }, [liveLocations, isOpen, baseLocation]);

  // Fokuskan peta ke unit tertentu
  const handleFocusUnit = (loc: AmbulanceLiveLocation) => {
    setSelectedUnit(loc.id);
    const map = mapInstanceRef.current;
    if (map && loc.lat && loc.lng) {
      map.flyTo([loc.lat, loc.lng], 16, { duration: 1.2 });
      if (ambulanceMarkersRef.current[loc.id]) {
        ambulanceMarkersRef.current[loc.id].openPopup();
      }
    }
  };

  // Fokuskan kembali ke seluruh armada & pangkalan
  const handleFitAll = () => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const points: [number, number][] = [[baseLocation.lat, baseLocation.lng]];
    liveLocations.forEach((loc) => {
      if (loc.lat && loc.lng) points.push([loc.lat, loc.lng]);
    });

    if (points.length === 1) {
      map.setView([baseLocation.lat, baseLocation.lng], 13);
    } else {
      const bounds = L.latLngBounds(points.map(([lat, lng]) => L.latLng(lat, lng)));
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  };

  // Simulasi Telemetri GPS (Demo Admin)
  const handleToggleSimulation = () => {
    if (isSimulating) {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
      simulationTimerRef.current = null;
      setIsSimulating(false);
      toast.success('Simulasi live tracking dihentikan');
    } else {
      setIsSimulating(true);
      toast.success('Simulasi live tracking GPS aktif (Demo 1 unit simulasi bergerak)');

      let step = 0;
      const baseLat = baseLocation.lat;
      const baseLng = baseLocation.lng;

      const runSim = async () => {
        step += 1;
        const angle = (step * 25 * Math.PI) / 180;
        const radius = 0.015 + Math.sin(step / 3) * 0.008;
        const simLat = baseLat + Math.cos(angle) * radius;
        const simLng = baseLng + Math.sin(angle) * radius * 1.3;
        const speed = Math.round(35 + Math.sin(step) * 15);

        try {
          const docRef = doc(db, LIVE_LOCATIONS_COLLECTION, 'EVALIA');
          await setDoc(
            docRef,
            {
              ambulance: 'EVALIA',
              driver: 'Acun (Simulasi Demo)',
              lat: simLat,
              lng: simLng,
              speed,
              heading: (angle * 180) / Math.PI,
              isMoving: true,
              status: 'Online',
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        } catch (e) {
          console.error('Sim error:', e);
        }
      };

      runSim();
      simulationTimerRef.current = setInterval(runSim, 4000);
    }
  };

  // Bersihkan timer simulasi saat unmount
  useEffect(() => {
    return () => {
      if (simulationTimerRef.current) clearInterval(simulationTimerRef.current);
    };
  }, []);

  const onlineUnitsCount = useMemo(() => {
    return liveLocations.filter((l) => {
      const diffSec = l.updatedAt?.toMillis
        ? Math.round((Date.now() - l.updatedAt.toMillis()) / 1000)
        : 0;
      return diffSec < 180;
    }).length;
  }, [liveLocations]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[94vh] flex flex-col overflow-hidden border border-slate-200">
        {/* Header Modal */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-slate-900 via-blue-950 to-primary text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-xs">
              <FaBroadcastTower size={20} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold">
                  Pelacakan Lokasi Ambulans Real-Time (Live GPS)
                </h3>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 border border-emerald-400/40 text-emerald-300">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{onlineUnitsCount} Unit Online</span>
                </span>
              </div>
              <p className="text-xs text-blue-200/80 mt-0.5 hidden sm:block">
                Pantau pergerakan armada ambulans di jalan secara hening dari sistem background mobile
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleToggleSimulation}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-xs ${
                isSimulating
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
              title="Aktifkan simulasi koordinat demo untuk uji coba"
            >
              {isSimulating ? <FaStop size={10} /> : <FaPlay size={10} />}
              <span className="hidden sm:inline">
                {isSimulating ? 'Stop Simulasi' : 'Demo Simulasi GPS'}
              </span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
            >
              <FaTimes size={18} />
            </button>
          </div>
        </div>

        {/* Body Konten: Peta (kiri) + Panel Armada (kanan) */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
          {/* Map Container */}
          <div className="flex-1 h-[60%] md:h-full relative">
            <div ref={mapContainerRef} className="w-full h-full z-0" />

            {/* Floating Action Map Buttons */}
            <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
              <button
                type="button"
                onClick={handleFitAll}
                className="bg-white/95 backdrop-blur-xs text-slate-800 p-2.5 rounded-xl shadow-lg border border-slate-200 hover:bg-white hover:text-primary transition-all text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                title="Lihat semua unit & pangkalan"
              >
                <FaCrosshairs size={14} className="text-blue-600" />
                <span className="hidden sm:inline">Lihat Semua</span>
              </button>
            </div>

            {/* Pangkalan Indicator Badge */}
            <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-xs border border-slate-200 rounded-xl p-2.5 shadow-lg flex items-center gap-2 max-w-xs text-xs">
              <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0">
                <FaHospital size={14} />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Pangkalan Asal
                </div>
                <div className="font-extrabold text-slate-900 truncate">
                  {baseLocation.name}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Daftar Armada Live */}
          <div className="w-full md:w-80 lg:w-96 h-[40%] md:h-full bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 flex flex-col shrink-0">
            <div className="p-3.5 border-b border-slate-200 bg-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FaAmbulance className="text-primary" size={16} />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-800">
                  Daftar Armada Ambulans ({liveLocations.length})
                </h4>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Auto-Sync Firestore</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
              {liveLocations.length === 0 ? (
                <div className="text-center py-10 px-4">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                    <FaAmbulance size={22} />
                  </div>
                  <h5 className="text-xs font-bold text-slate-700">Belum Ada Sinyal Telemetri GPS</h5>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    Saat aplikasi mobile driver dibuka di smartphone, lokasi GPS akan otomatis dipancarkan secara hening ke dashboard ini.
                  </p>
                  <button
                    type="button"
                    onClick={handleToggleSimulation}
                    className="mt-4 px-3.5 py-2 bg-primary text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-800 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <FaPlay size={10} />
                    <span>Coba Demo Simulasi</span>
                  </button>
                </div>
              ) : (
                liveLocations.map((loc) => {
                  const diffSec = loc.updatedAt?.toMillis
                    ? Math.round((Date.now() - loc.updatedAt.toMillis()) / 1000)
                    : 0;
                  const isOnline = diffSec < 180;
                  const isMoving = Boolean(loc.speed && loc.speed > 2);
                  const isSelected = selectedUnit === loc.id;
                  const distanceKm = calculateEstimatedDistance(
                    baseLocation.lat,
                    baseLocation.lng,
                    loc.lat,
                    loc.lng
                  );

                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleFocusUnit(loc)}
                      className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-blue-50/90 border-primary ring-2 ring-primary/20 shadow-sm'
                          : 'bg-white border-slate-200 hover:border-blue-300 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-sm text-slate-900">
                            🚑 {loc.ambulance}
                          </span>
                        </div>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            isOnline
                              ? isMoving
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <FaCircle size={6} className={isOnline ? 'text-emerald-500' : 'text-slate-400'} />
                          <span>{isOnline ? (isMoving ? 'Bergerak' : 'Standby') : 'Offline'}</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 mb-2.5">
                        <div className="flex items-center gap-1.5 truncate">
                          <FaUser size={11} className="text-slate-400 shrink-0" />
                          <span className="truncate">{loc.driver || 'Driver Mobile'}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaTachometerAlt size={11} className="text-slate-400 shrink-0" />
                          <span className="font-bold text-slate-800">{loc.speed || 0} km/jam</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaRoute size={11} className="text-slate-400 shrink-0" />
                          <span>~{distanceKm} KM ke RS</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <FaClock size={11} className="text-slate-400 shrink-0" />
                          <span>{diffSec < 60 ? 'Baru saja' : `${Math.floor(diffSec / 60)} m lalu`}</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        <span className="text-[10px] text-slate-400 font-mono">
                          {loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleFocusUnit(loc);
                          }}
                          className="text-[11px] font-bold text-primary hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                          <FaLocationArrow size={10} />
                          <span>Fokus</span>
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Sidebar Info */}
            <div className="p-3 bg-white border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between shrink-0">
              <span className="flex items-center gap-1">
                <FaBroadcastTower className="text-emerald-600" size={12} />
                <span>Background Telemetri</span>
              </span>
              <span className="text-[10px] text-slate-400">Sinkron Tiap 10-15 Detik</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
