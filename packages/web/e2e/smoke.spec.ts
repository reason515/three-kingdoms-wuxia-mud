import { expect, test } from '@playwright/test';

test.describe('W1 smoke', () => {
  test('server health exposes an advancing world tick', async ({ request }) => {
    const response = await request.get('http://127.0.0.1:3001/health');
    expect(response.ok()).toBeTruthy();
    const initial = (await response.json()) as { status: string; tick: { tickId: number; running: boolean } };
    expect(initial.status).toBe('ok');
    expect(initial.tick.running).toBe(true);
    await expect.poll(async () => {
      const next = await request.get('http://127.0.0.1:3001/health');
      return ((await next.json()) as { tick: { tickId: number } }).tick.tickId;
    }, { timeout: 3_000 }).toBeGreaterThan(initial.tick.tickId);
  });

  test('WebSocket gateway accepts a connection within three seconds', async ({ page }) => {
    await page.goto('/');
    const connected = await page.evaluate(
      () => new Promise<boolean>((resolve) => {
        const socket = new WebSocket('ws://127.0.0.1:3002/ws');
        socket.onopen = () => { socket.close(); resolve(true); };
        socket.onerror = () => resolve(false);
        setTimeout(() => resolve(false), 3_000);
      }),
    );
    expect(connected).toBe(true);
  });

  test('new character creation spawns at Chang’an inn', async ({ page }) => {
    const account = `smoke_${Date.now()}`;
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill('stable-password');
    await page.getByTestId('register-btn').click();
    await page.getByTestId('char-name').fill('任朔');
    await page.getByTestId('roll-attr').click();
    await page.getByTestId('confirm-create').click();
    await expect(page.getByTestId('character-location')).toHaveText('长安客店');
    await expect(page.getByTestId('connection-status')).toContainText('江湖已通');
    await expect(page.getByTestId('room-title')).toHaveText('长安客店');
    await expect(page.getByTestId('room-desc')).not.toBeEmpty();
    await expect(page.getByTestId('exits')).toBeVisible();
  });

  test('a dropped game connection automatically restores the room state', async ({ page }) => {
    const account = `recon_${Date.now()}`;
    await page.goto('/');
    await page.getByTestId('username').fill(account);
    await page.getByTestId('password').fill('stable-password');
    await page.getByTestId('register-btn').click();
    await page.getByTestId('char-name').fill('杜缄');
    await page.getByTestId('roll-attr').click();
    await page.getByTestId('confirm-create').click();
    await expect(page.getByTestId('room-title')).toHaveText('长安客店');
    await page.evaluate(() => (window as Window & { __testCloseWS?: () => void }).__testCloseWS?.());
    await expect(page.getByTestId('room-title')).toHaveText('长安客店', { timeout: 10_000 });
  });
});
