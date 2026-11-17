import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('dashboard blocks open their place, and the week says what each day had', async ({ page }) => {
  // A habit done today.
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('button', { name: 'Começar do zero' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Meditar');
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Meditar: feito hoje' }).first().click();
  await page.waitForTimeout(1500);

  await page.goto('/');
  // The week chart: today's summary, by kind.
  await expect(visible(page.getByText(/^Hoje: 1 hábito · \d+ pontos/))).toBeVisible();

  // The whole habits block opens the habits.
  await visible(page.getByRole('button', { name: /^Abrir hábitos/ })).click();
  await expect(page).toHaveURL(/tab=habits/);
});
