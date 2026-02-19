
export type ViewState = 'login' | 'calendar' | 'config' | 'absences';

export interface AuthUser {
  id: number;
  name: string;
  username: string;
  email?: string;
  access: ('Desktop' | 'Mobile')[];
  profileType?: string; // TipoPerfil_US
  doctorType?: string;  // TipoM_US
  service?: string;    // Servicio_US
  status?: string
}

export interface User {
  id: string;
  name: string;
  surname: string;
  birthDate: string; // DD/MM/YYYY
  sector: string;
  type: string; // e.g., 'Fijo', 'Suplente'
  dni?: string;
  email?: string;
  service?: string;
  role?: string;
}

export interface Doctor {
  id: string;
  name: string;
  type: string;
  email: string;
}

export interface CalendarEvent {
  day: number;
  status: 'pending' | 'taken' | 'cancelled';
}

export interface NewUserForm {
  name: string;
  surname: string;
  password: string;
  type: string;
  birthDate: string;
  dni: string;
  email: string;
  service: string;
  role: string;
  sector: string;
}
