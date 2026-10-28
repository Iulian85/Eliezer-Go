import test from 'node:test';
import assert from 'node:assert/strict';
import { enterFullscreen, toggleFullscreen, subscribeFullscreenChange } from '../src/utils/fullscreen';

test('fullscreen uses the tap immediately, deduplicates requests and reports actual state', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'document');
  let finish!: () => void;
  let calls = 0;
  const doc = Object.assign(new EventTarget(), {
    fullscreenElement: null as unknown,
    documentElement: {
      requestFullscreen: (options: unknown) => {
        calls++;
        assert.deepEqual(options, { navigationUI: 'hide' });
        return new Promise<void>(resolve => { finish = () => { doc.fullscreenElement = doc.documentElement; resolve(); }; });
      },
    },
    exitFullscreen: async () => { doc.fullscreenElement = null; },
  });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: doc });
  try {
    const first = enterFullscreen();
    assert.equal(calls, 1, 'request must start before returning to the event loop');
    const second = enterFullscreen();
    assert.equal(calls, 1);
    finish();
    assert.equal(await first, true);
    assert.equal(await second, true);
    let observed = false;
    const unsubscribe = subscribeFullscreenChange(active => { observed = active; });
    assert.equal(observed, true);
    assert.equal(await toggleFullscreen(), false);
    doc.dispatchEvent(new Event('fullscreenchange'));
    assert.equal(observed, false);
    unsubscribe();
    doc.documentElement.requestFullscreen = async () => { throw new Error('Denied'); };
    assert.equal(await toggleFullscreen(), false, 'a rejected request must never claim fullscreen');
    doc.documentElement.requestFullscreen = async () => {};
    assert.equal(await enterFullscreen(), false, 'a resolved call alone is not proof of fullscreen');
  } finally {
    if (original) Object.defineProperty(globalThis, 'document', original);
    else Reflect.deleteProperty(globalThis, 'document');
  }
});
