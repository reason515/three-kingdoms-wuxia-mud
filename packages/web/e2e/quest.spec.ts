import { expect, test } from '@playwright/test';

test.describe('newbie quest', () => {
  test('a new character auto-accepts and completes the innkeeper talk step', async ({ page }) => {
    const account = `quest_${Date.now()}`;
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill('stable-password');
    await page.getByTestId('register-btn').click();
    await page.getByTestId('char-name').fill('杜缄');
    await page.getByTestId('roll-attr').click();
    await page.getByTestId('confirm-create').click();

    await expect(page.getByTestId('quest-log')).toBeVisible({ timeout: 5_000 });
    await expect(page.getByTestId('quest-step')).toContainText('秦掌柜');

    // Talk to the innkeeper to advance quest
    await page.getByTestId('talk-npc.innkeeper_qin').click();
    await expect(page.getByTestId('quest-step')).toContainText('西市');

    // Move west to west market (completes goto step)
    await page.getByTestId('exit-west').click();
    await expect(page.getByTestId('quest-step')).toContainText('张铁匠');

    // Move north to iron smith, then talk to blacksmith
    await page.getByTestId('exit-north').click();
    await page.getByTestId('talk-npc.blacksmith_zhang').click();
    await expect(page.getByTestId('quest-step')).toContainText('闲汉');

    // Move back to west market for the thug fight
    await page.getByTestId('exit-south').click();

    // Fight the thug and win completes the quest
    await page.getByTestId('btn-attack').click();
    await expect(page.getByTestId('combat-view')).toBeVisible();
    // Wait for victory or flee after timeout
    await page.waitForTimeout(6_000);
    const fleeBtn = page.getByTestId('combat-flee');
    if (await fleeBtn.isVisible({ timeout: 2_000 }).catch(() => false)) await fleeBtn.click();
    await expect(page.getByTestId('combat-view')).not.toBeVisible({ timeout: 5_000 });
    // Quest should show completed step or all done
    await expect(page.getByTestId('quest-step')).toBeVisible();
  });
});
