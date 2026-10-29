export type FlightCameraSource = 'browser' | 'native' | null;

// Lock the first working source so a late second sensor cannot turn the scene abruptly.
export function selectFlightCameraSource(current: FlightCameraSource, browserReady: boolean, nativeReady: boolean): FlightCameraSource {
  if (current) return current;
  return browserReady ? 'browser' : nativeReady ? 'native' : null;
}
