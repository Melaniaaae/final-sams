import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import {
  Student, Supervisor, Company, CoordinatorKPIs,
  ApiResponse, PaginatedResponse, AttachmentStatus,
} from '../../../shared/models';
import { environment } from '../../../../environments/environment';

export interface StudentFilter {
  region?: string;
  companyId?: string;
  supervisorId?: string;
  status?: AttachmentStatus;
  search?: string;
  page?: number;
  pageSize?: number;
}

@Injectable({ providedIn: 'root' })
export class CoordinatorService {
  private readonly http = inject(HttpClient);
  private readonly base = environment.apiUrl;

  // ─── KPIs ─────────────────────────────────────────────────────────────

  getKPIs(): Observable<CoordinatorKPIs> {
    return this.http
      .get<ApiResponse<CoordinatorKPIs>>(`${this.base}/analytics/kpis`)
      .pipe(map((r) => r.data));
  }

  // ─── Students ─────────────────────────────────────────────────────────

  getStudents(filter: StudentFilter = {}): Observable<PaginatedResponse<Student>> {
    let params = new HttpParams();
    if (filter.search)       params = params.set('search', filter.search);
    if (filter.status)       params = params.set('status', filter.status);
    if (filter.region)       params = params.set('region', filter.region);
    if (filter.companyId)    params = params.set('companyId', filter.companyId);
    if (filter.supervisorId) params = params.set('supervisorId', filter.supervisorId);
    if (filter.page)         params = params.set('page', filter.page);
    if (filter.pageSize)     params = params.set('pageSize', filter.pageSize ?? 20);

    return this.http
      .get<ApiResponse<PaginatedResponse<Student>>>(`${this.base}/students`, { params })
      .pipe(map((r) => r.data));
  }

  assignSupervisor(studentId: string, supervisorId: string): Observable<void> {
    return this.http.patch<void>(
      `${this.base}/students/${studentId}/assign-supervisor`,
      { supervisorId }
    );
  }

  getStudentDocuments(studentId: string): Observable<{ id: string; name: string; type: string; url: string; uploadedAt: string }[]> {
    return this.http
      .get<ApiResponse<any[]>>(`${this.base}/students/${encodeURIComponent(studentId)}/documents`)
      .pipe(map((r) => r.data));
  }

  // ─── Lecturers / Supervisors ──────────────────────────────────────────

  getLecturers(): Observable<Supervisor[]> {
    return this.http
      .get<ApiResponse<Supervisor[]>>(`${this.base}/supervisors?type=university`)
      .pipe(map((r) => r.data));
  }

  createLecturer(payload: Partial<Supervisor>): Observable<Supervisor> {
    return this.http
      .post<ApiResponse<Supervisor>>(`${this.base}/supervisors`, payload)
      .pipe(map((r) => r.data));
  }

  // ─── Companies ────────────────────────────────────────────────────────

  getCompanies(): Observable<Company[]> {
    return this.http
      .get<ApiResponse<Company[]>>(`${this.base}/companies`)
      .pipe(map((r) => r.data));
  }

  createCompany(payload: Partial<Company>): Observable<Company> {
    return this.http
      .post<ApiResponse<Company>>(`${this.base}/companies`, payload)
      .pipe(map((r) => r.data));
  }

  // ─── Flags (students missing logs) ────────────────────────────────────

  getUrgentFlags(): Observable<{ student: Student; issue: string }[]> {
    return this.http
      .get<ApiResponse<{ student: Student; issue: string }[]>>(
        `${this.base}/analytics/urgent-flags`
      )
      .pipe(map((r) => r.data));
  }
}
