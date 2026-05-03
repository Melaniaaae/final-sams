import {
  HttpInterceptorFn,
  HttpErrorResponse,
  HttpRequest,
  HttpHandlerFn,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const authService = inject(AuthService);
  const router      = inject(Router);

  const token = authService.getToken();

  // Attach token if available
  const authReq = token
    ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
    : req;

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      // Only logout on 401 — and only if NOT already on the login page
      // (prevents logout → redirect → 401 → logout infinite loop)
      if (err.status === 401 && !router.url.includes('/auth/login')) {
        authService.logout();
      }
      return throwError(() => err);
    })
  );
};