import { Component, inject, signal } from '@angular/core';
import { ApiService } from '../../core/services/api.service';
import { Dashboard } from '../../core/models/api.models';
@Component({
  selector: 'app-dashboard',
  template: `<header class="page-head">
      <div>
        <p class="eyebrow">Vue d’ensemble</p>
        <h1>Dashboard</h1>
        <p class="muted">Les indicateurs RH en temps réel.</p>
      </div>
      <button class="secondary" (click)="load()">Actualiser</button>
    </header>
    @if (loading()) {
      <div class="state">Chargement des indicateurs…</div>
    } @else if (error()) {
      <div class="state error">{{ error() }} <button (click)="load()">Réessayer</button></div>
    } @else if (data(); as d) {
      <section class="stats">
        <article>
          <span>Employés</span><strong>{{ d.totalEmployees }}</strong>
        </article>
        <article>
          <span>Actifs</span><strong>{{ d.activeEmployees }}</strong>
        </article>
        <article>
          <span>Départements</span><strong>{{ d.totalDepartments }}</strong>
        </article>
        <article>
          <span>Congés en attente</span><strong>{{ d.pendingLeaveRequests }}</strong>
        </article>
      </section>
      <section class="grid">
        <article class="panel">
          <h2>Employés par département</h2>
          @for (x of entries(d.employeesByDepartment); track x[0]) {
            <div class="bar">
              <span>{{ x[0] }}</span
              ><meter min="0" [max]="d.totalEmployees || 1" [value]="x[1]">{{ x[1] }}</meter
              ><b>{{ x[1] }}</b>
            </div>
          } @empty {
            <p class="muted">Aucune donnée.</p>
          }
        </article>
        <article class="panel">
          <h2>Congés par statut</h2>
          @for (x of entries(d.leaveRequestsByStatus); track x[0]) {
            <div class="bar">
              <span>{{ x[0] }}</span
              ><meter min="0" [max]="leaveTotal(d) || 1" [value]="x[1]">{{ x[1] }}</meter
              ><b>{{ x[1] }}</b>
            </div>
          }
        </article>
      </section>
    }`,
})
export class DashboardPage {
  private api = inject(ApiService);
  readonly data = signal<Dashboard | null>(null);
  readonly loading = signal(true);
  readonly error = signal('');
  constructor() {
    this.load();
  }
  load() {
    this.loading.set(true);
    this.api.dashboard().subscribe({
      next: (x) => {
        this.data.set(x);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(e.message);
        this.loading.set(false);
      },
    });
  }
  entries(x: Record<string, number>) {
    return Object.entries(x);
  }
  leaveTotal(d: Dashboard) {
    return Object.values(d.leaveRequestsByStatus).reduce((a, b) => a + b, 0);
  }
}
