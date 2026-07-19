import { expect, test } from '@playwright/test';

test.describe('training', () => {
  test('a character starts breathing practice, receives a tick, and stops settlement', async ({ page }) => {
    const account = `skill_${Date.now()}`;
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill('stable-password');
    await page.getByTestId('register-btn').click();
    await page.getByTestId('char-name').fill('杜缄');
    await page.getByTestId('roll-attr').click();
    await page.getByTestId('confirm-create').click();

    await expect(page.getByTestId('training-panel')).toBeVisible();
    await page.getByTestId('train-start').click();
    await expect(page.getByTestId('train-status')).toHaveText('在线修炼中 · 基础吐纳');
    await expect(page.getByTestId('skill-skill.basic_breathing')).not.toHaveText('熟练度 0/100', { timeout: 5_000 });
    await page.evaluate(() => (window as Window & { __testCloseWS?: () => void }).__testCloseWS?.());
    await expect(page.getByTestId('connection-lost')).toBeVisible();
    await expect(page.getByTestId('train-status')).toHaveText('静候修炼');
    await expect(page.getByTestId('connection-lost')).not.toBeVisible({ timeout: 10_000 });
    const settled = await page.getByTestId('skill-skill.basic_breathing').textContent();
    await page.waitForTimeout(1_200);
    await expect(page.getByTestId('skill-skill.basic_breathing')).toHaveText(settled ?? '');
  });
});
