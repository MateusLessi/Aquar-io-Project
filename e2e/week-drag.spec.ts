import { expect, test, type Locator } from './fixtures';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('drag a routine in the week: only this day, or every week', async ({ page }, info) => {
  // The mouse drag needs the seven columns side by side.
  test.skip(info.project.name !== 'desktop', 'Seven columns on wide screens only.');
  await page.goto('/aquarium?tab=routines');
  await page.getByRole('button', { name: 'Nova rotina' }).first().click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Treino');
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByRole('button', { name: 'Criar rotina' })).toHaveCount(0);
  await page.getByRole('radio', { name: 'Semana', exact: true }).click();

  const drag = async (block: Locator, dx: number, dy: number) => {
    const box = (await block.boundingBox())!;
    const x = box.x + box.width / 2;
    const y = box.y + 10;
    await page.mouse.move(x, y);
    await page.mouse.down();
    for (let i = 1; i <= 10; i++) await page.mouse.move(x + (dx * i) / 10, y + (dy * i) / 10);
    await page.mouse.up();
  };

  // A routine shows from the day it was created: today, and the rest of this week.
  const blocks = page.getByRole('button', { name: /^Treino, .*07:00 às 08:00/ });
  await expect(blocks.first()).toBeVisible();
  const shown = await blocks.count();

  // Today's, two hours down (56 px an hour), only this day.
  await drag(blocks.first(), 0, 112);
  await expect(visible(page.getByText('Treino às 09:00'))).toBeVisible();
  await page.getByRole('button', { name: /^Só nest/ }).click();
  await expect(page.getByRole('button', { name: /^Treino, .*09:00 às 10:00/ })).toHaveCount(1);
  await expect(blocks).toHaveCount(shown - 1);

  // Another day's, an hour up, every week: all the others move.
  if (shown > 1) {
    // The question sheet is gone before the next drag.
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await drag(blocks.first(), 0, -56);
    await page.getByRole('button', { name: /^Tod[ao]s/ }).click();
    await expect(page.getByRole('button', { name: /^Treino, .*06:00 às 07:00/ })).toHaveCount(
      shown - 1,
    );
    // Today keeps its own change.
    await expect(page.getByRole('button', { name: /^Treino, .*09:00 às 10:00/ })).toHaveCount(1);
  }
});
