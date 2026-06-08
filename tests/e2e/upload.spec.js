const { test, expect } = require('@playwright/test');

test.describe('Sakura e2e: signup, signin, upload', () => {
  const base = process.env.E2E_BASE || 'https://vhyp3r.github.io/sakura.xyz/';
  const testEmail = process.env.E2E_EMAIL || `e2e+${Date.now()}@example.com`;
  const testPassword = process.env.E2E_PW || 'Test1234!';

  test('sign up, sign in, upload file', async ({ page, context }) => {
    await page.goto(base);

    // Sign up flow
    await page.waitForSelector('text=Sign Up');
    await page.click('text=Sign Up');
    await page.fill('input[type=email]', testEmail);
    await page.fill('input[type=password]', testPassword);
    await page.click('button:has-text("Sign Up")');

    // Wait for possible auth redirect and dashboard link
    await page.waitForTimeout(2000);

    // Navigate to dashboard
    await page.goto(new URL('/dashboard', base).toString());
    await expect(page.locator('text=Dashboard')).toBeVisible();

    // Switch to Uploads tab
    await page.click('button:has-text("Uploads")');

    // Prepare a small file to upload
    const filePath = require('path').resolve(__dirname, 'sample.txt');
    await page.setInputFiles('input[type=file]', filePath);

    // Fill metadata
    await page.fill('input[placeholder="Name"]', 'e2e-sample');
    await page.fill('input[placeholder="Description"]', 'Playwright test upload');
    await page.fill('input[placeholder="Tags (comma separated)"]', 'e2e,test');

    // Click upload and wait for progress indicator
    await page.click('button:has-text("Upload")');

    // Wait for a download link to appear for the uploaded item
    await page.waitForSelector('text=Download', { timeout: 60000 });
    const downloadLink = await page.locator('text=Download').first().getAttribute('href');
    expect(downloadLink).toBeTruthy();
  });
});
