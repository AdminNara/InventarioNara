import { expect, test, type Page } from '@playwright/test';

const counterEmail = process.env.E2E_COUNTER_EMAIL;
const counterPassword = process.env.E2E_COUNTER_PASSWORD;
const supervisorEmail = process.env.E2E_SUPERVISOR_EMAIL;
const supervisorPassword = process.env.E2E_SUPERVISOR_PASSWORD;

const hasCredentials = Boolean(counterEmail && counterPassword && supervisorEmail && supervisorPassword);

async function login(page: Page, email: string, password: string) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
  await page.getByLabel('Correo').fill(email);
  await page.getByLabel('Contraseña').fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión' }).click();
  await expect(page.getByText('Mis levantamientos')).toBeVisible();
}

test.describe('Inventario Nara production smoke', () => {
  test('renders the protected login boundary', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
    await expect(page.getByText('Usa el correo y contraseña creados en Supabase Auth.')).toBeVisible();
  });

  test('counter can authenticate and reach inventory workflow', async ({ page }) => {
    test.skip(!hasCredentials, 'Define E2E_COUNTER_* and E2E_SUPERVISOR_* in the local environment to run authenticated checks.');

    await login(page, counterEmail!, counterPassword!);
    await page.getByRole('button', { name: /Nuevo levantamiento/i }).click();
    await expect(page.getByRole('heading', { name: 'Nuevo levantamiento' })).toBeVisible();
    await page.getByLabel('Cliente *').selectOption({ index: 1 });
    await page.getByLabel('Bodega *').selectOption({ index: 1 });
    await page.getByRole('button', { name: 'Iniciar conteo' }).click();

    const existingDraft = page.getByRole('button', { name: /Continuar borrador/i });
    if (await existingDraft.isVisible().catch(() => false)) {
      await existingDraft.click();
    }

    await expect(page.getByRole('heading', { name: 'Conteo de inventario' })).toBeVisible();
    await page.getByLabel('Buscar artículo').fill('118120007');
    await page.getByText('Sabor Y Color Madona', { exact: false }).click();
    await page.getByLabel('Cantidad').fill('1');
    const expiry = page.getByLabel('Fecha de vencimiento');
    if (await expiry.isVisible().catch(() => false)) {
      await expiry.fill('2027-12-31');
    }
    await page.getByRole('button', { name: /Guardar conteo/i }).click();
    await expect(page.getByText(/Conteo guardado|Lotes guardados/)).toBeVisible();
  });

  test('supervisor can authenticate and reach administration surfaces', async ({ page }) => {
    test.skip(!hasCredentials, 'Define E2E_COUNTER_* and E2E_SUPERVISOR_* in the local environment to run authenticated checks.');

    await login(page, supervisorEmail!, supervisorPassword!);
    await page.getByRole('button', { name: /Catálogo/i }).click();
    await expect(page.getByRole('heading', { name: 'Catálogo de artículos' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Nuevo artículo/i })).toBeVisible();
    await page.getByRole('button', { name: /Perfil/i }).click();
    await page.getByRole('button', { name: /Clientes y bodegas/i }).click();
    await expect(page.getByRole('heading', { name: 'Clientes y bodegas' })).toBeVisible();
  });
});
