import { expect, test as base, type Locator, type Page } from '@playwright/test';

export { expect, type Locator, type Page } from '@playwright/test';

/**
 * Specs start inside the app: this browser counts as having seen the welcome dive (the same
 * mark the app leaves after it). e2e/welcome.spec.ts tests the dive itself.
 */
export const test = base.extend({
  page: async ({ page }, provide) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('aquario.welcome', 'done');
      } catch {
        // No storage: the welcome would show; specs would notice.
      }
    });
    await provide(page);
  },
});

/**
 * Clicks something in the Aquarium's section bar (Semana, Mês, "Novo na agenda"…). On phones
 * it lives in a dropdown under the section's capsule, so it opens the dropdown first.
 */
export async function inBar(
  page: import('@playwright/test').Page,
  target: import('@playwright/test').Locator,
) {
  const shown = target.locator('visible=true').first();
  const capsule = page.locator('[role="radio"][aria-expanded="false"]').first();
  // Wait for the bar to show up, as the option itself or as the closed capsule.
  await expect(shown.or(capsule)).toBeVisible();
  if (!(await shown.isVisible())) await capsule.click();
  await shown.click();
}
