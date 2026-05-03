import {
  HttpInterceptorFn,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs/operators';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  // Skip loading indicator for background/silent requests
  if (req.headers.has('X-Skip-Loading')) {
    return next(req.clone({ headers: req.headers.delete('X-Skip-Loading') }));
  }

  const loading = inject(LoadingService);
  loading.increment();

  // finalize() ALWAYS runs — success OR error — so counter never gets stuck
  return next(req).pipe(
    finalize(() => {
      loading.decrement();
    })
  );
};