import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('a running timer floats over the app: pause it, then finish it from there', async ({
  page,
}) => {
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('textbox', { name: 'Buscar um modelo' }).fill('meditar');
  await page.getByRole('button', { name: /^Meditar: 10 min/ }).click();
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);

  // Starting it opens the dive; the pill stays out of the dive.
  await visible(page.getByRole('button', { name: 'Meditar: iniciar cronômetro' })).click();
  await expect(page).toHaveURL(/dive=1/);
  await expect(page.getByRole('button', { name: 'Concluir Meditar' })).toHaveCount(0);
  await page.waitForTimeout(1500);

  // Anywhere else, it floats.
  await page.goto('/');
  await expect(
    visible(page.getByRole('button', { name: /^Meditar, 0:0\d de 10:00/ })),
  ).toBeVisible();
  await visible(page.getByRole('button', { name: 'Pausar Meditar' })).click();
  await expect(page.getByRole('button', { name: 'Pausar Meditar' })).toHaveCount(0);

  // Again, and finish it: the habit is done today.
  await page.goto('/aquarium?tab=habits');
  await visible(page.getByRole('button', { name: 'Meditar: iniciar cronômetro' })).click();
  await page.waitForTimeout(1500);
  await page.goto('/stats');
  await visible(page.getByRole('button', { name: 'Concluir Meditar' })).click();
  await expect(page.getByRole('button', { name: 'Concluir Meditar' })).toHaveCount(0);
  await page.waitForTimeout(1500);
  await page.goto('/aquarium?tab=habits');
  await expect(visible(page.getByText(/^10\/10 min/))).toBeVisible();
});
