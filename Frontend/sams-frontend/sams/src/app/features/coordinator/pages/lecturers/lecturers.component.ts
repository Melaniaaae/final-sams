import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { CoordinatorService } from '../../services/coordinator.service';
import { Supervisor } from '../../../../shared/models';

@Component({
  selector: 'app-lecturers',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './lecturers.component.html',
  styleUrls: ['./lecturers.component.scss'],
})
export class LecturersComponent implements OnInit {
  private coordService = inject(CoordinatorService);
  private fb = inject(FormBuilder);

  lecturers = signal<Supervisor[]>([]);
  isLoading = signal(true);
  showForm = signal(false);
  isSaving = signal(false);
  errorMsg = signal<string | null>(null);

  form = this.fb.group({
    name:  ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    maxStudents: [15, [Validators.required, Validators.min(1), Validators.max(30)]],
  });

  readonly MAX_STUDENTS = 15;

  ngOnInit(): void {
    this.coordService.getLecturers().subscribe({
      next: (list) => {
        this.lecturers.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  capacityPercent(l: Supervisor): number {
    const assigned = l.assignedStudents ?? 0;
    const max = l.maxStudents ?? this.MAX_STUDENTS;
    return Math.round((assigned / max) * 100);
  }

  isAtCapacity(l: Supervisor): boolean {
    return (l.assignedStudents ?? 0) >= (l.maxStudents ?? this.MAX_STUDENTS);
  }

  initials(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0].toUpperCase())
      .join('');
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    this.form.reset({ maxStudents: 15 });
    this.errorMsg.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSaving.set(true);
    const { name, email, phone, maxStudents } = this.form.value;

    this.coordService
      .createLecturer({ name: name!, email: email!, phone: phone!, maxStudents: maxStudents!, type: 'university' })
      .subscribe({
        next: (created) => {
          this.lecturers.update((prev) => [created, ...prev]);
          this.isSaving.set(false);
          this.showForm.set(false);
          this.form.reset({ maxStudents: 15 });
        },
        error: () => {
          this.errorMsg.set('Could not save. Please try again.');
          this.isSaving.set(false);
        },
      });
  }

  trackById(_: number, l: Supervisor): string { return l.id; }
}
