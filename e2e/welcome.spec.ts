import { expect, test, type Locator } from '@playwright/test';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('the first dive builds a starter aquarium from the quiz', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar o mergulho' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await page.getByRole('checkbox', { name: 'Estudos' }).click();
  await page.getByRole('checkbox', { name: 'Saúde e exercício' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await page.getByRole('radio', { name: 'À noite' }).click();
  await page.getByRole('checkbox', { name: 'Beber água' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  await page.getByRole('radio', { name: 'Polvo' }).click();
  await page.getByRole('textbox', { name: 'Como quer ser chamado?' }).fill('Mateus');
  await page.getByRole('radio', { name: '18–24' }).click();
  await page.getByRole('button', { name: 'Continuar' }).click();

  // The starter aquarium: trim it, then dive.
  await expect(page.getByRole('checkbox', { name: /^Rotina: Estudo, 19:00–21:00/ })).toBeVisible();
  await page.getByRole('checkbox', { name: /^Lista: Treinos/ }).click();
  await page.getByRole('button', { name: 'Mergulhar' }).click();
  await expect(page.getByRole('button', { name: 'Mergulhar' })).toHaveCount(0);

  await page.goto('/aquarium?tab=lists');
  await expect(visible(page.getByText('Faculdade'))).toBeVisible();
  await expect(page.getByText('Treinos', { exact: true })).toHaveCount(0);
  await page.goto('/aquarium?tab=habits');
  await expect(
    page
      .getByRole('checkbox', { name: 'Beber água: feito hoje' })
      .or(page.getByText('Beber água'))
      .first(),
  ).toBeVisible();

  // Once is enough.
  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Começar o mergulho' })).toHaveCount(0);
});

test('Pular goes straight into an empty app', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Começar o mergulho' }).click();
  await page.getByRole('button', { name: 'Pular' }).click();
  await expect(page.getByRole('button', { name: 'Pular' })).toHaveCount(0);
  await page.reload();
  await expect(visible(page.getByText(/Bom dia|Boa tarde|Boa noite/))).toBeVisible();
  await expect(page.getByRole('button', { name: 'Começar o mergulho' })).toHaveCount(0);
});
