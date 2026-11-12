import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('events, a routine changed for one day, and the month', async ({ page }) => {
  await page.goto('/aquarium?tab=routines');
  await expect(page.getByRole('radio', { name: 'Agenda', exact: true })).toBeChecked();

  // A routine, then skip it today only.
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Leitura');
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByRole('button', { name: 'Criar rotina' })).toHaveCount(0);

  // An all-day event today, from "Novo na agenda".
  await page.getByRole('button', { name: 'Novo na agenda' }).click();
  await page.getByText('Evento', { exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome do evento' }).fill('Prova de Cálculo');
  await page.getByRole('switch', { name: 'O dia todo' }).click();
  await page.getByRole('button', { name: 'Criar evento' }).click();
  await expect(page.getByRole('button', { name: 'Criar evento' })).toHaveCount(0);

  // The day lists it with the routines.
  await expect(page.getByText('Também hoje')).toBeVisible();
  const exam = visible(page.getByRole('button', { name: /^Prova de Cálculo, o dia todo, Evento/ }));
  await expect(exam).toBeVisible();

  // The list and the month show it too.
  await page.getByRole('radio', { name: 'Lista', exact: true }).click();
  await expect(exam).toBeVisible();
  await page.getByRole('radio', { name: 'Mês', exact: true }).click();
  await expect(visible(page.getByRole('button', { name: /, 2 compromissos$/ }))).toBeVisible();
  await expect(exam).toBeVisible();

  // Opening it edits it.
  await exam.click();
  await expect(page.getByRole('button', { name: 'Apagar evento' })).toBeVisible();
  await page.getByRole('textbox', { name: 'Nome do evento' }).fill('Prova de Cálculo 3');
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(
    visible(page.getByRole('button', { name: /^Prova de Cálculo 3, o dia todo/ })),
  ).toBeVisible();

  // Skip the routine today: the month shows only the exam on this day.
  // Today it opens the routine's piece; its edit button offers "só neste dia".
  await visible(page.getByRole('button', { name: /^Leitura, 07:00 às 08:00/ })).click();
  await visible(page.getByRole('button', { name: 'Editar Leitura' })).click();
  await page.getByRole('button', { name: 'Pular este dia' }).click();
  await expect(visible(page.getByRole('button', { name: /, 1 compromisso$/ }))).toBeVisible();
  await expect(page.getByRole('button', { name: /^Leitura, 07:00 às 08:00/ })).toHaveCount(0);
});

test("today's events show on Início and open from there", async ({ page }) => {
  await page.goto('/aquarium?tab=routines');
  await page.getByRole('button', { name: 'Novo na agenda' }).click();
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome do evento' }).fill('Consulta');
  await page.getByRole('switch', { name: 'O dia todo' }).click();
  await page.getByRole('button', { name: 'Criar evento' }).click();
  await expect(page.getByRole('button', { name: 'Criar evento' })).toHaveCount(0);
  await page.waitForTimeout(1500);

  await page.goto('/');
  await expect(visible(page.getByText('Eventos de hoje'))).toBeVisible();
  await visible(page.getByRole('button', { name: /^Consulta, o dia todo/ })).click();
  await expect(page.getByRole('button', { name: 'Apagar evento' })).toBeVisible();
});

test('an event in a list shows inside the list', async ({ page }) => {
  await page.goto('/aquarium?tab=lists');
  await visible(page.getByRole('button', { name: 'Nova lista ou pasta' })).click();
  await page.getByRole('button', { name: /^Nova lista:/ }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Cálculo 3');
  await page.getByRole('button', { name: 'Criar lista', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Criar lista' })).toHaveCount(0);
  await page.waitForTimeout(1500);

  await page.goto('/aquarium?tab=routines');
  await page.getByRole('button', { name: 'Novo na agenda' }).click();
  await page.getByRole('button', { name: 'Evento', exact: true }).click();
  await page.getByRole('textbox', { name: 'Nome do evento' }).fill('Prova');
  await page.getByRole('button', { name: 'Cálculo 3', exact: true }).click();
  await page.getByRole('button', { name: 'Criar evento' }).click();
  await expect(page.getByRole('button', { name: 'Criar evento' })).toHaveCount(0);
  await page.waitForTimeout(1500);

  await page.goto('/aquarium?tab=lists');
  await visible(page.getByRole('button', { name: /^Cálculo 3/ })).click();
  await expect(visible(page.getByText('Na agenda'))).toBeVisible();
  await expect(visible(page.getByRole('button', { name: /^Prova, 09:00 às 10:00/ }))).toBeVisible();
});
