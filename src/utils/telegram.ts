/**
 * Telegram Mini App WebApp SDK Integration Helper
 */

export interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
}

export interface TelegramWebApp {
  version?: string;
  isVersionAtLeast?: (version: string) => boolean;
  ready: () => void;
  expand: () => void;
  close: () => void;
  enableClosingConfirmation?: () => void;
  requestFullscreen?: () => void;
  exitFullscreen?: () => void;
  isFullscreen?: boolean;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  isVerticalSwipesEnabled?: boolean;
  lockOrientation?: (orientation: 'portrait' | 'landscape') => void;
  unlockOrientation?: () => void;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  BackButton?: {
    isVisible: boolean;
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
  openTelegramLink?: (url: string) => void;
  openLink?: (url: string) => void;
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void;
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void;
    selectionChanged: () => void;
  };
  initDataUnsafe?: {
    user?: TelegramUser;
    start_param?: string;
  };
  themeParams?: {
    bg_color?: string;
    text_color?: string;
    button_color?: string;
    button_text_color?: string;
  };
  colorScheme?: 'light' | 'dark';
  viewportHeight?: number;
  viewportStableHeight?: number;
  isExpanded?: boolean;
  onEvent?: (eventType: string, eventHandler: (...args: any[]) => void) => void;
  offEvent?: (eventType: string, eventHandler: (...args: any[]) => void) => void;
  shareToStory?: (
    media_url: string,
    params?: {
      text?: string;
      widget_link?: { url: string; name?: string };
    }
  ) => void;
}

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
      WebView?: {
        postEvent: (eventType: string, callback?: () => void, eventData?: any) => void;
      };
    };
    TelegramWebviewProxy?: {
      postEvent: (eventType: string, eventData: string) => void;
    };
  }
}

export function getTelegramWebApp(): TelegramWebApp | null {
  if (typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp) {
    return window.Telegram.WebApp;
  }
  return null;
}

/**
 * Directly post an event to Telegram's native Android/iOS WebView Proxy or parent iframe.
 * This guarantees events like web_app_request_fullscreen and web_app_expand are delivered
 * directly to the native host container without being blocked by SDK client checks.
 */
export function postTelegramEvent(eventType: string, eventData: any = '') {
  if (typeof window === 'undefined') return;

  const dataStr = typeof eventData === 'string' ? eventData : JSON.stringify(eventData);

  // 1. Android Telegram native JavascriptInterface
  try {
    if (window.TelegramWebviewProxy && typeof window.TelegramWebviewProxy.postEvent === 'function') {
      window.TelegramWebviewProxy.postEvent(eventType, JSON.stringify(dataStr));
    }
  } catch (e) {
    console.debug('TelegramWebviewProxy error:', e);
  }

  // 2. Windows Phone / UWP external notify
  try {
    const ext = (window as any).external;
    if (ext && typeof ext.notify === 'function') {
      ext.notify(JSON.stringify({ eventType, eventData: dataStr }));
    }
  } catch {}

  // 3. Telegram Web / iFrame postMessage
  try {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(JSON.stringify({ eventType, eventData: dataStr }), '*');
    }
  } catch {}
}

/**
 * Safely check if the Telegram Mini App client version satisfies a minimum version requirement.
 */
export function isTgVersionAtLeast(minVersion: string): boolean {
  const tg = getTelegramWebApp();
  if (!tg) return false;

  // Use Telegram's native isVersionAtLeast if available
  if (typeof tg.isVersionAtLeast === 'function') {
    try {
      return Boolean(tg.isVersionAtLeast(minVersion));
    } catch {
      // Fall through to manual parsing
    }
  }

  // Fallback: parse tg.version string (e.g., "6.0", "7.7", "8.0")
  if (typeof tg.version === 'string' && tg.version) {
    try {
      const curParts = tg.version.split('.').map((v) => parseInt(v, 10) || 0);
      const minParts = minVersion.split('.').map((v) => parseInt(v, 10) || 0);
      const maxLen = Math.max(curParts.length, minParts.length);
      for (let i = 0; i < maxLen; i++) {
        const cur = curParts[i] || 0;
        const min = minParts[i] || 0;
        if (cur > min) return true;
        if (cur < min) return false;
      }
      return true;
    } catch {
      return false;
    }
  }

  return false;
}

export function initTelegramApp(): {
  isTelegram: boolean;
  user: TelegramUser | null;
  startParam: string | null;
} {
  // Send direct native events to expand and enter fullscreen
  postTelegramEvent('web_app_expand');
  postTelegramEvent('web_app_request_fullscreen');
  postTelegramEvent('web_app_setup_swipe_behavior', { allow_vertical_swipe: false });
  postTelegramEvent('web_app_set_header_color', { color_key: 'bg_color' });
  postTelegramEvent('web_app_set_background_color', { color: '#060b13' });
  postTelegramEvent('web_app_set_bottom_bar_color', { color: '#060b13' });

  const tg = getTelegramWebApp();
  if (tg) {
    try {
      // 1. Core methods supported since 6.0
      if (typeof tg.ready === 'function') {
        try {
          tg.ready();
        } catch {}
      }
      if (typeof tg.expand === 'function') {
        try {
          tg.expand();
        } catch {}
      }

      // 2. Request native fullscreen
      if (typeof tg.requestFullscreen === 'function') {
        try {
          tg.requestFullscreen();
        } catch (e) {
          console.debug('Telegram requestFullscreen fallback:', e);
        }
      }

      // 3. Vertical swipe disabling
      if (typeof tg.disableVerticalSwipes === 'function') {
        try {
          tg.disableVerticalSwipes();
        } catch {}
      }

      // 4. Header & Background colors
      if (typeof tg.setHeaderColor === 'function') {
        try {
          tg.setHeaderColor('#060b13');
        } catch {}
      }
      if (typeof tg.setBackgroundColor === 'function') {
        try {
          tg.setBackgroundColor('#060b13');
        } catch {}
      }

      // 5. Bottom bar color
      if (typeof tg.setBottomBarColor === 'function') {
        try {
          tg.setBottomBarColor('#060b13');
        } catch {}
      }

      // 6. Orientation lock
      if (typeof tg.lockOrientation === 'function') {
        try {
          tg.lockOrientation('portrait');
        } catch {}
      }

      // 7. Closing confirmation
      if (typeof tg.enableClosingConfirmation === 'function') {
        try {
          tg.enableClosingConfirmation();
        } catch {}
      }

      return {
        isTelegram: true,
        user: tg.initDataUnsafe?.user || null,
        startParam: tg.initDataUnsafe?.start_param || null,
      };
    } catch (err) {
      console.warn('initTelegramApp error handled safely:', err);
    }
  }

  return {
    isTelegram: false,
    user: null,
    startParam: null,
  };
}

export function triggerHaptic(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') {
  const tg = getTelegramWebApp();
  if (tg && tg.HapticFeedback) {
    try {
      if (type === 'success' || type === 'warning' || type === 'error') {
        tg.HapticFeedback.notificationOccurred(type);
      } else {
        tg.HapticFeedback.impactOccurred(type);
      }
      return;
    } catch {}
  }
  // Browser navigator.vibrate fallback
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    const pattern = type === 'heavy' ? [40, 30, 40] : type === 'error' ? [60, 40, 60] : type === 'success' ? [30, 20, 50] : [25];
    try {
      navigator.vibrate(pattern);
    } catch {}
  }
}

export function openTelegramShare(shareText: string, shareUrl?: string) {
  const tg = getTelegramWebApp();
  const urlParam = shareUrl ? encodeURIComponent(shareUrl) : '';
  const textParam = encodeURIComponent(shareText);
  const fullUrl = `https://t.me/share/url?url=${urlParam}&text=${textParam}`;

  if (tg?.openTelegramLink) {
    try {
      tg.openTelegramLink(fullUrl);
      return;
    } catch {}
  }
  window.open(fullUrl, '_blank');
}

export function shareHunterStatusStory(mediaUrl: string, caption: string, botUrl?: string): boolean {
  const tg = getTelegramWebApp();
  if (tg && typeof tg.shareToStory === 'function') {
    try {
      tg.shareToStory(mediaUrl, {
        text: caption,
        widget_link: botUrl ? { url: botUrl, name: 'Play Eliezer Go' } : undefined,
      });
      return true;
    } catch (e) {
      console.warn('Telegram shareToStory failed, fallback:', e);
    }
  }
  return false;
}

export function showTelegramBackButton(onClick: () => void): () => void {
  postTelegramEvent('web_app_setup_back_button', { is_visible: true });
  const tg = getTelegramWebApp();
  if (tg && tg.BackButton) {
    try {
      tg.BackButton.show();
      tg.BackButton.onClick(onClick);
      return () => {
        try {
          tg.BackButton?.offClick(onClick);
          tg.BackButton?.hide();
          postTelegramEvent('web_app_setup_back_button', { is_visible: false });
        } catch {}
      };
    } catch {}
  }
  return () => {};
}

export function hideTelegramBackButton(): void {
  postTelegramEvent('web_app_setup_back_button', { is_visible: false });
  const tg = getTelegramWebApp();
  if (tg && tg.BackButton) {
    try {
      tg.BackButton.hide();
    } catch {}
  }
}
