import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('personalize the profile: line, color, privacy and showcase', async ({ page }) => {
  // A habit done today gives a streak to show.
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Meditar');
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);
  const check = page.getByRole('checkbox', { name: 'Meditar: feito hoje' }).first();
  await check.click();
  await expect(check).toHaveAttribute('aria-checked', 'true');

  await page.goto('/profile');
  await expect(visible(page.getByText(/^Selos · \d+ de 14$/))).toBeVisible();
  await visible(page.getByRole('button', { name: 'Editar perfil' })).click();
  await page.getByRole('textbox', { name: 'Nome', exact: true }).fill('Mateus');
  await page.getByRole('textbox', { name: 'Frase', exact: true }).fill('Um mergulho por dia');
  await page.getByRole('radio', { name: 'Cor Anêmona' }).click();
  // Everything starts private; one tap shares with friends.
  const depth = page.getByRole('button', { name: /^Zona e Profundidade: visível para Só eu/ });
  await depth.click();
  await expect(
    page.getByRole('button', { name: /^Zona e Profundidade: visível para Amigos/ }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(visible(page.getByText('Um mergulho por dia'))).toBeVisible();

  // The showcase: pick the streak.
  await visible(page.getByRole('button', { name: 'Escolher' })).click();
  await page.getByRole('checkbox', { name: /^Sequência: 1 dia/ }).click();
  await page.getByRole('button', { name: 'Salvar' }).click();
  await expect(visible(page.getByLabel(/^Sequência: 1 dia/))).toBeVisible();

  // Survives a reload (it is stored, and syncs like the rest). The web database writes to disk
  // a moment after each change: give it that moment, as closing a tab right after would not.
  await page.waitForTimeout(1500);
  await page.reload();
  await expect(visible(page.getByText('Mateus', { exact: true }))).toBeVisible();
  await expect(visible(page.getByLabel(/^Sequência: 1 dia/))).toBeVisible();
});
