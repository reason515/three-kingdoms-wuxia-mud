import { describe, expect, it } from 'vitest';

import { FakeClock, type Scheduler, WorldTick } from '../src/tick.js';

class FakeScheduler implements Scheduler {
  private callback: (() => void) | undefined;
  private active = false;

  setInterval(callback: () => void): string {
    this.callback = callback;
    this.active = true;
    return 'timer';
  }

  clearInterval(): void {
    this.active = false;
  }

  fire(): void {
    if (this.active) this.callback?.();
  }
}

describe('WorldTick', () => {
  it('emits monotonic tick contexts from an injectable clock', async () => {
    const clock = new FakeClock(10_000);
    const world = new WorldTick(clock);
    const contexts: Array<{ tickId: number; deltaMs: number; timestamp: number }> = [];
    world.register({ onTick: (context) => { contexts.push(context); } });

    clock.advance(1_000);
    await world.tick();
    clock.advance(1_250);
    await world.tick();

    expect(contexts).toEqual([
      { tickId: 1, timestamp: 11_000, deltaMs: 1_000 },
      { tickId: 2, timestamp: 12_250, deltaMs: 1_250 },
    ]);
    expect(world.snapshot()).toMatchObject({ tickId: 2, lastTickAt: 12_250, deltaMs: 1_250, running: false });
  });

  it('starts once and stops scheduled ticks deterministically', async () => {
    const clock = new FakeClock();
    const scheduler = new FakeScheduler();
    const world = new WorldTick(clock, scheduler);
    const contexts: number[] = [];
    world.register({ onTick: ({ tickId }) => { contexts.push(tickId); } });

    world.start();
    world.start();
    clock.advance(1_000);
    scheduler.fire();
    await Promise.resolve();
    world.stop();
    clock.advance(1_000);
    scheduler.fire();
    await Promise.resolve();

    expect(contexts).toEqual([1]);
    expect(world.snapshot().running).toBe(false);
  });
});
