import { test, expect } from '@playwright/test';

test('view_task', async ({ page, context }) => {
  await page.goto('http://localhost:3000/login');
  const page1Promise = page.waitForEvent('popup');
  await page.getByRole('button', { name: 'Continue with Google' }).click();
  const page1 = await page1Promise;
  await page1.getByRole('textbox', { name: 'Email or phone' }).click();
  await page1.getByRole('textbox', { name: 'Email or phone' }).fill('gmail');
  await page1.getByRole('textbox', { name: 'Email or phone' }).press('Enter');
  await page1.getByRole('textbox', { name: 'Enter your password' }).fill('password');
  await page1.getByRole('textbox', { name: 'Enter your password' }).press('Enter');
  await page.waitForURL('**/profile', { timeout: 15000 });
  await page.getByRole('button').nth(1).click();
  await expect(page).toHaveURL(/\/task$/);
  await expect(page.locator('text=All')).toBeVisible();
});