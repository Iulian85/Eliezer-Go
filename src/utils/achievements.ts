import { UserState, AchievementDefinition } from '../types';

export const ACHIEVEMENT_DEFINITIONS: (AchievementDefinition & {
  getProgress: (state: UserState) => number;
})[] = [
  {
    id: 'coins_10',
    title: 'AR Scout',
    description: 'Hunt and collect your first 10 ELZR coins in Augmented Reality.',
    category: 'hunting',
    rarity: 'bronze',
    target: 10,
    pointsReward: 50,
    iconName: 'Coins',
    getProgress: (state) => state.elzrCollected,
  },
  {
    id: 'coins_50',
    title: 'Urban Hunter',
    description: 'Collect 50 ELZR coins across city zones.',
    category: 'hunting',
    rarity: 'silver',
    target: 50,
    pointsReward: 150,
    iconName: 'Crosshair',
    getProgress: (state) => state.elzrCollected,
  },
  {
    id: 'coins_100',
    title: 'Centurion Vault',
    description: 'Collect 100 ELZR coins to reach the 100-Coin Century milestone.',
    category: 'hunting',
    rarity: 'gold',
    target: 100,
    pointsReward: 350,
    iconName: 'Trophy',
    getProgress: (state) => state.elzrCollected,
  },
  {
    id: 'coins_250',
    title: 'Master of AR',
    description: 'Collect 250 ELZR coins. Elite city-wide dominance.',
    category: 'hunting',
    rarity: 'diamond',
    target: 250,
    pointsReward: 1000,
    iconName: 'Crown',
    getProgress: (state) => state.elzrCollected,
  },
  {
    id: 'streak_3',
    title: 'Dedicated Tracker',
    description: 'Maintain a 3-day consecutive daily check-in streak.',
    category: 'streak',
    rarity: 'bronze',
    target: 3,
    pointsReward: 75,
    iconName: 'Flame',
    getProgress: (state) => state.dailyCheckIn.currentStreak,
  },
  {
    id: 'streak_7',
    title: 'Unstoppable 7-Day',
    description: 'Complete a full 7-day streak to trigger the grand jackpot.',
    category: 'streak',
    rarity: 'gold',
    target: 7,
    pointsReward: 300,
    iconName: 'Zap',
    getProgress: (state) => state.dailyCheckIn.currentStreak,
  },
  {
    id: 'first_fren',
    title: 'First Recruit',
    description: 'Invite your first Telegram fren to your hunting squad.',
    category: 'social',
    rarity: 'bronze',
    target: 1,
    pointsReward: 100,
    iconName: 'UserPlus',
    getProgress: (state) => state.referral.activeFrens,
  },
  {
    id: 'squad_leader',
    title: 'Squad Commander',
    description: 'Recruit 3 active frens to boost mutual mining power.',
    category: 'social',
    rarity: 'silver',
    target: 3,
    pointsReward: 250,
    iconName: 'Users',
    getProgress: (state) => state.referral.activeFrens,
  },
  {
    id: 'rare_hunter',
    title: 'Rare Seeker',
    description: 'Score landmark rare coin bonus points.',
    category: 'hunting',
    rarity: 'silver',
    target: 1,
    pointsReward: 120,
    iconName: 'Sparkles',
    getProgress: (state) => (state.points.rareCoins > 0 ? 1 : 0),
  },
  {
    id: 'wallet_linked',
    title: 'Web3 Pioneer',
    description: 'Connect your TON or Telegram wallet to lock in rewards.',
    category: 'web3',
    rarity: 'silver',
    target: 1,
    pointsReward: 200,
    iconName: 'Wallet',
    getProgress: (state) => (state.wallet.connected ? 1 : 0),
  },
  {
    id: 'patron_drop',
    title: 'City Patron',
    description: 'Drop an advertising coin campaign or earn merchant drop points.',
    category: 'web3',
    rarity: 'gold',
    target: 1,
    pointsReward: 300,
    iconName: 'Megaphone',
    getProgress: (state) => (state.points.merchantDrops > 0 ? 1 : 0),
  },
];

export const RARITY_CONFIG = {
  bronze: {
    label: 'Bronze',
    borderColor: 'border-amber-700/60',
    textColor: 'text-amber-500',
    glowColor: 'shadow-[0_0_12px_rgba(180,83,9,0.2)]',
    bg: 'bg-amber-950/20',
    badge: 'bg-amber-900/40 text-amber-300 border-amber-600/40',
  },
  silver: {
    label: 'Silver',
    borderColor: 'border-slate-400/60',
    textColor: 'text-slate-200',
    glowColor: 'shadow-[0_0_15px_rgba(203,213,225,0.25)]',
    bg: 'bg-slate-800/40',
    badge: 'bg-slate-700/40 text-slate-200 border-slate-400/40',
  },
  gold: {
    label: 'Gold',
    borderColor: 'border-yellow-500/60',
    textColor: 'text-yellow-400',
    glowColor: 'shadow-[0_0_20px_rgba(234,179,8,0.35)]',
    bg: 'bg-yellow-950/25',
    badge: 'bg-yellow-900/40 text-yellow-300 border-yellow-500/50',
  },
  diamond: {
    label: 'Diamond',
    borderColor: 'border-cyan-400/80',
    textColor: 'text-cyan-300',
    glowColor: 'shadow-[0_0_25px_rgba(0,229,255,0.5)]',
    bg: 'bg-cyan-950/40',
    badge: 'bg-cyan-900/50 text-cyan-200 border-cyan-400/60',
  },
};

/**
 * Checks UserState against all defined milestones.
 * Returns newly unlocked achievements and an updated state.
 */
export function checkAchievements(userState: UserState): {
  updatedState: UserState;
  newlyUnlocked: AchievementDefinition[];
} {
  const currentAchievements = { ...(userState.achievements || {}) };
  const newlyUnlocked: AchievementDefinition[] = [];
  let hasChanges = false;

  for (const def of ACHIEVEMENT_DEFINITIONS) {
    const existing = currentAchievements[def.id];
    if (existing && existing.unlocked) {
      continue;
    }

    const progressVal = def.getProgress(userState);
    if (progressVal >= def.target) {
      currentAchievements[def.id] = {
        unlocked: true,
        unlockedAt: new Date().toISOString(),
        claimedReward: false,
      };
      newlyUnlocked.push(def);
      hasChanges = true;
    }
  }

  if (!hasChanges) {
    return { updatedState: userState, newlyUnlocked: [] };
  }

  return {
    updatedState: {
      ...userState,
      achievements: currentAchievements,
    },
    newlyUnlocked,
  };
}

/**
 * Claims bonus points for an unlocked achievement.
 */
export function claimAchievementBonus(
  userState: UserState,
  achievementId: string
): UserState {
  const achievement = userState.achievements[achievementId];
  if (!achievement || !achievement.unlocked || achievement.claimedReward) {
    return userState;
  }

  const def = ACHIEVEMENT_DEFINITIONS.find((d) => d.id === achievementId);
  const reward = def?.pointsReward || 50;

  return {
    ...userState,
    points: {
      ...userState.points,
      gameplay: userState.points.gameplay + reward,
    },
    achievements: {
      ...userState.achievements,
      [achievementId]: {
        ...achievement,
        claimedReward: true,
      },
    },
  };
}
