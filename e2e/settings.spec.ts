import { expect, test, type Locator } from '@playwright/test';

const visible = (locator: Locator) => locator.locator('visible=true').first();

test('Ajustes change the app: week start, clock, dashboard cards, export', async ({ page }) => {
  // A routine at 07:00 to see the clock and the week.
  await page.goto('/aquarium?tab=routines');
  await page.getByRole('button', { name: 'Nova rotina' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Manhã');
  await page.getByRole('button', { name: 'Criar rotina' }).click();
  await expect(page.getByRole('button', { name: 'Criar rotina' })).toHaveCount(0);

  // Perfil → Ajustes → Calendário.
  await page.goto('/profile');
  await visible(page.getByRole('button', { name: /^Ajustes/ })).click();
  await visible(page.getByRole('button', { name: /^Calendário/ })).click();
  await page.getByRole('radio', { name: 'Segunda' }).click();
  await page.getByRole('radio', { name: '12 horas' }).click();
  // Saved (the control reads the stored value back) before leaving the page.
  await expect(page.getByRole('radio', { name: 'Segunda' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(page.getByRole('radio', { name: '12 horas' })).toHaveAttribute(
    'aria-checked',
    'true',
  );

  // The week now starts on Monday and times read in 12 h.
  await page.goto('/aquarium?tab=routines');
  await page.getByRole('radio', { name: 'Semana', exact: true }).click();
  await expect(
    visible(page.getByRole('button', { name: /^Manhã, .*7:00 AM às 8:00 AM/ })),
  ).toBeVisible();
  // The first day label in the week (the strip on phones, the column headers elsewhere).
  const firstDay = await page.evaluate(
    () =>
      [...document.querySelectorAll('[aria-label]')]
        .map((e) => e.getAttribute('aria-label') ?? '')
        .find((label) =>
          /^(domingo|segunda|terça|quarta|quinta|sexta|sábado), \d+ de/.test(label),
        ) ?? '',
  );
  expect(firstDay).toMatch(/^segunda/);

  // Hide a dashboard card.
  await page.goto('/profile/settings?section=home');
  const card = visible(page.getByRole('switch', { name: 'Mostrar Esta semana' }));
  await card.click();
  await expect(card).toHaveAttribute('aria-checked', 'false');
  await page.goto('/');
  await expect(page.getByText('Esta semana', { exact: true })).toHaveCount(0);

  // Export downloads the JSON and the CSV.
  await page.goto('/profile/settings?section=account');
  const downloads: string[] = [];
  page.on('download', (d) => downloads.push(d.suggestedFilename()));
  await visible(page.getByRole('button', { name: 'Exportar meus dados' })).click();
  await expect.poll(() => downloads.length).toBe(2);
  expect(downloads.some((n) => /^aquario-\d{4}-\d{2}-\d{2}\.json$/.test(n))).toBe(true);
  expect(downloads.some((n) => n.endsWith('.csv'))).toBe(true);
});

test('erasing this device leaves an empty aquarium', async ({ page }) => {
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Ler');
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);

  await page.goto('/profile/settings?section=account');
  await visible(page.getByRole('button', { name: 'Apagar os dados deste aparelho' })).click();
  await page.getByRole('button', { name: 'Apagar', exact: true }).click();
  await expect(visible(page.getByText('Os dados deste aparelho foram apagados.'))).toBeVisible();

  await page.goto('/aquarium?tab=habits');
  await expect(page.getByRole('checkbox', { name: 'Ler: feito hoje' })).toHaveCount(0);
});
