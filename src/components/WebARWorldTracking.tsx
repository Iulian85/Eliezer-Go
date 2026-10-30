import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

type XRSessionWithEvents = XRSession & {
  addEventListener: (type: string, listener: EventListener) => void;
  removeEventListener: (type: string, listener: EventListener) => void;
};

interface WebARWorldTrackingProps {
  enabled: boolean;
  onActive: () => void;
  onUnavailable: () => void;
}

/**
 * Starts native WebXR immersive-ar when Telegram's WebView exposes it.
 * Three.js then owns the camera pose and local-floor reference space, so
 * objects in the scene keep their world position while the user walks.
 * Devices without WebXR stay on the existing GPS/compass fallback.
 */
export function WebARWorldTracking({ enabled, onActive, onUnavailable }: WebARWorldTrackingProps) {
  const { gl } = useThree();

  useEffect(() => {
    let disposed = false;
    let session: XRSessionWithEvents | null = null;

    async function start() {
      const xr = navigator.xr;
      if (!enabled || !xr || typeof xr.isSessionSupported !== 'function') {
        onUnavailable();
        return;
      }

      try {
        const supported = await xr.isSessionSupported('immersive-ar');
        if (!supported || disposed) {
          onUnavailable();
          return;
        }

        session = await xr.requestSession('immersive-ar', {
          requiredFeatures: ['local-floor'],
          optionalFeatures: ['hit-test', 'anchors', 'dom-overlay'],
          domOverlay: { root: document.body },
        });
        if (disposed) {
          await session.end();
          return;
        }

        gl.xr.enabled = true;
        gl.xr.setReferenceSpaceType('local-floor');
        await gl.xr.setSession(session);
        onActive();

        const ended = () => {
          gl.xr.setSession(null);
          onUnavailable();
        };
        session.addEventListener('end', ended);
      } catch (error) {
        // Telegram WebViews commonly reject immersive-ar. Keep the GPS/compass
        // renderer alive instead of leaving a black screen.
        console.info('WebXR immersive-ar unavailable; using fallback renderer.', error);
        onUnavailable();
      }
    }

    void start();
    return () => {
      disposed = true;
      if (session) {
        void session.end().catch(() => undefined);
        session = null;
      }
      gl.xr.enabled = false;
    };
  }, [enabled, gl, onActive, onUnavailable]);

  return null;
}
