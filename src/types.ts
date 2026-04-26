export interface DoctorProfile {
  userId: string;
  name: string;
  gender?: 'male' | 'female';
  specialty: string;
  clinicAddress: string;
  wilaya?: string;
  commune?: string;
  phone: string;
  googleSheetWebhookUrl?: string;
  maxPatientsPerDay?: number;
  rating: number;
  reviewCount?: number;
  patientCount: number;
  status: 'pending' | 'approved';
}

export interface Review {
  id?: string;
  doctorId: string;
  patientName: string;
  rating: number;
  comment: string;
  createdAt: number;
}

export interface Appointment {
  id?: string;
  doctorId: string;
  patientName: string;
  patientPhone: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: number;
}

export interface Permanence {
  id?: string;
  name: string;
  type: 'pharmacy' | 'laboratory';
  address: string;
  phone: string;
  openUntil: string;
}
