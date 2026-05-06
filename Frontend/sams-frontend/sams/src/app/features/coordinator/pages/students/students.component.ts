import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subject, debounceTime, distinctUntilChanged, switchMap } from 'rxjs';
import { catchError, of } from 'rxjs';

import { CoordinatorService } from '../../services/coordinator.service';
import { Student, AttachmentStatus } from '../../../../shared/models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { environment } from '../../../../../environments/environment';

interface Lecturer {
  id: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  assignedStudents: number;
  maxStudents: number;
}

interface StudentDetail {
  registrationNumber: string;
  name: string;
  email: string;
  phone: string;
  department: string;
  stationSupervisorName: string | null;
  stationSupervisorPhone: string | null;
  universitySupervisorId: string | null;
  universitySupervisorName: string | null;
  placement: {
    companyName: string;
    county: string;
    city: string;
    startDate: string;
    endDate: string;
    status: string;
  } | null;
  status: string;
}

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss'],
})
export class StudentsComponent implements OnInit {
  private coordService = inject(CoordinatorService);
  private http         = inject(HttpClient);

  students: Student[] = [];
  isLoading     = true;
  searchQuery   = '';
  statusFilter: AttachmentStatus | '' = '';
  total = 0;
  page  = 1;
  readonly pageSize = 20;

  // ── View modal state ──────────────────────────────────────────────
  showModal        = false;
  selectedStudent: StudentDetail | null = null;
  loadingStudent   = false;
  lecturers: Lecturer[] = [];
  selectedLecturerId    = '';
  assigning        = false;
  assignSuccess    = false;
  assignError: string | null = null;

  private search$ = new Subject<string>();

  get filteredStudents(): Student[] {
    const q = this.searchQuery.toLowerCase();
    return this.students.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q)
    );
  }

  ngOnInit(): void {
    this.loadStudents();

    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) =>
          this.coordService.getStudents({
            search: q,
            status: this.statusFilter || undefined,
          })
        )
      )
      .subscribe((res) => {
        this.students = res.items as unknown as Student[];
        this.total    = res.total;
      });
  }

  onSearch(query: string): void {
    this.searchQuery = query;
    this.search$.next(query);
  }

  onStatusFilter(status: AttachmentStatus | ''): void {
    this.statusFilter = status;
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.coordService
      .getStudents({
        status:   this.statusFilter || undefined,
        page:     this.page,
        pageSize: this.pageSize,
      })
      .subscribe({
        next: (res) => {
          this.students  = res.items as unknown as Student[];
          this.total     = res.total;
          this.isLoading = false;
        },
        error: () => { this.isLoading = false; },
      });
  }

  // ── Open modal ────────────────────────────────────────────────────
  openStudentDetail(registrationNumber: string): void {
    this.showModal        = true;
    this.loadingStudent   = true;
    this.selectedStudent  = null;
    this.selectedLecturerId = '';
    this.assignSuccess    = false;
    this.assignError      = null;

    // Load student profile + lecturers in parallel
    const encodedReg = encodeURIComponent(registrationNumber);

    this.http
  .get<any>(`${environment.apiUrl}/students/${encodedReg}`)
  .pipe(catchError(() => of(null)))
  .subscribe((res) => {
    const d = res?.data ?? res;

    this.selectedStudent = {
      ...d,
      registrationNumber: d.registrationNumber || d.regNo, // SAFE MAPPING
    };

    this.selectedLecturerId = d?.universitySupervisorId ?? '';
    this.loadingStudent = false;
  });

    this.http
      .get<any>(`${environment.apiUrl}/supervisors?type=university`)
      .pipe(catchError(() => of({ data: [] })))
      .subscribe((res) => {
        const data = res?.data ?? res;
        this.lecturers = Array.isArray(data) ? data : [];
      });
  }

  closeModal(): void {
    this.showModal       = false;
    this.selectedStudent = null;
  }

  // ── Assign supervisor ─────────────────────────────────────────────
  assignSupervisor(): void {
  if (!this.selectedStudent || !this.selectedLecturerId) return;

  this.assigning = true;
  this.assignError = null;
  this.assignSuccess = false;

  const regNo = this.selectedStudent.registrationNumber;

  console.log('Assigning supervisor to:', regNo); // DEBUG

  this.http
    .patch<any>(
      `${environment.apiUrl}/students/${encodeURIComponent(regNo)}/assign-supervisor`,
      { supervisorId: this.selectedLecturerId }
    )
    .subscribe({
      next: () => {
        this.assigning = false;
        this.assignSuccess = true;

        const chosen = this.lecturers.find(l => l.id === this.selectedLecturerId);

        if (chosen && this.selectedStudent) {
          this.selectedStudent.universitySupervisorId = chosen.id;
          this.selectedStudent.universitySupervisorName = chosen.name;
        }

        this.loadStudents();
      },
      error: (err) => {
        console.error('Assign error:', err); // DEBUG
        this.assigning = false;
        this.assignError =
          err.error?.detail ?? 'Failed to assign supervisor. Please try again.';
      },
    });
}

 getStatusVariant(
  status?: AttachmentStatus
): 'active' | 'pending' | 'completed' {
  if (!status) return 'pending'; // default fallback

  return status;
}

  trackById(_: number, s: Student): string { return s.id; }
}