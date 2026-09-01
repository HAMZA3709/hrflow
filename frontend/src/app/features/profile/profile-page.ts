import { Component, inject, signal } from '@angular/core';
import { AuthService } from '../../core/auth/auth.service';
import { Employee } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
@Component({
  selector: 'app-profile',
  template: `<header class="page-head">
      <div>
        <p class="eyebrow">Compte</p>
        <h1>Mon profil</h1>
      </div>
    </header>
    <section class="grid">
      <article class="panel">
        <h2>Accès HRFlow</h2>
        <dl>
          <dt>Email</dt>
          <dd>{{ auth.user()?.email }}</dd>
          <dt>Rôle</dt>
          <dd>{{ auth.user()?.role }}</dd>
          <dt>Adresse vérifiée</dt>
          <dd>{{ auth.user()?.emailVerified ? 'Oui' : 'Non' }}</dd>
          <dt>Compte</dt>
          <dd>{{ auth.user()?.enabled ? 'Actif' : 'Inactif' }}</dd>
        </dl>
      </article>
      @if (employee(); as e) {
        <article class="panel">
          <h2>Informations employé</h2>
          <dl>
            <dt>Nom</dt>
            <dd>{{ e.firstName }} {{ e.lastName }}</dd>
            <dt>Matricule</dt>
            <dd>{{ e.employeeNumber }}</dd>
            <dt>Poste</dt>
            <dd>{{ e.position }}</dd>
            <dt>Département</dt>
            <dd>{{ e.departmentName }}</dd>
            <dt>Manager</dt>
            <dd>{{ e.managerId ?? 'Non affecté' }}</dd>
          </dl>
        </article>
      } @else if (loading()) {
        <div class="state">Chargement du profil employé…</div>
      } @else {
        <article class="panel">
          <h2>Profil employé</h2>
          <p class="muted">Aucun profil employé n’est associé à ce compte.</p>
        </article>
      }
    </section>`,
})
export class ProfilePage {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  readonly employee = signal<Employee | null>(null);
  readonly loading = signal(true);
  constructor() {
    this.api.employeeMe().subscribe({
      next: (e) => {
        this.employee.set(e);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
