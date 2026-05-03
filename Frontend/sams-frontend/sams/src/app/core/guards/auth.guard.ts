import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = () => {
  const router = inject(Router);

  const token   = localStorage.getItem('sams_token');
  const userRaw = localStorage.getItem('sams_user');

  if (token && userRaw) {
    try {
      JSON.parse(userRaw); // verify it's valid JSON
      return true;
    } catch {
      localStorage.clear();
    }
  }

  return router.createUrlTree(['/auth/login']);
};