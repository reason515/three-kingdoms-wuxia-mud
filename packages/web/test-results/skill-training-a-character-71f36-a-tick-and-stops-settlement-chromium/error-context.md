# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: skill.spec.ts >> training >> a character starts breathing practice, receives a tick, and stops settlement
- Location: e2e\skill.spec.ts:4:3

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
  - paragraph: 初平元年 · 长安纪
  - heading "汉末江湖录" [level=1]
  - paragraph: 一纸名帖，入此风尘
  - text: 江湖已通 江湖已通
  - navigation:
    - button "江湖"
    - button "角色"
    - button "任务"
  - paragraph: 长安 · 客店
  - heading "杜缄" [level=2]
  - paragraph: 你在客店的灯火下醒来。行囊尚轻，城中的风声却已传至檐下。
  - term: 臂力
  - definition: "23"
  - term: 悟性
  - definition: "26"
  - term: 身法
  - definition: "18"
  - term: 根骨
  - definition: "19"
  - text: 长安客店 体力 100/100
  - paragraph: 任务 · 初入长安
  - paragraph: 与秦掌柜攀谈，了解长安近况。 (1/4)
  - button "寻衅街头闲汉"
  - paragraph: 在线挂机
  - strong: 基础吐纳
  - text: 熟练度 18/100
  - paragraph: 在线修炼中 · 基础吐纳
  - button "收功"
  - paragraph: 环顾
  - button "再看一眼"
  - heading "长安客店" [level=3]
  - paragraph: 旧木梁撑起低矮屋檐，灯火映在擦得发亮的桌面上。柜台后的掌柜拨弄算盘， 门外是尚未苏醒的长安街声；此处是初来者安身、歇脚与整理行囊的安全所在。
  - list:
    - listitem:
      - strong: 秦掌柜
      - text: 客店掌柜
      - button "交谈"
  - button "往西"
  - button "往南"
```

# Test source

```ts
  1  | import { expect, test } from '@playwright/test';
  2  | 
  3  | test.describe('training', () => {
  4  |   test('a character starts breathing practice, receives a tick, and stops settlement', async ({ page }) => {
  5  |     const account = `skill_${Date.now()}`;
  6  |     await page.goto('/');
  7  |     await page.getByTestId('username').fill(account);
  8  |     await page.getByTestId('password').fill('stable-password');
  9  |     await page.getByTestId('register-btn').click();
  10 |     await page.getByTestId('char-name').fill('杜缄');
  11 |     await page.getByTestId('roll-attr').click();
  12 |     await page.getByTestId('confirm-create').click();
  13 | 
  14 |     await expect(page.getByTestId('training-panel')).toBeVisible();
  15 |     await page.getByTestId('train-start').click();
  16 |     await expect(page.getByTestId('train-status')).toHaveText('在线修炼中 · 基础吐纳');
  17 |     await expect(page.getByTestId('skill-skill.basic_breathing')).not.toHaveText('熟练度 0/100', { timeout: 5_000 });
  18 |     await page.evaluate(() => (window as Window & { __testCloseWS?: () => void }).__testCloseWS?.());
> 19 |     await expect(page.getByTestId('connection-lost')).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  20 |     await expect(page.getByTestId('train-status')).toHaveText('静候修炼');
  21 |     await expect(page.getByTestId('connection-lost')).not.toBeVisible({ timeout: 10_000 });
  22 |     const settled = await page.getByTestId('skill-skill.basic_breathing').textContent();
  23 |     await page.waitForTimeout(1_200);
  24 |     await expect(page.getByTestId('skill-skill.basic_breathing')).toHaveText(settled ?? '');
  25 |   });
  26 | });
  27 | 
```