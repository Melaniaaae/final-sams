import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirect root to login
  { path: '', redirectTo: 'auth/login', pathMatch: 'full' },

  // Auth pages — no guard needed
  {
    path: 'auth',
    loadChildren: () =>
      import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },

  // All authenticated pages share the shell layout
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./shared/components/layout/shell.component').then(
        (m) => m.ShellComponent
      ),
    children: [
      // ── Student pages ─────────────────────────────────────
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/student/pages/dashboard/dashboard.component').then(
            (m) => m.StudentDashboardComponent
          ),
      },
      {
        path: 'logbook',
        loadComponent: () =>
          import('./features/student/pages/logbook/logbook.component').then(
            (m) => m.LogbookComponent
          ),
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./features/student/pages/profile/profile.component').then(
            (m) => m.ProfileComponent
          ),
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('./features/student/pages/documents/documents.component').then(
            (m) => m.DocumentsComponent
          ),
      },
      // ── Coordinator pages ─────────────────────────────────
      {
        path: 'students',
        loadComponent: () =>
          import('./features/coordinator/pages/students/students.component').then(
            (m) => m.StudentsComponent
          ),
      },
      {
        path: 'lecturers',
        loadComponent: () =>
          import('./features/coordinator/pages/lecturers/lecturers.component').then(
            (m) => m.LecturersComponent
          ),
      },
      {
        path: 'companies',
        loadComponent: () =>
          import('./features/coordinator/pages/companies/companies.component').then(
            (m) => m.CompaniesComponent
          ),
      },
    ],
  },

  // 404
  {
    path: '404',
    loadComponent: () =>
      import('./shared/components/not-found/not-found.component').then(
        (m) => m.NotFoundComponent
      ),
  },
  { path: '**', redirectTo: '404' },
];