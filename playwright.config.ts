import { defineConfig, devices } from '@playwright/test';

// End-to-end tests run against the static web export (npm run e2e builds it first).
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: { baseURL: 'http://localhost:4173', trace: 'retain-on-failure' },
  webServer: {
    command: 'node scripts/serve-web.mjs dist 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'phone', use: { ...devices['iPhone 12'], browserName: 'chromium' } },
    // Galaxy Tab S8+ in portrait: navigation rail.
    { name: 'tablet', use: { viewport: { width: 800, height: 1280 }, hasTouch: true } },
    { name: 'desktop', use: { viewport: { width: 1280, height: 800 } } },
  ],
});
