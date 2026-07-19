import { expect, test } from '@playwright/test';

const account = `hanmo_${Date.now()}`;
const password = 'stable-password';

test.describe('character creation', () => {
  test('a new account rolls attributes, spawns at the inn, and can re-login after reload', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('register-btn').click();

    await expect(page.getByTestId('character-form')).toBeVisible();
    await page.getByTestId('char-name').fill('杜缄');
    await page.getByTestId('roll-attr').click();
    await expect(page.getByTestId('attributes')).toBeVisible();
    await page.getByTestId('confirm-create').click();
    await expect(page.getByTestId('character-name')).toHaveText('杜缄');
    await expect(page.getByTestId('character-location')).toHaveText('长安客店');
    await expect(page.getByTestId('connection-status')).toContainText('江湖已通');
    await expect(page.getByTestId('room-title')).toHaveText('长安客店');

    await page.reload();
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('login-btn').click();
    await expect(page.getByTestId('character-name')).toHaveText('杜缄');
    await expect(page.getByTestId('connection-status')).toContainText('江湖已通');
  });
});
