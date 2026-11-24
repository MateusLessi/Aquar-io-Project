import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('Seu aquário: pick a creature, act from its card and open its habit', async ({ page }) => {
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('button', { name: 'Começar do zero' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Ler');
  await page.getByRole('radio', { name: 'Peixe' }).click();
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);

  // The pond over the habits opens the aquarium, over the whole screen.
  await visible(page.getByRole('button', { name: /^Explorar o aquário/ })).click();
  await expect(page).toHaveURL(/\/pond$/);
  await expect(page.getByRole('heading', { name: 'Seu aquário' })).toBeVisible();

  // The creature's card: its stage and today's action.
  await page.getByRole('button', { name: 'Ler: Peixe, Ovo. Para hoje.' }).click();
  await expect(page.getByText('Peixe · Ovo · Para hoje')).toBeVisible();
  await page.getByRole('checkbox', { name: 'Ler: feito hoje' }).click();
  await expect(page.getByText('Peixe · Ovo · Feito hoje')).toBeVisible();
  await expect(page.getByText('1 criatura · 1 de 1 hoje')).toBeVisible();

  // Its page, and back to the pond.
  await page.getByRole('button', { name: 'Ver hábito' }).click();
  await expect(page).toHaveURL(/\/aquarium\/habits\//);
  await expect(visible(page.getByText('Feito hoje!'))).toBeVisible();
  await page.goBack();
  await expect(page).toHaveURL(/\/pond$/);
  await page.getByRole('button', { name: 'Fechar o aquário' }).click();
  await expect(page).toHaveURL(/\/aquarium/);
});
