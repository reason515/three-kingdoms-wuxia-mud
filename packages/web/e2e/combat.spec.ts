import { expect, test } from '@playwright/test';

test.describe('combat', () => {
  test('a character fights a street thug, sees battle log, and either wins or flees', async ({ page }) => {
    const account = `combat_${Date.now()}`;
    const password = 'stable-password';
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill(password);
    await page.getByTestId('register-btn').click();
    await page.getByTestId('char-name').fill('杜缄');
    await page.getByTestId('roll-attr').click();
    await page.getByTestId('confirm-create').click();

    await expect(page.getByTestId('btn-attack')).toBeVisible();
    await page.getByTestId('btn-attack').click();
    await expect(page.getByTestId('combat-view')).toBeVisible();
    await expect(page.getByTestId('enemy-hp')).toBeVisible();
    await page.waitForTimeout(3_000); // let 1 tick cycle process a combat round
    const entries = page.getByTestId('battle-log-entry');
    await expect(entries.first()).toBeVisible({ timeout: 5_000 });

    // If combat is still going, flee
    const fleeBtn = page.getByTestId('combat-flee');
    if (await fleeBtn.isVisible()) await fleeBtn.click();
    await expect(page.getByTestId('combat-view')).not.toBeVisible({ timeout: 3_000 });
  });
});
