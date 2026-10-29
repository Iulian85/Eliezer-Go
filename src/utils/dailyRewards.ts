export interface StreakTier {
  day: number;
  elzr: number;
  points: number;
  label: string;
  isJackpot?: boolean;
}

export const STREAK_TIERS: StreakTier[] = [
  { day: 1, elzr: 50, points: 50, label: 'Day 1' },
  { day: 2, elzr: 75, points: 75, label: 'Day 2' },
  { day: 3, elzr: 100, points: 100, label: 'Day 3' },
  { day: 4, elzr: 125, points: 125, label: 'Day 4' },
  { day: 5, elzr: 150, points: 150, label: 'Day 5' },
  { day: 6, elzr: 200, points: 200, label: 'Day 6' },
  { day: 7, elzr: 300, points: 300, label: 'Day 7', isJackpot: true },
];

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTimeUntilMidnight(): { hours: number; minutes: number } {
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24, 0, 0, 0);
  const diffMs = midnight.getTime() - now.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / (1000 * 60)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

export interface StreakStatus {
  isClaimedToday: boolean;
  currentStreak: number;
  targetDayIndex: number; // 1 - 7
  nextReward: StreakTier;
  timeUntilMidnight: { hours: number; minutes: number };
}

export function calculateStreakStatus(dailyCheckIn: {
  currentStreak: number;
  lastCheckInDate: string | null;
}): StreakStatus {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();

  const isClaimedToday = dailyCheckIn.lastCheckInDate === today;
  let effectiveStreak = dailyCheckIn.currentStreak;

  // If user hasn't claimed today and also missed yesterday, streak resets to 0
  if (!isClaimedToday && dailyCheckIn.lastCheckInDate && dailyCheckIn.lastCheckInDate !== yesterday) {
    effectiveStreak = 0;
  }

  // Target day to claim (or day claimed today)
  let targetDay = isClaimedToday ? ((effectiveStreak - 1) % 7) + 1 : (effectiveStreak % 7) + 1;
  if (targetDay < 1) targetDay = 1;
  if (targetDay > 7) targetDay = 7;

  const nextReward = STREAK_TIERS[targetDay - 1];

  return {
    isClaimedToday,
    currentStreak: effectiveStreak,
    targetDayIndex: targetDay,
    nextReward,
    timeUntilMidnight: getTimeUntilMidnight(),
  };
}
