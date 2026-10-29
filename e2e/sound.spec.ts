import { expect, test, type Locator, type Page } from '@playwright/test';

const visible = (locator: Locator) => locator.locator('visible=true').first();

/** Records which sound files the page plays (the browser's media elements). */
async function recordSounds(page: Page) {
  await page.addInitScript(() => {
    const played: string[] = [];
    (window as unknown as { __played: string[] }).__played = played;
    const original = HTMLMediaElement.prototype.play;
    HTMLMediaElement.prototype.play = function play(this: HTMLMediaElement) {
      played.push(this.currentSrc || this.src);
      return original.call(this).catch(() => undefined);
    };
  });
}
const played = (page: Page) =>
  page.evaluate(() => (window as unknown as { __played: string[] }).__played.join(' '));

test('a habit bubbles; with sounds off, it stays quiet', async ({ page }) => {
  await recordSounds(page);
  await page.goto('/aquarium?tab=habits');
  await page.getByRole('button', { name: 'Novo hábito' }).click();
  await page.getByRole('textbox', { name: 'Nome' }).fill('Meditar');
  await page.getByRole('button', { name: 'Criar hábito' }).click();
  await expect(page.getByRole('button', { name: 'Criar hábito' })).toHaveCount(0);

  const check = page.getByRole('checkbox', { name: 'Meditar: feito hoje' }).first();
  await check.click();
  await expect(check).toHaveAttribute('aria-checked', 'true');
  await expect.poll(() => played(page)).toMatch(/habit/);

  // Turn sounds off in Perfil → Sons e toque.
  await page.goto('/profile');
  const sounds = visible(page.getByRole('switch', { name: 'Sons' }));
  await sounds.click();
  await expect(sounds).toHaveAttribute('aria-checked', 'false');

  await page.goto('/aquarium?tab=habits');
  const again = page.getByRole('checkbox', { name: 'Meditar: feito hoje' }).first();
  await again.click(); // uncheck: quiet anyway
  await again.click();
  await expect(again).toHaveAttribute('aria-checked', 'true');
  await page.waitForTimeout(500);
  expect(await played(page)).toBe('');
});
