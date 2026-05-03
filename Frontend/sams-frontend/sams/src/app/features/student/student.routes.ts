import { Routes } from '@angular/router';

export const STUDENT_ROUTES: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./pages/dashboard/dashboard.component').then(
        (m) => m.StudentDashboardComponent
      ),
  },
  {
    path: 'logbook',
    loadComponent: () =>
      import('./pages/logbook/logbook.component').then(
        (m) => m.LogbookComponent
      ),
  },
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent
      ),
  },
  {
    path: 'documents',
    loadComponent: () =>
      import('./pages/documents/documents.component').then(
        (m) => m.DocumentsComponent
      ),
  },
];
