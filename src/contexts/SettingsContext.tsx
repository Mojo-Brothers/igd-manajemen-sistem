import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';
import { AppSettings } from '../types';

interface SettingsContextType {
  settings: AppSettings | null;
  loading: boolean;
}

const defaultSettings: AppSettings = {
  hospitalName: 'PRIMAYA HOSPITAL',
  runningText: 'Selamat Datang di Instalasi Gawat Darurat Primaya Hospital',
  themeColor: '#015c80',
  secondaryColor: '#F5F8FA',
  logoUrl: '',
  copyright: `© ${new Date().getFullYear()} Primaya Hospital. All Rights Reserved.`,
};

const SettingsContext = createContext<SettingsContextType>({
  settings: defaultSettings,
  loading: true,
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen to real-time settings document updates
    const unsubscribe = onSnapshot(
      doc(db, 'settings', 'global'),
      (docSnap) => {
        if (docSnap.exists()) {
          setSettings(docSnap.data() as AppSettings);
        } else {
          // If no settings exist yet, use default
          setSettings(defaultSettings);
        }
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching settings:", error);
        setSettings(defaultSettings);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  return (
    <SettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SettingsContext.Provider>
  );
};
