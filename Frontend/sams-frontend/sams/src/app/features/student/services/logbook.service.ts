import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { WeeklyLog, LogSubmitPayload, ApiResponse, PaginatedResponse } from '../../../shared/models';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LogbookService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/logs`;

  getWeeklyLogs(studentId: string): Observable<WeeklyLog[]> {
    return this.http
      .get<ApiResponse<PaginatedResponse<WeeklyLog>>>(`${this.base}?studentId=${studentId}`)
      .pipe(map((r) => r.data.items));
  }

  submitLog(studentId: string, payload: LogSubmitPayload): Observable<WeeklyLog> {
    const form = new FormData();
    form.append('studentId', studentId);
    form.append('weekNumber', String(payload.weekNumber));
    form.append('activityDescription', payload.activityDescription);
    if (payload.file) {
      form.append('file', payload.file, payload.file.name);
    }
    return this.http
      .post<ApiResponse<WeeklyLog>>(this.base, form)
      .pipe(map((r) => r.data));
  }

  saveDraft(studentId: string, payload: Partial<LogSubmitPayload>): Observable<void> {
    return this.http.post<void>(`${this.base}/draft`, { studentId, ...payload });
  }
}
