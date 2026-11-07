import { describe, expect, it, vi } from 'vitest';
import { EventBus } from './events';

describe('EventBus', () => {
  it('delivers payloads and supports unsubscribe', () => {
    const bus = new EventBus<{ a: number; b: void }>();
    const fn = vi.fn();
    const off = bus.on('a', fn);
    bus.emit('a', 3);
    off();
    bus.emit('a', 4);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });
});
