import { expect, test } from '@playwright/test';

test.describe('training', () => {
  test('a character starts breathing practice, receives a tick, and retains gain through disconnect', async ({ page }) => {
    const account = `skill_${Date.now()}`;
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill('stable-password');
    await page.getByTestId('register-btn').click();
    await page.getByTestId('char-name').fill('杜缄');
    await page.getByTestId('roll-attr').click();
    await page.getByTestId('confirm-create').click();

    // Switch to 角色 tab
    await page.getByText('角色').click();
    await expect(page.getByTestId('training-panel')).toBeVisible();
    await page.getByTestId('train-start').click();
    await expect(page.getByTestId('train-status')).toHaveText('在线修炼中 · 基础吐纳');
    await expect(page.getByTestId('skill-skill.basic_breathing')).not.toHaveText('熟练度 0/100', { timeout: 5_000 });
    const preDisconnect = await page.getByTestId('skill-skill.basic_breathing').textContent();

    await page.evaluate(() => (window as Window & { __testCloseWS?: () => void }).__testCloseWS?.());
    await expect(page.getByTestId('skill-skill.basic_breathing')).toBeVisible({ timeout: 10_000 });
    const postReconnect = await page.getByTestId('skill-skill.basic_breathing').textContent();
    const preNum = parseInt(preDisconnect?.match(/\d+/)?.[0] ?? '0', 10);
    const postNum = parseInt(postReconnect?.match(/\d+/)?.[0] ?? '0', 10);
    expect(postNum).toBeGreaterThanOrEqual(preNum);
  });
});
