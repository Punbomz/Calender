import { test, expect } from '@playwright/test';

test('user unauthenticated and redirect to login page', async ({ page }) => {
    await page.goto('http://localhost:3000/task');
    await expect(page).toHaveURL(/\/login$/);
});
