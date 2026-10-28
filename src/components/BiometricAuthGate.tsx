import React, { useState, useEffect } from 'react';
import { Fingerprint, Lock, Check, RefreshCw, ArrowRight } from 'lucide-react';
import { triggerHaptic } from '../utils/telegram';
import { playSound } from '../utils/audio';
import { verifyBiometricFingerprint } from '../utils/adminAuth';
import { syncHunterToService } from '../lib/api';

interface BiometricAuthGateProps {
  onAuthenticated: (biometricHash: string) => void;
  telegramUser?: { id: number; username?: string; first_name?: string } | null;
  elzrCollected: number;
  totalPoints: number;
}

export const BiometricAuthGate: React.FC<BiometricAuthGateProps> = ({
  onAuthenticated,
  telegramUser,
  elzrCollected,
  totalPoints,
}) => {
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>('SCANNING DEVICE SIGNATURE FOR BIOMETRIC MATCH...');
  const [authSuccess, setAuthSuccess] = useState<boolean>(false);
  const [biometricHash, setBiometricHash] = useState<string>(() => {
    return localStorage.getItem('elzr_biometric_hash') || '';
  });

  // Pre-initialize Telegram native BiometricManager on gate mount
  useEffect(() => {
    const tgBio = (window as any).Telegram?.WebApp?.BiometricManager;
    if (tgBio && typeof tgBio.init === 'function' && !tgBio.isInited) {
      try {
        tgBio.init(() => {
          if (tgBio.isBiometricAvailable) {
            setStatusMessage('BIOMETRIC FINGERPRINT READY. TAP UNLOCK ENTRY.');
          }
        });
      } catch (e) {
        console.debug('BiometricManager init error:', e);
      }
    }
  }, []);

  const handleStartBiometricAuth = async () => {
    triggerHaptic('heavy');
    playSound.buttonClick();
    setIsAuthenticating(true);
    setStatusMessage('SCANNING FINGERPRINT SENSOR...');

    try {
      const isVerified = await verifyBiometricFingerprint();
      if (isVerified) {
        let hash = localStorage.getItem('elzr_admin_biometric_id');
        if (!hash) {
          hash = `BIO_${Date.now()}_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
          localStorage.setItem('elzr_admin_biometric_id', hash);
        }
        localStorage.setItem('elzr_biometric_hash', hash);
        setBiometricHash(hash);
        setAuthSuccess(true);
        triggerHaptic('success');
        playSound.streakMilestone();

        // Sync Biometric Hash ID to Service
        if (telegramUser?.id) {
          syncHunterToService({
            telegram_id: telegramUser.id,
            username: telegramUser.username,
            first_name: telegramUser.first_name,
            biometric_hash_id: hash,
            elzr_balance: elzrCollected,
            energy: 100,
            score: totalPoints,
          });
        }

        setStatusMessage('BIOMETRIC MATCH CONFIRMED. ACCESS GRANTED!');

        setTimeout(() => {
          onAuthenticated(hash);
        }, 800);
      } else {
        triggerHaptic('error');
        setStatusMessage('AUTHENTICATION FAILED. TAP BELOW TO RETRY.');
        setIsAuthenticating(false);
      }
    } catch (err: any) {
      console.warn('Biometric Auth Gate error:', err);
      setStatusMessage('FINGERPRINT SENSOR ERROR. PLEASE RETRY.');
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#020610] text-slate-100 flex flex-col items-center justify-between py-12 px-6 select-none overflow-y-auto animate-in fade-in duration-300">
      {/* Subtle Background Glow & Radial Grid */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Branding Section */}
      <div className="flex flex-col items-center text-center mt-4">
        <span className="text-[11px] font-mono font-bold tracking-[0.3em] text-cyan-400 uppercase mb-2">
          SECURE GATEWAY
        </span>
        <h1 className="text-4xl font-black text-white tracking-wider font-sans uppercase">
          ELIEZER GO
        </h1>
      </div>

      {/* Center Squircle Biometric Fingerprint Container */}
      <div className="my-auto flex flex-col items-center justify-center">
        <button
          onClick={handleStartBiometricAuth}
          disabled={isAuthenticating || authSuccess}
          className={`relative w-44 h-44 rounded-[42px] bg-[#081526] border border-[#162b48] flex items-center justify-center shadow-[0_20px_50px_rgba(0,0,0,0.8)] transition-all cursor-pointer ${
            authSuccess
              ? 'border-emerald-400/80 shadow-[0_0_40px_rgba(16,185,129,0.4)]'
              : 'hover:border-cyan-400/80 hover:shadow-[0_0_40px_rgba(0,240,255,0.3)] active:scale-95'
          }`}
        >
          {/* Subtle Inner Glow */}
          <div className="absolute inset-0 rounded-[42px] bg-gradient-to-b from-cyan-500/5 to-transparent pointer-events-none" />

          {authSuccess ? (
            <Check className="w-20 h-20 text-emerald-400 stroke-[2.5] animate-in zoom-in-75 duration-200" />
          ) : isAuthenticating ? (
            <RefreshCw className="w-16 h-16 animate-spin text-cyan-400" />
          ) : (
            <Fingerprint className="w-20 h-20 text-cyan-400/90 stroke-[1.8]" />
          )}
        </button>

        {/* Status Message Text */}
        <div className="mt-8 text-center max-w-xs px-2">
          <h2 className="text-xs font-mono font-extrabold tracking-[0.2em] text-white uppercase mb-2">
            {authSuccess ? 'AUTHENTICATION SUCCESSFUL' : 'AUTHENTICATION REQUIRED'}
          </h2>
          <p className="text-[10px] font-mono tracking-wider text-slate-400 uppercase leading-relaxed min-h-[28px]">
            {statusMessage}
          </p>
        </div>
      </div>

      {/* Bottom Action Area */}
      <div className="w-full max-w-xs flex flex-col items-center gap-3 mb-2">
        <button
          onClick={handleStartBiometricAuth}
          disabled={isAuthenticating || authSuccess}
          className="w-full py-4 rounded-[28px] bg-white hover:bg-slate-100 text-slate-950 font-black text-xs font-mono tracking-[0.15em] uppercase flex items-center justify-center gap-2.5 shadow-[0_0_30px_rgba(255,255,255,0.25)] active:scale-95 transition-all cursor-pointer"
        >
          {authSuccess ? (
            <Check className="w-4 h-4 text-emerald-600 stroke-[3]" />
          ) : (
            <Lock className="w-4 h-4 text-slate-950 stroke-[2.5]" />
          )}
          <span>{authSuccess ? 'ENTRY UNLOCKED' : 'UNLOCK ENTRY'}</span>
        </button>

        {biometricHash && !authSuccess && (
          <button
            onClick={() => onAuthenticated(biometricHash)}
            className="text-[10px] font-mono text-slate-500 hover:text-cyan-400 flex items-center gap-1 transition-colors pt-1"
          >
            <span>Continue with existing session</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}

        {/* Footer Subtext */}
        <p className="text-[9px] font-mono text-slate-500/80 tracking-widest uppercase mt-4 text-center">
          TELEGRAM NATIVE PROTOCOL V7.0 · GLOBAL BIOMETRIC ENABLED
        </p>
      </div>
    </div>
  );
};
