import { expect, test, type Locator } from '@playwright/test';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('statistics count what was done, from the dashboard and the profile', async ({ page }) => {
  // Empty at first: the screen explains what will appear.
  await page.goto('/profile/stats');
  await expect(visible(page.getByText('Seus números aparecem aqui'))).toBeVisible();

  // A habit done today.
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Meditar');
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);
  const check = page.getByRole('checkbox', { name: 'Meditar: feito hoje' }).first();
  await check.click();
  await expect(check).toHaveAttribute('aria-checked', 'true');

  // The dashboard card counts it and opens the statistics.
  await page.goto('/');
  await expect(visible(page.getByText('Esta semana'))).toBeVisible();
  await expect(visible(page.getByText('1 hábito', { exact: true }))).toBeVisible();
  await visible(page.getByRole('button', { name: 'Ver estatísticas' })).click();
  await expect(page).toHaveURL(/\/profile\/stats/);

  await expect(visible(page.getByLabel(/^Concluídos: 1\./))).toBeVisible();
  await expect(visible(page.getByLabel(/^Meditar: 1 de 1 dias planejados/))).toBeVisible();

  // The chart has a table view.
  await visible(page.getByRole('button', { name: 'Ver como tabela' })).click();
  await expect(visible(page.getByText('Tarefas', { exact: true }))).toBeVisible();

  // The month too, and the profile links here.
  await page.getByRole('radio', { name: 'Mês', exact: true }).click();
  await expect(visible(page.getByText(/^Dias de maré cheia/))).toBeVisible();
  await page.goto('/profile');
  await visible(page.getByRole('button', { name: /^Estatísticas/ })).click();
  await expect(page).toHaveURL(/\/profile\/stats/);
});
