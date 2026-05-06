import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap, catchError, throwError, timeout } from 'rxjs';
import { AuthUser, LoginPayload } from '../../shared/models';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http   = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly TOKEN_KEY = 'sams_token';
  private readonly USER_KEY  = 'sams_user';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(
    this.loadUserFromStorage()
  );

  currentUser$ = this.currentUserSubject.asObservable();

  get currentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  get isLoggedIn(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }

  login(payload: LoginPayload): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/login`, payload)
      .pipe(
        timeout(10000), // Stop waiting if backend hangs
        tap((res: any) => {
          console.log('Raw login response:', res);
          this.handleAuthSuccess(res);
        }),
        catchError((err) => throwError(() => err))
      );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    this.router.navigate(['/auth/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  private handleAuthSuccess(res: any): void {
    // ✅ Handle both shapes:
    // Shape A — direct:  { access_token, token_type, user }
    // Shape B — wrapped: { data: { access_token, token_type, user } }
    const payload = res?.data ?? res;

    const token = payload?.access_token;
    const user  = payload?.user;

    if (!token || !user) {
      console.error('Login response missing token or user:', payload);
      return;
    }

    const authUser: AuthUser = {
      id:                 user.id                 ?? user.reg_no ?? '',
      name:               user.name               ?? '',
      email:              user.email              ?? '',
      role:               user.role               ?? 'student',
      registrationNumber: user.registrationNumber ?? user.id ?? null,
      token:              token,
    };

    localStorage.setItem(this.TOKEN_KEY, token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(authUser));
    this.currentUserSubject.next(authUser);

    console.log('Auth user stored:', authUser);

    // Navigate based on role
    const destination = authUser.role === 'coordinator'
      ? '/coordinator/dashboard'
      : '/student/dashboard';

    this.router.navigate([destination]).then((navigated) => {
      console.log('Navigation result:', navigated);
    });
  }

  private loadUserFromStorage(): AuthUser | null {
    try {
      const raw = localStorage.getItem(this.USER_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  }
}