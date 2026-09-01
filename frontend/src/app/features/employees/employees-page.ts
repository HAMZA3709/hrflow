import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError, Department, Employee, EmployeeInput, User } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-employees',
  imports: [FormsModule, ReactiveFormsModule],
  template: ` <header class="page-head">
      <div>
        <p class="eyebrow">Talents</p>
        <h1>{{ managerOnly() ? 'Mon équipe' : 'Employés' }}</h1>
        <p class="muted">Annuaire et relations organisationnelles.</p>
      </div>
      @if (!managerOnly()) {
        <button (click)="newEmployee()">Nouvel employé</button>
      }
    </header>
    @if (!managerOnly()) {
      <div class="toolbar">
        <label>Recherche<input [(ngModel)]="search" (keyup.enter)="load()" /></label
        ><label
          >Département<select [(ngModel)]="departmentId">
            <option value="">Tous</option>
            @for (d of departments(); track d.id) {
              <option [value]="d.id">{{ d.name }}</option>
            }
          </select></label
        ><label
          >Statut<select [(ngModel)]="active">
            <option value="">Tous</option>
            <option value="true">Actifs</option>
            <option value="false">Inactifs</option>
          </select></label
        ><label
          >Trier<select [(ngModel)]="sort">
            <option value="lastName,asc">Nom A–Z</option>
            <option value="hireDate,desc">Embauche récente</option>
            <option value="employeeNumber,asc">Matricule</option>
          </select></label
        ><button (click)="load()">Filtrer</button>
      </div>
    }
    @if (showForm()) {
      <form class="panel employee-form" [formGroup]="form" (ngSubmit)="save()" novalidate>
        <div class="row">
          <h2>{{ editing() ? 'Modifier' : 'Créer' }} un employé</h2>
          <button type="button" class="secondary" (click)="showForm.set(false)">Fermer</button>
        </div>
        <div class="form-grid">
          <label
            >Matricule<input formControlName="employeeNumber" maxlength="50" />
            @if (fieldError('employeeNumber')) {
              <small class="field-error">{{ fieldError('employeeNumber') }}</small>
            }</label
          ><label>Prénom<input formControlName="firstName" maxlength="100" /></label
          ><label>Nom<input formControlName="lastName" maxlength="100" /></label
          ><label>Téléphone<input formControlName="phone" maxlength="30" /></label
          ><label
            >Date d’embauche<input type="date" formControlName="hireDate" [max]="today" /></label
          ><label>Poste<input formControlName="position" maxlength="120" /></label
          ><label
            >Département<select formControlName="departmentId">
              <option [ngValue]="null">Sélectionner</option>
              @for (d of activeDepartments(); track d.id) {
                <option [ngValue]="d.id">{{ d.name }}</option>
              }
            </select></label
          ><label
            >Manager<select formControlName="managerId">
              <option [ngValue]="null">Aucun</option>
              @for (m of managerCandidates(); track m.id) {
                <option [ngValue]="m.id">{{ m.firstName }} {{ m.lastName }}</option>
              }
            </select></label
          ><label
            >Compte utilisateur<select formControlName="userId">
              <option [ngValue]="null">Aucun</option>
              @for (u of availableUsers(); track u.id) {
                <option [ngValue]="u.id">{{ u.email }}</option>
              }
            </select></label
          >
        </div>
        <button [disabled]="form.invalid || saving()">
          {{ saving() ? 'Enregistrement…' : 'Enregistrer' }}
        </button>
      </form>
    }
    @if (loading()) {
      <div class="state">Chargement…</div>
    } @else if (!rows().length) {
      <div class="state">Aucun employé trouvé.</div>
    } @else {
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Matricule</th>
              <th>Collaborateur</th>
              <th>Poste</th>
              <th>Département</th>
              <th>Manager</th>
              <th>État</th>
              @if (!managerOnly()) {
                <th>Actions</th>
              }
            </tr>
          </thead>
          <tbody>
            @for (e of rows(); track e.id) {
              <tr>
                <td>{{ e.employeeNumber }}</td>
                <td>
                  <button class="link-button" (click)="selected.set(e)">
                    <strong>{{ e.firstName }} {{ e.lastName }}</strong></button
                  ><small>{{ e.email || 'Aucun compte lié' }}</small>
                </td>
                <td>{{ e.position }}</td>
                <td>{{ e.departmentName }}</td>
                <td>{{ managerName(e.managerId) }}</td>
                <td>
                  <span class="badge" [class.off]="!e.active">{{
                    e.active ? 'Actif' : 'Inactif'
                  }}</span>
                </td>
                @if (!managerOnly()) {
                  <td>
                    <div class="actions">
                      <button class="secondary" (click)="edit(e)">Modifier</button
                      ><button class="secondary" (click)="toggle(e)">
                        {{ e.active ? 'Désactiver' : 'Activer' }}
                      </button>
                    </div>
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }
    @if (selected(); as e) {
      <section class="panel detail-panel" aria-label="Détail employé">
        <div class="row">
          <h2>{{ e.firstName }} {{ e.lastName }}</h2>
          <button class="icon" (click)="selected.set(null)" aria-label="Fermer le détail">×</button>
        </div>
        <dl>
          <dt>Matricule</dt>
          <dd>{{ e.employeeNumber }}</dd>
          <dt>Email</dt>
          <dd>{{ e.email || 'Non associé' }}</dd>
          <dt>Téléphone</dt>
          <dd>{{ e.phone || 'Non renseigné' }}</dd>
          <dt>Embauche</dt>
          <dd>{{ e.hireDate }}</dd>
          <dt>Poste</dt>
          <dd>{{ e.position }}</dd>
          <dt>Département</dt>
          <dd>{{ e.departmentName }}</dd>
          <dt>Manager</dt>
          <dd>{{ managerName(e.managerId) }}</dd>
        </dl>
      </section>
    }`,
})
export class EmployeesPage {
  readonly auth = inject(AuthService);
  private api = inject(ApiService);
  private notices = inject(NotificationService);
  readonly rows = signal<Employee[]>([]);
  readonly allEmployees = signal<Employee[]>([]);
  readonly departments = signal<Department[]>([]);
  readonly users = signal<User[]>([]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly showForm = signal(false);
  readonly editing = signal<Employee | null>(null);
  readonly selected = signal<Employee | null>(null);
  readonly backendFields = signal<Record<string, string>>({});
  search = '';
  departmentId = '';
  active = '';
  sort = 'lastName,asc';
  readonly today = new Date().toISOString().slice(0, 10);
  readonly managerOnly = () => this.auth.user()?.role === 'MANAGER';
  readonly form = new FormGroup({
    employeeNumber: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(50)],
    }),
    firstName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    lastName: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(100)],
    }),
    phone: new FormControl<string | null>(null, { validators: [Validators.maxLength(30)] }),
    hireDate: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    position: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    departmentId: new FormControl<number | null>(null, { validators: [Validators.required] }),
    managerId: new FormControl<number | null>(null),
    userId: new FormControl<number | null>(null),
  });
  constructor() {
    this.loadOptions();
    this.load();
  }
  activeDepartments() {
    return this.departments().filter((d) => d.active || d.id === this.editing()?.departmentId);
  }
  managerCandidates() {
    return this.allEmployees().filter((e) => e.active && e.id !== this.editing()?.id);
  }
  availableUsers() {
    const used = new Set(
      this.allEmployees()
        .filter((e) => e.id !== this.editing()?.id)
        .map((e) => e.userId),
    );
    return this.users().filter((u) => u.enabled && !used.has(u.id));
  }
  managerName(id: number | null) {
    if (!id) return 'Non affecté';
    const m = this.allEmployees().find((e) => e.id === id);
    return m ? `${m.firstName} ${m.lastName}` : `Employé #${id}`;
  }
  loadOptions() {
    if (this.managerOnly()) return;
    this.api
      .departments({ size: 200, sort: 'name,asc' })
      .subscribe((x) => this.departments.set(x.content));
    this.api
      .employees({ size: 200, sort: 'lastName,asc' })
      .subscribe((x) => this.allEmployees.set(x.content));
    if (this.auth.user()?.role === 'ADMIN')
      this.api.users({ size: 200, sort: 'email,asc' }).subscribe((x) => this.users.set(x.content));
  }
  load() {
    this.loading.set(true);
    if (this.managerOnly()) {
      this.api.employeeMe().subscribe({
        next: (self) =>
          this.api.team(self.id, { size: 100 }).subscribe({
            next: (x) => {
              this.rows.set(x.content);
              this.allEmployees.set([self, ...x.content]);
              this.loading.set(false);
            },
            error: () => this.loading.set(false),
          }),
        error: () => this.loading.set(false),
      });
    } else
      this.api
        .employees({
          search: this.search,
          departmentId: this.departmentId,
          active: this.active,
          size: 100,
          sort: this.sort,
        })
        .subscribe({
          next: (x) => {
            this.rows.set(x.content);
            this.loading.set(false);
          },
          error: () => this.loading.set(false),
        });
  }
  newEmployee() {
    this.editing.set(null);
    this.backendFields.set({});
    this.form.reset({
      employeeNumber: '',
      firstName: '',
      lastName: '',
      phone: null,
      hireDate: '',
      position: '',
      departmentId: null,
      managerId: null,
      userId: null,
    });
    this.showForm.set(true);
  }
  edit(e: Employee) {
    this.editing.set(e);
    this.backendFields.set({});
    this.form.setValue({
      employeeNumber: e.employeeNumber,
      firstName: e.firstName,
      lastName: e.lastName,
      phone: e.phone,
      hireDate: e.hireDate,
      position: e.position,
      departmentId: e.departmentId,
      managerId: e.managerId,
      userId: e.userId,
    });
    this.showForm.set(true);
  }
  fieldError(name: string) {
    return this.backendFields()[name] ?? '';
  }
  save() {
    if (this.form.invalid) return;
    const raw = this.form.getRawValue();
    if (raw.hireDate > this.today) {
      this.notices.show('La date d’embauche ne peut pas être future.', 'error');
      return;
    }
    if (raw.managerId === this.editing()?.id) {
      this.notices.show('Un employé ne peut pas être son propre manager.', 'error');
      return;
    }
    this.saving.set(true);
    this.backendFields.set({});
    this.api.saveEmployee(raw as EmployeeInput, this.editing()?.id).subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.notices.show('Employé enregistré.', 'success');
        this.loadOptions();
        this.load();
      },
      error: (e: ApiError) => {
        this.saving.set(false);
        this.backendFields.set(e.fieldErrors ?? {});
        this.notices.show(e.message, 'error');
      },
    });
  }
  toggle(e: Employee) {
    if (confirm(`${e.active ? 'Désactiver' : 'Activer'} ${e.firstName} ${e.lastName} ?`))
      this.api.employeeStatus(e.id, !e.active).subscribe({
        next: () => {
          this.notices.show('Statut mis à jour.', 'success');
          this.load();
        },
        error: (x: ApiError) => this.notices.show(x.message, 'error'),
      });
  }
}
