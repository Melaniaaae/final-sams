import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { forkJoin, Subject, takeUntil } from 'rxjs';

import { StudentService } from '../../services/student.service';
import { LogbookService } from '../../services/logbook.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PlacementProgress, WeeklyLog, AppNotification } from '../../../../shared/models';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { ProgressRingComponent } from '../../../../shared/components/progress-ring/progress-ring.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { NotificationDropdownComponent } from '../../../../shared/components/notification-dropdown/notification-dropdown.component';

export interface CalendarCell {
  day: number | null;
  submitted: boolean;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CardComponent,
    ProgressRingComponent,
    StatusBadgeComponent,
    NotificationDropdownComponent,
  ],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
})
export class StudentDashboardComponent implements OnInit, OnDestroy {
  private studentService = inject(StudentService);
  private logbookService = inject(LogbookService);
  private authService   = inject(AuthService);
  private destroy$      = new Subject<void>();

  currentUser = this.authService.currentUser;

  // Plain properties — no signals, no getters that create objects
  progress: PlacementProgress | null = null;
  recentLogs: WeeklyLog[] = [];
  notifications: AppNotification[] = [];
  isLoading = true;
  error: string | null = null;

  // ✅ FIX: Pre-computed once, stored as a property — NOT a getter
  calendarCells: CalendarCell[] = [];

  logsSubmitted = 0;
  totalWeeks    = 12;

  ngOnInit(): void {
  const user = this.authService.currentUser;

  // 🚨 STOP if user not ready
  if (!user?.id) {
    this.error = 'User not authenticated';
    this.isLoading = false;
    return;
  }

  const studentId = user.id;

  forkJoin({
    progress:      this.studentService.getPlacementProgress(studentId),
    logs:          this.logbookService.getWeeklyLogs(studentId),
    notifications: this.studentService.getNotifications(studentId),
  })
    .pipe(takeUntil(this.destroy$))
    .subscribe({
      next: ({ progress, logs, notifications }) => {
        this.progress      = progress;
        this.recentLogs    = logs.slice(0, 8);
        this.notifications = notifications;
        this.isLoading     = false;

        this.logsSubmitted = this.recentLogs.filter(
          (l) => l.status === 'submitted' || l.status === 'reviewed'
        ).length;

        this.totalWeeks = progress ? Math.ceil(progress.daysTotal / 7) : 12;

        this.calendarCells = this._buildCalendar(this.recentLogs);
      },
      error: (err) => {
        this.error     = 'Failed to load dashboard data. Please refresh.';
        this.isLoading = false;
        console.error('Dashboard load error:', err);
      },
    });
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackByLogId(_: number, log: WeeklyLog): string { return log.id; }

  private _buildCalendar(logs: WeeklyLog[]): CalendarCell[] {
    const now       = new Date();
    const year      = now.getFullYear();
    const month     = now.getMonth();
    const today     = now.getDate();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7;

    const submittedDays = new Set(
      logs
        .filter((l) => l.status === 'submitted' || l.status === 'reviewed')
        .map((l) => new Date(l.weekStart).getDate())
    );

    const cells: CalendarCell[] = [];

    for (let i = 0; i < firstDow; i++) {
      cells.push({ day: null, submitted: false, isToday: false, isPast: false, isFuture: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        submitted: submittedDays.has(d),
        isToday: d === today,
        isPast: d < today,
        isFuture: d > today,
      });
    }
    const remainder = cells.length % 7;
    if (remainder !== 0) {
      for (let i = 0; i < 7 - remainder; i++) {
        cells.push({ day: null, submitted: false, isToday: false, isPast: false, isFuture: false });
      }
    }
    return cells;
  }
}