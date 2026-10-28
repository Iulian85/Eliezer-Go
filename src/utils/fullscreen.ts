import { getTelegramWebApp, isTgVersionAtLeast } from './telegram';

function fullscreenElement() {
  if (typeof document === 'undefined') return null;
  const doc = document as any;
  return doc.fullscreenElement || doc.webkitFullscreenElement || doc.mozFullScreenElement || doc.msFullscreenElement;
}

export function isFullscreen(): boolean {
  return Boolean(fullscreenElement() || getTelegramWebApp()?.isFullscreen);
}

let pending: Promise<boolean> | null = null;

// Call directly from a tap, before camera permissions or other awaits.
export function enterFullscreen(): Promise<boolean> {
  if (pending) return pending;
  if (fullscreenElement()) return Promise.resolve(true);
  const request = async (): Promise<boolean> => {
    if (typeof document === 'undefined') return false;
    const el = document.documentElement as any;
    try {
      if (el.requestFullscreen) await el.requestFullscreen({ navigationUI: 'hide' });
      else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
      if (fullscreenElement()) return true;
    } catch {}
    const tg = getTelegramWebApp();
    if (tg?.isFullscreen) return true;
    if (!tg?.requestFullscreen || !isTgVersionAtLeast('8.0')) return false;
    return new Promise<boolean>((resolve) => {
      const finish = () => {
        clearTimeout(timer);
        tg.offEvent?.('fullscreenChanged', finish);
        tg.offEvent?.('fullscreenFailed', finish);
        resolve(isFullscreen());
      };
      const timer = setTimeout(finish, 1500);
      tg.onEvent?.('fullscreenChanged', finish);
      tg.onEvent?.('fullscreenFailed', finish);
      try {
        tg.expand();
        tg.disableVerticalSwipes?.();
        tg.requestFullscreen!();
      } catch { finish(); }
    });
  };
  pending = request().finally(() => { pending = null; });
  return pending;
}

export async function exitFullscreen(): Promise<boolean> {
  if (pending) await pending;
  const tg = getTelegramWebApp();
  try { if (tg?.isFullscreen) tg.exitFullscreen?.(); } catch {}
  if (fullscreenElement()) {
    const doc = document as any;
    try {
      const exit = doc.exitFullscreen || doc.webkitExitFullscreen || doc.mozCancelFullScreen || doc.msExitFullscreen;
      await exit?.call(doc);
    } catch {}
  }
  return !isFullscreen();
}

export async function toggleFullscreen(): Promise<boolean> {
  if (!isFullscreen()) return enterFullscreen();
  await exitFullscreen();
  return isFullscreen();
}

export function subscribeFullscreenChange(callback: (active: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};
  const handle = () => callback(isFullscreen());
  const events = ['fullscreenchange', 'fullscreenerror', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'];
  events.forEach(event => document.addEventListener(event, handle));
  const tg = getTelegramWebApp();
  tg?.onEvent?.('fullscreenChanged', handle);
  tg?.onEvent?.('fullscreenFailed', handle);
  handle();
  return () => {
    events.forEach(event => document.removeEventListener(event, handle));
    tg?.offEvent?.('fullscreenChanged', handle);
    tg?.offEvent?.('fullscreenFailed', handle);
  };
}
