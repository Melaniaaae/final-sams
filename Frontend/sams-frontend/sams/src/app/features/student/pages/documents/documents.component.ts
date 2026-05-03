import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AuthService } from '../../../../core/services/auth.service';
import { LogbookService } from '../../services/logbook.service';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

interface UploadedDocument {
  id: string;
  name: string;
  type: 'introduction_letter' | 'field_visit' | 'final_report' | 'other';
  sizeKb: number;
  uploadedAt: string;
  status: 'approved' | 'pending' | 'rejected';
  url: string;
}

interface UploadSlot {
  key: string;
  label: string;
  hint: string;
  file: File | null;
  uploading: boolean;
  done: boolean;
}

@Component({
  selector: 'app-documents',
  standalone: true,
  imports: [CommonModule, FileUploadComponent, StatusBadgeComponent],
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss'],
})
export class DocumentsComponent implements OnInit {
  private auth = inject(AuthService);
  private logbookService = inject(LogbookService);

  documents = signal<UploadedDocument[]>([]);

  ngOnInit(): void {
    const studentId = this.auth.currentUser?.id ?? '';
    this.logbookService.getWeeklyLogs(studentId).subscribe({
      next: (logs) => {
        const fileDocs: UploadedDocument[] = logs
          .filter(l => !!l.fileUrl)
          .map(l => ({
            id: l.id,
            name: `Logbook_Week_${l.weekNumber}.pdf`,
            type: 'other',
            sizeKb: 0,
            uploadedAt: l.submittedAt ? l.submittedAt.split('T')[0] : '',
            status: 'approved',
            url: l.fileUrl!
          }));
        this.documents.set(fileDocs);
      }
    });
  }

  uploadSlots = signal<UploadSlot[]>([
    { key: 'field_visit',   label: 'Field Visit Report',    hint: 'Signed by station supervisor — PDF only', file: null, uploading: false, done: false },
    { key: 'final_report',  label: 'Final Attachment Report', hint: 'Submitted after attachment ends — PDF only', file: null, uploading: false, done: false },
  ]);

  onFileSelected(slotKey: string, file: File): void {
    this.uploadSlots.update((slots) =>
      slots.map((s) => (s.key === slotKey ? { ...s, file } : s))
    );
  }

  uploadSlot(slotKey: string): void {
    const slot = this.uploadSlots().find((s) => s.key === slotKey);
    if (!slot?.file) return;

    // Set uploading state
    this.uploadSlots.update((slots) =>
      slots.map((s) => (s.key === slotKey ? { ...s, uploading: true } : s))
    );

    // Simulate upload (replace with real HTTP call)
    setTimeout(() => {
      const newDoc: UploadedDocument = {
        id: `d${Date.now()}`,
        name: slot.file!.name,
        type: slotKey as UploadedDocument['type'],
        sizeKb: Math.round(slot.file!.size / 1024),
        uploadedAt: new Date().toISOString().split('T')[0],
        status: 'pending',
        url: '#',
      };

      this.documents.update((prev) => [newDoc, ...prev]);
      this.uploadSlots.update((slots) =>
        slots.map((s) =>
          s.key === slotKey ? { ...s, uploading: false, done: true, file: null } : s
        )
      );
    }, 1800);
  }

  formatKb(kb: number): string {
    return kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`;
  }

  docIcon(type: UploadedDocument['type']): string {
    const icons: Record<string, string> = {
      introduction_letter: '📄',
      field_visit:         '🗂️',
      final_report:        '📋',
      other:               '📎',
    };
    return icons[type] ?? '📎';
  }

  statusVariant(status: UploadedDocument['status']): 'active' | 'pending' | 'missing' {
    return status === 'approved' ? 'active' : status === 'rejected' ? 'missing' : 'pending';
  }

  trackById(_: number, d: UploadedDocument): string { return d.id; }
  trackByKey(_: number, s: UploadSlot): string { return s.key; }
}
