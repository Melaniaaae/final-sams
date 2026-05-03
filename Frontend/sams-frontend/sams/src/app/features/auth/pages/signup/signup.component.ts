import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

function endAfterStart(control: AbstractControl): ValidationErrors | null {
  const parent = control.parent;
  if (!parent) return null;
  const start = parent.get('startDate')?.value;
  const end   = control.value;
  if (start && end && new Date(end) <= new Date(start)) {
    return { endBeforeStart: true };
  }
  return null;
}

const KENYA_COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu',
  'Garissa','Homa Bay','Isiolo','Kajiado','Kakamega','Kericho',
  'Kiambu','Kilifi','Kirinyaga','Kisii','Kisumu','Kitui','Kwale',
  'Laikipia','Lamu','Machakos','Makueni','Mandera','Marsabit',
  'Meru','Migori','Mombasa',"Murang'a",'Nairobi','Nakuru','Nandi',
  'Narok','Nyamira','Nyandarua','Nyeri','Samburu','Siaya',
  'Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
];

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})
export class SignupComponent {
  private fb     = inject(FormBuilder);
  private router = inject(Router);
  private http   = inject(HttpClient);

  isLoading    = signal(false);
  errorMsg     = signal<string | null>(null);
  successMsg   = signal<string | null>(null);
  currentStep  = signal(1);

  readonly counties = KENYA_COUNTIES;

  form = this.fb.group({
    // Step 1
    name:               ['', [Validators.required, Validators.minLength(2)]],
    registrationNumber: ['', [Validators.required]],
    email:              ['', [Validators.required, Validators.email]],
    phone:              ['', [Validators.required]],
    password:           ['Sams@2025', [Validators.required, Validators.minLength(6)]],

    // Step 2
    company:            ['', Validators.required],
    county:             ['', Validators.required],
    city:               ['', Validators.required],
    stationSupervisor:  ['', Validators.required],
    stationSupervisorPhone: ['', Validators.required],
    startDate:          ['', Validators.required],
    endDate:            ['', [Validators.required, endAfterStart]],
  });

  get nameCtrl()       { return this.form.controls.name; }
  get regCtrl()        { return this.form.controls.registrationNumber; }
  get emailCtrl()      { return this.form.controls.email; }
  get phoneCtrl()      { return this.form.controls.phone; }
  get passwordCtrl()   { return this.form.controls.password; }
  get companyCtrl()    { return this.form.controls.company; }
  get countyCtrl()     { return this.form.controls.county; }
  get cityCtrl()       { return this.form.controls.city; }
  get supervisorCtrl() { return this.form.controls.stationSupervisor; }
  get supervisorPhoneCtrl() { return this.form.controls.stationSupervisorPhone; }
  get startCtrl()      { return this.form.controls.startDate; }
  get endCtrl()        { return this.form.controls.endDate; }

  get isStep1(): boolean { return this.currentStep() === 1; }
  get isStep2(): boolean { return this.currentStep() === 2; }

  get step1Valid(): boolean {
    return (
      this.nameCtrl.valid &&
      this.regCtrl.valid &&
      this.emailCtrl.valid &&
      this.phoneCtrl.valid &&
      this.passwordCtrl.valid
    );
  }

  onStartDateChange(): void {
    this.endCtrl.updateValueAndValidity();
  }

  nextStep(): void {
    this.nameCtrl.markAsTouched();
    this.regCtrl.markAsTouched();
    this.emailCtrl.markAsTouched();
    this.phoneCtrl.markAsTouched();
    this.passwordCtrl.markAsTouched();
    if (!this.step1Valid) return;
    this.errorMsg.set(null);
    this.currentStep.set(2);
  }

  prevStep(): void {
    this.currentStep.set(1);
    this.errorMsg.set(null);
  }

  submit(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.errorMsg.set('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    this.errorMsg.set(null);

    // Build payload exactly matching FastAPI StudentRegisterSchema
    const payload = {
      name:               this.form.value.name!.trim(),
      registrationNumber: this.form.value.registrationNumber!.trim().toUpperCase(),
      email:              this.form.value.email!.trim().toLowerCase(),
      phone:              this.form.value.phone!.trim(),
      password:           this.form.value.password!,
      company:            this.form.value.company!.trim(),
      location: {
        county: this.form.value.county!,
        city:   this.form.value.city!.trim(),
      },
      stationSupervisor:  this.form.value.stationSupervisor!.trim(),
      stationSupervisorPhone: this.form.value.stationSupervisorPhone!.trim(),
      startDate:          this.form.value.startDate!,
      endDate:            this.form.value.endDate!,
      role:               'student',
    };

    console.log('Sending registration payload:', payload);

    this.http
      .post(`${environment.apiUrl}/auth/register`, payload)
      .subscribe({
        next: (response: any) => {
          console.log('Registration success:', response);
          this.isLoading.set(false);
          this.successMsg.set(
            'Account created! Your default password is: ' +
            this.form.value.password +
            '. Redirecting to login...'
          );
          setTimeout(() => this.router.navigate(['/auth/login']), 3000);
        },
        error: (err) => {
          console.error('Registration error:', err);
          this.isLoading.set(false);

          // FastAPI 422 returns { detail: [...] } — extract readable message
          if (err.status === 422 && err.error?.detail) {
            const detail = err.error.detail;
            if (Array.isArray(detail)) {
              // Join all validation error messages
              const messages = detail
                .map((d: any) => {
                  const field = d.loc?.[d.loc.length - 1] ?? 'field';
                  return `${field}: ${d.msg}`;
                })
                .join('. ');
              this.errorMsg.set(messages);
            } else {
              this.errorMsg.set(String(detail));
            }
          } else if (err.status === 409) {
            this.errorMsg.set(err.error?.detail ?? 'Account already exists.');
          } else if (err.status === 0) {
            this.errorMsg.set(
              'Cannot connect to server. Make sure FastAPI is running on port 8000.'
            );
          } else {
            this.errorMsg.set(
              err.error?.detail ?? err.message ?? 'Registration failed. Please try again.'
            );
          }
        },
      });
  }
}