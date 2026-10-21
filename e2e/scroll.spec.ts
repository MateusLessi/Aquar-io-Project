import { expect, test } from '@playwright/test';

// Regression: screens shown directly in a tab (Settings, Today) once grew past the window
// and could not scroll.
for (const path of ['/settings', '/']) {
  test(`${path} scrolls when it is taller than the window`, async ({ page }) => {
    const width = page.viewportSize()?.width ?? 390;
    await page.setViewportSize({ width, height: 420 });
    await page.goto(path);
    await page.mouse.move(width / 2, 200);
    // Keep scrolling until the screen has rendered and moved (or the poll times out).
    await expect
      .poll(async () => {
        await page.mouse.wheel(0, 200);
        return page.evaluate(() =>
          Math.max(
            0,
            ...[...document.querySelectorAll('div')]
              .filter((d) => ['auto', 'scroll'].includes(getComputedStyle(d).overflowY))
              .map((d) => d.scrollTop),
          ),
        );
      })
      .toBeGreaterThan(0);
  });
}
