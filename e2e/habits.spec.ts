import { expect, test } from './fixtures';

test('create a habit, check today, and it survives a reload', async ({ page }) => {
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('button', { name: 'Começar do zero' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Beber água');
  await page.getByRole('radio', { name: 'Peixe' }).click();
  await page.getByRole('button', { name: 'Criar hábito' }).click();

  const check = page.getByRole('checkbox', { name: 'Beber água: feito hoje' }).first();
  await expect(check).toHaveAttribute('aria-checked', 'false');
  await check.click();
  await expect(check).toHaveAttribute('aria-checked', 'true');

  await page.reload();
  await expect(
    page.getByRole('checkbox', { name: 'Beber água: feito hoje' }).first(),
  ).toHaveAttribute('aria-checked', 'true');

  // Today shows the creature too.
  await page.goto('/');
  await expect(page.getByText('Hábitos de hoje · 1 de 1')).toBeVisible();
});

test('a count habit fills up to its goal and a checklist step by step', async ({ page }) => {
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('button', { name: 'Começar do zero' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Água');
  await page.getByRole('radio', { name: /^Contador/ }).click();
  for (let i = 0; i < 6; i++)
    await page.getByRole('button', { name: 'Meta do dia: menos' }).click();
  await page.getByRole('button', { name: 'copos', exact: true }).click();
  await page.getByRole('button', { name: 'Criar hábito' }).click();

  const add = page.getByRole('button', { name: 'Água: somar 1' }).first();
  await add.click();
  await expect(page.getByText('1/2 copos').first()).toBeVisible();
  await add.click();
  await expect(page.getByText('2/2 copos').first()).toBeVisible();
  await expect(page.getByText(/^Feito/).first()).toBeVisible();

  await page.getByRole('button', { name: 'Novo hábito' }).click();

  await page.getByRole('button', { name: 'Começar do zero' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Skincare');
  await page.getByRole('radio', { name: /^Checklist/ }).click();
  for (const step of ['Limpar', 'Hidratar']) {
    await page.getByRole('textbox', { name: 'Novo passo' }).fill(step);
    await page.getByRole('button', { name: 'Adicionar passo' }).click();
  }
  await page.getByRole('button', { name: 'Criar hábito' }).click();

  await page.getByRole('button', { name: 'Skincare: mostrar passos' }).click();
  await page.getByRole('checkbox', { name: 'Limpar' }).click();
  await expect(page.getByText('1/2 passos').first()).toBeVisible();

  // Progress survives a reload, and the dashboard counts the finished habit.
  await page.reload();
  await expect(page.getByText('1/2 passos').first()).toBeVisible();
  await page.goto('/');
  await expect(page.getByText('Hábitos de hoje · 1 de 2')).toBeVisible();
});

test('start a habit from a model: water adds up, and the model only fills the editor', async ({
  page,
}) => {
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('textbox', { name: 'Buscar um modelo' }).fill('agua');
  await page.getByRole('button', { name: /^Beber água: 8 copos de 250 ml/ }).click();

  // The model fills the editor; the goal adds up.
  await expect(page.getByRole('textbox', { name: 'Nome' })).toHaveValue('Beber água');
  await expect(page.getByLabel('Meta do dia', { exact: true })).toBeVisible();
  await expect(page.getByText('2 litros por dia')).toBeVisible();
  // Same amount in bottles.
  await page.getByRole('button', { name: 'Garrafa 500 ml' }).click();
  await expect(page.getByText('2 litros por dia')).toBeVisible();
  await page.getByRole('button', { name: 'Meta do dia: mais' }).click();
  await expect(page.getByText('2,5 litros por dia')).toBeVisible();

  await page.getByRole('textbox', { name: 'Por quê? (opcional)' }).fill('Para ter energia');
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);
  await expect(page.getByText(/0\/5 garrafas/).first()).toBeVisible();
});
