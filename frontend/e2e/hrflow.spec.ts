import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const email = process.env['E2E_ADMIN_EMAIL'] ?? 'admin@hrflow.local';
const password = process.env['E2E_ADMIN_PASSWORD'] ?? 'NewAdminPassword!2026';

async function login(page: import('@playwright/test').Page) {
  await page.goto('/connexion');
  await page.getByLabel('Adresse email').fill(email);
  await page.getByLabel(/Mot de passe/).fill(password);
  await page.getByRole('button', { name: 'Se connecter' }).click();
  await expect(page).toHaveURL(/\/app/);
}

async function navigate(page: import('@playwright/test').Page, name: RegExp) {
  const link = page.getByRole('link', { name });
  if ((page.viewportSize()?.width ?? 1000) <= 850)
    await page.getByRole('button', { name: 'Ouvrir le menu' }).click();
  await link.click();
}

test.describe('HRFlow réel', () => {
  test('mot de passe oublié et réinitialisation complète via Mailpit', async ({
    page,
    request,
  }) => {
    const resetEmail = 'admin@hrflow.local';
    const newPassword = 'NewAdminPassword!2026';
    await page.goto('/mot-de-passe-oublie');
    const submit = page.getByRole('button', { name: 'Envoyer le lien' });
    await expect(submit).toBeDisabled();
    await page.getByLabel('Adresse email').fill(resetEmail);
    await expect(submit).toBeEnabled();
    await submit.click();
    await expect(page.getByText('Si le compte existe, un email a été envoyé.')).toBeVisible();

    let token = '';
    await expect
      .poll(
        async () => {
          const list = await (await request.get('http://127.0.0.1:8025/api/v1/messages')).json();
          const summary = (list.messages ?? []).find(
            (item: { To?: { Address: string }[]; Subject: string }) =>
              item.To?.some((recipient) => recipient.Address === resetEmail) &&
              item.Subject.includes('Réinitialisation'),
          );
          token =
            /reset-password\?token=([A-Za-z0-9_-]+)/.exec(summary?.Snippet ?? '')?.[1] ?? '';
          return token;
        },
        { timeout: 15_000 },
      )
      .not.toBe('');

    await page.goto(`/reset-password?token=${token}`);
    await expect(page.getByText('Adresse email')).toHaveCount(0);
    const reset = page.getByRole('button', { name: 'Réinitialiser' });
    await expect(reset).toBeDisabled();
    await page.getByLabel('Nouveau mot de passe', { exact: true }).fill(newPassword);
    await page.getByLabel('Confirmer le mot de passe', { exact: true }).fill(newPassword);
    await expect(reset).toBeEnabled();
    const axe = await new AxeBuilder({ page }).analyze();
    expect(axe.violations).toEqual([]);
    await reset.click();
    await expect(page).toHaveURL(/\/connexion\?reset=success/);
    await expect(page.getByText(/mot de passe a été réinitialisé/)).toBeVisible();
    await page.getByLabel('Adresse email').fill(resetEmail);
    await page.getByLabel(/Mot de passe/).fill(newPassword);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/app/);
  });

  test('inscription, email Mailpit, vérification, login et profil réel', async ({
    page,
    request,
  }, testInfo) => {
    const registered = `e2e.${testInfo.project.name}.${Date.now()}@hrflow.local`;
    await page.goto('/inscription');
    await page.getByLabel('Adresse email').fill(registered);
    await page.getByLabel(/Mot de passe/).fill(password);
    await page.getByRole('button', { name: 'S’inscrire' }).click();
    await expect(page.getByText(/Inscription réussie/)).toBeVisible();
    let token = '';
    await expect
      .poll(
        async () => {
          const list = await (await request.get('http://127.0.0.1:8025/api/v1/messages')).json();
          for (const summary of list.messages ?? []) {
            if (
              summary.To?.some((recipient: { Address: string }) => recipient.Address === registered)
            )
              token = /verify-email\?token=([A-Za-z0-9_-]+)/.exec(summary.Snippet ?? '')?.[1] ?? '';
          }
          return token;
        },
        { timeout: 15_000 },
      )
      .not.toBe('');
    await page.goto(`/verifier-email?token=${token}`);
    await page.getByRole('button', { name: 'Vérifier mon adresse' }).click();
    await expect(page.getByText('Adresse email vérifiée')).toBeVisible();
    await page.goto('/connexion');
    await page.getByLabel('Adresse email').fill(registered);
    await page.getByLabel(/Mot de passe/).fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page.getByRole('heading', { name: 'Mon profil' })).toBeVisible();
    await expect(page.locator('#contenu dd').filter({ hasText: registered })).toBeVisible();
  });

  test('connexion ADMIN, dashboard, navigation, accessibilité et déconnexion', async ({ page }) => {
    await login(page);
    await navigate(page, /Dashboard/);
    await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible();
    await expect(page.getByText('Employés', { exact: true }).first()).toBeVisible();
    await navigate(page, /Utilisateurs/);
    await expect(page.getByRole('heading', { name: 'Utilisateurs' })).toBeVisible();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
    await page.getByRole('button', { name: 'Déconnexion' }).click();
    await expect(page).toHaveURL(/\/connexion/);
    expect(await page.evaluate(() => sessionStorage.getItem('hrflow_access_token'))).toBeNull();
  });

  test('création d’un département et conflit 409', async ({ page }) => {
    await login(page);
    await navigate(page, /Départements/);
    const name = `E2E Qualité ${Date.now()}`;
    await page.getByLabel('Nom').fill(name);
    await page.getByLabel('Description').fill('Département créé par le test contrôlé');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Département enregistré.')).toBeVisible();
    await page.getByLabel('Nom').fill(name);
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Un département porte déjà ce nom')).toBeVisible();
  });

  test('pages 403 et 404 accessibles', async ({ page }) => {
    await page.goto('/403');
    await expect(page.getByRole('heading', { name: 'Accès interdit' })).toBeVisible();
    await page.goto('/adresse-inconnue');
    await expect(page.getByRole('heading', { name: 'Page introuvable' })).toBeVisible();
  });

  test('création employé, demande de congé et approbation ADMIN', async ({ page }, testInfo) => {
    await login(page);
    await navigate(page, /Employés/);
    await page.getByRole('button', { name: 'Nouvel employé' }).click();
    const suffix = Date.now().toString().slice(-7);
    await page.getByRole('textbox', { name: 'Matricule' }).fill(`E2E-${suffix}`);
    await page.getByLabel('Prénom').fill('E2E');
    await page.getByLabel('Nom', { exact: true }).fill('Administrateur');
    await page.getByLabel('Date d’embauche').fill('2026-01-15');
    await page.getByLabel('Poste').fill('Validation E2E');
    const employeeForm = page.locator('form.employee-form');
    await employeeForm.getByLabel('Département').selectOption({ index: 1 });
    const accounts = employeeForm.getByLabel('Compte utilisateur');
    if ((await accounts.locator('option').allTextContents()).includes(email))
      await accounts.selectOption({ label: email });
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Employé enregistré.')).toBeVisible();
    await navigate(page, /Congés/);
    await page.getByRole('button', { name: 'Nouvelle demande' }).click();
    const startDate = new Date();
    startDate.setUTCDate(startDate.getUTCDate() + 30 + (Number(suffix) % 240));
    if (testInfo.project.name === 'mobile') startDate.setUTCDate(startDate.getUTCDate() + 3);
    const endDate = new Date(startDate);
    endDate.setUTCDate(endDate.getUTCDate() + 2);
    const start = startDate.toISOString().slice(0, 10);
    const end = endDate.toISOString().slice(0, 10);
    await page.getByLabel('Début').fill(start);
    await page.getByLabel('Fin').fill(end);
    await page.getByLabel('Motif').fill('Validation du workflow');
    await page.getByRole('button', { name: 'Envoyer' }).click();
    await expect(page.getByText('Demande envoyée.')).toBeVisible();
    page.once('dialog', (dialog) => dialog.accept('Validé par E2E'));
    await page.getByRole('button', { name: 'Approuver' }).first().click();
    await expect(page.getByText('Décision enregistrée.')).toBeVisible();
  });
});
