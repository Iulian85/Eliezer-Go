import React, { useState, useEffect, useRef } from 'react';
import { X, Camera, Scan, Sparkles, CheckCircle2, MapPin, Trophy, RefreshCw, Eye } from 'lucide-react';
import confetti from 'canvas-confetti';
import { LandmarkLocation, generateLandmarks } from '../utils/nearbyHunters';
import { playSound } from '../utils/audio';
import { triggerHaptic } from '../utils/telegram';

interface SmartScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
  onRewardCoins: (amount: number, landmarkName: string) => void;
}

export const SmartScanModal: React.FC<SmartScanModalProps> = ({
  isOpen,
  onClose,
  userLat,
  userLng,
  onRewardCoins,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [landmarks, setLandmarks] = useState<LandmarkLocation[]>(() =>
    generateLandmarks(userLat, userLng)
  );
  const [detectedLandmark, setDetectedLandmark] = useState<LandmarkLocation | null>(null);
  const [scanResult, setScanResult] = useState<{ name: string; bonus: number } | null>(null);

  // Initialize camera preview
  useEffect(() => {
    if (!isOpen) return;

    let stream: MediaStream | null = null;
    async function startCamera() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: { ideal: 'environment' } },
            audio: false,
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
            setHasCamera(true);
          }
        }
      } catch (e) {
        console.warn('Camera access fallback for Smart Scan:', e);
        setHasCamera(false);
      }
    }

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Execute AI Neural Landmark Analysis simulation
  const handleStartScan = () => {
    if (isScanning) return;
    setIsScanning(true);
    setScanProgress(0);
    setScanResult(null);
    setDetectedLandmark(null);
    playSound.radarPing();
    triggerHaptic('medium');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          finishScan();
          return 100;
        }
        return prev + 10;
      });
    }, 250);
  };

  const finishScan = () => {
    setIsScanning(false);

    // Pick an unscanned landmark, or reset if all scanned
    const unscanned = landmarks.filter((l) => !l.scanned);
    const target = unscanned.length > 0 ? unscanned[0] : landmarks[0];

    setDetectedLandmark(target);
    setScanResult({ name: target.name, bonus: target.bonusCoins });

    // Mark landmark as scanned
    setLandmarks((prev) =>
      prev.map((l) => (l.id === target.id ? { ...l, scanned: true } : l))
    );

    // Reward player
    onRewardCoins(target.bonusCoins, target.name);
    playSound.coinCollected(true);
    triggerHaptic('heavy');

    confetti({
      particleCount: 75,
      spread: 60,
      origin: { y: 0.6 },
      colors: ['#00f0ff', '#38bdf8', '#fbbf24', '#ffffff'],
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/90 backdrop-blur-xl animate-in fade-in select-none">
      <div className="w-full max-w-md bg-[#061120] border border-cyan-500/50 rounded-3xl p-5 shadow-[0_0_50px_rgba(0,229,255,0.25)] flex flex-col max-h-[92vh] overflow-hidden relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#142640]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-400 text-cyan-300 flex items-center justify-center">
              <Scan className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono tracking-wider uppercase">
                SMART AI LANDMARK SCAN
              </h2>
              <div className="text-[10px] font-mono text-cyan-400">
                Landmark Vision Neural Engine
              </div>
            </div>
          </div>

          <button
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Viewfinder Camera Feed & AI Scan Box */}
        <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-slate-950 border border-cyan-500/40 my-3 flex items-center justify-center">
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className={`absolute inset-0 w-full h-full object-cover transition-opacity ${
              hasCamera ? 'opacity-100' : 'opacity-20'
            }`}
          />

          {!hasCamera && (
            <div className="absolute inset-0 bg-[#040a14] opacity-80 flex flex-col items-center justify-center text-slate-400 p-4 text-center">
              <Eye className="w-8 h-8 text-cyan-400 mb-2 animate-bounce" />
              <span className="text-xs font-mono font-bold text-white">AI VISION SIMULATION</span>
              <span className="text-[10px] text-slate-400">Point phone camera toward city landmark</span>
            </div>
          )}

          {/* AI HUD Reticle Grid */}
          <div className="absolute inset-4 border border-cyan-500/30 rounded-xl pointer-events-none flex flex-col justify-between p-2">
            <div className="flex justify-between items-start text-[9px] font-mono text-cyan-400 font-bold">
              <span>[AI-LOCK: ACTIVE]</span>
              <span>GPS: DISCOVERABLE</span>
            </div>

            {/* Sweep Scan Line */}
            {isScanning && (
              <div
                className="w-full h-0.5 bg-cyan-400 shadow-[0_0_15px_#00e5ff] animate-pulse"
                style={{
                  transform: `translateY(${(scanProgress / 100) * 120}px)`,
                }}
              />
            )}

            <div className="flex justify-between items-end text-[9px] font-mono text-cyan-400/80">
              <span>AZIMUTH: 142°</span>
              <span>MAG-SENS: HIGH</span>
            </div>
          </div>
        </div>

        {/* Progress Bar during scan */}
        {isScanning && (
          <div className="w-full my-2 space-y-1">
            <div className="flex justify-between text-[10px] font-mono font-bold text-cyan-300">
              <span>ANALYZING LANDMARK GEOMETRY...</span>
              <span>{scanProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-slate-900 border border-cyan-500/40 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-amber-400 transition-all duration-200"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Success Result Banner */}
        {scanResult && (
          <div className="my-2 p-3.5 rounded-2xl bg-gradient-to-r from-amber-950/80 to-cyan-950/80 border-2 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.3)] animate-in zoom-in-95">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-[0_0_12px_#f59e0b]">
                <Trophy className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <div className="text-xs font-mono font-bold text-amber-300 uppercase">
                  LANDMARK IDENTIFIED!
                </div>
                <div className="text-sm font-extrabold text-white font-sans">
                  {scanResult.name}
                </div>
                <div className="text-xs font-mono font-extrabold text-emerald-400 mt-0.5">
                  +{scanResult.bonus} BONUS ELZR REWARDED!
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Nearby Discoverable Landmarks List */}
        <div className="flex-1 overflow-y-auto space-y-2 max-h-44 my-2 pr-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Nearby High-Value Landmarks</span>
            <span className="text-cyan-400 font-bold">
              {landmarks.filter((l) => l.scanned).length}/{landmarks.length} Discovered
            </span>
          </div>

          {landmarks.map((lm) => (
            <div
              key={lm.id}
              className={`p-2.5 rounded-2xl border transition-all flex items-center justify-between ${
                lm.scanned
                  ? 'bg-[#081729] border-emerald-500/40'
                  : 'bg-[#0a1628] border-[#142640]'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    lm.scanned
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-cyan-500/20 text-cyan-400'
                  }`}
                >
                  {lm.scanned ? <CheckCircle2 className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{lm.name}</span>
                    {lm.scanned && (
                      <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold">
                        SCANNED
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {lm.distanceMeters}m away · {lm.description}
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-extrabold font-mono text-amber-300">
                  +{lm.bonusCoins}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button: Trigger Scan */}
        <button
          onClick={handleStartScan}
          disabled={isScanning}
          className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-500 text-slate-950 font-black font-mono text-xs tracking-wider uppercase shadow-[0_0_20px_rgba(6,182,212,0.4)] active:scale-95 transition-all cursor-pointer hover:brightness-110 flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isScanning ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>SCANNING CITY LANDMARK...</span>
            </>
          ) : (
            <>
              <Camera className="w-4 h-4 text-slate-950" />
              <span>SCAN LANDMARK FOR BONUS COINS</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
