import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('search finds a setting and opens its section on it', async ({ page }) => {
  await page.goto('/profile/settings');
  await expect(visible(page.getByText('Mais usados'))).toBeVisible();

  const search = visible(page.getByRole('textbox', { name: 'Buscar nos ajustes' }));
  await search.fill('notificacao');
  await visible(page.getByRole('button', { name: /^Lembretes/ })).click();
  await expect(page).toHaveURL(/section=sounds/);
  await expect(page).toHaveURL(/focus=reminders/);
  // The reminders group is brought into view.
  await expect(visible(page.getByText('Lembretes', { exact: true }))).toBeInViewport();

  await page.goto('/profile/settings');
  await visible(page.getByRole('textbox', { name: 'Buscar nos ajustes' })).fill('xyz');
  await expect(visible(page.getByText(/^Nada com “xyz”/))).toBeVisible();
});
