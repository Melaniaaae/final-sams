import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type BadgeVariant = 'active' | 'pending' | 'completed' | 'missing' | 'neutral';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span class="badge" [ngClass]="'badge--' + variant">
      {{ label ?? status }}
    </span>
  `,
  styles: [`
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 10px;
      border-radius: 99px;
      font-size: 11px;
      font-weight: 500;
      text-transform: capitalize;
    }
    .badge--active    { background: #e8f5ee; color: #1a6e3c; }
    .badge--pending   { background: #fff8e1; color: #b27d00; }
    .badge--completed { background: #e3f2fd; color: #1565c0; }
    .badge--missing   { background: #fde8e7; color: #c0392b; }
    .badge--neutral   { background: #f5f5f5; color: #555; }
  `],
})
export class StatusBadgeComponent {
  @Input() status: BadgeVariant = 'neutral';
  /** Optional override label; defaults to status string */
  @Input() label?: string;

  get variant(): BadgeVariant {
    return this.status;
  }
}
