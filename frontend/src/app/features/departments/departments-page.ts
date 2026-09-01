import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Department } from '../../core/models/api.models';
import { ApiService } from '../../core/services/api.service';
import { NotificationService } from '../../core/services/notification.service';
@Component({
  selector: 'app-departments',
  imports: [FormsModule, ReactiveFormsModule],
  template: `<header class="page-head">
      <div>
        <p class="eyebrow">Organisation</p>
        <h1>Départements</h1>
      </div>
      <button (click)="editing.set(null); form.reset()">Nouveau département</button>
    </header>
    <section class="grid">
      <div>
        <div class="toolbar">
          <label>Rechercher<input [(ngModel)]="search" (keyup.enter)="load()" /></label
          ><button (click)="load()">Filtrer</button>
        </div>
        @if (loading()) {
          <div class="state">Chargement…</div>
        } @else {
          <div class="cards">
            @for (d of rows(); track d.id) {
              <article class="panel">
                <div class="row">
                  <div>
                    <h2>{{ d.name }}</h2>
                    <p>{{ d.description || 'Sans description' }}</p>
                  </div>
                  <span class="badge" [class.off]="!d.active">{{
                    d.active ? 'Actif' : 'Inactif'
                  }}</span>
                </div>
                <div class="actions">
                  <button class="secondary" (click)="edit(d)">Modifier</button
                  ><button class="secondary" (click)="toggle(d)">
                    {{ d.active ? 'Désactiver' : 'Activer' }}
                  </button>
                </div>
              </article>
            } @empty {
              <div class="state">Aucun département.</div>
            }
          </div>
        }
      </div>
      <form class="panel form-panel" [formGroup]="form" (ngSubmit)="save()">
        <h2>{{ editing() ? 'Modifier' : 'Ajouter' }} un département</h2>
        <label>Nom<input formControlName="name" maxlength="120" /></label
        ><label
          >Description<textarea formControlName="description" maxlength="1000"></textarea></label
        ><button [disabled]="form.invalid">Enregistrer</button>
      </form>
    </section>`,
})
export class DepartmentsPage {
  private api = inject(ApiService);
  private n = inject(NotificationService);
  readonly rows = signal<Department[]>([]);
  readonly loading = signal(true);
  readonly editing = signal<Department | null>(null);
  search = '';
  readonly form = new FormGroup({
    name: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.maxLength(120)],
    }),
    description: new FormControl<string | null>(null, { validators: [Validators.maxLength(1000)] }),
  });
  constructor() {
    this.load();
  }
  load() {
    this.api.departments({ search: this.search, size: 50 }).subscribe({
      next: (x) => {
        this.rows.set(x.content);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
  edit(d: Department) {
    this.editing.set(d);
    this.form.setValue({ name: d.name, description: d.description });
  }
  save() {
    if (this.form.invalid) return;
    this.api.saveDepartment(this.form.getRawValue(), this.editing()?.id).subscribe({
      next: () => {
        this.n.show('Département enregistré.', 'success');
        this.editing.set(null);
        this.form.reset();
        this.load();
      },
      error: (e) => this.n.show(e.message, 'error'),
    });
  }
  toggle(d: Department) {
    if (confirm(`${d.active ? 'Désactiver' : 'Activer'} ${d.name} ?`))
      this.api
        .departmentStatus(d.id, !d.active)
        .subscribe({ next: () => this.load(), error: (e) => this.n.show(e.message, 'error') });
  }
}
