import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppNotification } from '../../models';

@Component({
  selector: 'app-notification-dropdown',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="notif-card">
      <div class="card-head">
        <span class="card-title">Notifications</span>
        <span class="mark-read" (click)="markAll()">Mark all read</span>
      </div>

      <div *ngIf="notifications.length > 0; else noNotifs">
        <div
          class="notif-item"
          *ngFor="let n of notifications; trackBy: trackById"
          [class.unread]="!n.read"
        >
          <div class="notif-dot" [ngClass]="'dot--' + n.type"></div>
          <div class="notif-body">
            <div class="notif-text">{{ n.message }}</div>
            <div class="notif-time">{{ n.createdAt | date:'MMM d · h:mm a' }}</div>
          </div>
        </div>
      </div>

      <ng-template #noNotifs>
        <div class="empty-notifs">You're all caught up!</div>
      </ng-template>
    </div>
  `,
  styles: [`
    .notif-card {
      background: #ffffff;
      border: 1px solid #d4ecde;
      border-radius: 12px;
      padding: 20px;
    }
    .card-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 14px;
    }
    .card-title {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      font-weight: 600;
      color: #0A231C;
    }
    .mark-read {
      font-size: 12px;
      color: #6bb890;
      cursor: pointer;
      font-weight: 500;
    }
    .mark-read:hover { text-decoration: underline; }
    .notif-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 8px;
      background: #F1F9F4;
      border: 1px solid #d4ecde;
      margin-bottom: 6px;
      transition: background 0.12s;
    }
    .notif-item:last-child { margin-bottom: 0; }
    .notif-item.unread { border-left: 3px solid #6bb890; }
    .notif-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
      margin-top: 5px;
    }
    .dot--info    { background: #6bb890; }
    .dot--warning { background: #f0a500; }
    .dot--danger  { background: #e05a4e; }
    .notif-text {
      font-size: 12px;
      color: #1A1A1A;
      line-height: 1.5;
    }
    .notif-time {
      font-size: 10px;
      color: #4a6e5a;
      margin-top: 3px;
    }
    .empty-notifs {
      padding: 20px 0;
      text-align: center;
      font-size: 13px;
      color: #4a6e5a;
    }
  `],
})
export class NotificationDropdownComponent {
  @Input() notifications: AppNotification[] = [];

  markAll(): void {
    this.notifications.forEach((n) => (n.read = true));
  }

  trackById(_: number, n: AppNotification): string { return n.id; }
}
