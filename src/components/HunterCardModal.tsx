import React, { useState, useEffect, useRef } from 'react';
import { X, Share2, Download, Copy, Check, Sparkles, Send, Flame, RefreshCw, Image as ImageIcon } from 'lucide-react';
import { CardTheme, CardRatio, generateHunterStatusCard } from '../utils/cardGenerator';
import { triggerHaptic, openTelegramShare, shareHunterStatusStory } from '../utils/telegram';
import { playSound } from '../utils/audio';

interface HunterCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  elzrCount: number;
  city: string;
  points: number;
  referralCode: string;
  streak: number;
}

export const HunterCardModal: React.FC<HunterCardModalProps> = ({
  isOpen,
  onClose,
  username,
  elzrCount,
  city,
  points,
  referralCode,
  streak,
}) => {
  const [theme, setTheme] = useState<CardTheme>('cyan');
  const [ratio, setRatio] = useState<CardRatio>('story');
  const [cardDataUrl, setCardDataUrl] = useState<string | null>(null);
  const [cardBlob, setCardBlob] = useState<Blob | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);
  const [storySharedSuccess, setStorySharedSuccess] = useState<boolean>(false);

  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // Re-generate card whenever theme, ratio, or metrics change
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setIsGenerating(true);

    generateHunterStatusCard({
      username: username || 'hunter',
      elzrCount,
      city: city || 'Gersthofen',
      points,
      referralCode,
      streak,
      theme,
      ratio,
    })
      .then((res) => {
        if (isMounted) {
          setCardDataUrl(res.dataUrl);
          setCardBlob(res.blob);
          setIsGenerating(false);
        }
      })
      .catch((err) => {
        console.error('Failed to generate hunter card:', err);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, theme, ratio, username, elzrCount, city, points, referralCode, streak]);

  if (!isOpen) return null;

  const handleDownload = async () => {
    triggerHaptic('medium');
    playSound.buttonClick();

    const fileName = `Eliezer_Go_${username || 'hunter'}_${Date.now()}.png`;

    // 1. Try Mobile Web Share API with file (Opens native sheet with "Save Image" option on iOS/Android)
    if (cardBlob && typeof navigator !== 'undefined' && navigator.canShare && navigator.share) {
      try {
        const file = new File([cardBlob], fileName, { type: 'image/png' });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: 'Eliezer Go Hunter Card',
            text: `Eliezer Go - ${username || 'hunter'} Status Card`,
          });
          setDownloadSuccess(true);
          setTimeout(() => setDownloadSuccess(false), 3000);
          return;
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          // User canceled share sheet, return silently
          return;
        }
        console.warn('Web Share failed, using download link fallback:', err);
      }
    }

    // 2. Standard Blob Download for Desktop / standard browsers
    if (cardBlob) {
      const url = URL.createObjectURL(cardBlob);
      const link = document.createElement('a');
      link.download = fileName;
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 10000);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
      return;
    }

    // 3. Data URL Fallback
    if (cardDataUrl) {
      const link = document.createElement('a');
      link.download = fileName;
      link.href = cardDataUrl;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    }
  };

  const handleCopyLink = () => {
    triggerHaptic('light');
    playSound.buttonClick();
    const shareText = `🎯 Check out my Hunter Status on Eliezer Go!\n⚡ ${elzrCount} ELZR Coins Collected\n🏆 ${points} PTS · ${streak} Day Streak\nJoin with my invite code: ${referralCode}\nhttps://t.me/ELZR_Hunt_bot/eliezergo?startapp=${referralCode}`;
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareToTelegramChat = () => {
    triggerHaptic('medium');
    playSound.buttonClick();

    const shareText = `🎯 Check out my Hunter Status on Eliezer Go!\n⚡ ${elzrCount} ELZR Coins Collected in ${city}\n🏆 ${points} Points · ${streak} Day Streak\nJoin the hunt using my invite code: ${referralCode}`;
    const botUrl = `https://t.me/ELZR_Hunt_bot/eliezergo?startapp=${referralCode}`;

    openTelegramShare(shareText, botUrl);
  };

  const handleShareToTelegramStory = () => {
    triggerHaptic('heavy');
    playSound.coinCollected();

    const caption = `Hunting real AR crypto coins on Eliezer Go! 🚀 (${elzrCount} ELZR collected in ${city})`;
    const botUrl = `https://t.me/ELZR_Hunt_bot/eliezergo?startapp=${referralCode}`;

    if (cardDataUrl) {
      const success = shareHunterStatusStory(cardDataUrl, caption, botUrl);
      if (success) {
        setStorySharedSuccess(true);
        setTimeout(() => setStorySharedSuccess(false), 3000);
        return;
      }
    }

    // Fallback: auto-download card image so user can upload to story, and open share link
    handleDownload();
    handleShareToTelegramChat();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="w-full max-w-md bg-[#0a1628] border-t sm:border border-[#142640] rounded-t-[32px] sm:rounded-[32px] p-5 shadow-2xl relative overflow-hidden max-h-[92vh] flex flex-col">
        {/* Glow */}
        <div className="absolute top-0 left-1/3 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#142640]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md">
              <Share2 className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-sans">
                Hunter Status Card
              </h2>
              <p className="text-[11px] font-mono text-cyan-400">
                Share directly to Telegram Stories & Chats
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Customization Controls: Theme & Ratio */}
        <div className="flex items-center justify-between my-3 gap-2">
          {/* Theme Color Swatches */}
          <div className="flex items-center gap-1.5 p-1 bg-[#071322] rounded-xl border border-[#142640]">
            {(
              [
                { id: 'cyan', color: '#00f0ff', label: 'Cyan' },
                { id: 'gold', color: '#fbbf24', label: 'Gold' },
                { id: 'ruby', color: '#f43f5e', label: 'Ruby' },
                { id: 'emerald', color: '#10b981', label: 'Gram' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  triggerHaptic('light');
                  setTheme(t.id);
                }}
                title={t.label}
                className={`w-6 h-6 rounded-lg transition-transform flex items-center justify-center ${
                  theme === t.id ? 'scale-110 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                }`}
                style={{ backgroundColor: t.color }}
              >
                {theme === t.id && <Check className="w-3.5 h-3.5 text-slate-950 stroke-[3]" />}
              </button>
            ))}
          </div>

          {/* Ratio switch (Story vs Post) */}
          <div className="flex items-center bg-[#071322] border border-[#142640] p-1 rounded-xl">
            <button
              onClick={() => {
                triggerHaptic('light');
                setRatio('story');
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                ratio === 'story'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              STORY (9:16)
            </button>
            <button
              onClick={() => {
                triggerHaptic('light');
                setRatio('post');
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                ratio === 'post'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_8px_rgba(6,182,212,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              POST (4:5)
            </button>
          </div>
        </div>

        {/* Live Card Preview Container */}
        <div className="flex-1 flex flex-col items-center justify-center p-2 bg-[#050a14] rounded-2xl border border-slate-800/80 overflow-hidden relative min-h-[260px] max-h-[380px]">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-2 text-cyan-400 font-mono text-xs">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span>GENERATING HD STATUS CARD...</span>
            </div>
          ) : cardDataUrl ? (
            <div className="relative max-h-full flex flex-col items-center justify-center overflow-hidden">
              <img
                src={cardDataUrl}
                alt="Hunter Status Card Preview"
                className="max-h-[280px] sm:max-h-[300px] w-auto object-contain rounded-xl shadow-2xl border border-white/10 select-auto pointer-events-auto"
                style={{ WebkitTouchCallout: 'default', userSelect: 'auto' }}
              />
              <p className="mt-1.5 text-[10px] text-cyan-400/80 font-mono text-center flex items-center justify-center gap-1">
                <ImageIcon className="w-3 h-3 text-cyan-400" />
                <span>Press & hold card image to Save Image</span>
              </p>
            </div>
          ) : null}

          {/* Success Story / Download Notification */}
          {(storySharedSuccess || downloadSuccess) && (
            <div className="absolute inset-x-4 top-4 z-20 flex justify-center animate-bounce">
              <div className="bg-emerald-500 text-slate-950 font-bold px-3 py-1.5 rounded-xl text-xs font-mono flex items-center gap-1.5 shadow-lg">
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{storySharedSuccess ? 'SHARED TO TELEGRAM STORY!' : 'SAVED / SHARE SHEET OPENED!'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Sharing Buttons */}
        <div className="space-y-2 mt-3 pt-1">
          {/* Main Action: Share to Telegram Story */}
          <button
            onClick={handleShareToTelegramStory}
            disabled={isGenerating}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 font-extrabold text-xs font-mono tracking-wider uppercase flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(0,229,255,0.35)] active:scale-95 transition-all cursor-pointer hover:brightness-110"
          >
            <Sparkles className="w-4 h-4" />
            <span>SHARE TO TELEGRAM STORY</span>
          </button>

          {/* Secondary Buttons Row: Send to Chat & Download */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleShareToTelegramChat}
              disabled={isGenerating}
              className="py-2.5 px-2 rounded-xl bg-[#0e243d] border border-cyan-500/40 text-cyan-300 font-mono font-bold text-[11px] uppercase flex items-center justify-center gap-1.5 hover:bg-[#122e4e] active:scale-95 transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5 -rotate-45" />
              <span>SEND CHAT</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={isGenerating}
              className="py-2.5 px-2 rounded-xl bg-[#081220] border border-[#162a47] text-slate-300 hover:text-white font-mono font-bold text-[11px] uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>SAVE PNG</span>
            </button>

            <button
              onClick={handleCopyLink}
              disabled={isGenerating}
              className="py-2.5 px-2 rounded-xl bg-[#081220] border border-[#162a47] text-slate-300 hover:text-white font-mono font-bold text-[11px] uppercase flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'COPIED' : 'COPY'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
