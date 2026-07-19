import { expect, test } from '@playwright/test';

test.describe('room movement', () => {
  test('a character moves between the inn and west market, then reconnects at the right location', async ({ page }) => {
    const account = `room_${Date.now()}`;
    const password = 'stable-password';
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('register-btn').click();
    await page.getByTestId('char-name').fill('任朔');
    await page.getByTestId('roll-attr').click();
    await page.getByTestId('confirm-create').click();

    await expect(page.getByTestId('room-title')).toHaveText('长安客店');
    await expect(page.getByTestId('npc-npc.innkeeper_qin')).toContainText('秦掌柜');
    await page.getByTestId('exit-west').click();
    await expect(page.getByTestId('room-title')).toHaveText('长安西市');
    await expect(page.getByTestId('exit-east')).toBeVisible();

    // Drop connection and wait for auto-reconnect
    await page.evaluate(() => (window as Window & { __testCloseWS?: () => void }).__testCloseWS?.());
    await expect(page.getByTestId('room-title')).toHaveText('长安西市', { timeout: 10_000 });

    await page.getByTestId('exit-east').click();
    await expect(page.getByTestId('room-title')).toHaveText('长安客店');

    await page.reload();
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('room-title')).toHaveText('长安客店');
  });
});
