export type TickContext = {
  timestamp: number;
  tickId: number;
  deltaMs: number;
};

export interface ITickable {
  onTick(context: TickContext): void | Promise<void>;
}

export interface Clock {
  now(): number;
}

export class SystemClock implements Clock {
  now(): number {
    return Date.now();
  }
}

export class FakeClock implements Clock {
  constructor(private timestamp = 0) {}

  now(): number {
    return this.timestamp;
  }

  advance(milliseconds: number): void {
    if (milliseconds < 0) throw new Error('FakeClock cannot move backwards.');
    this.timestamp += milliseconds;
  }
}

export interface Scheduler {
  setInterval(callback: () => void, milliseconds: number): unknown;
  clearInterval(handle: unknown): void;
}

export const systemScheduler: Scheduler = {
  setInterval: (callback, milliseconds) => setInterval(callback, milliseconds),
  clearInterval: (handle) => clearInterval(handle as NodeJS.Timeout),
};

export type TickSnapshot = { tickId: number; lastTickAt: number; deltaMs: number; running: boolean };

export class WorldTick {
  private readonly tickables = new Set<ITickable>();
  private timer: unknown;
  private tickId = 0;
  private lastTickAt: number;
  private deltaMs = 0;

  constructor(
    private readonly clock: Clock = new SystemClock(),
    private readonly scheduler: Scheduler = systemScheduler,
    private readonly intervalMs = 1_000,
  ) {
    this.lastTickAt = clock.now();
  }

  register(tickable: ITickable): () => void {
    this.tickables.add(tickable);
    return () => this.tickables.delete(tickable);
  }

  start(): void {
    if (this.timer !== undefined) return;
    this.lastTickAt = this.clock.now();
    this.timer = this.scheduler.setInterval(() => void this.tick(), this.intervalMs);
  }

  stop(): void {
    if (this.timer === undefined) return;
    this.scheduler.clearInterval(this.timer);
    this.timer = undefined;
  }

  async tick(): Promise<TickContext> {
    const timestamp = this.clock.now();
    this.deltaMs = timestamp - this.lastTickAt;
    this.lastTickAt = timestamp;
    const context = { timestamp, tickId: ++this.tickId, deltaMs: this.deltaMs };
    await Promise.all([...this.tickables].map((tickable) => tickable.onTick(context)));
    return context;
  }

  snapshot(): TickSnapshot {
    return { tickId: this.tickId, lastTickAt: this.lastTickAt, deltaMs: this.deltaMs, running: this.timer !== undefined };
  }
}
