import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../shared/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginComponent {
  private fb   = inject(FormBuilder);
  private auth = inject(AuthService);

  isLoading    = signal(false);
  errorMsg     = signal<string | null>(null);
  showPassword = signal(false);
  selectedRole = signal<UserRole>('student');

  form = this.fb.group({
    email:    ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
  });

  get emailCtrl()    { return this.form.controls.email; }
  get passwordCtrl() { return this.form.controls.password; }

  selectRole(role: UserRole): void {
    this.selectedRole.set(role);
    this.errorMsg.set(null);
  }

  togglePassword(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);

    const payload = {
      email: this.form.value.email!,
      password: this.form.value.password!,
      role: this.selectedRole(),
    };

    this.auth.login(payload).subscribe({
      next: () => {
        // 🔥 IMPORTANT: stop spinner (even though redirect happens)
        this.isLoading.set(false);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.errorMsg.set(this.extractErrorMessage(err));
      },
    });
  }

  private extractErrorMessage(err: any): string {
    if (err.name === 'TimeoutError' || err.message?.includes('Timeout')) {
      return 'Server is not responding. Please make sure the backend is running and not paused.';
    }

    if (err.status === 0) {
      return 'Cannot connect to server. Make sure FastAPI is running on port 8000.';
    }

    if (err.status === 401) {
      return 'Incorrect email or password. Please try again.';
    }

    if (err.status === 422 && err.error?.detail) {
      const detail = err.error.detail;
      if (Array.isArray(detail)) {
        return detail
          .map((d: any) => {
            const field = d.loc?.[d.loc.length - 1] ?? 'field';
            return `${field}: ${d.msg}`;
          })
          .join('. ');
      }
      return String(detail);
    }

    if (err.error?.detail) {
      return typeof err.error.detail === 'string'
        ? err.error.detail
        : JSON.stringify(err.error.detail);
    }

    return err.message
      ? String(err.message)
      : 'Login failed. Please try again.';
  }
}