import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('Personalizar: change the text size right there, and the shortcuts open the right place', async ({
  page,
}) => {
  // From the profile (phones) or the sidebar.
  await page.goto('/profile');
  await visible(page.getByRole('button', { name: /^Personalizar/ })).click();
  await expect(page).toHaveURL(/\/personalize$/);
  await expect(visible(page.getByText('Tudo isto já é seu, de graça'))).toBeVisible();

  // One look (no themes to pick); the text size changes here, as in Ajustes.
  await expect(page.getByRole('radio', { name: 'Escuro' })).toHaveCount(0);
  await visible(page.getByRole('radio', { name: 'Grande' })).click();
  await expect(visible(page.getByRole('radio', { name: 'Grande' }))).toBeChecked();

  // Nothing for sale: one honest line and a small card.
  // The aquarium's scene: the Lagoa from the start, the rest with the points left.
  await expect(visible(page.getByRole('radio', { name: /^Lagoa\./ }))).toBeChecked();
  await expect(
    visible(page.getByRole('radio', { name: 'Recife de Coral, faltam 300 pontos' })),
  ).toBeDisabled();
  await expect(visible(page.getByText(/^Em breve: o nível das criaturas/))).toBeVisible();
  await expect(visible(page.getByText('Para apoiar o app · preço a definir'))).toBeVisible();

  // A shortcut opens Ajustes on the setting.
  await visible(page.getByRole('button', { name: 'Blocos do Início' })).click();
  await expect(page).toHaveURL(/section=home/);
  await expect(visible(page.getByText('Cartões do painel'))).toBeVisible();

  // And one opens the profile's editor.
  await page.goto('/personalize');
  await visible(page.getByRole('button', { name: 'Sua criatura e sua cor' })).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
