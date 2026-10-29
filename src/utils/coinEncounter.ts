import type { EncounterReport } from './encounterDisplay';

// Address-fixed test drops must never inherit a camera-relative flight report.
export function coinEncounterReport(coin: { calibration?: boolean }, flight?: EncounterReport) {
  return coin.calibration === true ? undefined : flight;
}
