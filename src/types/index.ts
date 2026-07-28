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
  theme?: 'classic' | 'modern';
  copyright?: string;
}

export interface Specialist {
  id: string;
  name: string;
}

export interface OnCallSchedule {
  id: string;
  department: string;
  departmentEn: string;
  doctorName: string;
  order: number;
}

export interface DoctorSlot {
  slotId: 'doctor1' | 'doctor2' | 'coordinator' | 'pic';
  doctorId: string | null;
}
