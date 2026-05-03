import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ring-container" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="viewBox">

        <!-- Track -->
        <circle
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          fill="none"
          stroke="#e8f5ee"
          [attr.stroke-width]="stroke"
        />

        <!-- Progress arc -->
        <circle
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          fill="none"
          stroke="#0A231C"
          [attr.stroke-width]="stroke"
          [attr.stroke-dasharray]="dashArray"
          [attr.stroke-dashoffset]="dashOffset"
          stroke-linecap="round"
          [attr.transform]="'rotate(-90 ' + center + ' ' + center + ')'"
        />
      </svg>

      <!-- Label -->
      <div class="ring-label">
        <span class="ring-pct">{{ percent }}%</span>
        <span class="ring-unit">done</span>
      </div>
    </div>
  `,
  styles: [`
    .ring-container {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto;
    }

    .ring-label {
      position: absolute;
      text-align: center;
      pointer-events: none;
    }

    .ring-pct {
      display: block;
      font-size: 18px;
      font-weight: 600;
      color: #0A231C;
      line-height: 1;
    }

    .ring-unit {
      display: block;
      font-size: 10px;
      color: #4a6e5a;
      margin-top: 2px;
    }
  `],
})
export class ProgressRingComponent {
  @Input() percent = 0;
  @Input() radius = 46;
  @Input() stroke = 8;

  get size(): number {
    return (this.radius + this.stroke) * 2;
  }

  get center(): number {
    return this.radius + this.stroke;
  }

  get viewBox(): string {
    return `0 0 ${this.size} ${this.size}`;
  }

  get circumference(): number {
    return 2 * Math.PI * this.radius;
  }

  get dashArray(): string {
    return `${this.circumference}`;
  }

  get dashOffset(): number {
    const filled = this.circumference * (this.percent / 100);
    return this.circumference - filled;
  }
}