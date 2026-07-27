export interface Doctor {
  id: string;
  name: string;
  role: string;
  status: string;
  imageUrl: string;
  order: number;
  isActive: boolean;
}

export interface AppSettings {
  hospitalName: string;
  runningText: string;
  themeColor: string;
  secondaryColor: string;
  logoUrl: string;
  copyright: string;
}

export interface DoctorSlot {
  slotId: 'doctor1' | 'doctor2' | 'coordinator' | 'pic';
  doctorId: string | null;
}
