import { test, expect } from '@playwright/test';
import { mockAnalyzeAudio, mockDiagnoseReply } from './support/api-mocks';

test('uploading a file enables Analyze and renders the result', async ({ page }) => {
  await mockAnalyzeAudio(page);

  await page.goto('/');

  const analyzeButton = page.getByRole('button', { name: 'Analyze' });
  await expect(analyzeButton).toBeDisabled();

  await page.locator('input[type="file"]').setInputFiles({
    name: 'engine-noise.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from('RIFF....WAVEfmt fake-audio-bytes-for-e2e'),
  });

  await expect(analyzeButton).toBeEnabled();
  await analyzeButton.click();

  await expect(page.getByRole('heading', { name: 'Brake Squeal' })).toBeVisible();
  await expect(page.getByText('87% Confidence')).toBeVisible();
});

test('"Ask GarageAI about this" seeds a new chat with the result', async ({ page }) => {
  await mockAnalyzeAudio(page);
  await mockDiagnoseReply(page, 'هذا صوت البريك على الأغلب، لازم تفحص التيل.');

  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles({
    name: 'engine-noise.wav',
    mimeType: 'audio/wav',
    buffer: Buffer.from('RIFF....WAVEfmt fake-audio-bytes-for-e2e'),
  });
  await page.getByRole('button', { name: 'Analyze' }).click();
  await expect(page.getByRole('heading', { name: 'Brake Squeal' })).toBeVisible();

  await page.getByRole('button', { name: 'Ask GarageAI about this' }).click();

  // The URL may already carry ?id=<conversationId> by the time this runs --
  // the seeded message's (mocked) reply can resolve before this assertion does.
  await expect(page).toHaveURL(/\/chat(\?.*)?$/);
  await expect(page.getByText('Brake Squeal', { exact: false })).toBeVisible();
});
