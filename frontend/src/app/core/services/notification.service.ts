import { Injectable, signal } from '@angular/core';
export type Notice = { type: 'success' | 'error' | 'info'; text: string };
@Injectable({ providedIn: 'root' })
export class NotificationService {
  readonly notice = signal<Notice | null>(null);
  show(text: string, type: Notice['type'] = 'info') {
    this.notice.set({ text, type });
    setTimeout(() => this.notice.set(null), 5000);
  }
}
