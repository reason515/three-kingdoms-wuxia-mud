export type HealthState = 'checking' | 'online' | 'offline';

export function healthLabel(state: HealthState): string {
  return { checking: '正在探听江湖消息', online: '江湖已通', offline: '暂未接通江湖' }[state];
}
