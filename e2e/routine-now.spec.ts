import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('a routine happening now: check its items on Início, with no button inside another', async ({
  page,
}) => {
  // 07:30 today, inside a new routine's default 07:00–08:00.
  const now = new Date();
  now.setHours(7, 30, 0, 0);
  await page.clock.setFixedTime(now);

  await page.goto('/aquarium?tab=routines');
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Academia');
  await page.getByRole('textbox', { name: 'Novo item' }).fill('Aquecer');
  await page.getByRole('button', { name: 'Adicionar item' }).click();
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByRole('button', { name: 'Criar rotina' })).toHaveCount(0);

  // On Início it is happening now, with its items to check right there.
  await page.goto('/');
  const heading = visible(page.getByRole('button', { name: /^Academia, 07:00 às 08:00, Agora/ }));
  await expect(heading).toBeVisible();
  const item = visible(page.getByRole('checkbox', { name: 'Aquecer' }));
  await expect(item).toBeVisible();

  // No button inside another (HTML forbids it; screen readers lump them together).
  await expect(
    page.locator(':is(button, [role="button"]) :is(button, [role="button"])'),
  ).toHaveCount(0);

  // The item checks on its own; the heading opens the routine.
  await item.click();
  await expect(item).toHaveAttribute('aria-checked', 'true');
  await heading.click();
  await expect(page).toHaveURL(/tab=routines/);
});
