import { describe, expect, it } from 'vitest';

import { parseCommand } from '../src/protocol.js';

describe('gateway protocol', () => {
  it('parses only supported session commands', () => {
    expect(parseCommand('{"type":"ping"}')).toEqual({ type: 'ping' });
    expect(parseCommand('{"type":"look"}')).toEqual({ type: 'look' });
    expect(parseCommand('{"type":"move","direction":"west"}')).toEqual({ type: 'move', direction: 'west' });
    expect(parseCommand('{"type":"auth.login","username":"hanmo","password":"long-password"}')).toEqual({ type: 'auth.login', username: 'hanmo', password: 'long-password' });
    expect(parseCommand('{"type":"move"}')).toBeNull();
    expect(parseCommand('{"type":"fight"}')).toBeNull();
  });
});
