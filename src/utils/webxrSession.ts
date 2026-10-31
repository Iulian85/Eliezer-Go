let pendingSession: Promise<XRSession | null> | null = null;

/** Must be called from the existing Hunt button gesture. WebXR requires user activation. */
export function requestWebXRSessionOnGesture(): void {
  if (!navigator.xr || pendingSession) return;
  pendingSession = navigator.xr.isSessionSupported('immersive-ar')
    .then((supported) => supported
      ? navigator.xr!.requestSession('immersive-ar', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hit-test', 'anchors', 'dom-overlay'],
        domOverlay: { root: document.body },
      })
      : null)
    .catch(() => null);
}

export function consumeWebXRSession(): Promise<XRSession | null> | null {
  const session = pendingSession;
  pendingSession = null;
  return session;
}
