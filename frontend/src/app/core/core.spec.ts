import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { AuthService } from './auth/auth.service';
import { authGuard, roleGuard } from './guards/auth.guards';
import { correlationInterceptor, jwtInterceptor } from './interceptors/http.interceptors';
import { User } from './models/api.models';
import { TokenService } from './services/token.service';
const user: User = {
  id: 1,
  email: 'admin@hrflow.test',
  role: 'ADMIN',
  enabled: true,
  emailVerified: true,
  createdAt: '2026-01-01T00:00:00Z',
};
describe('HRFlow core', () => {
  let http: HttpTestingController;
  beforeEach(() => {
    sessionStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([correlationInterceptor, jwtInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());
  it('stores and removes only the access token', () => {
    const s = TestBed.inject(TokenService);
    s.set('jwt');
    expect(s.get()).toBe('jwt');
    s.clear();
    expect(s.get()).toBeNull();
  });
  it('logs in using the exact backend contract', () => {
    const a = TestBed.inject(AuthService);
    a.login('admin@hrflow.test', 'StrongPassword!123').subscribe();
    const r = http.expectOne('/api/v1/auth/login');
    expect(r.request.body).toEqual({ email: 'admin@hrflow.test', password: 'StrongPassword!123' });
    r.flush({ accessToken: 'jwt', tokenType: 'Bearer', expiresInSeconds: 3600 });
    expect(TestBed.inject(TokenService).get()).toBe('jwt');
  });
  it('loads the authenticated user', () => {
    const a = TestBed.inject(AuthService);
    a.loadMe().subscribe();
    http.expectOne('/api/v1/auth/me').flush(user);
    expect(a.user()).toEqual(user);
  });
  it('adds JWT and a correlation ID to internal API requests', () => {
    TestBed.inject(TokenService).set('jwt');
    TestBed.inject(HttpClient).get('/api/v1/users').subscribe();
    const r = http.expectOne('/api/v1/users');
    expect(r.request.headers.get('Authorization')).toBe('Bearer jwt');
    expect(r.request.headers.get('X-Correlation-ID')).toBeTruthy();
    r.flush({});
  });
  it('does not leak JWT to external origins', () => {
    TestBed.inject(TokenService).set('jwt');
    TestBed.inject(HttpClient).get('https://example.test/data').subscribe();
    const r = http.expectOne('https://example.test/data');
    expect(r.request.headers.has('Authorization')).toBe(false);
    r.flush({});
  });
  it('role guard rejects an unauthorized role', () => {
    const a = TestBed.inject(AuthService);
    a.user.set({ ...user, role: 'EMPLOYEE' });
    const result = TestBed.runInInjectionContext(() =>
      roleGuard(['ADMIN'])({} as never, {} as never),
    );
    expect(result).toEqual(TestBed.inject(Router).createUrlTree(['/403']));
  });
  it('auth guard preserves the requested URL', () => {
    const result = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/app/conges' } as never),
    );
    expect(result).toEqual(
      TestBed.inject(Router).createUrlTree(['/connexion'], {
        queryParams: { returnUrl: '/app/conges' },
      }),
    );
  });
});
