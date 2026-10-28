import React, { useState } from 'react';
import { UserState } from '../types';
import {
  ACHIEVEMENT_DEFINITIONS,
  RARITY_CONFIG,
  claimAchievementBonus,
} from '../utils/achievements';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';
import confetti from 'canvas-confetti';
import {
  Trophy,
  Coins,
  Crosshair,
  Crown,
  Flame,
  Zap,
  UserPlus,
  Users,
  Sparkles,
  Wallet,
  Megaphone,
  Check,
  Lock,
  Gift,
  Award,
} from 'lucide-react';

interface AchievementsSectionProps {
  userState: UserState;
  onUpdateUserState: (newState: UserState) => void;
}

export const AchievementsSection: React.FC<AchievementsSectionProps> = ({
  userState,
  onUpdateUserState,
}) => {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'in_progress'>('all');

  const getIcon = (name: string, className = 'w-5 h-5') => {
    switch (name) {
      case 'Coins':
        return <Coins className={className} />;
      case 'Crosshair':
        return <Crosshair className={className} />;
      case 'Trophy':
        return <Trophy className={className} />;
      case 'Crown':
        return <Crown className={className} />;
      case 'Flame':
        return <Flame className={className} />;
      case 'Zap':
        return <Zap className={className} />;
      case 'UserPlus':
        return <UserPlus className={className} />;
      case 'Users':
        return <Users className={className} />;
      case 'Sparkles':
        return <Sparkles className={className} />;
      case 'Wallet':
        return <Wallet className={className} />;
      case 'Megaphone':
        return <Megaphone className={className} />;
      default:
        return <Award className={className} />;
    }
  };

  const totalBadges = ACHIEVEMENT_DEFINITIONS.length;
  const unlockedBadges = ACHIEVEMENT_DEFINITIONS.filter(
    (def) => userState.achievements?.[def.id]?.unlocked
  ).length;
  const progressPercent = Math.round((unlockedBadges / totalBadges) * 100);

  const filteredBadges = ACHIEVEMENT_DEFINITIONS.filter((def) => {
    const isUnlocked = userState.achievements?.[def.id]?.unlocked;
    if (filter === 'unlocked') return isUnlocked;
    if (filter === 'in_progress') return !isUnlocked;
    return true;
  });

  const handleClaim = (achievementId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    triggerHaptic('success');
    playSound.rareCoinCollected();

    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { x, y },
      colors: ['#00e5ff', '#fbbf24', '#a855f7'],
    });

    const nextState = claimAchievementBonus(userState, achievementId);
    onUpdateUserState(nextState);
  };

  return (
    <div className="rounded-3xl bg-[#091322] border border-[#182c47] p-5 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 flex items-center justify-center">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white tracking-wide uppercase">
              Hunter Milestones & Badges
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              {unlockedBadges} of {totalBadges} Badges Unlocked ({progressPercent}%)
            </p>
          </div>
        </div>

        <div className="px-2.5 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono text-xs font-bold">
          {progressPercent}%
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-cyan-400 to-purple-500 rounded-full transition-all duration-500 shadow-[0_0_12px_rgba(0,229,255,0.5)]"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 pt-1 border-b border-slate-800/80 pb-3">
        {(['all', 'unlocked', 'in_progress'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => {
              triggerHaptic('light');
              playSound.buttonClick();
              setFilter(tab);
            }}
            className={`px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider uppercase transition-all cursor-pointer ${
              filter === tab
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_#00e5ff]'
                : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            {tab === 'all' && `All (${totalBadges})`}
            {tab === 'unlocked' && `Unlocked (${unlockedBadges})`}
            {tab === 'in_progress' && `In Progress (${totalBadges - unlockedBadges})`}
          </button>
        ))}
      </div>

      {/* Badges List */}
      <div className="space-y-2.5">
        {filteredBadges.map((def) => {
          const status = userState.achievements?.[def.id];
          const isUnlocked = Boolean(status?.unlocked);
          const hasClaimed = Boolean(status?.claimedReward);
          const currentVal = def.getProgress(userState);
          const currentPercent = Math.min(100, Math.round((currentVal / def.target) * 100));
          const rarity = RARITY_CONFIG[def.rarity];

          return (
            <div
              key={def.id}
              className={`p-3.5 rounded-2xl border transition-all ${
                isUnlocked
                  ? `${rarity.bg} ${rarity.borderColor} ${rarity.glowColor}`
                  : 'bg-slate-900/50 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  {/* Badge Icon */}
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 border relative ${
                      isUnlocked
                        ? `${rarity.borderColor} bg-slate-900/90 text-white`
                        : 'border-slate-800 bg-slate-950 text-slate-600'
                    }`}
                  >
                    {getIcon(def.iconName, 'w-5 h-5')}
                    {isUnlocked && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                    )}
                    {!isUnlocked && (
                      <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-slate-800 text-slate-500 border border-slate-700 flex items-center justify-center">
                        <Lock className="w-2.5 h-2.5" />
                      </div>
                    )}
                  </div>

                  {/* Title & Info */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-bold ${isUnlocked ? 'text-white' : 'text-slate-300'}`}>
                        {def.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase border ${rarity.badge}`}
                      >
                        {rarity.label}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 font-bold">
                        +{def.pointsReward} PTS
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                      {def.description}
                    </p>

                    {/* Progress Bar within item */}
                    <div className="mt-2 flex items-center gap-2">
                      <div className="w-28 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            isUnlocked ? 'bg-emerald-400' : 'bg-cyan-500'
                          }`}
                          style={{ width: `${currentPercent}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        {Math.min(currentVal, def.target)} / {def.target} ({currentPercent}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action / Status */}
                <div className="shrink-0 flex flex-col items-end">
                  {isUnlocked && !hasClaimed ? (
                    <button
                      onClick={(e) => handleClaim(def.id, e)}
                      className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-mono text-xs font-extrabold uppercase shadow-[0_0_15px_rgba(245,158,11,0.5)] active:scale-95 transition-transform flex items-center gap-1 cursor-pointer animate-pulse"
                    >
                      <Gift className="w-3.5 h-3.5" />
                      <span>CLAIM</span>
                    </button>
                  ) : isUnlocked && hasClaimed ? (
                    <div className="flex items-center gap-1 text-[11px] font-mono font-bold text-emerald-400 px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                      <Check className="w-3.5 h-3.5" />
                      <span>CLAIMED</span>
                    </div>
                  ) : (
                    <div className="text-[10px] font-mono text-slate-500 px-2 py-1 rounded bg-slate-900 border border-slate-800">
                      LOCKED
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
