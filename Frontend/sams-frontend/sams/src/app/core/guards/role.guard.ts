import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../../shared/models';

/**
 * Factory function — call as `roleGuard('coordinator')` in route config.
 */
export const roleGuard = (requiredRole: UserRole): CanActivateFn => {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const user = auth.currentUser;

    if (!user) {
      router.navigate(['/auth/login']);
      return false;
    }

    if (user.role !== requiredRole) {
      // Redirect to the user's own portal instead of a blank error page
      const fallback = user.role === 'coordinator' ? '/coordinator' : '/student';
      router.navigate([fallback]);
      return false;
    }

    return true;
  };
};
