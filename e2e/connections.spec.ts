import { expect, test, type Locator } from '@playwright/test';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('connect a list and a habit to a routine, by menu and by dragging', async ({ page }) => {
  // A routine, a habit and a list.
  await page.goto('/aquarium?tab=routines');
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Academia');
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByRole('button', { name: 'Criar rotina' })).toHaveCount(0);

  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Treinar');
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);

  await page.goto('/aquarium?tab=lists');
  await page.getByRole('button', { name: 'Nova lista ou pasta' }).click();
  await page.getByRole('button', { name: /^Nova lista:/ }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Treino A');
  await page.getByRole('button', { name: 'Criar lista' }).click();
  await expect(page.getByRole('button', { name: 'Criar lista' })).toHaveCount(0);
  const add = page.getByRole('textbox', { name: 'Adicionar tarefa' });
  await add.click();
  await add.pressSequentially('Supino');
  await add.press('Enter');
  await expect(page.getByRole('checkbox', { name: 'Supino' })).toBeVisible();

  // By menu: the list goes into the routine.
  await page.getByRole('button', { name: 'Conectar Treino A a…' }).click();
  await page.getByRole('button', { name: /Academia, 07:00/ }).click();
  await expect(page.getByText('Pronto: Treino A agora está em Academia')).toBeVisible();

  // The routine's piece shows it, and opens to the list's tasks.
  await page.goto('/aquarium?tab=routines');
  await expect(visible(page.getByText('📋 1 lista'))).toBeVisible();
  await page.getByRole('button', { name: 'Abrir Academia' }).click();
  await expect(visible(page.getByText('Supino'))).toBeVisible();

  // By dragging: the list onto the habit, in the Connect mode.
  await page.goto('/aquarium?tab=lists');
  await visible(page.getByRole('button', { name: 'Conectar', exact: true })).click();
  // The mode slides up: measure where things are only after it settles.
  await expect(page.getByText(/Segure um item da bandeja/)).toBeVisible();
  await page.waitForTimeout(800);
  const chip = (await page
    .getByRole('button', { name: /^📋 Treino A/ })
    .last()
    .boundingBox())!;
  const habit = (await page
    .getByRole('button', { name: /Treinar, Hábito/ })
    .last()
    .boundingBox())!;
  const from = { x: chip.x + chip.width / 2, y: chip.y + chip.height / 2 };
  const to = { x: habit.x + habit.width / 2, y: habit.y + habit.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.waitForTimeout(400); // hold: the drag starts after a short press
  // Move like a hand does: in small steps, then rest over the target before letting go.
  for (let i = 1; i <= 12; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / 12, from.y + ((to.y - from.y) * i) / 12);
    await page.waitForTimeout(30);
  }
  await expect(visible(page.getByText('Soltar para conectar'))).toBeVisible();
  await page.mouse.up();
  await expect(page.getByText('Pronto: Treino A agora está em Treinar')).toBeVisible();
});
