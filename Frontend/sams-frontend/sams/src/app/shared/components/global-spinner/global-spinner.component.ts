import { Component, inject } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-global-spinner',
  standalone: true,
  imports: [CommonModule, AsyncPipe],
  template: `
    <div class="overlay" *ngIf="loading.isLoading$ | async">
      <div class="spinner-wrap">
        <div class="ring"></div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      z-index: 9999;
      background: rgba(10, 35, 28, 0.4);
      display: flex;
      align-items: center;
      justify-content: center;
      pointer-events: none;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .ring {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(197,232,209,.25);
      border-top-color: #C5E8D1;
      border-radius: 50%;
      animation: spin 0.75s linear infinite;
    }
  `],
})
export class GlobalSpinnerComponent {
  loading = inject(LoadingService);
}