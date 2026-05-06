// ─── Auth ──────────────────────────────────────────────────────────────────

export type UserRole = 'student' | 'coordinator' | 'supervisor' | 'lecturer';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole | string;
  registrationNumber?: string | null;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: Omit<AuthUser, 'token'>;
}

// ─── Student ───────────────────────────────────────────────────────────────

export type AttachmentStatus = 'active' | 'pending' | 'completed';

export interface Student {
  id: string;
  reg_no?: string;
  name: string;
  registrationNumber: string;
  email: string;
  phone_number?: string;
  phone?: string;
  school?: string;
  department?: string;
  yearOfStudy?: number;
  placementId?: string;
  status?: AttachmentStatus;
  universitySupervisorName?: string;
  universitySupervisorId?: string;
  universitySupervisorPhone?: string;
  company?: string;
  location?: string;
  startDate?: string;
  endDate?: string;
  stationSupervisorName?: string;
  stationSupervisorPhone?: string;
}

// ─── Placement ─────────────────────────────────────────────────────────────

export interface Placement {
  id: string | number;
  studentId: string;
  companyId: string | number;
  companyName: string;
  department: string;
  location: string;
  startDate: string;
  endDate: string;
  stationSupervisorId?: string;
  universitySupervisorId?: string;
  status: AttachmentStatus | string;
}

export interface PlacementProgress {
  placement: Placement;
  daysTotal: number;
  daysElapsed: number;
  daysRemaining: number;
  completionPercent: number;
}

// ─── Weekly Log ────────────────────────────────────────────────────────────

export type LogStatus = 'submitted' | 'pending' | 'reviewed' | 'missing';

export interface WeeklyLog {
  id: string;
  studentId?: string;
  placementId: string;
  weekNumber: number;
  weekStart: string;
  weekEnd: string;
  activityDescription: string;
  fileUrl?: string;
  status: LogStatus | string;
  submittedAt?: string;
  reviewedAt?: string;
  reviewerComment?: string;
}

export interface LogSubmitPayload {
  weekNumber: number;
  activityDescription: string;
  file?: File;
}

// ─── Supervisor ────────────────────────────────────────────────────────────

export interface Supervisor {
  id: string;
  name: string;
  email?: string;
  phone: string;
  type: 'station' | 'university';
  maxStudents?: number;
  assignedStudents?: number;
}

// ─── Company ───────────────────────────────────────────────────────────────

export interface Company {
  id: string;
  name: string;
  location: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail?: string;
  placementHistory: number;
  activeStudents: number;
}

// ─── Analytics / KPI ───────────────────────────────────────────────────────

export interface CoordinatorKPIs {
  totalStudents: number;
  placedPercent: number;
  visitedPercent: number
  missingLogsCount: number;
  onTrackPercent: number;
  geographicDistribution?: { county: string; count: number }[];
}

// ─── Notification ──────────────────────────────────────────────────────────

export type NotifType = 'warning' | 'info' | 'danger';

export interface AppNotification {
  id: string;
  type: NotifType | string;
  message: string;
  createdAt: string;
  read: boolean;
}

// ─── API wrappers ──────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}