import { expect, test } from './fixtures';

const visible = (locator: ReturnType<import('@playwright/test').Page['locator']>) =>
  locator.locator('visible=true').first();

test('a habit done from a list: marking in either place is the same mark', async ({ page }) => {
  // A workout list that starts over every day, with a counter item and a check item.
  await page.goto('/aquarium?tab=lists');
  await visible(page.getByRole('button', { name: 'Nova lista ou pasta' })).click();
  await page.getByRole('button', { name: /^Nova lista:/ }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Push');
  await page.getByRole('switch', { name: 'Zera todo dia' }).click();
  await page.getByRole('button', { name: 'Criar lista', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Criar lista' })).toHaveCount(0);

  const add = visible(page.getByRole('textbox', { name: 'Adicionar tarefa' }));
  for (const title of ['Supino', 'Alongar']) {
    await add.click();
    await add.fill(title);
    await add.press('Enter');
    await expect(visible(page.getByRole('checkbox', { name: title }))).toBeVisible();
  }
  await visible(page.getByRole('button', { name: /^Supino/ })).click();
  await visible(page.getByRole('radio', { name: 'Contador' })).click();
  await expect(visible(page.getByRole('radio', { name: 'Contador' }))).toBeChecked();
  await page.keyboard.press('Escape');
  await expect(visible(page.getByRole('button', { name: /^Supino: 0 de 3/ }))).toBeVisible();

  // The habit, done from that list.
  await page.goto('/aquarium?tab=habits');
  await visible(page.getByRole('button', { name: /Novo hábito/ })).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Academia');
  await page.getByRole('radio', { name: /^Uma lista/ }).click();
  await page.getByRole('button', { name: 'Push', exact: true }).click();
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(visible(page.getByText('Push · 0 de 2'))).toBeVisible();
  await page.waitForTimeout(1500);

  // Filling the counter in the list counts for the habit.
  await page.goto('/aquarium?tab=lists');
  await visible(page.getByRole('button', { name: /^Push/ })).click();
  const supino = visible(page.getByRole('button', { name: /^Supino: .* Somar 1/ }));
  for (let i = 0; i < 3; i++) await supino.click();
  await expect(visible(page.getByText('Concluídas (1)'))).toBeVisible();
  // The web database saves a moment after the change: wait before leaving the page.
  await page.waitForTimeout(1500);
  await page.goto('/aquarium?tab=habits');
  await expect(visible(page.getByText('Push · 1 de 2'))).toBeVisible();

  // Marking the rest inside the habit marks it in the list, and the habit is done.
  await visible(page.getByRole('button', { name: /^Academia/ })).click();
  await visible(page.getByRole('checkbox', { name: 'Alongar' })).click();
  await expect(visible(page.getByText('Feito hoje!'))).toBeVisible();
  await page.waitForTimeout(1500);
  await page.goto('/aquarium?tab=lists');
  await visible(page.getByRole('button', { name: /^Push/ })).click();
  await expect(visible(page.getByText('Feito hoje'))).toBeVisible();
});
