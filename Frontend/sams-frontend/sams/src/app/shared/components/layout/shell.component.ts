import {
  Component,
  OnInit,
  OnDestroy,
  inject,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { Subject, takeUntil, filter } from 'rxjs';

import { AuthService } from '../../../core/services/auth.service';
import { GlobalSpinnerComponent } from '../global-spinner/global-spinner.component';

interface NavItem {
  label: string;
  route: string;
  svgPath: string;   // raw SVG — computed ONCE at init, never in template
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  logbook:   'Logbook',
  profile:   'My Profile',
  documents: 'Document Vault',
  students:  'Student Management',
  lecturers: 'Lecturer Management',
  companies: 'Company Database',
};

// ── Static SVG strings ────────────────────────────────────────────────────
// Defined as constants so they are NEVER recreated during change detection
const ICONS: Record<string, string> = {
  grid:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>`,
  book:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>`,
  user:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>`,
  folder:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
    </svg>`,
  users:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>`,
  grad:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
    </svg>`,
  building:
    `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <rect x="2" y="7" width="20" height="14"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>`,
};

@Component({
  selector: 'app-shell',
  standalone: true,
  // OnPush — only re-renders when @Input changes or async pipe emits
  // This is the key setting that prevents runaway change detection
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, RouterModule, RouterOutlet, GlobalSpinnerComponent],
  templateUrl: './shell.component.html',
  styleUrls: ['./shell.component.scss'],
})
export class ShellComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router      = inject(Router);
  private cdr         = inject(ChangeDetectorRef);
  private destroy$    = new Subject<void>();

  // ── All plain properties — zero signals, zero computed, zero getters ────
  navItems: NavItem[]     = [];
  portalLabel             = 'Student Portal';
  isCoordinator           = false;
  userName                = '';
  userSub                 = '';
  initials                = '';
  pageTitle               = 'Dashboard';
  isMenuOpen              = false;
  showLogoutDialog        = false;

  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user) {
      this.isCoordinator = user.role === 'coordinator';
      this.userName      = user.name;
      this.userSub       = user.registrationNumber ?? user.role;
      this.initials      = user.name
        .split(' ')
        .slice(0, 2)
        .map((n: string) => n[0])
        .join('')
        .toUpperCase();
      this.portalLabel = this.isCoordinator
        ? 'Coordinator Portal'
        : 'Student Portal';
    }

    // Build nav items ONCE — icons are embedded strings, never recreated
    this.navItems = this.isCoordinator
      ? [
          { label: 'Dashboard', route: '/coordinator/dashboard', svgPath: ICONS['grid']     },
          { label: 'Students',  route: '/coordinator/students',  svgPath: ICONS['users']    },
          { label: 'Lecturers', route: '/coordinator/lecturers', svgPath: ICONS['grad']     },
          { label: 'Companies', route: '/coordinator/companies', svgPath: ICONS['building'] },
        ]
      : [
          { label: 'Dashboard',      route: '/student/dashboard',  svgPath: ICONS['grid']   },
          { label: 'Logbook',        route: '/student/logbook',    svgPath: ICONS['book']   },
          { label: 'My Profile',     route: '/student/profile',    svgPath: ICONS['user']   },
          { label: 'Document Vault', route: '/student/documents',  svgPath: ICONS['folder'] },
        ];

    // Track page title from router — manual subscription, no toSignal
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((e) => {
        const segments = (e as NavigationEnd).urlAfterRedirects
          .split('/')
          .filter(Boolean);
        const last = segments[segments.length - 1];
        this.pageTitle = PAGE_TITLES[last] ?? 'Dashboard';
        this.cdr.markForCheck();   // tell OnPush to re-render
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleMenu(): void    { this.isMenuOpen = !this.isMenuOpen; }
  closeMenu(): void     { this.isMenuOpen = false; }
  confirmLogout(): void { this.showLogoutDialog = true; }
  cancelLogout(): void  { this.showLogoutDialog = false; }

 logout(): void {
  this.showLogoutDialog = false;
  this.authService.logout();
  this.router.navigate(['/auth/login']); // 👈 ADD THIS
}

  trackByRoute(_: number, item: NavItem): string {
    return item.route;
  }
}