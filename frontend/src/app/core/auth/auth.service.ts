import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Message, TokenResponse, User } from '../models/api.models';
import { TokenService } from '../services/token.service';
@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private tokens = inject(TokenService);
  readonly user = signal<User | null>(null);
  readonly authenticated = computed(() => !!this.user() && !!this.tokens.get());
  login(email: string, password: string) {
    return this.http
      .post<TokenResponse>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(tap((r) => this.tokens.set(r.accessToken)));
  }
  loadMe() {
    return this.http.get<User>(`${environment.apiUrl}/auth/me`).pipe(tap((u) => this.user.set(u)));
  }
  register(email: string, password: string) {
    return this.http.post<Message>(`${environment.apiUrl}/auth/register`, { email, password });
  }
  verify(token: string) {
    return this.http.get<Message>(`${environment.apiUrl}/auth/verify-email`, { params: { token } });
  }
  resend(email: string) {
    return this.http.post<Message>(`${environment.apiUrl}/auth/resend-verification`, { email });
  }
  forgot(email: string) {
    return this.http.post<Message>(`${environment.apiUrl}/auth/forgot-password`, { email });
  }
  reset(token: string, newPassword: string) {
    return this.http.post<Message>(`${environment.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
    });
  }
  logout() {
    this.tokens.clear();
    this.user.set(null);
  }
}
