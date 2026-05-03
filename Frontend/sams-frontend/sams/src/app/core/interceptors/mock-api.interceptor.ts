import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpResponse,
} from '@angular/common/http';
import { of, delay } from 'rxjs';

// ── Helpers ──────────────────────────────────────────────────────────────

function ok<T>(body: T, ms = 400) {
  return of(new HttpResponse({ status: 200, body })).pipe(delay(ms));
}
function wrap<T>(data: T)         { return { data }; }
function paginated<T>(items: T[]) { return { data: { items, total: items.length, page: 1, pageSize: 20 } }; }

// ── Mock users ────────────────────────────────────────────────────────────

const STUDENT_USER = {
  id: 'student-001',
  name: 'Jane Muthoni Kamau',
  email: 'j.muthoni@students.ku.ac.ke',
  role: 'student',
  registrationNumber: 'SCT/2021/045',
};

const COORDINATOR_USER = {
  id: 'coordinator-001',
  name: 'Dr. Amina Kariuki',
  email: 'a.kariuki@ku.ac.ke',
  role: 'coordinator',
  registrationNumber: undefined,
};

// ── Mock data ─────────────────────────────────────────────────────────────

const PLACEMENT_PROGRESS: any = {
  placement: {
    id: 'placement-001',
    studentId: 'student-001',
    companyId: 'company-001',
    companyName: 'Safaricom PLC',
    department: 'Software Engineering',
    location: 'Westlands, Nairobi',
    startDate: '2025-02-03',
    endDate: '2025-05-15',
    status: 'active',
  },
  daysTotal: 101,
  daysElapsed: 66,
  daysRemaining: 35,
  completionPercent: 65,
};

const WEEKLY_LOGS: any[] = [
  { id: 'log-7', studentId: 'student-001', placementId: 'placement-001', weekNumber: 7, weekStart: '2025-03-31', weekEnd: '2025-04-04', activityDescription: 'Worked on REST API integration.', status: 'submitted', submittedAt: '2025-04-04' },
  { id: 'log-6', studentId: 'student-001', placementId: 'placement-001', weekNumber: 6, weekStart: '2025-03-24', weekEnd: '2025-03-28', activityDescription: 'Unit testing and code review.', status: 'reviewed', submittedAt: '2025-03-28' },
  { id: 'log-5', studentId: 'student-001', placementId: 'placement-001', weekNumber: 5, weekStart: '2025-03-17', weekEnd: '2025-03-21', activityDescription: '', status: 'missing' },
  { id: 'log-4', studentId: 'student-001', placementId: 'placement-001', weekNumber: 4, weekStart: '2025-03-10', weekEnd: '2025-03-14', activityDescription: 'Database schema design.', status: 'submitted', fileUrl: '/uploads/log4.pdf', submittedAt: '2025-03-14' },
  { id: 'log-3', studentId: 'student-001', placementId: 'placement-001', weekNumber: 3, weekStart: '2025-03-03', weekEnd: '2025-03-07', activityDescription: 'Environment setup.', status: 'submitted', submittedAt: '2025-03-07' },
  { id: 'log-2', studentId: 'student-001', placementId: 'placement-001', weekNumber: 2, weekStart: '2025-02-24', weekEnd: '2025-02-28', activityDescription: 'Team introductions.', status: 'submitted', submittedAt: '2025-02-28' },
  { id: 'log-1', studentId: 'student-001', placementId: 'placement-001', weekNumber: 1, weekStart: '2025-02-17', weekEnd: '2025-02-21', activityDescription: 'First week at Safaricom.', status: 'submitted', submittedAt: '2025-02-21' },
];

const NOTIFICATIONS: any[] = [
  { id: 'n-1', type: 'danger',  message: 'Week 5 log is overdue — submit before Friday', createdAt: new Date(Date.now() - 2 * 86400000).toISOString(), read: false },
  { id: 'n-2', type: 'warning', message: 'Upcoming field visit scheduled for April 18',  createdAt: new Date().toISOString(), read: false },
  { id: 'n-3', type: 'info',    message: 'Dr. Wangeci reviewed your Week 4 log',          createdAt: new Date(Date.now() - 3 * 86400000).toISOString(), read: true },
];

const KPIS: any = {
  totalStudents: 247,
  placedPercent: 89,
  visitedPercent: 34,
  missingLogsCount: 18,
  onTrackPercent: 71,
};

const URGENT_FLAGS: any[] = [
  { student: { id: 's2', name: 'Kevin Otieno',  registrationNumber: 'SCT/2021/091', status: 'active'  }, issue: '3 logs missing' },
  { student: { id: 's3', name: 'Amara Wekesa',  registrationNumber: 'SCT/2021/067', status: 'pending' }, issue: 'No supervisor assigned' },
  { student: { id: 's4', name: 'Brian Mutua',   registrationNumber: 'SCT/2021/023', status: 'active'  }, issue: '2 logs missing' },
];

const STUDENTS: any[] = [
  { id: 'student-001', name: 'Jane Muthoni Kamau', registrationNumber: 'SCT/2021/045', email: 'j.muthoni@students.ku.ac.ke', phone: '+254 700 123 456', school: 'Science & Technology', yearOfStudy: 3, status: 'active'    },
  { id: 's2',          name: 'Kevin Otieno',        registrationNumber: 'SCT/2021/091', email: 'k.otieno@students.ku.ac.ke',  phone: '+254 701 234 567', school: 'Science & Technology', yearOfStudy: 3, status: 'pending'   },
  { id: 's3',          name: 'Amara Wekesa',        registrationNumber: 'SCT/2021/067', email: 'a.wekesa@students.ku.ac.ke', phone: '+254 702 345 678', school: 'Science & Technology', yearOfStudy: 3, status: 'pending'   },
  { id: 's4',          name: 'Brian Mutua',         registrationNumber: 'SCT/2021/023', email: 'b.mutua@students.ku.ac.ke',  phone: '+254 703 456 789', school: 'Science & Technology', yearOfStudy: 3, status: 'active'    },
  { id: 's5',          name: 'Grace Achieng',       registrationNumber: 'SCT/2021/034', email: 'g.achieng@students.ku.ac.ke', phone: '+254 704 567 890', school: 'Science & Technology', yearOfStudy: 3, status: 'completed' },
];

const LECTURERS: any[] = [
  { id: 'l1', name: 'Dr. Ruth Wangeci',  email: 'r.wangeci@ku.ac.ke',  phone: '+254 722 987 654', type: 'university', maxStudents: 15, assignedStudents: 12 },
  { id: 'l2', name: 'Dr. James Mutai',   email: 'j.mutai@ku.ac.ke',    phone: '+254 733 456 789', type: 'university', maxStudents: 15, assignedStudents: 8  },
  { id: 'l3', name: 'Dr. Peter Njoroge', email: 'p.njoroge@ku.ac.ke',  phone: '+254 711 234 567', type: 'university', maxStudents: 15, assignedStudents: 15 },
  { id: 'l4', name: 'Dr. Sarah Mwende',  email: 's.mwende@ku.ac.ke',   phone: '+254 720 876 543', type: 'university', maxStudents: 15, assignedStudents: 5  },
];

const COMPANIES: any[] = [
  { id: 'c1', name: 'Safaricom PLC',      location: 'Westlands, Nairobi',       contactPerson: 'HR Manager', contactPhone: '+254 722 000 001', contactEmail: 'hr@safaricom.co.ke',  placementHistory: 4, activeStudents: 28 },
  { id: 'c2', name: 'KCB Group',          location: 'Upper Hill, Nairobi',      contactPerson: 'HR Manager', contactPhone: '+254 711 000 002', contactEmail: 'hr@kcbgroup.com',     placementHistory: 5, activeStudents: 22 },
  { id: 'c3', name: 'Nation Media Group', location: 'Industrial Area, Nairobi', contactPerson: 'HR Manager', contactPhone: '+254 733 000 003', contactEmail: 'hr@nationmedia.com',  placementHistory: 3, activeStudents: 18 },
  { id: 'c4', name: 'Equity Bank',        location: 'Upper Hill, Nairobi',      contactPerson: 'HR Manager', contactPhone: '+254 720 000 004', contactEmail: 'hr@equitybank.co.ke', placementHistory: 5, activeStudents: 15 },
  { id: 'c5', name: 'Airtel Kenya',       location: 'Upperhill, Nairobi',       contactPerson: 'HR Manager', contactPhone: '+254 700 000 005', contactEmail: 'hr@airtel.co.ke',     placementHistory: 2, activeStudents: 10 },
  { id: 'c6', name: 'Kenya Power',        location: 'Stima Plaza, Nairobi',     contactPerson: 'HR Manager', contactPhone: '+254 719 000 006', contactEmail: 'hr@kplc.co.ke',       placementHistory: 3, activeStudents: 12 },
];

// ── Route interceptor ─────────────────────────────────────────────────────

export const mockApiInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const { url, method, body } = req;

  // ── Auth login ──
  if (url.includes('/auth/login') && method === 'POST') {
    const payload = body as { email: string; password: string; role?: string };

    // Use the role field sent by the login form, fall back to email detection
    const isCoordinator =
      payload.role === 'coordinator' ||
      (!payload.role && payload.email.toLowerCase().includes('coord'));

    const user = isCoordinator ? COORDINATOR_USER : STUDENT_USER;

    return ok({
      access_token: `mock-jwt-${user.role}-token`,
      token_type: 'bearer',
      user,
    });
  }

  // ── Students ──
  if (url.match(/\/students\/[^/]+\/placement-progress/)) {
    return ok(wrap(PLACEMENT_PROGRESS));
  }
  if (url.match(/\/students\/[^/]+\/notifications/)) {
    return ok(wrap(NOTIFICATIONS));
  }
  if (url.match(/\/students\/[^/]+$/) && method === 'GET') {
    return ok(wrap({ ...STUDENT_USER, phone: '+254 700 123 456', school: 'School of Science & Technology', yearOfStudy: 3, status: 'active' }));
  }
  if (url.includes('/students') && method === 'GET') {
    return ok(paginated(STUDENTS));
  }
  if (url.match(/\/students\/[^/]+\/assign-supervisor/) && method === 'PATCH') {
    return ok({}, 300);
  }

  // ── Logs ──
  if (url.includes('/logs/draft')) {
    return ok({}, 300);
  }
  if (url.includes('/logs') && method === 'GET') {
    return ok(paginated(WEEKLY_LOGS));
  }
  if (url.includes('/logs') && method === 'POST') {
    const newLog = {
      id: `log-${Date.now()}`,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      weekNumber: 8,
      weekStart: '2025-04-07',
      weekEnd: '2025-04-11',
      activityDescription: (body as any)?.activityDescription ?? '',
    };
    return ok(wrap(newLog), 900);
  }

  // ── Analytics ──
  if (url.includes('/analytics/kpis'))          { return ok(wrap(KPIS)); }
  if (url.includes('/analytics/urgent-flags'))  { return ok(wrap(URGENT_FLAGS)); }

  // ── Supervisors / Lecturers ──
  if (url.includes('/supervisors') && method === 'GET')  { return ok(wrap(LECTURERS)); }
  if (url.includes('/supervisors') && method === 'POST') {
    const created = { id: `l${Date.now()}`, ...(body as object), assignedStudents: 0 };
    return ok(wrap(created), 600);
  }

  // ── Companies ──
  if (url.includes('/companies') && method === 'GET')  { return ok(wrap(COMPANIES)); }
  if (url.includes('/companies') && method === 'POST') {
    const created = { id: `c${Date.now()}`, ...(body as object), activeStudents: 0, placementHistory: 0 };
    return ok(wrap(created), 600);
  }

  // Pass through anything unmatched
  return next(req);
};
