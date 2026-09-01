import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, provideRouter } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { AuthService } from '../../core/auth/auth.service';
import { ApiError, Message } from '../../core/models/api.models';
import { AuthPage } from './auth-page';

type AuthStub = Pick<
  AuthService,
  'forgot' | 'reset' | 'resend' | 'login' | 'register' | 'loadMe' | 'verify'
>;
const success: Message = { message: 'Si le compte existe, un email a été envoyé.' };

function setup(mode: string, token: string | null = null) {
  const auth: AuthStub = {
    forgot: vi.fn(() => of(success)),
    reset: vi.fn(() => of({ message: 'Mot de passe réinitialisé' })),
    resend: vi.fn(() => of(success)),
    login: vi.fn(),
    register: vi.fn(),
    loadMe: vi.fn(),
    verify: vi.fn(),
  };
  const router = {
    navigate: vi.fn(() => Promise.resolve(true)),
    navigateByUrl: vi.fn(() => Promise.resolve(true)),
  };
  TestBed.configureTestingModule({
    imports: [AuthPage],
    providers: [
      provideRouter([]),
      { provide: AuthService, useValue: auth },
      { provide: Router, useValue: router },
      {
        provide: ActivatedRoute,
        useValue: {
          snapshot: {
            data: { mode },
            queryParamMap: { get: (name: string) => (name === 'token' ? token : null) },
          },
        },
      },
    ],
  });
  const fixture = TestBed.createComponent(AuthPage);
  fixture.detectChanges();
  return { fixture, component: fixture.componentInstance, auth, router };
}

function button(fixture: ComponentFixture<AuthPage>, label: string) {
  return [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
    (element) => element.textContent?.trim() === label,
  ) as HTMLButtonElement;
}

describe('AuthPage — mot de passe oublié', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('désactive le bouton pour un email vide', () => {
    const { fixture } = setup('forgot');
    expect(button(fixture, 'Envoyer le lien').disabled).toBe(true);
  });

  it('désactive le bouton pour un email incorrect', () => {
    const { fixture, component } = setup('forgot');
    component.emailForm.controls.email.setValue('incorrect');
    fixture.detectChanges();
    expect(button(fixture, 'Envoyer le lien').disabled).toBe(true);
  });

  it('active le bouton pour admin@hrflow.local', () => {
    const { fixture, component } = setup('forgot');
    component.emailForm.controls.email.setValue('admin@hrflow.local');
    fixture.detectChanges();
    expect(component.emailForm.valid).toBe(true);
    expect(button(fixture, 'Envoyer le lien').disabled).toBe(false);
  });

  it('envoie exactement le DTO email attendu et affiche la confirmation', () => {
    const { fixture, component, auth } = setup('forgot');
    component.emailForm.controls.email.setValue('admin@hrflow.local');
    component.submitEmail();
    fixture.detectChanges();
    expect(auth.forgot).toHaveBeenCalledTimes(1);
    expect(auth.forgot).toHaveBeenCalledWith('admin@hrflow.local');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(success.message);
    expect(component.busy()).toBe(false);
  });

  it('empêche une double soumission et conserve loading jusqu’à la réponse', () => {
    const pending = new Subject<Message>();
    const { component, auth } = setup('forgot');
    vi.mocked(auth.forgot).mockReturnValue(pending);
    component.emailForm.controls.email.setValue('admin@hrflow.local');
    component.submitEmail();
    component.submitEmail();
    expect(auth.forgot).toHaveBeenCalledTimes(1);
    expect(component.busy()).toBe(true);
    pending.next(success);
    pending.complete();
    expect(component.busy()).toBe(false);
  });

  it('réinitialise loading et affiche une erreur réseau', () => {
    const error = {
      status: 0,
      code: 'HTTP_ERROR',
      message: 'Le serveur HRFlow est indisponible.',
    } as ApiError;
    const { fixture, component, auth } = setup('forgot');
    vi.mocked(auth.forgot).mockReturnValue(throwError(() => error));
    component.emailForm.controls.email.setValue('admin@hrflow.local');
    component.submitEmail();
    fixture.detectChanges();
    expect(component.busy()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(error.message);
  });
});

describe('AuthPage — réinitialisation', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('affiche une erreur claire et désactive le bouton sans token', () => {
    const { fixture } = setup('reset');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('aucun token');
    expect(button(fixture, 'Réinitialiser').disabled).toBe(true);
  });

  it('n’affiche aucun champ ou libellé email fantôme', () => {
    const { fixture } = setup('reset', 'token-valide');
    expect((fixture.nativeElement as HTMLElement).querySelector('input[type="email"]')).toBeNull();
    expect((fixture.nativeElement as HTMLElement).textContent).not.toContain('Adresse email');
  });

  it('rend le formulaire utilisable avec un token', () => {
    const { component } = setup('reset', 'token-valide');
    expect(component.resetToken()).toBe('token-valide');
    expect(component.resetForm.enabled).toBe(true);
  });

  it('désactive le bouton si le mot de passe est trop court', () => {
    const { fixture, component } = setup('reset', 'token-valide');
    component.resetForm.setValue({ newPassword: 'trop-court', confirmation: 'trop-court' });
    fixture.detectChanges();
    expect(button(fixture, 'Réinitialiser').disabled).toBe(true);
  });

  it('signale une confirmation différente', () => {
    const { fixture, component } = setup('reset', 'token-valide');
    component.resetForm.setValue({
      newPassword: 'NouveauPassword!2026',
      confirmation: 'AutrePassword!!2026',
    });
    component.resetForm.controls.confirmation.markAsTouched();
    fixture.detectChanges();
    expect(component.resetForm.hasError('passwordMismatch')).toBe(true);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('ne correspondent pas');
  });

  it('active le bouton avec un token et deux mots de passe valides identiques', () => {
    const { fixture, component } = setup('reset', 'token-valide');
    component.resetForm.setValue({
      newPassword: 'NouveauPassword!2026',
      confirmation: 'NouveauPassword!2026',
    });
    fixture.detectChanges();
    expect(button(fixture, 'Réinitialiser').disabled).toBe(false);
  });

  it('envoie exactement {token, newPassword} une seule fois', () => {
    const pending = new Subject<Message>();
    const { component, auth } = setup('reset', 'token-valide');
    vi.mocked(auth.reset).mockReturnValue(pending);
    component.resetForm.setValue({
      newPassword: 'NouveauPassword!2026',
      confirmation: 'NouveauPassword!2026',
    });
    component.submitReset();
    component.submitReset();
    expect(auth.reset).toHaveBeenCalledTimes(1);
    expect(auth.reset).toHaveBeenCalledWith('token-valide', 'NouveauPassword!2026');
    expect(component.busy()).toBe(true);
    pending.complete();
    expect(component.busy()).toBe(false);
  });

  it('redirige vers la connexion avec confirmation après succès', () => {
    const { component, router } = setup('reset', 'token-valide');
    component.resetForm.setValue({
      newPassword: 'NouveauPassword!2026',
      confirmation: 'NouveauPassword!2026',
    });
    component.submitReset();
    expect(router.navigate).toHaveBeenCalledWith(['/connexion'], {
      queryParams: { reset: 'success' },
    });
    expect(component.busy()).toBe(false);
  });

  it('affiche les erreurs de token invalide, expiré ou utilisé et réinitialise loading', () => {
    const backendError = {
      status: 400,
      code: 'INVALID_TOKEN',
      message: 'Token invalide ou expiré',
    } as ApiError;
    const { fixture, component, auth } = setup('reset', 'token-invalide');
    vi.mocked(auth.reset).mockReturnValue(throwError(() => backendError));
    component.resetForm.setValue({
      newPassword: 'NouveauPassword!2026',
      confirmation: 'NouveauPassword!2026',
    });
    component.submitReset();
    fixture.detectChanges();
    expect(component.busy()).toBe(false);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      'Token invalide ou expiré',
    );
  });
});
