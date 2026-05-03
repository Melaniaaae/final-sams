import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of, forkJoin } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { StudentService } from '../../services/student.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Student, PlacementProgress, Supervisor } from '../../../../shared/models';
import { ProgressRingComponent } from '../../../../shared/components/progress-ring/progress-ring.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ProgressRingComponent, StatusBadgeComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
})
export class ProfileComponent implements OnInit {
  private studentService = inject(StudentService);
  private auth           = inject(AuthService);

  // Read user directly from auth service — always available
  currentUser = this.auth.currentUser;

  student:  Student | null          = null;
  progress: PlacementProgress | null = null;
  isLoading = true;
  error: string | null = null;

  // Supervisor data — shown from student record if available
  stationSupervisor: Supervisor = {
    id: 'sup-1', name: 'Not assigned yet',
    phone: '—', email: '—', type: 'station',
  };

  universitySupervisor: Supervisor = {
    id: 'sup-2', name: 'Not assigned yet',
    phone: '—', email: '—', type: 'university',
  };

  ngOnInit(): void {
    // ✅ Use the reg_no from the logged-in user directly
    const studentId = this.currentUser?.id ?? '';

    if (!studentId) {
      this.error     = 'Could not identify student. Please log in again.';
      this.isLoading = false;
      return;
    }

    forkJoin({
      student: this.studentService.getStudent(studentId).pipe(
        catchError((err) => {
          console.warn('Student load failed:', err);
          return of(null);
        })
      ),
      progress: this.studentService.getPlacementProgress(studentId).pipe(
        catchError((err) => {
          console.warn('Placement progress load failed:', err);
          return of(null);
        })
      ),
    }).subscribe({
      next: ({ student, progress }) => {
        this.student  = student as Student | null;
        this.progress = progress as PlacementProgress | null;
        
        if (this.progress && this.progress.placement) {
            this.stationSupervisor = {
                id: 'sup-1', 
                name: (this.progress.placement as any).stationSupervisorName || 'Not assigned',
                phone: (this.progress.placement as any).stationSupervisorPhone || '—', 
                email: '—', 
                type: 'station',
            };
        }

        if (this.student) {
            this.universitySupervisor = {
                id: (this.student as any).universitySupervisorId || 'sup-2',
                name: (this.student as any).universitySupervisorName || 'Not assigned yet',
                phone: (this.student as any).universitySupervisorPhone || '—',
                email: '—',
                type: 'university'
            };
        }

        this.isLoading = false;
      },
      error: () => {
        this.error     = 'Failed to load profile data.';
        this.isLoading = false;
      },
    });
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  call(phone: string):  void { window.location.href = `tel:${phone}`; }
  email(addr: string):  void { window.location.href = `mailto:${addr}`; }
}