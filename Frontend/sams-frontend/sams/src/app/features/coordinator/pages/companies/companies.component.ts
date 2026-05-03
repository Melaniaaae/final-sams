import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { CoordinatorService } from '../../services/coordinator.service';
import { Company } from '../../../../shared/models';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss'],
})
export class CompaniesComponent implements OnInit {
  private coordService = inject(CoordinatorService);
  private fb = inject(FormBuilder);

  companies = signal<Company[]>([]);
  isLoading = signal(true);
  showForm = signal(false);
  isSaving = signal(false);
  searchQuery = signal('');
  selectedCompany = signal<Company | null>(null);

  form = this.fb.group({
    name:          ['', Validators.required],
    location:      ['', Validators.required],
    contactPerson: ['', Validators.required],
    contactPhone:  ['', Validators.required],
    contactEmail:  ['', [Validators.required, Validators.email]],
  });

  filteredCompanies = computed(() => {
    const q = this.searchQuery().toLowerCase();
    return q
      ? this.companies().filter((c) => c.name.toLowerCase().includes(q) || c.location.toLowerCase().includes(q))
      : this.companies();
  });

  ngOnInit(): void {
    this.coordService.getCompanies().subscribe({
      next: (list) => {
        this.companies.set(list);
        this.isLoading.set(false);
      },
      error: () => this.isLoading.set(false),
    });
  }

  selectCompany(company: Company): void {
    this.selectedCompany.set(this.selectedCompany()?.id === company.id ? null : company);
  }

  toggleForm(): void {
    this.showForm.update((v) => !v);
    this.form.reset();
  }

  save(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.isSaving.set(true);
    this.coordService.createCompany(this.form.value as Partial<Company>).subscribe({
      next: (c) => {
        this.companies.update((prev) => [c, ...prev]);
        this.isSaving.set(false);
        this.showForm.set(false);
        this.form.reset();
      },
      error: () => this.isSaving.set(false),
    });
  }

  initials(name: string): string {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  trackById(_: number, c: Company): string { return c.id; }
}
