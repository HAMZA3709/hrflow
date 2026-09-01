import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../auth/auth.service';
import { ApiError } from '../models/api.models';
import { NotificationService } from '../services/notification.service';
import { TokenService } from '../services/token.service';
export const correlationInterceptor: HttpInterceptorFn = (req, next) =>
  next(req.clone({ setHeaders: { 'X-Correlation-ID': crypto.randomUUID() } }));
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(TokenService).get();
  const internal = req.url.startsWith(environment.apiUrl) || req.url.startsWith(location.origin);
  return next(
    token && internal ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req,
  );
};
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService),
    router = inject(Router),
    notices = inject(NotificationService);
  return next(req).pipe(
    catchError((e: HttpErrorResponse) => {
      const body = (
        e.error && typeof e.error === 'object'
          ? e.error
          : {
              status: e.status,
              code: 'HTTP_ERROR',
              message:
                e.status === 0 ? 'Le serveur HRFlow est indisponible.' : 'Une erreur est survenue.',
            }
      ) as ApiError;
      body.correlationId = e.headers.get('X-Correlation-ID') ?? undefined;
      if (e.status === 401 && !req.url.endsWith('/auth/login')) {
        auth.logout();
        void router.navigate(['/connexion'], { queryParams: { returnUrl: router.url } });
      } else if (e.status === 403) notices.show('Vous n’avez pas les droits nécessaires.', 'error');
      else if (e.status === 0 || e.status >= 500) notices.show(body.message, 'error');
      return throwError(() => body);
    }),
  );
};
