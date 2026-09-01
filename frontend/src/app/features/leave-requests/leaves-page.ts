import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import {
  Department,
  Employee,
  LeaveRequest,
  LeaveStatus,
  LeaveType,
} from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
@Component({
  selector: 'app-leaves',
  imports: [FormsModule, ReactiveFormsModule],
  template: `<header class="page-head">
      <div>
        <p class="eyebrow">Absences</p>
        <h1>{{ mine() ? 'Mes congés' : 'Congés' }}</h1>
      </div>
      <button (click)="showForm.update((v) => !v)">Nouvelle demande</button>
    </header>
    @if (showForm()) {
      <form class="panel inline-form" [formGroup]="form" (ngSubmit)="create()">
        <label>Début<input type="date" formControlName="startDate" /></label
        ><label>Fin<input type="date" formControlName="endDate" /></label
        ><label
          >Type<select formControlName="leaveType">
            @for (t of types; track t) {
              <option [value]="t">{{ t }}</option>
            }
          </select></label
        ><label>Motif<input formControlName="reason" maxlength="1000" /></label
        ><button [disabled]="form.invalid">Envoyer</button>
      </form>
    }
    @if (!mine()) {
      <div class="toolbar">
        <label
          >Statut<select [(ngModel)]="status">
            <option value="">Tous</option>
            @for (s of statuses; track s) {
              <option [value]="s">{{ s }}</option>
            }
          </select></label
        ><label
          >Employé<select [(ngModel)]="employeeId">
            <option value="">Tous</option>
            @for (e of employees(); track e.id) {
              <option [value]="e.id">{{ e.firstName }} {{ e.lastName }}</option>
            }
          </select></label
        ><label
          >Département<select [(ngModel)]="departmentId">
            <option value="">Tous</option>
            @for (d of departments(); track d.id) {
              <option [value]="d.id">{{ d.name }}</option>
            }
          </select></label
        ><label>Du<input type="date" [(ngModel)]="from" /></label
        ><label>Au<input type="date" [(ngModel)]="to" /></label
        ><button (click)="load()">Filtrer</button>
      </div>
    }
    @if (loading()) {
      <div class="state">Chargement…</div>
    } @else {
      <div class="cards">
        @for (l of rows(); track l.id) {
          <article class="panel">
            <div class="row">
              <div>
                <button class="link-button" (click)="selected.set(l)">
                  <h2>{{ l.employeeName }}</h2>
                </button>
                <p>{{ l.startDate }} → {{ l.endDate }} · {{ l.leaveType }}</p>
                <small>{{ l.reason || 'Sans motif' }}</small>
              </div>
              <span class="badge status-{{ l.status.toLowerCase() }}">{{ l.status }}</span>
            </div>
            @if (l.managerComment) {
              <p><strong>Commentaire :</strong> {{ l.managerComment }}</p>
            }
            <div class="actions">
              @if (l.status === 'PENDING' && mine()) {
                <button class="danger" (click)="cancel(l)">Annuler</button>
              }
              @if (l.status === 'PENDING' && !mine()) {
                <button (click)="decide(l, 'approve')">Approuver</button
                ><button class="danger" (click)="decide(l, 'reject')">Rejeter</button>
              }
            </div>
          </article>
        } @empty {
          <div class="state">Aucune demande.</div>
        }
      </div>
    }
    @if (selected(); as l) {
      <section class="panel detail-panel" aria-label="Détail de la demande">
        <div class="row">
          <h2>Demande #{{ l.id }}</h2>
          <button class="icon" (click)="selected.set(null)" aria-label="Fermer le détail">×</button>
        </div>
        <dl>
          <dt>Employé</dt>
          <dd>{{ l.employeeName }}</dd>
          <dt>Période</dt>
          <dd>{{ l.startDate }} → {{ l.endDate }}</dd>
          <dt>Type</dt>
          <dd>{{ l.leaveType }}</dd>
          <dt>Statut</dt>
          <dd>{{ l.status }}</dd>
          <dt>Motif</dt>
          <dd>{{ l.reason || 'Non renseigné' }}</dd>
          <dt>Commentaire</dt>
          <dd>{{ l.managerComment || 'Aucun' }}</dd>
        </dl>
      </section>
    }`,
})
export class LeavesPage {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  private n = inject(NotificationService);
  readonly rows = signal<LeaveRequest[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly selected = signal<LeaveRequest | null>(null);
  readonly loading = signal(true);
  readonly showForm = signal(false);
  readonly types: LeaveType[] = ['ANNUAL', 'SICK', 'UNPAID', 'MATERNITY', 'PATERNITY', 'OTHER'];
  readonly statuses: LeaveStatus[] = ['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED'];
  status = '';
  employeeId = '';
  departmentId = '';
  from = '';
  to = '';
  readonly mine = () => this.auth.user()?.role === 'EMPLOYEE';
  readonly form = new FormGroup({
    startDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    endDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    leaveType: new FormControl<LeaveType>('ANNUAL', { nonNullable: true }),
    reason: new FormControl<string | null>(null),
  });
  constructor() {
    if (!this.mine() && this.auth.user()?.role !== 'MANAGER') {
      this.api
        .employees({ size: 200, sort: 'lastName,asc' })
        .subscribe((x) => this.employees.set(x.content));
      this.api
        .departments({ size: 200, sort: 'name,asc' })
        .subscribe((x) => this.departments.set(x.content));
    }
    this.load();
  }
  load() {
    if (this.from && this.to && this.from > this.to) {
      this.n.show('La période de filtre est invalide.', 'error');
      return;
    }
    this.loading.set(true);
    this.api
      .leaves(
        {
          status: this.status,
          employeeId: this.employeeId,
          departmentId: this.departmentId,
          from: this.from,
          to: this.to,
          size: 100,
        },
        this.mine(),
      )
      .subscribe({
        next: (x) => {
          this.rows.set(x.content);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
  }
  create() {
    const v = this.form.getRawValue();
    if (v.startDate > v.endDate) {
      this.n.show('La date de fin doit suivre la date de début.', 'error');
      return;
    }
    this.api.createLeave(v).subscribe({
      next: () => {
        this.n.show('Demande envoyée.', 'success');
        this.showForm.set(false);
        this.form.reset({ leaveType: 'ANNUAL', startDate: '', endDate: '', reason: null });
        this.load();
      },
      error: (e) => this.n.show(e.message, 'error'),
    });
  }
  cancel(l: LeaveRequest) {
    if (confirm('Annuler cette demande ?'))
      this.api
        .cancelLeave(l.id)
        .subscribe({ next: () => this.load(), error: (e) => this.n.show(e.message, 'error') });
  }
  decide(l: LeaveRequest, d: 'approve' | 'reject') {
    const comment =
      d === 'reject'
        ? prompt('Commentaire obligatoire pour le rejet :')
        : prompt('Commentaire (facultatif) :');
    if (d === 'reject' && !comment) {
      this.n.show('Le commentaire est obligatoire.', 'error');
      return;
    }
    if (comment === null) return;
    this.api.decideLeave(l.id, d, comment || null).subscribe({
      next: () => {
        this.n.show('Décision enregistrée.', 'success');
        this.load();
      },
      error: (e) => this.n.show(e.message, 'error'),
    });
  }
}
