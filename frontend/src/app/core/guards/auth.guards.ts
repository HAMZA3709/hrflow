import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { Role } from '../models/api.models';
import { TokenService } from '../services/token.service';
export const authGuard: CanActivateFn = (_, state) => {
  const a = inject(AuthService),
    r = inject(Router),
    t = inject(TokenService);
  if (a.authenticated()) return true;
  if (!t.get()) return r.createUrlTree(['/connexion'], { queryParams: { returnUrl: state.url } });
  return a.loadMe().pipe(
    map(() => true),
    catchError(() =>
      of(r.createUrlTree(['/connexion'], { queryParams: { returnUrl: state.url } })),
    ),
  );
};
export const guestGuard: CanActivateFn = () =>
  inject(AuthService).authenticated() ? inject(Router).createUrlTree(['/app']) : true;
export const roleGuard =
  (roles: Role[]): CanActivateFn =>
  () =>
    roles.includes(inject(AuthService).user()?.role ?? 'EMPLOYEE') ||
    inject(Router).createUrlTree(['/403']);
