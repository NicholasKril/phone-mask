import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

test('local demo formats, submits, resets country and fits the viewport', async ({ page }, testInfo) => {
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(pathToFileURL(path.resolve('demo/index.html')).href);
  await page.locator('#country').selectOption('UA');
  await page.locator('#phone').pressSequentially('0501234567');
  await expect(page.locator('#international')).toHaveText('+380501234567');
  await page.getByRole('button', { name: 'Перевірити номер' }).click();
  await expect(page.locator('#result')).toContainText('+380501234567');
  await page.getByRole('button', { name: 'Очистити' }).click();
  await expect(page.locator('#phone')).toHaveValue('');
  await expect(page.locator('#country')).toHaveValue('');
  await page.locator('#phone').pressSequentially('+38050');
  await expect(page.locator('.hint-remaining')).toContainText('_');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  if (['chromium', 'ios'].includes(testInfo.project.name)) {
    await page.screenshot({ path: testInfo.outputPath('demo.png'), fullPage: true });
  }
});
