import { expect, test } from '@playwright/test';

test('create a list and a task for today, complete it, and it survives a reload', async ({
  page,
}) => {
  await page.goto('/');
  await expect(page.getByText('Nenhuma tarefa para hoje')).toBeVisible();
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);

  await page.getByRole('button', { name: 'Criar' }).first().click();
  await page.getByRole('button', { name: /^Criar tarefa/ }).click();
  await page.getByRole('button', { name: 'Criar lista', exact: true }).click();
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
  await page.goto('/aquarium?tab=lists');
  await page.getByRole('button', { name: 'Nova lista ou pasta' }).click();
  await page.getByRole('button', { name: /^Nova lista:/ }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Casa');
  await page.getByRole('button', { name: 'Criar lista', exact: true }).click();

  // Creating a list opens it. Wait until the editor sheet has fully closed: on web, a
  // closing modal returns focus to the element that opened it.
  await expect(page.getByRole('button', { name: 'Criar lista' })).toHaveCount(0);
  // Type key by key, like a person, and add the next task as soon as the previous shows up.
  const add = page.getByRole('textbox', { name: 'Adicionar tarefa' });
  for (const title of ['Lavar louça', 'Regar plantas']) {
    await add.click();
    await expect(add).toBeFocused();
    await add.pressSequentially(title);
    await add.press('Enter');
    await expect(page.getByRole('checkbox', { name: title })).toBeVisible();
    await expect(add).toHaveValue('');
  }

  await page.getByRole('button', { name: 'Voltar' }).click();
  await expect(page.getByRole('button', { name: /Casa, 2 pendentes/ })).toBeVisible();
});
