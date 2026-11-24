import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('statistics count what was done, from the dashboard and the profile', async ({ page }) => {
  // Empty at first: the screen explains what will appear.
  await page.goto('/stats');
  await expect(visible(page.getByText('Sua primeira semana começa agora'))).toBeVisible();

  // A habit done today.
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('button', { name: 'Começar do zero' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Meditar');
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);

  // Planned but nothing done yet: a line on what to do, not a row of zeros.
  await page.goto('/stats');
  await expect(visible(page.getByText('Sua primeira semana começa agora'))).toBeVisible();
  await expect(page.getByLabel(/^Concluídos: 0\./)).toHaveCount(0);
  await page.goto('/aquarium?tab=habits');

  const check = page.getByRole('checkbox', { name: 'Meditar: feito hoje' }).first();
  await check.click();
  await expect(check).toHaveAttribute('aria-checked', 'true');

  // The dashboard card counts it and opens the statistics.
  await page.goto('/');
  await expect(visible(page.getByText('Consistência da semana'))).toBeVisible();
  await expect(visible(page.getByText('1 de 1 hábitos e rotinas feitos'))).toBeVisible();
  // The whole block opens the statistics.
  await visible(page.getByRole('button', { name: /^Abrir estatísticas/ })).click();
  await expect(page).toHaveURL(/\/stats$/);

  // The consistency leads; then what got done and each habit.
  await expect(visible(page.getByLabel(/^Consistência da semana: 100%/))).toBeVisible();
  await expect(visible(page.getByLabel(/^Concluídos: 1\./))).toBeVisible();
  await expect(visible(page.getByLabel(/^Meditar: 1 de 1 dias planejados/))).toBeVisible();

  // The charts beyond that wait under "Ver mais detalhes"; the chart has a table view.
  await visible(page.getByRole('button', { name: 'Ver mais detalhes' })).click();
  await visible(page.getByRole('button', { name: 'Ver como tabela' })).click();
  await expect(visible(page.getByText('Tarefas', { exact: true }))).toBeVisible();

  // The month too (day by day as a calendar), and the profile links here.
  await page.getByRole('radio', { name: 'Mês', exact: true }).click();
  await expect(visible(page.getByLabel(/^Consistência do mês: 100%/))).toBeVisible();
  await expect(visible(page.getByText(/^Dias de maré cheia/))).toBeVisible();
  // Each habit opens its page.
  await visible(page.getByRole('button', { name: /^Meditar: 1 de 1 dias planejados/ })).click();
  await expect(page).toHaveURL(/\/aquarium\/habits\//);
  await page.goto('/profile');
  await visible(page.getByRole('button', { name: /^Estatísticas/ })).click();
  await expect(page).toHaveURL(/\/stats$/);
});
