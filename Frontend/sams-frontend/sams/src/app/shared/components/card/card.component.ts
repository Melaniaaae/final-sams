import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type CardVariant = 'default' | 'mint' | 'elevated';

@Component({
  selector: 'app-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card" [ngClass]="'card--' + variant">
      <ng-content />
    </div>
  `,
  styles: [`
    .card {
      background: #ffffff;
      border: 1px solid #d4ecde;
      border-radius: 12px;
      padding: 20px;
    }
    .card--mint {
      background: #C5E8D1;
      border-color: #9dd4b4;
    }
    .card--elevated {
      background: #ffffff;
      border-color: #d4ecde;
      box-shadow: 0 4px 12px rgba(10,35,28,.08);
    }
  `],
})
export class CardComponent {
  @Input() variant: CardVariant = 'default';
}
