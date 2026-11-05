import { test as base } from '@playwright/test';

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
