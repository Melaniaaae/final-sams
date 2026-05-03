import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { LogbookService } from '../../services/logbook.service';
import { AuthService } from '../../../../core/services/auth.service';
import { WeeklyLog, LogStatus } from '../../../../shared/models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';

@Component({
  selector: 'app-logbook',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, StatusBadgeComponent, FileUploadComponent],
  templateUrl: './logbook.component.html',
  styleUrls: ['./logbook.component.scss'],
})
export class LogbookComponent implements OnInit {
  private fb = inject(FormBuilder);
  private logbookService = inject(LogbookService);
  private auth = inject(AuthService);

  logs = signal<WeeklyLog[]>([]);
  isLoading = signal(true);
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  errorMsg = signal<string | null>(null);
  selectedFile = signal<File | null>(null);

  // Current week (mock — replace with real date logic)
  currentWeek = signal(8);
  currentWeekRange = signal('April 7 – April 11, 2025');

  form = this.fb.group({
    activityDescription: ['', [Validators.required, Validators.minLength(50)]],
  });

  get descCtrl() { return this.form.controls.activityDescription; }

  submittedCount = computed(() =>
    this.logs().filter((l) => l.status === 'submitted' || l.status === 'reviewed').length
  );

  totalWeeks = computed(() => this.logs().length || 12);

  ngOnInit(): void {
    const studentId = this.auth.currentUser?.id ?? '';
    this.logbookService.getWeeklyLogs(studentId).subscribe({
      next: (logs) => {
        this.logs.set(logs);
        this.isLoading.set(false);
      },
      error: () => {
        this.errorMsg.set('Could not load your logs. Please refresh.');
        this.isLoading.set(false);
      },
    });
  }

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isSubmitting.set(true);
    this.errorMsg.set(null);
    const studentId = this.auth.currentUser?.id ?? '';

    this.logbookService
      .submitLog(studentId, {
        weekNumber: this.currentWeek(),
        activityDescription: this.descCtrl.value!,
        file: this.selectedFile() ?? undefined,
      })
      .subscribe({
        next: (newLog) => {
          this.logs.update((prev) => [newLog, ...prev]);
          this.form.reset();
          this.selectedFile.set(null);
          this.submitSuccess.set(true);
          this.isSubmitting.set(false);
          setTimeout(() => this.submitSuccess.set(false), 3000);
        },
        error: () => {
          this.errorMsg.set('Submission failed. Please try again.');
          this.isSubmitting.set(false);
        },
      });
  }

  saveDraft(): void {
    const studentId = this.auth.currentUser?.id ?? '';
    this.logbookService.saveDraft(studentId, {
      weekNumber: this.currentWeek(),
      activityDescription: this.descCtrl.value ?? '',
    }).subscribe();
  }

  getStatusVariant(
  status: LogStatus | string | undefined
): 'active' | 'pending' | 'missing' | 'neutral' {

  if (!status) return 'neutral';

  const map: Record<string, 'active' | 'pending' | 'missing' | 'neutral'> = {
    submitted: 'active',
    reviewed: 'active',
    pending: 'pending',
    missing: 'missing',
  };

  return map[status] ?? 'neutral';
}

  trackById(_: number, log: WeeklyLog): string { return log.id; }
}
