import { test, expect } from '@playwright/test';

// Automates the manual browser sweep that previously caught the hidden
// mobile chat sidebar and the missing Sheet forwardRef: load every public
// page and fail if the console logs an error, in both desktop and mobile
// viewports (the `desktop` / `mobile` Playwright projects).
const PUBLIC_PAGES = ['/', '/chat', '/about', '/login', '/signup', '/forgot-password'];

for (const path of PUBLIC_PAGES) {
  test(`${path} loads with no console errors`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(err.message));

    const response = await page.goto(path);
    expect(response?.ok()).toBeTruthy();
    await page.waitForLoadState('networkidle');

    expect(errors).toEqual([]);
  });
}

test('logged-out visitor is redirected away from protected pages', async ({ page }) => {
  await page.goto('/history');
  await expect(page).toHaveURL('/login');

  await page.goto('/settings');
  await expect(page).toHaveURL('/login');
});
