import React, { useState, useEffect } from 'react';
import { X, Flame, CheckCircle2, Lock, Gift, Sparkles, Clock, Volume2, VolumeX } from 'lucide-react';
import { STREAK_TIERS, calculateStreakStatus, StreakTier } from '../utils/dailyRewards';
import { triggerHaptic } from '../utils/telegram';
import { soundManager, playSound } from '../utils/audio';
import confetti from 'canvas-confetti';

interface DailyCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  dailyCheckIn: {
    currentStreak: number;
    lastCheckInDate: string | null;
    totalCheckIns: number;
  };
  onClaimDailyReward: (reward: StreakTier) => void;
}

export const DailyCheckInModal: React.FC<DailyCheckInModalProps> = ({
  isOpen,
  onClose,
  dailyCheckIn,
  onClaimDailyReward,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(() => soundManager.isMuted());

  useEffect(() => {
    return soundManager.subscribe((state) => {
      setIsMuted(state.isMuted);
    });
  }, []);

  if (!isOpen) return null;

  const status = calculateStreakStatus(dailyCheckIn);
  const { isClaimedToday, currentStreak, targetDayIndex, nextReward, timeUntilMidnight } = status;

  const handleClaim = () => {
    if (isClaimedToday) return;

    triggerHaptic('heavy');
    // Trigger rich celebratory check-in sound (jackpot fanfare for Day 7)
    playSound.dailyCheckIn(Boolean(nextReward.isJackpot));

    // Celebration Confetti
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#fbbf24', '#10b981', '#f43f5e', '#ffffff'],
    });

    onClaimDailyReward(nextReward);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#0a1628] border-t sm:border border-[#142640] rounded-t-[32px] sm:rounded-[32px] p-6 shadow-2xl relative overflow-hidden max-h-[92vh] overflow-y-auto">
        {/* Glow Effect */}
        <div className="absolute top-0 right-1/4 w-52 h-52 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#142640]">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-yellow-400 flex items-center justify-center text-slate-950 font-black shadow-[0_0_15px_rgba(245,158,11,0.4)]">
              <Flame className="w-6 h-6 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-sans">
                  Daily Check-in
                </h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  {currentStreak} DAY STREAK
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Log in every consecutive day for bigger rewards!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                triggerHaptic('light');
                soundManager.toggleMute();
              }}
              title={isMuted ? 'Unmute Sound' : 'Mute Sound'}
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-slate-500" />
              ) : (
                <Volume2 className="w-4 h-4 text-cyan-400" />
              )}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                playSound.buttonClick();
                onClose();
              }}
              className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Day Rewards Grid */}
        <div className="grid grid-cols-4 gap-2.5 my-5">
          {STREAK_TIERS.map((tier) => {
            const isCompleted = isClaimedToday
              ? tier.day <= targetDayIndex
              : tier.day < targetDayIndex;
            const isCurrent = !isClaimedToday && tier.day === targetDayIndex;
            const isLocked = !isCompleted && !isCurrent;

            return (
              <div
                key={tier.day}
                className={`relative rounded-2xl p-2.5 flex flex-col items-center text-center transition-all ${
                  tier.isJackpot ? 'col-span-2' : 'col-span-1'
                } ${
                  isCurrent
                    ? 'bg-gradient-to-b from-[#0f2d4a] to-[#091b2e] border-2 border-cyan-400 shadow-[0_0_18px_rgba(0,229,255,0.3)] scale-[1.03]'
                    : isCompleted
                    ? 'bg-[#081322] border border-emerald-500/40 opacity-80'
                    : 'bg-[#081220] border border-[#142640] opacity-60'
                }`}
              >
                {/* Day label */}
                <span className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-1">
                  {tier.label}
                </span>

                {/* Coin Icon / Graphic */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center my-1 ${
                    tier.isJackpot
                      ? 'bg-amber-400 text-slate-950 shadow-[0_0_10px_#f59e0b]'
                      : isCompleted
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : isCurrent
                      ? 'bg-cyan-400/20 text-cyan-300'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  ) : isLocked ? (
                    <Lock className="w-4 h-4 text-slate-500" />
                  ) : tier.isJackpot ? (
                    <Gift className="w-5 h-5 text-slate-950 animate-bounce" />
                  ) : (
                    <Sparkles className="w-4 h-4 text-cyan-400" />
                  )}
                </div>

                {/* ELZR Reward */}
                <span
                  className={`text-xs font-mono font-black ${
                    isCurrent ? 'text-cyan-300' : tier.isJackpot ? 'text-amber-400' : 'text-white'
                  }`}
                >
                  +{tier.elzr} ELZR
                </span>

                {/* Completed badge banner */}
                {isCompleted && (
                  <div className="absolute top-1 right-1 text-[8px] font-bold text-emerald-400">
                    ✓
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Streak Info Callout */}
        <div className="p-3.5 rounded-2xl bg-[#081220] border border-[#162a47] flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            <span className="text-xs font-mono text-slate-300">
              {isClaimedToday ? 'Next check-in resets in:' : 'Reward available now!'}
            </span>
          </div>

          <span className="text-xs font-mono font-bold text-cyan-400">
            {isClaimedToday
              ? `${timeUntilMidnight.hours}h ${timeUntilMidnight.minutes}m`
              : 'READY TO CLAIM'}
          </span>
        </div>

        {/* Main Claim Button */}
        <button
          onClick={handleClaim}
          disabled={isClaimedToday}
          className={`w-full py-4 px-6 rounded-2xl font-bold font-mono tracking-wider text-xs uppercase flex items-center justify-center gap-2 transition-all ${
            isClaimedToday
              ? 'bg-[#081220] border border-[#162a47] text-slate-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 shadow-[0_0_25px_rgba(245,158,11,0.4)] active:scale-95 cursor-pointer hover:brightness-110'
          }`}
        >
          {isClaimedToday ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>CLAIMED FOR TODAY (COME BACK TOMORROW)</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Gift className="w-4 h-4 text-slate-950" />
              <span>
                CLAIM DAY {targetDayIndex}
              </span>
            </div>
          )}
        </button>
      </div>
    </div>
  );
};
