import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Subject, switchMap } from 'rxjs';

import { CoordinatorService } from '../../services/coordinator.service';
import { Student, AttachmentStatus } from '../../../../shared/models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-students',
  standalone: true,
  imports: [CommonModule, FormsModule, StatusBadgeComponent],
  templateUrl: './students.component.html',
  styleUrls: ['./students.component.scss'],
})
export class StudentsComponent implements OnInit {
  private coordService = inject(CoordinatorService);

  students = signal<Student[]>([]);
  isLoading = signal(true);
  searchQuery = signal('');
  statusFilter = signal<AttachmentStatus | ''>('');

  total = signal(0);
  page = signal(1);
  pageSize = 20;

  private search$ = new Subject<string>();

  filteredStudents = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return this.students().filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.registrationNumber.toLowerCase().includes(q)
    );
  });

  ngOnInit(): void {
    this.loadStudents();

    // Debounce search → server-side query
    this.search$
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        switchMap((q) =>
          this.coordService.getStudents({ search: q, status: this.statusFilter() || undefined })
        )
      )
      .subscribe((res) => {
        this.students.set(res.items);
        this.total.set(res.total);
      });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
    this.search$.next(query);
  }

  onStatusFilter(status: AttachmentStatus | ''): void {
    this.statusFilter.set(status);
    this.loadStudents();
  }

  loadStudents(): void {
    this.isLoading.set(true);
    this.coordService
      .getStudents({ status: this.statusFilter() || undefined, page: this.page(), pageSize: this.pageSize })
      .subscribe({
        next: (res) => {
          this.students.set(res.items);
          this.total.set(res.total);
          this.isLoading.set(false);
        },
        error: () => this.isLoading.set(false),
      });
  }

  getStatusVariant(
  status?: AttachmentStatus
): 'active' | 'pending' | 'completed' {
  if (!status) return 'pending'; // fallback

  return status;
}

  trackById(_: number, s: Student): string { return s.id; }
}
