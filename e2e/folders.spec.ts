import { expect, test } from '@playwright/test';

const visible = (locator: ReturnType<import('@playwright/test').Page['locator']>) =>
  locator.locator('visible=true').first();

test('organize lists in nested folders and see their tasks together', async ({ page }) => {
  await page.goto('/aquarium?tab=lists');

  const create = async (kind: 'Nova lista' | 'Nova pasta', name: string) => {
    await visible(page.getByRole('button', { name: 'Nova lista ou pasta' })).click();
    await page.getByRole('button', { name: new RegExp(`^${kind}:`) }).click();
    await page.getByRole('textbox', { name: 'Nome' }).fill(name);
    await page
      .getByRole('button', { name: kind === 'Nova pasta' ? 'Criar pasta' : 'Criar lista' })
      .click();
  };

  await create('Nova pasta', 'UnB');
  await visible(page.getByRole('button', { name: /^Pasta UnB/ })).click();
  await create('Nova pasta', 'Semestre 3');
  await visible(page.getByRole('button', { name: /^Pasta Semestre 3/ })).click();
  await expect(visible(page.getByRole('link', { name: 'Ir para UnB' }))).toBeVisible();

  await create('Nova lista', 'Cálculo 3');
  // Wait for the editor to close: on web a closing modal gives focus back to its opener.
  await expect(page.getByRole('button', { name: 'Criar lista' })).toHaveCount(0);
  const add = visible(page.getByRole('textbox', { name: 'Adicionar tarefa' }));
  await add.click();
  await expect(add).toBeFocused();
  await add.pressSequentially('Lista 4');
  await add.press('Enter');
  await expect(visible(page.getByRole('checkbox', { name: 'Lista 4' }))).toBeVisible();
  await page.goBack();

  // Everything inside UnB, together.
  await visible(page.getByRole('link', { name: 'Ir para UnB' })).click();
  await visible(page.getByRole('radio', { name: 'Tudo junto' })).click();
  await expect(visible(page.getByText('Lista 4'))).toBeVisible();

  // Survives a reload, folder trail included.
  await page.reload();
  await expect(visible(page.getByText('Lista 4'))).toBeVisible();
  await visible(page.getByRole('radio', { name: 'Grade' })).click();
  await expect(
    visible(page.getByRole('button', { name: /^Pasta Semestre 3, 1 lista/ })),
  ).toBeVisible();
});
