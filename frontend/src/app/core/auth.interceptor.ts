import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from './auth.service';

/** Haengt das Token an API-Aufrufe und loggt bei 401 aus (z. B. abgelaufenes Token). */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.token();
  const isApi = req.url.startsWith('/api/');
  const authed = token && isApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authed).pipe(
    catchError((err: unknown) => {
      const isLoginCall = req.url.startsWith('/api/auth/login');
      if (err instanceof HttpErrorResponse && err.status === 401 && token && !isLoginCall) {
        auth.logout();
      }
      return throwError(() => err);
    }),
  );
};
