import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError, Message, TokenResponse } from '../../core/models/api.models';
@Component({
  selector: 'app-auth-page',
  imports: [ReactiveFormsModule, RouterLink],
  template: `<h1>{{ title() }}</h1>
    <p class="muted">{{ subtitle() }}</p>
    @if (message()) {
      <div class="alert success" role="status">{{ message() }}</div>
    }
    @if (error()) {
      <div class="alert error" role="alert">{{ error() }}</div>
    }
    @if (mode() === 'verify') {
      <button (click)="verify()" [disabled]="busy()">Vérifier mon adresse</button>
    } @else {
      <form [formGroup]="form" (ngSubmit)="submit()">
        <label
          >Adresse email
          @if (mode() !== 'reset') {
            <input type="email" formControlName="email" autocomplete="email" />
            @if (fieldError('email')) {
              <small class="field-error">{{ fieldError('email') }}</small>
            }
          }
        </label>
        @if (mode() === 'login' || mode() === 'register' || mode() === 'reset') {
          <label
            >{{ mode() === 'reset' ? 'Nouveau mot de passe' : 'Mot de passe'
            }}<span class="password"
              ><input
                [type]="visible() ? 'text' : 'password'"
                formControlName="password"
                [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
              />
              @if (fieldError(mode() === 'reset' ? 'newPassword' : 'password')) {
                <small class="field-error">{{
                  fieldError(mode() === 'reset' ? 'newPassword' : 'password')
                }}</small>
              }
              <button
                type="button"
                class="icon"
                (click)="visible.update((v) => !v)"
                [attr.aria-label]="
                  visible() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
                "
              >
                ◉
              </button></span
            ></label
          ><small>12 à 72 caractères pour un nouveau mot de passe.</small>
        }
        <button [disabled]="form.invalid || busy()">
          {{ busy() ? 'Veuillez patienter…' : action() }}
        </button>
      </form>
    }
    <div class="auth-links">
      @if (mode() !== 'login') {
        <a routerLink="/connexion">Connexion</a>
      }
      @if (mode() === 'login') {
        <a routerLink="/mot-de-passe-oublie">Mot de passe oublié ?</a
        ><a routerLink="/inscription">Créer un compte</a>
      }
    </div>`,
})
export class AuthPage {
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  readonly mode = signal(this.route.snapshot.data['mode'] as string);
  readonly busy = signal(false);
  readonly visible = signal(false);
  readonly error = signal('');
  readonly message = signal('');
  readonly backendFields = signal<Record<string, string>>({});
  readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(12), Validators.maxLength(72)],
    }),
  });
  title = () =>
    ({
      login: 'Bienvenue',
      register: 'Créer votre compte',
      forgot: 'Mot de passe oublié',
      resend: 'Renvoyer la vérification',
      reset: 'Nouveau mot de passe',
      verify: 'Vérifier votre email',
    })[this.mode()] ?? 'HRFlow';
  subtitle = () =>
    this.mode() === 'login'
      ? 'Connectez-vous à votre espace RH.'
      : 'Suivez les indications pour sécuriser votre compte.';
  action = () =>
    ({
      login: 'Se connecter',
      register: 'S’inscrire',
      forgot: 'Envoyer le lien',
      resend: 'Renvoyer',
      reset: 'Réinitialiser',
    })[this.mode()] ?? 'Continuer';
  submit() {
    if (this.form.invalid || this.busy()) return;
    this.busy.set(true);
    this.error.set('');
    this.backendFields.set({});
    const { email, password } = this.form.getRawValue();
    const mode = this.mode();
    const token = this.route.snapshot.queryParamMap.get('token') ?? '';
    const request: Observable<Message | TokenResponse> =
      mode === 'login'
        ? this.auth.login(email, password)
        : mode === 'register'
          ? this.auth.register(email, password)
          : mode === 'forgot'
            ? this.auth.forgot(email)
            : mode === 'resend'
              ? this.auth.resend(email)
              : this.auth.reset(token, password);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (r) => {
        if (mode === 'login')
          this.auth
            .loadMe()
            .subscribe(
              () =>
                void this.router.navigateByUrl(
                  this.route.snapshot.queryParamMap.get('returnUrl') || '/app',
                ),
            );
        else this.message.set('message' in r ? r.message : 'Opération réussie.');
      },
      error: (e: ApiError) => {
        this.error.set(e.message);
        this.backendFields.set(e.fieldErrors ?? {});
        if (e.code === 'EMAIL_NOT_VERIFIED')
          this.message.set('Votre adresse doit être vérifiée avant la connexion.');
      },
    });
  }
  verify() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set('Lien de vérification invalide.');
      return;
    }
    this.busy.set(true);
    this.auth
      .verify(token)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => this.message.set(r.message),
        error: (e: ApiError) => this.error.set(e.message),
      });
  }
  fieldError(name: string) {
    return this.backendFields()[name] ?? '';
  }
}
