import React, { useState } from 'react';
import { UserState } from '../types';
import { Users, Copy, Share2, Zap, CheckCircle2, Gift, Sparkles } from 'lucide-react';
import { triggerHaptic, getTelegramWebApp } from '../utils/telegram';
import { playSound } from '../utils/audio';

interface FrensTabProps {
  userState: UserState;
  onActivateCode: (code: string) => boolean;
  onOpenHunterCard?: () => void;
}

export const FrensTab: React.FC<FrensTabProps> = ({ userState, onActivateCode, onOpenHunterCard }) => {
  const [frenCodeInput, setFrenCodeInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [activationError, setActivationError] = useState<string | null>(null);

  const inviteCode = userState.referral.code;
  const inviteLink = `https://t.me/ELZR_Hunt_bot/eliezergo?startapp=${inviteCode}`;

  const handleCopy = () => {
    triggerHaptic('light');
    playSound.buttonClick();
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    triggerHaptic('medium');
    playSound.buttonClick();

    const shareText = `Join me on Eliezer Go! Hunt real AR crypto coins with your camera and connect your TON/GRAM wallet. Use my invite code: ${inviteCode}`;
    const shareUrl = `https://t.me/share/url?url=${encodeURIComponent(inviteLink)}&text=${encodeURIComponent(shareText)}`;

    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(shareUrl);
    } else if (navigator.share) {
      navigator.share({
        title: 'Eliezer Go - AR Crypto Hunt',
        text: shareText,
        url: inviteLink,
      }).catch(() => {});
    } else {
      window.open(shareUrl, '_blank');
    }
  };

  const handleActivate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!frenCodeInput.trim()) return;

    if (frenCodeInput.trim().toUpperCase() === inviteCode.toUpperCase()) {
      setActivationError("You cannot activate your own code!");
      triggerHaptic('warning');
      return;
    }

    const success = onActivateCode(frenCodeInput.trim().toUpperCase());
    if (success) {
      triggerHaptic('success');
      playSound.coinCollected();
      setFrenCodeInput('');
      setActivationError(null);
    } else {
      setActivationError('Already activated a code');
      triggerHaptic('warning');
    }
  };

  return (
    <div className="flex flex-col px-4 pt-6 pb-28 max-w-md mx-auto space-y-4">
      {/* Top Header */}
      <div>
        <div className="text-xs font-bold text-cyan-400 tracking-wider uppercase font-mono mb-1">
          FRENS NETWORK
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight font-sans">
          Grow the hunt crew
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Invite friends, activate rewards, and track referral points.
        </p>
      </div>

      {/* Main Card: Invite Code */}
      <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-[#0f2a4a] border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Users className="w-4 h-4" />
          </div>
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400">
            Invite code
          </span>
        </div>

        <div className="text-3xl font-extrabold text-white tracking-wider my-3 font-mono">
          {inviteCode}
        </div>

        {/* Buttons Row: Copy & Share */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <button
            onClick={handleCopy}
            className="py-3 px-4 rounded-full bg-white text-slate-950 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer hover:bg-slate-100"
          >
            <Copy className="w-4 h-4" />
            <span className="font-mono">{copied ? 'COPIED!' : 'Copy'}</span>
          </button>

          <button
            onClick={handleShare}
            className="py-3 px-4 rounded-full bg-white text-slate-950 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-md active:scale-95 transition-all cursor-pointer hover:bg-slate-100"
          >
            <Share2 className="w-4 h-4" />
            <span className="font-mono">Share</span>
          </button>
        </div>

        {onOpenHunterCard && (
          <button
            onClick={() => {
              triggerHaptic('medium');
              onOpenHunterCard();
            }}
            className="w-full mt-3 py-2.5 px-4 rounded-full bg-cyan-950/60 border border-cyan-500/40 text-cyan-300 font-mono font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:bg-cyan-900/60 active:scale-95 transition-all cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>Generate Story Status Card</span>
          </button>
        )}
      </div>

      {/* Row: Active Frens & Referral PTS */}
      <div className="grid grid-cols-2 gap-3.5">
        {/* Left: Active frens */}
        <div className="bg-[#0a1628] border border-[#142640] rounded-3xl p-5 shadow-lg">
          <div className="w-8 h-8 rounded-full bg-[#0f2a4a] border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-2">
            <Users className="w-4 h-4" />
          </div>
          <div className="text-xs font-medium text-slate-300">Active frens</div>
          <div className="text-4xl font-extrabold text-white tracking-tight my-1">
            {userState.referral.activeFrens}
          </div>
        </div>

        {/* Right: Referral PTS */}
        <div className="bg-[#0a1628] border border-[#142640] rounded-3xl p-5 shadow-lg">
          <div className="w-8 h-8 rounded-full bg-[#0e3328] border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-2">
            <Zap className="w-4 h-4 fill-emerald-400" />
          </div>
          <div className="text-xs font-medium text-slate-300">Referral PTS</div>
          <div className="text-4xl font-extrabold text-white tracking-tight my-1">
            {userState.referral.referralPts}
          </div>
        </div>
      </div>

      {/* Card: Activation */}
      <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-6 shadow-2xl relative">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-7 h-7 rounded-full bg-[#0e3328] border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <span className="text-base font-bold text-white">Activation</span>
        </div>
        <p className="text-xs text-slate-400 mb-4 pl-9">
          {userState.referral.hasActivatedCode
            ? `Activated with code: ${userState.referral.activatedCode}`
            : 'No invite code activated'}
        </p>

        {/* Welcome Bonus Banner */}
        <div className="w-full rounded-2xl bg-gradient-to-r from-[#2e2309] to-[#3a2c07] border border-amber-500/40 p-3.5 flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold text-amber-300 tracking-wide">
              Welcome bonus
            </span>
          </div>
          <span className="text-sm font-extrabold text-amber-400 font-mono">
            +500 PTS
          </span>
        </div>

        {/* Form to enter fren code */}
        {!userState.referral.hasActivatedCode ? (
          <form onSubmit={handleActivate} className="space-y-3">
            <input
              type="text"
              value={frenCodeInput}
              onChange={(e) => setFrenCodeInput(e.target.value)}
              placeholder="Enter fren code"
              className="w-full px-4 py-3.5 rounded-2xl bg-[#081220] border border-[#162a47] text-white text-sm placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors uppercase font-mono"
            />

            {activationError && (
              <p className="text-xs text-rose-400 font-mono">{activationError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-400 to-cyan-500 text-slate-950 font-bold text-xs tracking-wider uppercase flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all cursor-pointer font-mono"
            >
              <span>Activate invite code</span>
            </button>
          </form>
        ) : (
          <div className="py-2.5 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono text-center">
            ✓ Bonus claimed (+500 PTS added to your wallet)
          </div>
        )}
      </div>

      {/* Bottom Section: Activated frens header */}
      <div className="flex items-center justify-between px-2 pt-2">
        <span className="text-sm font-bold text-white">Activated frens</span>
        <span className="text-xs font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-500/30">
          +100 PTS each
        </span>
      </div>
    </div>
  );
};
