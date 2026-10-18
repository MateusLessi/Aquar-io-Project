import { expect, test } from '@playwright/test';

test('create a list and a task for today, complete it, and it survives a reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Nada para hoje')).toBeVisible();
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);

  await page.getByRole('button', { name: 'Nova tarefa' }).first().click();
  await page.getByRole('button', { name: 'Criar lista' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Academia');
  await page.getByRole('button', { name: 'Criar lista' }).last().click();

  await page.getByRole('textbox', { name: 'Tarefa' }).fill('Treino de perna');
  await page.getByRole('button', { name: 'Adicionar' }).click();
  await expect(page.getByRole('checkbox', { name: 'Treino de perna' })).toBeVisible();

  // Data lives in SQLite: a reload must not lose it.
  await page.reload();
  const task = page.getByRole('checkbox', { name: 'Treino de perna' });
  await expect(task).toBeVisible();

  await task.click();
  await expect(page.getByRole('progressbar', { name: /1 de 1/ })).toBeVisible();

  await page.reload();
  await expect(page.getByRole('progressbar', { name: /1 de 1/ })).toBeVisible();
});

test('open a list, add tasks inline and see them counted on the list tile', async ({ page }) => {
  await page.goto('/lists');
  await page.getByRole('button', { name: 'Nova lista' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Casa');
  await page.getByRole('button', { name: 'Criar lista' }).click();

  // Creating a list opens it.
  const add = page.getByRole('textbox', { name: 'Adicionar tarefa' });
  await add.fill('Lavar louça');
  await add.press('Enter');
  await add.fill('Regar plantas');
  await add.press('Enter');
  await expect(page.getByRole('checkbox', { name: 'Regar plantas' })).toBeVisible();

  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByRole('button', { name: /Casa, 2 pendentes/ })).toBeVisible();
});
