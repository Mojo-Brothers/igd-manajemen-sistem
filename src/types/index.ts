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
  department?: string;
  departmentEn?: string;
}

export interface OnCallSchedule {
  id: string;
  department: string;
  departmentEn: string;
  doctorName: string;
  status?: string;
  order: number;
}

export interface DoctorSlot {
  slotId: 'doctor1' | 'doctor2' | 'coordinator' | 'pic';
  doctorId: string | null;
}

export interface MonthlyScheduleItem {
  date: string; // YYYY-MM-DD
  schedules: {
    department: string;
    departmentEn: string;
    doctorName: string;
    specialistId: string;
    status?: string;
  }[];
}
