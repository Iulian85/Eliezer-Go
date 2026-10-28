import React, { useState } from 'react';
import { UserState } from '../types';
import { ChevronDown, Power, Wallet, Trophy, Sparkles, Pickaxe, Megaphone, Check, Copy, ExternalLink, LogOut, ShieldCheck, Award, Fingerprint, Lock, ShieldAlert } from 'lucide-react';
import { useTonConnectUI, useTonAddress, useTonWallet } from '@tonconnect/ui-react';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';
import { AchievementsSection } from './AchievementsSection';
import { verifyBiometricFingerprint, setAuthorizedAdminWallet, getIsAdminModeVisible } from '../utils/adminAuth';

interface WalletTabProps {
  userState: UserState;
  onUpdateUserState?: (state: UserState) => void;
  onAdminUnlocked?: () => void;
}

export const WalletTab: React.FC<WalletTabProps> = ({ userState, onUpdateUserState, onAdminUnlocked }) => {
  const [tonConnectUI] = useTonConnectUI();
  const userFriendlyAddress = useTonAddress();
  const wallet = useTonWallet();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [biometricStatusMsg, setBiometricStatusMsg] = useState('');

  // Compute total ELZR points
  const totalPoints =
    userState.points.gameplay +
    userState.points.rareCoins +
    userState.points.eventCoins +
    userState.points.miningRewards +
    userState.points.merchantDrops +
    userState.referral.referralPts;

  const truncateAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  const handleConnectClick = () => {
    triggerHaptic('medium');
    playSound.buttonClick();

    if (userFriendlyAddress) {
      setDropdownOpen(!dropdownOpen);
    } else {
      // Launches the official TON Connect modal dialog
      tonConnectUI.openModal();
    }
  };

  const handleCopyAddress = () => {
    if (!userFriendlyAddress) return;
    triggerHaptic('light');
    navigator.clipboard.writeText(userFriendlyAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleBiometricAdminAuth = async () => {
    triggerHaptic('heavy');
    playSound.streakMilestone();
    setBiometricStatusMsg('WAITING FOR BIOMETRIC SCAN...');

    const success = await verifyBiometricFingerprint();
    if (success) {
      if (userFriendlyAddress) {
        setAuthorizedAdminWallet(userFriendlyAddress);
      }
      setBiometricStatusMsg('✅ BIOMETRIC VERIFIED. AUTHORIZED ACCESS GRANTED.');
      if (onAdminUnlocked) onAdminUnlocked();
      setTimeout(() => setBiometricStatusMsg(''), 4000);
    } else {
      setBiometricStatusMsg('❌ FINGERPRINT AUTHENTICATION FAILED OR CANCELED.');
      setTimeout(() => setBiometricStatusMsg(''), 3000);
    }
  };

  const handleDisconnect = async () => {
    triggerHaptic('medium');
    playSound.buttonClick();
    setDropdownOpen(false);
    await tonConnectUI.disconnect();
  };

  return (
    <div className="flex flex-col px-4 pt-6 pb-28 max-w-md mx-auto space-y-4">
      {/* Top Header Row */}
      <div className="flex items-center justify-between relative">
        <h1 className="text-3xl font-black tracking-tight text-amber-400 font-sans">
          WALLET
        </h1>

        {/* TON Connect Button (Matching screenshot styling, powered by official TonConnect UI) */}
        <div className="relative">
          <button
            onClick={handleConnectClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0a1628] border border-[#142640] text-white text-xs font-mono font-bold tracking-wider hover:border-cyan-500/40 active:scale-95 transition-all shadow-md cursor-pointer"
          >
            {userFriendlyAddress ? (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-cyan-300">{truncateAddress(userFriendlyAddress)}</span>
              </div>
            ) : (
              <span>CONNECT</span>
            )}
            <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Connected Wallet Dropdown Menu */}
          {dropdownOpen && userFriendlyAddress && (
            <div className="absolute right-0 top-10 w-72 bg-[#091322] border border-[#182c47] rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-mono font-bold text-white">
                    {wallet?.device.appName || 'TON Wallet'}
                  </span>
                </div>
                <span className="text-[10px] font-mono text-cyan-400 px-1.5 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                  TonConnect 2.0
                </span>
              </div>

              {/* Address display & copy */}
              <div className="mt-3">
                <div className="text-[10px] font-mono text-slate-400 uppercase">Address</div>
                <div className="flex items-center justify-between mt-1 p-2 rounded-xl bg-[#060b14] border border-slate-800">
                  <span className="text-xs font-mono text-slate-300 truncate max-w-[190px]">
                    {userFriendlyAddress}
                  </span>
                  <button
                    onClick={handleCopyAddress}
                    className="p-1 text-slate-400 hover:text-white"
                    title="Copy Address"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Tonviewer link */}
              <a
                href={`https://tonviewer.com/${userFriendlyAddress}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2.5 flex items-center justify-center gap-1.5 text-[11px] font-mono text-cyan-400 hover:text-cyan-300 py-1.5 rounded-lg bg-cyan-950/30 border border-cyan-500/20"
              >
                <span>View on Tonviewer</span>
                <ExternalLink className="w-3 h-3" />
              </a>

              {/* Disconnect button */}
              <button
                onClick={handleDisconnect}
                className="mt-2.5 w-full flex items-center justify-center gap-1.5 text-xs font-mono text-rose-400 hover:text-rose-300 py-2 rounded-xl bg-rose-950/20 border border-rose-500/30 active:scale-95 transition-all"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Disconnect</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Card: TOTAL ELZR POINTS */}
      <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-8 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Center Circular Wallet Icon (matching screenshot) */}
        <div className="w-20 h-20 rounded-full bg-[#2a220b] border-2 border-amber-500/40 flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
          <div className="w-14 h-14 rounded-full bg-[#3d3110] flex items-center justify-center">
            <Wallet className="w-7 h-7 text-amber-400" />
          </div>
        </div>

        {/* Subtitle */}
        <div className="text-xs font-bold text-slate-400 tracking-widest uppercase font-mono mb-2">
          TOTAL ELZR POINTS
        </div>

        {/* Big Number */}
        <div className="text-6xl font-extrabold text-white tracking-tight my-2 font-sans">
          {totalPoints}
        </div>

        {/* TonConnect status banner */}
        {userFriendlyAddress ? (
          <div className="mt-4 pt-3 border-t border-[#142640] w-full flex items-center justify-center gap-2 text-xs font-mono text-emerald-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>TON CONNECTED ({truncateAddress(userFriendlyAddress)})</span>
          </div>
        ) : (
          <div className="mt-4 pt-3 border-t border-[#142640] w-full flex items-center justify-center gap-2 text-xs font-mono text-slate-400">
            <span>Non-custodial TON & GRAM Connect Protocol</span>
          </div>
        )}
      </div>

      {/* Points Breakdown Section Header */}
      <div className="flex items-center gap-2 pt-2">
        <Power className="w-4 h-4 text-emerald-400" />
        <h2 className="text-lg font-bold text-white font-sans">
          Points Breakdown
        </h2>
      </div>

      {/* Breakdown Card: IN-APP PROGRESS POINTS */}
      <div className="w-full bg-[#0a1628] border border-[#142640] rounded-3xl p-6 shadow-xl space-y-4">
        <div>
          <div className="text-[11px] font-bold text-slate-400 tracking-widest uppercase font-mono mb-1">
            IN-APP PROGRESS POINTS
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Track where your points came from. These totals are game progress, not a token allocation estimate.
          </p>
        </div>

        <div className="h-[1px] bg-[#142640]" />

        {/* Breakdown Items List (Matching exact screenshots) */}
        <div className="space-y-4">
          {/* 1. Gameplay (Urban/Mall) */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <Power className="w-4 h-4 text-cyan-400" />
              <span className="text-sm font-medium">Gameplay (Urban/Mall)</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-white">
              {userState.points.gameplay}
            </span>
          </div>

          {/* 2. Rare Coins (Landmarks) */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <Trophy className="w-4 h-4 text-purple-400" />
              <span className="text-sm font-medium">Rare Coins (Landmarks)</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-white">
              {userState.points.rareCoins}
            </span>
          </div>

          {/* 3. Event Coins */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <Sparkles className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium">Event Coins</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-white">
              {userState.points.eventCoins}
            </span>
          </div>

          {/* 4. Mining Rewards */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <Pickaxe className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-medium">Mining Rewards</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-white">
              {userState.points.miningRewards}
            </span>
          </div>

          {/* 5. Merchant Drops */}
          <div className="flex items-center justify-between text-slate-300">
            <div className="flex items-center gap-3">
              <Megaphone className="w-4 h-4 text-rose-400" />
              <span className="text-sm font-medium">Merchant Drops</span>
            </div>
            <span className="text-sm font-extrabold font-mono text-white">
              {userState.points.merchantDrops}
            </span>
          </div>
        </div>
      </div>

      {/* Hunter Milestones & Badges Showcase */}
      <AchievementsSection
        userState={userState}
        onUpdateUserState={onUpdateUserState || (() => {})}
      />
    </div>
  );
};

