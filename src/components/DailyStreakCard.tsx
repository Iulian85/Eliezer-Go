import React from 'react';
import { Flame, Gift, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { calculateStreakStatus } from '../utils/dailyRewards';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';

interface DailyStreakCardProps {
  dailyCheckIn: {
    currentStreak: number;
    lastCheckInDate: string | null;
    totalCheckIns: number;
  };
  onOpenModal: () => void;
}

export const DailyStreakCard: React.FC<DailyStreakCardProps> = ({ dailyCheckIn, onOpenModal }) => {
  const status = calculateStreakStatus(dailyCheckIn);
  const { isClaimedToday, currentStreak, targetDayIndex, nextReward, timeUntilMidnight } = status;

  const handleClick = () => {
    triggerHaptic('light');
    playSound.buttonClick();
    onOpenModal();
  };

  return (
    <div
      onClick={handleClick}
      className="w-full bg-[#0a1628] border border-[#142640] hover:border-cyan-500/40 rounded-3xl p-5 shadow-lg relative overflow-hidden transition-all active:scale-[0.99] cursor-pointer group"
    >
      {/* Background glow when reward is ready to claim */}
      {!isClaimedToday && (
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/15 rounded-full blur-2xl pointer-events-none animate-pulse" />
      )}

      <div className="flex items-center justify-between">
        {/* Left info */}
        <div className="flex items-center gap-3">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
              isClaimedToday
                ? 'bg-[#081829] border border-emerald-500/30 text-emerald-400'
                : 'bg-gradient-to-tr from-amber-500 to-yellow-400 text-slate-950 shadow-[0_0_15px_rgba(245,158,11,0.35)]'
            }`}
          >
            {isClaimedToday ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <Flame className="w-6 h-6 fill-slate-950 animate-pulse" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold uppercase tracking-wider text-amber-400">
                DAILY STREAK
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300">
                {currentStreak} DAYS
              </span>
            </div>

            <div className="text-sm font-extrabold text-white mt-0.5 flex items-center gap-1.5">
              {isClaimedToday ? (
                <span className="text-emerald-400 text-xs font-mono">
                  ✓ Claimed today · Next in {timeUntilMidnight.hours}h {timeUntilMidnight.minutes}m
                </span>
              ) : (
                <span className="text-slate-100 flex items-center gap-1">
                  <span>Day {targetDayIndex}:</span>
                  <span className="text-cyan-300 font-mono">+{nextReward.elzr} ELZR</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right Action Button / Badge */}
        <div>
          {isClaimedToday ? (
            <div className="w-8 h-8 rounded-full bg-[#081220] border border-slate-800 flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
              <ChevronRight className="w-4 h-4" />
            </div>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClick();
              }}
              className="py-2 px-3.5 rounded-xl bg-gradient-to-r from-amber-400 to-cyan-400 text-slate-950 text-xs font-mono font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-[0_0_12px_rgba(245,158,11,0.3)] animate-bounce"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>CLAIM</span>
            </button>
          )}
        </div>
      </div>

      {/* Mini Streak Progress Bar (7 circles) */}
      <div className="grid grid-cols-7 gap-1.5 mt-3 pt-3 border-t border-[#142640]/60">
        {[1, 2, 3, 4, 5, 6, 7].map((dayNum) => {
          const isDone = isClaimedToday
            ? dayNum <= targetDayIndex
            : dayNum < targetDayIndex;
          const isCurrentDay = !isClaimedToday && dayNum === targetDayIndex;

          return (
            <div
              key={dayNum}
              className={`h-1.5 rounded-full transition-all ${
                isDone
                  ? 'bg-emerald-400 shadow-[0_0_4px_#34d399]'
                  : isCurrentDay
                  ? 'bg-amber-400 shadow-[0_0_6px_#fbbf24] animate-pulse'
                  : 'bg-slate-800'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
};
