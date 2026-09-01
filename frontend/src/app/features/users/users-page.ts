import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Role, User } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
@Component({
  selector: 'app-users',
  imports: [FormsModule],
  template: `<header class="page-head">
      <div>
        <p class="eyebrow">Administration</p>
        <h1>Utilisateurs</h1>
        <p class="muted">Rôles, accès et état des comptes.</p>
      </div>
    </header>
    <div class="toolbar">
      <label>Rechercher par email<input [(ngModel)]="search" (keyup.enter)="load()" /></label
      ><button (click)="load()">Rechercher</button>
    </div>
    @if (loading()) {
      <div class="state">Chargement…</div>
    } @else if (!users().length) {
      <div class="state">Aucun utilisateur trouvé.</div>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Email</th>
              <th>Rôle</th>
              <th>Vérifié</th>
              <th>État</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            @for (u of users(); track u.id) {
              <tr>
                <td>
                  <button class="link-button" (click)="selected.set(u)">{{ u.email }}</button>
                </td>
                <td>
                  <select
                    [ngModel]="u.role"
                    (ngModelChange)="setRole(u, $event)"
                    aria-label="Rôle de l’utilisateur"
                  >
                    <option>ADMIN</option>
                    <option>HR</option>
                    <option>MANAGER</option>
                    <option>EMPLOYEE</option>
                  </select>
                </td>
                <td>{{ u.emailVerified ? 'Oui' : 'Non' }}</td>
                <td>
                  <span class="badge" [class.off]="!u.enabled">{{
                    u.enabled ? 'Actif' : 'Inactif'
                  }}</span>
                </td>
                <td>
                  <button class="secondary" (click)="toggle(u)">
                    {{ u.enabled ? 'Désactiver' : 'Activer' }}
                  </button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="pager">
        <button [disabled]="page() === 0" (click)="page.set(page() - 1); load()">Précédent</button
        ><span>Page {{ page() + 1 }} / {{ pages() }}</span
        ><button [disabled]="page() + 1 >= pages()" (click)="page.set(page() + 1); load()">
          Suivant
        </button>
      </div>
    }
    @if (selected(); as u) {
      <section class="panel detail-panel" aria-label="Détail utilisateur">
        <div class="row">
          <h2>{{ u.email }}</h2>
          <button class="icon" (click)="selected.set(null)" aria-label="Fermer le détail">×</button>
        </div>
        <dl>
          <dt>Identifiant</dt>
          <dd>{{ u.id }}</dd>
          <dt>Rôle</dt>
          <dd>{{ u.role }}</dd>
          <dt>Email vérifié</dt>
          <dd>{{ u.emailVerified ? 'Oui' : 'Non' }}</dd>
          <dt>Compte</dt>
          <dd>{{ u.enabled ? 'Actif' : 'Inactif' }}</dd>
          <dt>Création</dt>
          <dd>{{ u.createdAt }}</dd>
        </dl>
      </section>
    }`,
})
export class UsersPage {
  private api = inject(ApiService);
  private n = inject(NotificationService);
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly page = signal(0);
  readonly pages = signal(1);
  readonly selected = signal<User | null>(null);
  search = '';
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api
      .users({ search: this.search, page: this.page(), size: 10, sort: 'email,asc' })
      .subscribe({
        next: (x) => {
          this.users.set(x.content);
          this.pages.set(x.page.totalPages || 1);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
  setRole(u: User, role: Role) {
    if (!confirm(`Changer le rôle de ${u.email} ?`)) return;
    this.api.role(u.id, role).subscribe({
      next: () => {
        this.n.show('Rôle mis à jour.', 'success');
        this.load();
      },
      error: (e) => this.n.show(e.message, 'error'),
    });
  }
  toggle(u: User) {
    if (!confirm(`${u.enabled ? 'Désactiver' : 'Activer'} ${u.email} ?`)) return;
    this.api.userStatus(u.id, !u.enabled).subscribe({
      next: () => {
        this.n.show('Statut mis à jour.', 'success');
        this.load();
      },
      error: (e) => this.n.show(e.message, 'error'),
    });
  }
}
