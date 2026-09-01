import { Injectable } from '@angular/core';
const KEY = 'hrflow_access_token';
@Injectable({ providedIn: 'root' })
export class TokenService {
  get() {
    return sessionStorage.getItem(KEY);
  }
  set(token: string) {
    sessionStorage.setItem(KEY, token);
  }
  clear() {
    sessionStorage.removeItem(KEY);
  }
}
