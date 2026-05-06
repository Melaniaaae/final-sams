import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { NgxMaterialIntlTelInputComponent } from 'ngx-material-intl-tel-input';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs/operators';
import { TimeoutError } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { AlphabetDirective } from '../../../../shared/components/alphabet.directive';
import { NumericDirective } from '../../../../shared/components/numeric.directive';

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

// ── Complete Kenya Counties → Cities/Towns mapping ─────────────────
export const KENYA_CITIES: Record<string, string[]> = {
  'Baringo':         ['Kabarnet', 'Eldama Ravine', 'Mogotio', 'Marigat', 'Kituro'],
  'Bomet':           ['Bomet', 'Sotik', 'Longisa', 'Chepalungu', 'Silibwet'],
  'Bungoma':         ['Bungoma', 'Webuye', 'Kimilili', 'Chwele', 'Malakisi', 'Sirisia'],
  'Busia':           ['Busia', 'Malaba', 'Port Victoria', 'Funyula', 'Butula'],
  'Elgeyo-Marakwet': ['Iten', 'Kapsowar', 'Tambach', 'Cheptebo'],
  'Embu':            ['Embu', 'Runyenjes', 'Siakago', 'Ishiara'],
  'Garissa':         ['Garissa', 'Dadaab', 'Hulugho', 'Ijara'],
  'Homa Bay':        ['Homa Bay', 'Oyugis', 'Kendu Bay', 'Mbita', 'Rodi Kopany'],
  'Isiolo':          ['Isiolo', 'Merti', 'Garbatulla'],
  'Kajiado':         ['Kajiado', 'Ngong', 'Ongata Rongai', 'Kitengela', 'Namanga', 'Loitokitok'],
  'Kakamega':        ['Kakamega', 'Mumias', 'Malava', 'Butere', 'Lugari', 'Navakholo'],
  'Kericho':         ['Kericho', 'Litein', 'Londiani', 'Kipkelion'],
  'Kiambu':          ['Kiambu', 'Thika', 'Ruiru', 'Limuru', 'Kikuyu', 'Githunguri', 'Karuri', 'Gatundu'],
  'Kilifi':          ['Kilifi', 'Malindi', 'Watamu', 'Mariakani', 'Kaloleni', 'Ganze'],
  'Kirinyaga':       ['Kerugoya', 'Kutus', 'Kagio', 'Sagana', 'Wanguru'],
  'Kisii':           ['Kisii', 'Ogembo', 'Suneka', 'Keroka', 'Nyamache'],
  'Kisumu':          ['Kisumu', 'Ahero', 'Muhoroni', 'Katito', 'Maseno'],
  'Kitui':           ['Kitui', 'Mwingi', 'Mutomo', 'Zombe', 'Migwani'],
  'Kwale':           ['Kwale', 'Diani', 'Ukunda', 'Msambweni', 'Lungalunga'],
  'Laikipia':        ['Nanyuki', 'Rumuruti', 'Nyahururu', 'Doldol'],
  'Lamu':            ['Lamu', 'Mokowe', 'Witu', 'Hindi'],
  'Machakos':        ['Machakos', 'Athi River', 'Matuu', 'Kathiani', 'Mwala'],
  'Makueni':         ['Wote', 'Makindu', 'Kikima', 'Sultan Hamud', 'Mtito Andei'],
  'Mandera':         ['Mandera', 'Elwak', 'Takaba', 'Rhamu'],
  'Marsabit':        ['Marsabit', 'Moyale', 'North Horr', 'Loiyangalani'],
  'Meru':            ['Meru', 'Nkubu', 'Maua', 'Timau', 'Mikinduri'],
  'Migori':          ['Migori', 'Awendo', 'Rongo', 'Uriri', 'Suna'],
  'Mombasa':         ['Mombasa', 'Nyali', 'Bamburi', 'Kisauni', 'Likoni', 'Changamwe'],
  "Murang'a":        ["Murang'a", 'Kenol', 'Maragua', 'Kandara', 'Kigumo'],
  'Nairobi':         ['Nairobi CBD', 'Westlands', 'Embakasi', 'Kasarani', 'Langata', 'Dagoretti',
                      'Roysambu', 'Makadara', 'Starehe', 'Upper Hill', 'Industrial Area',
                      'Karen', 'Gigiri', 'Kilimani', 'Parklands', 'Pangani'],
  'Nakuru':          ['Nakuru', 'Naivasha', 'Molo', 'Gilgil', 'Subukia', 'Rongai'],
  'Nandi':           ['Kapsabet', 'Nandi Hills', 'Mosoriot', 'Kobujoi'],
  'Narok':           ['Narok', 'Kilgoris', 'Ol Kalou', 'Suswa'],
  'Nyamira':         ['Nyamira', 'Keroka', 'Nyansiongo'],
  'Nyandarua':       ['Ol Kalou', 'Engineer', 'Ndunyu Njeru', 'Kipipiri'],
  'Nyeri':           ['Nyeri', 'Karatina', 'Othaya', 'Mukurweini', 'Tetu'],
  'Samburu':         ['Maralal', 'Baragoi', 'Wamba'],
  'Siaya':           ['Siaya', 'Bondo', 'Ugunja', 'Yala', 'Usenge'],
  'Taita-Taveta':    ['Voi', 'Wundanyi', 'Mwatate', 'Taveta'],
  'Tana River':      ['Hola', 'Garsen', 'Bura'],
  'Tharaka-Nithi':   ['Chuka', 'Marimanti', 'Kathwana'],
  'Trans Nzoia':     ['Kitale', 'Kiminini', 'Saboti', 'Endebess'],
  'Turkana':         ['Lodwar', 'Kalokol', 'Lokichar', 'Kakuma'],
  'Uasin Gishu':     ['Eldoret', 'Turbo', 'Ziwa', 'Burnt Forest'],
  'Vihiga':          ['Vihiga', 'Mbale', 'Hamisi', 'Luanda'],
  'Wajir':           ['Wajir', 'Habaswein', 'Griftu', 'Tarbaj'],
  'West Pokot':      ['Kapenguria', 'Lodwar', 'Ortum', 'Sigor'],
};

export const KENYA_COUNTIES = Object.keys(KENYA_CITIES).sort();

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, NgxMaterialIntlTelInputComponent, AlphabetDirective, NumericDirective],
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
  availableCities: string[] = []; 

 // ── Current year date constraints ──────────────────────────────
  readonly currentYear = new Date().getFullYear();
  readonly minDate     = `${this.currentYear}-01-01`;
  readonly maxDate     = `${this.currentYear}-12-31`;

  form = this.fb.group({
    // Step 1
    name:               ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-z\s]+$/)]],
    registrationNumber: ['', [Validators.required, Validators.pattern(/^[A-Z]\d{2}\/\d{5}\/\d{2}$/)]],
    email:              ['', [Validators.required, Validators.email]],
    phone:              ['', [Validators.required, Validators.pattern(/^(\+254|0)(7|1)\d{8}$/)]],
    password:           ['Sams@2025', [Validators.required, Validators.minLength(6)]],

    // Step 2
    company:            ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-z\s]+$/)]],
    county:             ['', Validators.required],
    city:               ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-z\s]+$/)]],
    stationSupervisor:  ['', [Validators.required, Validators.minLength(2), Validators.pattern(/^[A-Za-z\s]+$/)]],
    stationSupervisorPhone: ['', [Validators.required, Validators.pattern(/^(\+254|0)(7|1)\d{8}$/)]],
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

   // ── Called when county dropdown changes ───────────────────────
  onCountyChange(county: string): void {
    this.availableCities = KENYA_CITIES[county] ?? [];
    // Reset city selection when county changes
    this.cityCtrl.setValue('');
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

// Validate dates are in current year
    const startYear = new Date(this.form.value.startDate!).getFullYear();
    const endYear   = new Date(this.form.value.endDate!).getFullYear();
    if (startYear !== this.currentYear || endYear !== this.currentYear) {
      this.errorMsg.set(`Start and end dates must be in ${this.currentYear}.`);
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
      .pipe(timeout(10000))
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

          if (err instanceof TimeoutError || err.name === 'TimeoutError') {
            this.errorMsg.set('Server is not responding. Please make sure the backend is running and not paused.');
            return;
          }

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