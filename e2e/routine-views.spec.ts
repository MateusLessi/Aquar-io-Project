import { expect, test, type Locator, inBar } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('see routines as a week and as an agenda, and open the week from the dashboard', async ({
  page,
}) => {
  await page.goto('/aquarium?tab=routines');
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Estudo');
  await page.getByRole('textbox', { name: 'Etiqueta' }).fill('Faculdade');
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByRole('button', { name: 'Criar rotina' })).toHaveCount(0);

  // The week: the routine is a block with its hours and label.
  await inBar(page, page.getByRole('radio', { name: 'Semana', exact: true }));
  await expect(
    visible(page.getByRole('button', { name: /^Estudo, .*07:00 às 08:00, Faculdade/ })),
  ).toBeVisible();

  // The agenda lists today first.
  await inBar(page, page.getByRole('radio', { name: 'Lista', exact: true }));
  await expect(
    visible(page.getByRole('button', { name: /^Estudo, 07:00 às 08:00/ })),
  ).toBeVisible();

  // The choice is remembered.
  await page.reload();
  await expect(
    visible(page.getByRole('button', { name: /^Estudo, 07:00 às 08:00/ })),
  ).toBeVisible();

  // The dashboard shows the week; a day opens it in Agenda.
  await page.goto('/');
  await expect(visible(page.getByText('Sua semana'))).toBeVisible();
  await expect(visible(page.getByText('Próxima: Estudo'))).toBeVisible();
  // Computers show the week under the tank (the tides), and only what comes next in the
  // agenda: the routines' week map is on phones and tablets.
  if (test.info().project.name === 'desktop') return;
  await visible(
    page.getByRole('button', {
      name: /^(domingo|segunda|terça|quarta|quinta|sexta|sábado) \d+: Estudo às 07:00/,
    }),
  ).click();
  await expect(page).toHaveURL(/view=week/);
  await expect(
    visible(page.getByRole('button', { name: /^Estudo, .*07:00 às 08:00, Faculdade/ })),
  ).toBeVisible();
});
