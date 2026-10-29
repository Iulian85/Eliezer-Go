export interface EncounterReport { distance: number; bearing: number; timeLeft: number; escaped: boolean }
export const HUD_UPDATE_MS = 200;
export function formatCoinDistance(distance: number) {
  if (!Number.isFinite(distance)) return '—';
  return distance >= 1000 ? `${(distance / 1000).toFixed(1)} km`
    : `${distance < 10 ? (Math.ceil(distance * 10) / 10).toFixed(1) : Math.ceil(distance)} m`;
}
