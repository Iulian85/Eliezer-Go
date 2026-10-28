/**
 * Fullscreen Manager supporting HTML5 Fullscreen API (with navigationUI: 'hide')
 * and Telegram WebApp Bot API 8.0+ native fullscreen
 */
import { getTelegramWebApp, postTelegramEvent } from './telegram';

export function isFullscreen(): boolean {
  if (typeof document === 'undefined') return false;

  const doc = document as any;
  const isDocFullscreen = Boolean(
    doc.fullscreenElement ||
    doc.webkitFullscreenElement ||
    doc.mozFullScreenElement ||
    doc.msFullscreenElement
  );

  const tg = getTelegramWebApp();
  const isTgFullscreen = Boolean(tg?.isFullscreen);

  return isDocFullscreen || isTgFullscreen;
}

export async function enterFullscreen(): Promise<boolean> {
  // 1. Post native Telegram Fullscreen and expand events directly to Telegram Android / iOS
  postTelegramEvent('web_app_expand');
  postTelegramEvent('web_app_request_fullscreen');
  postTelegramEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });

  const tg = getTelegramWebApp();
  if (tg) {
    try {
      if (typeof tg.expand === 'function') tg.expand();
      if (typeof tg.disableVerticalSwipes === 'function') tg.disableVerticalSwipes();
      if (typeof tg.requestFullscreen === 'function') tg.requestFullscreen();
    } catch (e) {
      console.debug('Telegram WebApp requestFullscreen caught:', e);
    }
  }

  // 2. Request browser Fullscreen API with navigationUI: 'hide' to remove bottom phone menu & status bar
  if (typeof document !== 'undefined') {
    const el = document.documentElement as any;
    try {
      if (el.requestFullscreen) {
        try {
          await el.requestFullscreen({ navigationUI: 'hide' });
          return true;
        } catch {
          await el.requestFullscreen();
          return true;
        }
      } else if (el.webkitRequestFullscreen) {
        await el.webkitRequestFullscreen();
        return true;
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
        return true;
      } else if (el.msRequestFullscreen) {
        await el.msRequestFullscreen();
        return true;
      }
    } catch (err) {
      console.debug('HTML5 fullscreen request pending user gesture:', err);
    }
  }

  return isFullscreen();
}

export async function exitFullscreen(): Promise<boolean> {
  postTelegramEvent('web_app_exit_fullscreen');

  const tg = getTelegramWebApp();
  if (tg && typeof tg.exitFullscreen === 'function') {
    try {
      tg.exitFullscreen();
    } catch (e) {
      console.debug('Telegram WebApp exit fullscreen caught:', e);
    }
  }

  if (typeof document !== 'undefined') {
    const doc = document as any;
    try {
      if (doc.exitFullscreen) {
        await doc.exitFullscreen();
        return true;
      } else if (doc.webkitExitFullscreen) {
        await doc.webkitExitFullscreen();
        return true;
      } else if (doc.mozCancelFullScreen) {
        await doc.mozCancelFullScreen();
        return true;
      } else if (doc.msExitFullscreen) {
        await doc.msExitFullscreen();
        return true;
      }
    } catch (err) {
      console.warn('HTML5 exit fullscreen error:', err);
    }
  }

  return false;
}

export async function toggleFullscreen(): Promise<boolean> {
  if (isFullscreen()) {
    await exitFullscreen();
    return false;
  } else {
    await enterFullscreen();
    return true;
  }
}

export function subscribeFullscreenChange(callback: (active: boolean) => void): () => void {
  if (typeof document === 'undefined') return () => {};

  const handle = () => {
    callback(isFullscreen());
  };

  document.addEventListener('fullscreenchange', handle);
  document.addEventListener('webkitfullscreenchange', handle);
  document.addEventListener('mozfullscreenchange', handle);
  document.addEventListener('MSFullscreenChange', handle);

  const tg = getTelegramWebApp();
  if (tg && typeof tg.onEvent === 'function') {
    try {
      tg.onEvent('fullscreenChanged', handle);
    } catch {}
  }

  return () => {
    document.removeEventListener('fullscreenchange', handle);
    document.removeEventListener('webkitfullscreenchange', handle);
    document.removeEventListener('mozfullscreenchange', handle);
    document.removeEventListener('MSFullscreenChange', handle);

    if (tg && typeof tg.offEvent === 'function') {
      try {
        tg.offEvent('fullscreenChanged', handle);
      } catch {}
    }
  };
}

/**
 * Automatically triggers fullscreen on app launch.
 * If the browser blocks automatic fullscreen prior to a gesture,
 * this hooks the very first user interaction (touch/tap) to enter fullscreen immediately.
 */
export function initAutoFullscreen(): () => void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return () => {};
  }

  // 1. Immediate attempt on app load
  enterFullscreen().catch(() => {});

  // 2. Gesture listener: the first touch anywhere on screen activates full screen if not yet active
  const handleFirstInteraction = () => {
    if (!isFullscreen()) {
      enterFullscreen().catch(() => {});
    }
  };

  const gestureEvents = ['pointerdown', 'touchstart', 'touchend', 'click', 'keydown'];
  gestureEvents.forEach((evt) => {
    window.addEventListener(evt, handleFirstInteraction, { capture: true, passive: true });
    document.addEventListener(evt, handleFirstInteraction, { capture: true, passive: true });
  });

  // 3. Visibility change listener (re-enter when returning to the app)
  const handleVisibility = () => {
    if (document.visibilityState === 'visible' && !isFullscreen()) {
      enterFullscreen().catch(() => {});
    }
  };
  document.addEventListener('visibilitychange', handleVisibility);

  return () => {
    gestureEvents.forEach((evt) => {
      window.removeEventListener(evt, handleFirstInteraction, { capture: true });
      document.removeEventListener(evt, handleFirstInteraction, { capture: true });
    });
    document.removeEventListener('visibilitychange', handleVisibility);
  };
}
