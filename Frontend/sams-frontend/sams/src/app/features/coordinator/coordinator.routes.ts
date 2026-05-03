import { Routes } from '@angular/router';

export const COORDINATOR_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/coordinator-dashboard.component').then(
        (m) => m.CoordinatorDashboardComponent
      ),
  },
  {
    path: 'students',
    loadComponent: () =>
      import('./pages/students/students.component').then(
        (m) => m.StudentsComponent
      ),
  },
  {
    path: 'lecturers',
    loadComponent: () =>
      import('./pages/lecturers/lecturers.component').then(
        (m) => m.LecturersComponent
      ),
  },
  {
    path: 'companies',
    loadComponent: () =>
      import('./pages/companies/companies.component').then(
        (m) => m.CompaniesComponent
      ),
  },
];
