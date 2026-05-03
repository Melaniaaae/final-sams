import {
  Component,
  EventEmitter,
  Input,
  Output,
  HostListener,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="upload-zone"
      [class.drag-over]="isDragOver()"
      (click)="fileInput.click()"
    >
      <div class="upload-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
             stroke="#0A231C" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
          <polyline points="17 8 12 3 7 8"/>
          <line x1="12" y1="3" x2="12" y2="15"/>
        </svg>
      </div>

      <div *ngIf="!selectedFile(); else fileSelected">
        <p class="upload-title">{{ label }}</p>
        <p class="upload-hint">{{ hint }}</p>
      </div>

      <ng-template #fileSelected>
        <p class="upload-title selected">{{ selectedFile()!.name }}</p>
        <p class="upload-hint">{{ formatBytes(selectedFile()!.size) }}</p>
      </ng-template>

      <input
        #fileInput
        type="file"
        [accept]="accept"
        hidden
        (change)="onFileChange($event)"
      />
    </div>
  `,
  styles: [`
    .upload-zone {
      border: 1.5px dashed #9dd4b4;
      border-radius: 10px;
      padding: 24px;
      text-align: center;
      background: #F1F9F4;
      cursor: pointer;
      transition: background 0.15s, border-color 0.15s;
    }
    .upload-zone:hover, .upload-zone.drag-over {
      background: #e2f4ea;
      border-color: #6bb890;
    }
    .upload-icon {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #C5E8D1;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 10px;
    }
    .upload-title {
      font-size: 13px;
      font-weight: 500;
      color: #1A1A1A;
      margin: 0;
    }
    .upload-title.selected { color: #0A231C; }
    .upload-hint {
      font-size: 11px;
      color: #4a6e5a;
      margin: 4px 0 0;
    }
  `],
})
export class FileUploadComponent {
  @Input() label = 'Drop file here or click to browse';
  @Input() hint = 'PDF or image, max 5 MB';
  @Input() accept = '.pdf,image/*';

  @Output() fileSelected = new EventEmitter<File>();

  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);

  @HostListener('dragover', ['$event'])
  onDragOver(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(true);
  }

  @HostListener('dragleave')
  onDragLeave(): void {
    this.isDragOver.set(false);
  }

  @HostListener('drop', ['$event'])
  onDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDragOver.set(false);
    const file = e.dataTransfer?.files[0];
    if (file) this.emitFile(file);
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.emitFile(file);
  }

  private emitFile(file: File): void {
    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  formatBytes(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1_048_576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1_048_576).toFixed(1)} MB`;
  }
}
