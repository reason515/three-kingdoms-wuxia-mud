# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: smoke.spec.ts >> W1 smoke >> a dropped game connection automatically restores the room state
- Location: e2e\smoke.spec.ts:45:3

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByTestId('connection-lost')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for getByTestId('connection-lost')

```

```yaml
- main:
  - heading "汉末江湖录" [level=1]
  - text: 江湖已通 江湖已通
  - navigation:
    - button "江湖"
    - button "角色"
    - button "任务"
  - text: 长安客店
  - paragraph: 任务 · 初入长安
  - paragraph: 与秦掌柜攀谈，了解长安近况。 (1/4)
  - heading "长安客店" [level=3]
  - paragraph: 旧木梁撑起低矮屋檐，灯火映在擦得发亮的桌面上。柜台后的掌柜拨弄算盘， 门外是尚未苏醒的长安街声；此处是初来者安身、歇脚与整理行囊的安全所在。
  - list:
    - listitem:
      - button "秦掌柜 客店掌柜"
  - paragraph: 在线挂机
  - strong: 基础吐纳
  - text: 熟练度 0/100
  - paragraph: 静候修炼
  - button "打坐吐纳"
  - button "练剑"
  - button "练刀"
  - button "寻衅街头闲汉"
  - navigation:
    - button "↓南"
    - button "←西"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test.describe('W1 smoke', () => {
  4  |   test('server health exposes an advancing world tick', async ({ request }) => {
  5  |     const response = await request.get('http://127.0.0.1:3001/health');
  6  |     expect(response.ok()).toBeTruthy();
  7  |     const initial = (await response.json()) as { status: string; tick: { tickId: number; running: boolean } };
  8  |     expect(initial.status).toBe('ok');
  9  |     expect(initial.tick.running).toBe(true);
  10 |     await expect.poll(async () => {
  11 |       const next = await request.get('http://127.0.0.1:3001/health');
  12 |       return ((await next.json()) as { tick: { tickId: number } }).tick.tickId;
  13 |     }, { timeout: 3_000 }).toBeGreaterThan(initial.tick.tickId);
  14 |   });
  15 | 
  16 |   test('WebSocket gateway accepts a connection within three seconds', async ({ page }) => {
  17 |     await page.goto('/');
  18 |     const connected = await page.evaluate(
  19 |       () => new Promise<boolean>((resolve) => {
  20 |         const socket = new WebSocket('ws://127.0.0.1:3002/ws');
  21 |         socket.onopen = () => { socket.close(); resolve(true); };
  22 |         socket.onerror = () => resolve(false);
  23 |         setTimeout(() => resolve(false), 3_000);
  24 |       }),
  25 |     );
  26 |     expect(connected).toBe(true);
  27 |   });
  28 | 
  29 |   test('new character creation spawns at Chang’an inn', async ({ page }) => {
  30 |     const account = `smoke_${Date.now()}`;
  31 |     await page.goto('/');
  32 |     await page.getByTestId('username').fill(account);
  33 |     await page.getByTestId('password').fill('stable-password');
  34 |     await page.getByTestId('register-btn').click();
  35 |     await page.getByTestId('char-name').fill('任朔');
  36 |     await page.getByTestId('roll-attr').click();
  37 |     await page.getByTestId('confirm-create').click();
  38 |     await expect(page.getByTestId('character-location')).toHaveText('长安客店');
  39 |     await expect(page.getByTestId('connection-status')).toContainText('江湖已通');
  40 |     await expect(page.getByTestId('room-title')).toHaveText('长安客店');
  41 |     await expect(page.getByTestId('room-desc')).not.toBeEmpty();
  42 |     await expect(page.getByTestId('exits')).toBeVisible();
  43 |   });
  44 | 
  45 |   test('a dropped game connection automatically restores the room state', async ({ page }) => {
  46 |     const account = `recon_${Date.now()}`;
  47 |     await page.goto('/');
  48 |     await page.getByTestId('username').fill(account);
  49 |     await page.getByTestId('password').fill('stable-password');
  50 |     await page.getByTestId('register-btn').click();
  51 |     await page.getByTestId('char-name').fill('杜缄');
  52 |     await page.getByTestId('roll-attr').click();
  53 |     await page.getByTestId('confirm-create').click();
  54 |     await expect(page.getByTestId('room-title')).toHaveText('长安客店');
  55 |     await page.evaluate(() => (window as Window & { __testCloseWS?: () => void }).__testCloseWS?.());
> 56 |     await expect(page.getByTestId('connection-lost')).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  57 |     await expect(page.getByTestId('connection-lost')).not.toBeVisible({ timeout: 10_000 });
  58 |     await expect(page.getByTestId('room-title')).toHaveText('长安客店');
  59 |   });
  60 | });
  61 | 
```