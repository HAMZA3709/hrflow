import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NotificationService } from '../services/notification.service';
@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `<div class="shell">
      <aside [class.open]="open()">
        <a class="brand" routerLink="/app">HR<span>Flow</span></a>
        <nav aria-label="Navigation principale">
          @for (i of items(); track i.path) {
            <a [routerLink]="i.path" routerLinkActive="active" (click)="open.set(false)"
              ><span aria-hidden="true">{{ i.icon }}</span
              >{{ i.label }}</a
            >
          }
        </nav>
      </aside>
      <div class="workspace">
        <header>
          <button class="icon" (click)="open.update((v) => !v)" aria-label="Ouvrir le menu">
            ☰
          </button>
          <div>
            <strong>{{ auth.user()?.email }}</strong
            ><small>{{ auth.user()?.role }}</small>
          </div>
          <button class="secondary" (click)="logout()">Déconnexion</button>
        </header>
        <main id="contenu"><router-outlet /></main>
      </div>
    </div>
    @if (notices.notice(); as n) {
      <div class="toast" [class.error]="n.type === 'error'" role="status">{{ n.text }}</div>
    }`,
})
export class AppLayout {
  readonly auth = inject(AuthService);
  readonly notices = inject(NotificationService);
  private router = inject(Router);
  readonly open = signal(false);
  readonly items = computed(() => {
    const role = this.auth.user()?.role;
    const a = [
      { label: 'Dashboard', path: '/app/dashboard', icon: '◫', roles: ['ADMIN', 'HR', 'MANAGER'] },
      { label: 'Utilisateurs', path: '/app/utilisateurs', icon: '♙', roles: ['ADMIN'] },
      { label: 'Départements', path: '/app/departements', icon: '◇', roles: ['ADMIN', 'HR'] },
      {
        label: role === 'MANAGER' ? 'Mon équipe' : 'Employés',
        path: '/app/employes',
        icon: '♧',
        roles: ['ADMIN', 'HR', 'MANAGER'],
      },
      {
        label: role === 'EMPLOYEE' ? 'Mes congés' : 'Congés',
        path: '/app/conges',
        icon: '☼',
        roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      },
      {
        label: role === 'EMPLOYEE' ? 'Mes entretiens' : 'Recrutement',
        path: role === 'EMPLOYEE' ? '/app/recrutement/entretiens' : '/app/recrutement',
        icon: '◎',
        roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      },
      {
        label: 'Mon profil',
        path: '/app/profil',
        icon: '○',
        roles: ['ADMIN', 'HR', 'MANAGER', 'EMPLOYEE'],
      },
    ];
    return a.filter((x) => x.roles.includes(role ?? ''));
  });
  logout() {
    this.auth.logout();
    void this.router.navigate(['/connexion']);
  }
}
