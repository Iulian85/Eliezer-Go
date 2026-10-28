import { Quaternion } from 'three';
import { deviceCameraQuaternion } from './arSpatial';
import { getTelegramWebApp, isTgVersionAtLeast } from './telegram';

export function telegramOrientationQuaternion(sample: { absolute: boolean; alpha: number; beta: number; gamma: number }, screenAngle: number): Quaternion | null {
  if (!sample.absolute || ![sample.alpha, sample.beta, sample.gamma].every(Number.isFinite)) return null;
  const degrees = 180 / Math.PI;
  return deviceCameraQuaternion(sample.alpha * degrees, sample.beta * degrees, sample.gamma * degrees, screenAngle);
}

export function subscribeTelegramOrientation(callback: (orientation: Quaternion) => void): () => void {
  const tg = getTelegramWebApp();
  const sensor = tg?.DeviceOrientation;
  if (!sensor || !isTgVersionAtLeast('8.0')) return () => {};
  const owned = !sensor.isStarted;
  const changed = () => {
    const angle = window.screen.orientation?.angle ?? 0;
    const quaternion = telegramOrientationQuaternion(sensor, angle);
    if (quaternion) callback(quaternion);
  };
  tg.onEvent?.('deviceOrientationChanged', changed);
  try { if (owned) sensor.start({ refresh_rate: 33, need_absolute: true }); } catch {}
  return () => {
    tg.offEvent?.('deviceOrientationChanged', changed);
    try { if (owned) sensor.stop(); } catch {}
  };
}
