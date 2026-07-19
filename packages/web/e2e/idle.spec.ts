import { expect, test } from '@playwright/test';

test.describe('online idle', () => {
  test('breathing practice starts, disconnect stops it, reconnect restores room', async ({ page }) => {
    const account = `idle_${Date.now()}`;
    const password = 'stable-password';
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('register-btn').click();
    await page.getByTestId('char-name').fill('任朔');
    await page.getByTestId('roll-attr').click();
    await page.getByTestId('confirm-create').click();

    await expect(page.getByTestId('training-panel')).toBeVisible();
    await page.getByTestId('train-start').click();
    await expect(page.getByTestId('train-status')).toContainText('基础吐纳');
    await page.waitForTimeout(1_200);
    await expect(page.getByTestId('vital-stamina')).toContainText('体力 100/100');

    await page.evaluate(() => (window as Window & { __testCloseWS?: () => void }).__testCloseWS?.());
    await expect(page.getByTestId('connection-lost')).toBeVisible();
    await expect(page.getByTestId('train-status')).toHaveText('静候修炼');

    await expect(page.getByTestId('connection-lost')).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('training-panel')).toBeVisible();

    await page.reload();
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('character-name')).toHaveText('任朔');
  });
});
