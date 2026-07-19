import { describe, expect, it } from 'vitest';

import { healthLabel } from '../src/lib/health';

describe('health status copy', () => {
  it('uses a distinct message for each connection state', () => {
    expect(healthLabel('checking')).toBe('正在探听江湖消息');
    expect(healthLabel('online')).toBe('江湖已通');
    expect(healthLabel('offline')).toBe('暂未接通江湖');
  });
});
