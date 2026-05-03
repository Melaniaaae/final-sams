import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { forkJoin } from 'rxjs';

import { CoordinatorService } from '../../services/coordinator.service';
import { CoordinatorKPIs, Student } from '../../../../shared/models';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';

@Component({
  selector: 'app-coordinator-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, StatusBadgeComponent],
  templateUrl: './coordinator-dashboard.component.html',
  styleUrls: ['./coordinator-dashboard.component.scss'],
})
export class CoordinatorDashboardComponent implements OnInit {
  private coordService = inject(CoordinatorService);

  kpis = signal<CoordinatorKPIs | null>(null);
  urgentFlags = signal<{ student: Student; issue: string }[]>([]);
  isLoading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    forkJoin({
      kpis: this.coordService.getKPIs(),
      flags: this.coordService.getUrgentFlags(),
    }).subscribe({
      next: ({ kpis, flags }) => {
        this.kpis.set(kpis);
        this.urgentFlags.set(flags);
        this.isLoading.set(false);
      },
      error: () => {
        this.error.set('Failed to load dashboard data.');
        this.isLoading.set(false);
      },
    });
  }
}
