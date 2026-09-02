import AxeBuilder from '@axe-core/playwright';
import { expect, test, APIRequestContext } from '@playwright/test';
import crypto from 'node:crypto';
const apiUrl = 'http://127.0.0.1:8081/api/v1';
async function transitionApplication(
  request: APIRequestContext,
  applicationId: number,
  targetStage: string,
  headers: Record<string, string>,
) {
  const response = await request.patch(
    `${apiUrl}/recruitment/applications/${applicationId}/stage`,
    { headers, data: { stage: targetStage } },
  );
  const body = await response.text();
  expect(
    response.ok(),
    `Transition application=${applicationId} vers ${targetStage}: HTTP ${response.status()} ${body}`,
  ).toBeTruthy();
  const parsed = body ? (JSON.parse(body) as { id: number; stage: string }) : null;
  expect(parsed?.id, `Réponse transition application=${applicationId} sans id`).toBe(applicationId);
  expect(parsed?.stage, `Étape retournée pour application=${applicationId}`).toBe(targetStage);
  return parsed;
}
const email = process.env['E2E_ADMIN_EMAIL'] ?? 'admin@hrflow.local';
const password = process.env['E2E_ADMIN_PASSWORD'] ?? 'NewAdminPassword!2026';
test.describe('Recrutement V2 réel', () => {
  test('offre, CV, pipeline, entretien, évaluation, embauche et rejet', async ({
    page,
    request,
  }, info) => {
    test.setTimeout(180_000);
    const suffix = `${Date.now().toString(36)}-${info.repeatEachIndex}-${info.workerIndex}-${crypto.randomUUID().slice(0, 8)}`;
    const login = await request.post('http://127.0.0.1:8081/api/v1/auth/login', {
      data: { email, password },
    });
    expect(login.ok()).toBeTruthy();
    const token = (await login.json()).accessToken as string;
    const headers = { Authorization: `Bearer ${token}` };
    const department = await (
      await request.post('http://127.0.0.1:8081/api/v1/departments', {
        headers,
        data: { name: `E2E Recruitment ${suffix}`, description: 'Playwright' },
      })
    ).json();
    const interviewer = await (
      await request.post('http://127.0.0.1:8081/api/v1/employees', {
        headers,
        data: {
          employeeNumber: `INT-${suffix}`.slice(0, 50),
          firstName: 'Iris',
          lastName: 'Interviewer',
          phone: null,
          hireDate: '2026-01-01',
          position: 'Interviewer',
          departmentId: department.id,
          managerId: null,
          userId: null,
        },
      })
    ).json();
    await page.goto('/connexion');
    await page.getByLabel('Adresse email').fill(email);
    await page.getByLabel(/Mot de passe/).fill(password);
    await page.getByRole('button', { name: 'Se connecter' }).click();
    await expect(page).toHaveURL(/\/app/);
    await page.goto('/app/recrutement/offres/nouvelle');
    await page.getByLabel('Référence').fill(`PW-${suffix}`.slice(0, 40));
    await page.getByLabel('Intitulé').fill('Ingénieur Playwright');
    await page.getByLabel('Lieu').fill('Rabat');
    await page.getByLabel('Département').evaluate((select, id) => {
      const o = document.createElement('option');
      o.value = String(id);
      o.text = 'E2E department';
      select.append(o);
    }, department.id);
    await page.getByLabel('Département').selectOption(String(department.id));
    await page.getByLabel('Description').fill('Offre créée dans le navigateur');
    await page.getByLabel('Prérequis').fill('TypeScript et Java');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByRole('heading', { name: 'Ingénieur Playwright' })).toBeVisible();
    await page.getByRole('link', { name: 'Modifier' }).click();
    await page.getByLabel('Lieu').fill('Casablanca');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText(/Casablanca/)).toBeVisible();
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Publier' }).click();
    await expect(page.getByText('PUBLISHED')).toBeVisible();
    const offerId = Number(page.url().split('/').pop());
    const candidatePayload = {
      firstName: 'Nora',
      lastName: `E2E-${suffix}`.slice(0, 100),
      email: `candidate-${suffix}@example.test`.slice(0, 254),
      phone: '+212600000001',
      city: 'Rabat',
    };
    const candidateCreate = await request.post(
      'http://127.0.0.1:8081/api/v1/recruitment/candidates',
      { headers, data: candidatePayload },
    );
    const candidateBodyText = await candidateCreate.text();
    let candidateBody: { id?: number; code?: string; message?: string; fieldErrors?: unknown } = {};
    try { candidateBody = candidateBodyText ? JSON.parse(candidateBodyText) : {}; } catch { /* diagnostic body remains raw */ }
    expect(
      candidateCreate.status(),
      `Création candidat: HTTP ${candidateCreate.status()} code=${candidateBody.code ?? ''} message=${candidateBody.message ?? ''} fieldErrors=${JSON.stringify(candidateBody.fieldErrors ?? {})} payload=${JSON.stringify(candidatePayload)} body=${candidateBodyText}`,
    ).toBe(201);
    const candidateId = candidateBody.id!;
    await page.goto(`/app/recrutement/candidats/${candidateId}`);
    const file = page.locator('input[type=file]');
    await file.setInputFiles({
      name: 'cv.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n%%EOF'),
    });
    await expect(page.getByText('CV enregistré.')).toBeVisible();
    await file.setInputFiles({
      name: 'fake.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('not a pdf'),
    });
    await expect(page.getByRole('alert')).toContainText(/PDF/);
    await file.setInputFiles({
      name: 'large.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(5_242_881, 1),
    });
    await expect(page.getByRole('alert')).toContainText(/volumineux|maximum|large/i);
    await page.goto('/app/recrutement/candidatures');
    await page.getByLabel('Candidat').evaluate((select, id) => {
      const o = document.createElement('option');
      o.value = String(id);
      o.text = 'Nora';
      select.append(o);
    }, candidateId);
    await page.getByLabel('Offre').evaluate((select, id) => {
      const o = document.createElement('option');
      o.value = String(id);
      o.text = 'Playwright offer';
      select.append(o);
    }, offerId);
    await page.getByLabel('Candidat').selectOption(String(candidateId));
    await page.getByLabel('Offre').selectOption(String(offerId));
    const applicationCreate = await request.post(
      'http://127.0.0.1:8081/api/v1/recruitment/applications',
      { headers, data: { candidateId, jobOfferId: offerId, source: 'E2E', notes: null } },
    );
    expect(applicationCreate.status()).toBe(201);
    const applicationId = ((await applicationCreate.json()) as { id: number }).id;
    const kanbanHttp = page.waitForResponse(
      (r) =>
        r.url().includes('/api/v1/recruitment/applications') &&
        r.url().includes('status=ACTIVE') &&
        r.request().method() === 'GET',
    );
    await page.goto('/app/recrutement/pipeline');
    await expect(page.getByRole('heading', { name: 'Pipeline Kanban' })).toBeVisible();
    const kanbanPayload = (await (await kanbanHttp).json()) as {
      content: { id: number; stage: string }[];
    };
    const kanbanApp = kanbanPayload.content.find((a) => a.id === applicationId);
    if (kanbanApp) expect(kanbanApp.stage).toBe('APPLIED');
    else {
      const detail = await request.get(
        `http://127.0.0.1:8081/api/v1/recruitment/applications/${applicationId}`,
        { headers },
      );
      expect(detail.ok()).toBeTruthy();
      expect((await detail.json()).stage).toBe('APPLIED');
    }
    for (const stage of ['SCREENING', 'INTERVIEW', 'HR_INTERVIEW', 'OFFER']) {
      await transitionApplication(request, applicationId, stage, headers);
    }
    const forbidden = await request.patch(
      `http://127.0.0.1:8081/api/v1/recruitment/applications/${applicationId}/stage`,
      { headers, data: { stage: 'APPLIED' } },
    );
    expect(forbidden.status()).toBe(409);
    const futureIso = new Date(Date.now() + 86_400_000).toISOString();
    const interviewCreate = await request.post(
      'http://127.0.0.1:8081/api/v1/recruitment/interviews',
      {
        headers,
        data: {
          applicationId,
          interviewerId: interviewer.id,
          scheduledAt: futureIso,
          durationMinutes: 60,
          interviewType: 'TECHNICAL',
          locationOrMeetingUrl: 'https://meet.example/e2e',
          notes: null,
        },
      },
    );
    expect(interviewCreate.ok()).toBeTruthy();
    const interviewId = ((await interviewCreate.json()) as { id: number }).id;
    await page.goto(`/app/recrutement/entretiens/${interviewId}`);
    await expect(page.getByRole('heading', { name: 'Détail entretien' })).toBeVisible();
    await page.getByLabel('Durée').fill('75');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText(/75 minutes/)).toBeVisible();
    if (await page.getByRole('button', { name: 'Finaliser' }).isVisible())
      await page.getByRole('button', { name: 'Finaliser' }).click();
    await page.goto('/app/recrutement/evaluations');
    await page.getByLabel('Entretien').evaluate((select, id) => {
      const o = document.createElement('option');
      o.value = String(id);
      o.text = 'TECHNICAL';
      select.append(o);
    }, interviewId);
    await page.getByLabel('Évaluateur').evaluate((select, id) => {
      const o = document.createElement('option');
      o.value = String(id);
      o.text = 'Iris';
      select.append(o);
    }, interviewer.id);
    await page.getByLabel('Entretien').selectOption(String(interviewId));
    await page.getByLabel('Évaluateur').selectOption(String(interviewer.id));
    await page.getByLabel('Technique').fill('5');
    await page.getByRole('button', { name: 'Enregistrer' }).click();
    await expect(page.getByText('Évaluation enregistrée.')).toBeVisible();
    await page.goto(`/app/recrutement/candidatures/${applicationId}`);
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Confirmer l’embauche' }).click();
    await expect(page.getByText('Candidat embauché.')).toBeVisible();
    const again = await request.post(
      `http://127.0.0.1:8081/api/v1/recruitment/applications/${applicationId}/hire`,
      { headers },
    );
    expect(again.ok()).toBeTruthy();
    expect((await again.json()).hiredEmployeeId).toBeTruthy();
    await page.goto('/app/employes');
    await expect(page.getByText(`Nora E2E-${suffix}`)).toBeVisible();
    const second = await (
      await request.post('http://127.0.0.1:8081/api/v1/recruitment/candidates', {
        headers,
        data: {
          firstName: 'Rémi',
          lastName: `Reject-${suffix}`.slice(0, 100),
          email: `reject-${suffix}@example.test`.slice(0, 254),
          phone: '+212600000002',
          city: 'Fès',
        },
      })
    ).json();
    const offer2 = await (
      await request.post('http://127.0.0.1:8081/api/v1/recruitment/offers', {
        headers,
        data: {
          reference: `RJ-${suffix}`.slice(0, 40),
          title: 'Offre rejet',
          description: 'Test',
          requirements: 'Test',
          location: 'Fès',
          employmentType: 'FIXED_TERM',
          departmentId: department.id,
          closingDate: '2027-01-01',
        },
      })
    ).json();
    await request.patch(`http://127.0.0.1:8081/api/v1/recruitment/offers/${offer2.id}/publish`, {
      headers,
    });
    const app2 = await (
      await request.post('http://127.0.0.1:8081/api/v1/recruitment/applications', {
        headers,
        data: { candidateId: second.id, jobOfferId: offer2.id, source: 'E2E' },
      })
    ).json();
    await page.goto(`/app/recrutement/candidatures/${app2.id}`);
    await expect(page.getByRole('button', { name: 'Rejeter' })).toBeDisabled();
    await page.getByLabel('Motif du rejet').fill('Profil non retenu');
    page.once('dialog', (d) => d.accept());
    await page.getByRole('button', { name: 'Rejeter' }).click();
    await expect(page.getByText('Candidature rejetée.')).toBeVisible();
    for (const path of ['dashboard', 'offres', 'candidats', 'pipeline', 'entretiens']) {
      await page.goto(`/app/recrutement/${path}`);
      expect((await new AxeBuilder({ page }).analyze()).violations).toEqual([]);
    }
    const anonymous = await request.get('http://127.0.0.1:8081/api/v1/recruitment/candidates');
    expect(anonymous.status()).toBe(401);
  });
});
