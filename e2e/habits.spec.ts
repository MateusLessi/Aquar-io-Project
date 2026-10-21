import { expect, test } from '@playwright/test';

test('create a habit, check today, and it survives a reload', async ({ page }) => {
  await page.goto('/habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Beber água');
  await page.getByRole('radio', { name: 'Peixe' }).click();
  await page.getByRole('button', { name: 'Criar hábito' }).click();

  const check = page.getByRole('checkbox', { name: 'Beber água: feito hoje' }).first();
  await expect(check).toHaveAttribute('aria-checked', 'false');
  await check.click();
  await expect(check).toHaveAttribute('aria-checked', 'true');

  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Beber água: feito hoje' }).first(),
  ).toHaveAttribute('aria-checked', 'true');

  // Today shows the creature too.
  await page.goto('/');
  await expect(page.getByText('Hábitos · 1 de 1')).toBeVisible();
});
