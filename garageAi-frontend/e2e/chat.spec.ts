import { test, expect } from '@playwright/test';
import { mockLoggedIn, mockConversations, mockDiagnoseReply } from './support/api-mocks';

test('sends a message and renders the assistant reply', async ({ page }) => {
  await mockLoggedIn(page);
  await mockConversations(page);
  await mockDiagnoseReply(page, 'هذا صوت الدينمو على الأغلب، لازم تفحص القشاط.');

  await page.goto('/chat');
  await page.getByPlaceholder('اكتب وصف العطل هون...').fill('في صوت صفير من قدام السيارة');
  await page.getByRole('button', { name: 'Send' }).click();

  await expect(page.getByText('هذا صوت الدينمو على الأغلب، لازم تفحص القشاط.')).toBeVisible();
});

// Regression test for a real bug: the conversations sidebar was completely
// unreachable on mobile (no way to see past chats), and separately the Sheet
// component was missing forwardRef and silently failed to render at all.
test('mobile: conversation sidebar opens from the header menu button', async ({ page, isMobile }) => {
  test.skip(!isMobile, 'only meaningful on the mobile project');

  await mockLoggedIn(page);
  await mockConversations(page, [
    {
      id: 7,
      preview: 'صوت صفير من الدينمو',
      predicted_class: '02_serpentine_belt',
      category_label: 'Serpentine belt',
      match_score: 0.9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  await page.goto('/chat');

  // The sidebar Card is present but CSS-hidden below md, so the sheet
  // ("dialog") is the only place this text should be reachable from.
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: 'Open conversations' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('صوت صفير من الدينمو')).toBeVisible();
});

test('desktop: conversation sidebar is visible without opening anything', async ({ page, isMobile }) => {
  test.skip(isMobile, 'only meaningful on the desktop project');

  await mockLoggedIn(page);
  await mockConversations(page, [
    {
      id: 7,
      preview: 'صوت صفير من الدينمو',
      predicted_class: '02_serpentine_belt',
      category_label: 'Serpentine belt',
      match_score: 0.9,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ]);

  await page.goto('/chat');
  await expect(page.getByText('صوت صفير من الدينمو')).toBeVisible();
});
