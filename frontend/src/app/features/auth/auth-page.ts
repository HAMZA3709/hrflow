import { Component, computed, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError, Message, TokenResponse } from '../../core/models/api.models';

function matchingPasswords(control: AbstractControl): ValidationErrors | null {
  const password = control.get('newPassword')?.value as string | undefined;
  const confirmation = control.get('confirmation')?.value as string | undefined;
  return password && confirmation && password !== confirmation ? { passwordMismatch: true } : null;
}

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
    } @else if (mode() === 'forgot' || mode() === 'resend') {
      <form [formGroup]="emailForm" (ngSubmit)="submitEmail()" novalidate>
        <label
          >Adresse email
          <input type="email" formControlName="email" autocomplete="email" />
        </label>
        @if (emailForm.controls.email.touched && emailForm.controls.email.hasError('required')) {
          <small class="field-error">L’adresse email est obligatoire.</small>
        }
        @if (emailForm.controls.email.touched && emailForm.controls.email.hasError('email')) {
          <small class="field-error">Saisissez une adresse email valide.</small>
        }
        @if (fieldError('email')) {
          <small class="field-error">{{ fieldError('email') }}</small>
        }
        <button [disabled]="emailForm.invalid || busy()">
          {{ busy() ? 'Veuillez patienter…' : action() }}
        </button>
      </form>
    } @else if (mode() === 'reset') {
      <form [formGroup]="resetForm" (ngSubmit)="submitReset()" novalidate>
        <label for="new-password">Nouveau mot de passe</label>
        <span class="password"
          ><input
            id="new-password"
            [type]="passwordVisible() ? 'text' : 'password'"
            formControlName="newPassword"
            autocomplete="new-password"
          /><button
            type="button"
            class="icon password-toggle"
            (click)="passwordVisible.update((v) => !v)"
            [attr.aria-label]="
              passwordVisible()
                ? 'Masquer le nouveau mot de passe'
                : 'Afficher le nouveau mot de passe'
            "
          >
            <span aria-hidden="true">{{ passwordVisible() ? '◉' : '◎' }}</span>
          </button></span
        >
        @if (
          resetForm.controls.newPassword.touched &&
          resetForm.controls.newPassword.hasError('required')
        ) {
          <small class="field-error">Le nouveau mot de passe est obligatoire.</small>
        }
        @if (
          resetForm.controls.newPassword.touched &&
          (resetForm.controls.newPassword.hasError('minlength') ||
            resetForm.controls.newPassword.hasError('maxlength'))
        ) {
          <small class="field-error"
            >Le mot de passe doit contenir entre 12 et 72 caractères.</small
          >
        }
        @if (fieldError('newPassword')) {
          <small class="field-error">{{ fieldError('newPassword') }}</small>
        }
        <label for="password-confirmation">Confirmer le mot de passe</label>
        <span class="password"
          ><input
            id="password-confirmation"
            [type]="confirmationVisible() ? 'text' : 'password'"
            formControlName="confirmation"
            autocomplete="new-password"
          /><button
            type="button"
            class="icon password-toggle"
            (click)="confirmationVisible.update((v) => !v)"
            [attr.aria-label]="
              confirmationVisible() ? 'Masquer la confirmation' : 'Afficher la confirmation'
            "
          >
            <span aria-hidden="true">{{ confirmationVisible() ? '◉' : '◎' }}</span>
          </button></span
        >
        @if (
          resetForm.controls.confirmation.touched &&
          resetForm.controls.confirmation.hasError('required')
        ) {
          <small class="field-error">La confirmation est obligatoire.</small>
        }
        @if (resetForm.hasError('passwordMismatch') && resetForm.controls.confirmation.touched) {
          <small class="field-error">Les mots de passe ne correspondent pas.</small>
        }
        <small>12 à 72 caractères.</small>
        <button [disabled]="!resetToken() || resetForm.invalid || busy()">
          {{ busy() ? 'Veuillez patienter…' : 'Réinitialiser' }}
        </button>
      </form>
    } @else {
      <form [formGroup]="credentialsForm" (ngSubmit)="submitCredentials()" novalidate>
        <label
          >Adresse email<input type="email" formControlName="email" autocomplete="email"
        /></label>
        @if (credentialsForm.controls.email.touched && credentialsForm.controls.email.invalid) {
          <small class="field-error">Saisissez une adresse email valide.</small>
        }
        @if (fieldError('email')) {
          <small class="field-error">{{ fieldError('email') }}</small>
        }
        <label for="account-password">Mot de passe</label>
        <span class="password"
          ><input
            id="account-password"
            [type]="passwordVisible() ? 'text' : 'password'"
            formControlName="password"
            [autocomplete]="mode() === 'login' ? 'current-password' : 'new-password'"
          /><button
            type="button"
            class="icon password-toggle"
            (click)="passwordVisible.update((v) => !v)"
            [attr.aria-label]="
              passwordVisible() ? 'Masquer le mot de passe' : 'Afficher le mot de passe'
            "
          >
            <span aria-hidden="true">{{ passwordVisible() ? '◉' : '◎' }}</span>
          </button></span
        >
        @if (
          credentialsForm.controls.password.touched &&
          credentialsForm.controls.password.hasError('required')
        ) {
          <small class="field-error">Le mot de passe est obligatoire.</small>
        }
        @if (
          mode() === 'register' &&
          credentialsForm.controls.password.touched &&
          (credentialsForm.controls.password.hasError('minlength') ||
            credentialsForm.controls.password.hasError('maxlength'))
        ) {
          <small class="field-error"
            >Le mot de passe doit contenir entre 12 et 72 caractères.</small
          >
        }
        @if (fieldError('password')) {
          <small class="field-error">{{ fieldError('password') }}</small>
        }
        @if (mode() === 'register') {
          <small>12 à 72 caractères.</small>
        }
        <button [disabled]="credentialsForm.invalid || busy()">
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
  readonly resetToken = signal(this.route.snapshot.queryParamMap.get('token')?.trim() ?? '');
  readonly busy = signal(false);
  readonly passwordVisible = signal(false);
  readonly confirmationVisible = signal(false);
  readonly error = signal('');
  readonly message = signal(
    this.route.snapshot.queryParamMap.get('reset') === 'success'
      ? 'Votre mot de passe a été réinitialisé. Vous pouvez maintenant vous connecter.'
      : '',
  );
  readonly backendFields = signal<Record<string, string>>({});

  readonly emailForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
  });
  readonly credentialsForm = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  readonly resetForm = new FormGroup(
    {
      newPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(12), Validators.maxLength(72)],
      }),
      confirmation: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    },
    { validators: matchingPasswords },
  );

  readonly title = computed(
    () =>
      ({
        login: 'Bienvenue',
        register: 'Créer votre compte',
        forgot: 'Mot de passe oublié',
        resend: 'Renvoyer la vérification',
        reset: 'Nouveau mot de passe',
        verify: 'Vérifier votre email',
      })[this.mode()] ?? 'HRFlow',
  );
  readonly subtitle = computed(() =>
    this.mode() === 'login'
      ? 'Connectez-vous à votre espace RH.'
      : 'Suivez les indications pour sécuriser votre compte.',
  );
  readonly action = computed(
    () =>
      ({
        login: 'Se connecter',
        register: 'S’inscrire',
        forgot: 'Envoyer le lien',
        resend: 'Renvoyer',
      })[this.mode()] ?? 'Continuer',
  );

  constructor() {
    if (this.mode() === 'register')
      this.credentialsForm.controls.password.addValidators([
        Validators.minLength(12),
        Validators.maxLength(72),
      ]);
    if (this.mode() === 'reset' && !this.resetToken())
      this.error.set(
        'Le lien de réinitialisation est invalide : aucun token n’a été fourni. Demandez un nouveau lien.',
      );
  }

  submitEmail() {
    if (this.emailForm.invalid || this.busy()) return;
    this.startRequest();
    const email = this.emailForm.controls.email.value;
    const request = this.mode() === 'forgot' ? this.auth.forgot(email) : this.auth.resend(email);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (response) => this.message.set(response.message),
      error: (e: ApiError) => this.showError(e),
    });
  }

  submitCredentials() {
    if (this.credentialsForm.invalid || this.busy()) return;
    this.startRequest();
    const { email, password } = this.credentialsForm.getRawValue();
    const request: Observable<Message | TokenResponse> =
      this.mode() === 'login'
        ? this.auth.login(email, password)
        : this.auth.register(email, password);
    request.pipe(finalize(() => this.busy.set(false))).subscribe({
      next: (response) => {
        if (this.mode() === 'login')
          this.auth
            .loadMe()
            .subscribe(
              () =>
                void this.router.navigateByUrl(
                  this.route.snapshot.queryParamMap.get('returnUrl') || '/app',
                ),
            );
        else if ('message' in response) this.message.set(response.message);
      },
      error: (e: ApiError) => {
        this.showError(e);
        if (e.code === 'EMAIL_NOT_VERIFIED')
          this.message.set('Votre adresse doit être vérifiée avant la connexion.');
      },
    });
  }

  submitReset() {
    if (!this.resetToken() || this.resetForm.invalid || this.busy()) return;
    this.startRequest();
    this.auth
      .reset(this.resetToken(), this.resetForm.controls.newPassword.value)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: () =>
          void this.router.navigate(['/connexion'], { queryParams: { reset: 'success' } }),
        error: (e: ApiError) => this.showError(e),
      });
  }

  verify() {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (!token) {
      this.error.set('Lien de vérification invalide.');
      return;
    }
    if (this.busy()) return;
    this.startRequest();
    this.auth
      .verify(token)
      .pipe(finalize(() => this.busy.set(false)))
      .subscribe({
        next: (r) => this.message.set(r.message),
        error: (e: ApiError) => this.showError(e),
      });
  }

  fieldError(name: string) {
    return this.backendFields()[name] ?? '';
  }
  private startRequest() {
    this.busy.set(true);
    this.error.set('');
    this.message.set('');
    this.backendFields.set({});
  }
  private showError(error: ApiError) {
    this.error.set(error.message || 'Le serveur HRFlow est indisponible. Réessayez plus tard.');
    this.backendFields.set(error.fieldErrors ?? {});
  }
}
