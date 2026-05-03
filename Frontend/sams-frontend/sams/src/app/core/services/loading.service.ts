import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

/**
 * Global loading service using BehaviorSubject instead of signals.
 * BehaviorSubject does NOT trigger Angular's signal-based change detection
 * on every read, preventing render loops.
 */
@Injectable({ providedIn: 'root' })
export class LoadingService {
  private _count = 0;
  private _loading$ = new BehaviorSubject<boolean>(false);

  // Expose as observable for async pipe consumption
  isLoading$ = this._loading$.asObservable();

  // Synchronous read — safe to use in templates sparingly
  get isLoading(): boolean {
    return this._loading$.value;
  }

  increment(): void {
    this._count = Math.max(0, this._count) + 1;
    this._loading$.next(true);
  }

  decrement(): void {
    this._count = Math.max(0, this._count - 1);
    if (this._count === 0) {
      this._loading$.next(false);
    }
  }

  reset(): void {
    this._count = 0;
    this._loading$.next(false);
  }
}