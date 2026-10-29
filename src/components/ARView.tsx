import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { Quaternion, Vector3 } from 'three';
import { deviceCameraQuaternion, VisualPositionFilter, toWorldPosition } from '../utils/arSpatial';
import { GeoCamera } from './GeoCamera';
import { coinEncounterReport } from '../utils/coinEncounter';
import { Canvas } from '@react-three/fiber';
import { Group } from 'three';
import { Coin3D } from './Coin3D';
import { GyroCamera, createCoinFlightPath, AircoinsCoinMotion, CoinFlightPath } from './OriginalCoinFlight';
import { EncounterReport, formatCoinDistance, HUD_UPDATE_MS } from '../utils/encounterDisplay';
import { movingCoinPosition, gameTime } from '../utils/coinMotion';
import { canCollectAt, collectionDistance } from '../utils/collection';
import { subscribeTelegramOrientation } from '../utils/telegramOrientation';
import { soundManager, playSound } from '../utils/audio';
import { triggerHaptic, hideTelegramBackButton, showTelegramBackButton, getTelegramWebApp } from '../utils/telegram';
import confetti from 'canvas-confetti';
import {
  ArrowLeft,
  Camera,
  Compass,
  Volume2,
  VolumeX,
  CheckCircle2,
  Map as MapIcon,
  Navigation,
  Palette,
  Timer,
  AlertTriangle,
  CloudSun,
  CloudRain,
  Snowflake,
  CloudFog,
  CloudLightning,
  Cloud,
  Users,
  Coins,
  MapPin,
  Sparkles,
  Maximize,
  Minimize,
} from 'lucide-react';
import {
  isFullscreen as checkFullscreen,
  toggleFullscreen,
  subscribeFullscreenChange,
} from '../utils/fullscreen';
import { ARCoinTarget, WeatherData, WeatherCondition, AdCampaign } from '../types';
import {
  GeoCoin,
  GeoCoordinate,
  getDistanceMeters,
  getBearingDegrees,
  getCompassDirection,
  getRemainingDurability,
  formatCountdown,
} from '../utils/geo';
import { useCity } from '../utils/useCity';
import { RadarMapOverlay } from './RadarMapOverlay';
import { CoinSkinId, CameraFilterId, COIN_SKINS, CAMERA_FILTERS } from '../utils/skins';
import { CoinSkinsMenu } from './CoinSkinsMenu';
import { WeatherParticles } from './WeatherParticles';
import { WeatherSelectorModal } from './WeatherSelectorModal';
import { fetchLiveWeather, WEATHER_PRESETS } from '../utils/weather';
import {
  fetchCoinDropsFromService,
  markCoinCollectedInService,
} from '../lib/api';

interface ARViewProps {
  onClose: () => void;
  onCoinCollected: (coin: ARCoinTarget) => void;
  initialDistance?: number;
  cityName: string;
  elzrInCity?: number;
  initialStream?: MediaStream | null;
  campaigns?: AdCampaign[];
}

export const ARView: React.FC<ARViewProps> = ({
  onClose,
  onCoinCollected,
  cityName,
  elzrInCity = 10,
  initialStream,
  campaigns,
}) => {

  const nativeOrientationAt = useRef(0);
  const orientationAt = useRef(0);
  const geographicOrientation = useRef(new Quaternion());
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [hasCamera, setHasCamera] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => !soundManager.isMuted());
  const [isCollecting, setIsCollecting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [despawnAlert, setDespawnAlert] = useState<{ name: string; value: number } | null>(null);
  const [isRadarOpen, setIsRadarOpen] = useState<boolean>(false);
  const [, setDurabilityTick] = useState<number>(0);
  const lastWarningSoundRef = useRef<number>(0);
  const originRef = useRef<GeoCoordinate | null>(null);
  const visualFilter = useRef(new VisualPositionFilter());
  const lastGpsTimestamp = useRef(0);
  const [visualCoords, setVisualCoords] = useState<GeoCoordinate | null>(null);
  const positionRef = useRef<GeoCoordinate | null>(null);
  const collectingRef = useRef(false);
  const [hasOrientation, setHasOrientation] = useState(false);
  const lastCompassUpdate = useRef(0);
  const [flight, setFlight] = useState<CoinFlightPath>(() => createCoinFlightPath());
  const [flightReports, setFlightReports] = useState<Record<string, EncounterReport>>({});
  const liveFlightReport = useRef<EncounterReport | null>(null);
  const [savingReward, setSavingReward] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [coinError, setCoinError] = useState<string | null>(null);
  const [gpsTimestamp, setGpsTimestamp] = useState(0);

  // Synchronize soundEnabled with soundManager
  useEffect(() => {
    return soundManager.subscribe((state) => {
      setSoundEnabled(!state.isMuted);
    });
  }, []);

  // Fullscreen State and auto-immersion for AR Camera Mode
  const [isFs, setIsFs] = useState<boolean>(() => checkFullscreen());
  useEffect(() => {
    const unsub = subscribeFullscreenChange((active) => {
      setIsFs(active);
    });
    return () => {
      unsub();
    };
  }, []);

  // 3D Skins & Visual Filters State (Default: 24K Gold Bullion)
  const [activeSkinId, setActiveSkinId] = useState<CoinSkinId>('gold-ton');
  const [activeFilterId, setActiveFilterId] = useState<CameraFilterId>('normal');
  const [isSkinsMenuOpen, setIsSkinsMenuOpen] = useState<boolean>(false);

  // Interactive 3D Compass Navigation Mode ('north-up' vs 'heading-up')
  const [compassMode, setCompassMode] = useState<'north-up' | 'heading-up'>('heading-up');

  // Dynamic Weather System State
  const [weatherData, setWeatherData] = useState<WeatherData>({
    condition: 'clear',
    label: 'Clear Sky',
    temperature: 19,
    windSpeed: 8,
    weatherCode: 0,
    isSimulated: false,
  });
  const [isWeatherSimulated, setIsWeatherSimulated] = useState<boolean>(false);
  const [isWeatherModalOpen, setIsWeatherModalOpen] = useState<boolean>(false);
  const [isLightningFlashing, setIsLightningFlashing] = useState<boolean>(false);
  const liveWeatherRef = useRef<WeatherData | null>(null);

  // User Geolocation Coordinates - dynamically acquired from device GPS
  const [userCoords, setUserCoords] = useState<GeoCoordinate | null>(null);
  const [, setIsGpsReady] = useState<boolean>(false);
  const { city: liveCity, loading: cityLoading } = useCity(userCoords);
  const liveLocationName = liveCity || (!userCoords ? 'Waiting for GPS…' : cityLoading ? 'Finding city…' : 'City unavailable');

  // Fetch real-world weather from Open-Meteo
  useEffect(() => {
    let active = true;
    async function loadWeather() {
      try {
        const lat = userCoords?.latitude ?? 48.4284;
        const lon = userCoords?.longitude ?? 10.8719;
        const live = await fetchLiveWeather(lat, lon);
        if (!active) return;
        liveWeatherRef.current = live;
        if (!isWeatherSimulated) {
          setWeatherData(live);
        }
      } catch (err) {
        console.warn('Weather fetch error:', err);
      }
    }
    loadWeather();
    return () => {
      active = false;
    };
  }, [userCoords?.latitude, userCoords?.longitude, isWeatherSimulated]);

  const handleSelectWeatherPreset = (condition: WeatherCondition) => {
    const preset = WEATHER_PRESETS[condition];
    setIsWeatherSimulated(true);
    setWeatherData({
      condition: preset.id,
      label: preset.label,
      temperature: preset.temperature,
      windSpeed: preset.windSpeed,
      weatherCode: preset.weatherCode,
      isSimulated: true,
    });
  };

  const handleResetLiveWeather = async () => {
    setIsWeatherSimulated(false);
    if (liveWeatherRef.current) {
      setWeatherData(liveWeatherRef.current);
    } else {
      const lat = userCoords?.latitude ?? 48.4284;
      const lon = userCoords?.longitude ?? 10.8719;
      const live = await fetchLiveWeather(lat, lon);
      setWeatherData(live);
    }
  };

  // Active coins loaded strictly from the API (real GPS coordinates)
  const [geoCoins, setGeoCoins] = useState<GeoCoin[]>([]);
  const sessionCollected = useRef(new Set<string>());
  const collectionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (collectionTimer.current) clearTimeout(collectionTimer.current); }, []);
  const [activeCoinId, setActiveCoinId] = useState('');
  const [sensorYaw, setSensorYaw] = useState(0);
  const yaw = sensorYaw;
  const updateCompass = (quaternion: Quaternion) => {
    geographicOrientation.current.copy(quaternion);
    setHasOrientation(true);
    const now = performance.now();
    if (now - lastCompassUpdate.current < HUD_UPDATE_MS) return;
    lastCompassUpdate.current = now;
    const forward = new Vector3(0, 0, -1).applyQuaternion(quaternion);
    setSensorYaw(Math.round((Math.atan2(forward.x, -forward.z) * 180 / Math.PI + 360) % 360) % 360);
  };

  // Authoritative live coins from the API
  useEffect(() => {
    let active = true;
    async function loadCoins() {
      let drops;
      try {
        drops = await fetchCoinDropsFromService(cityName);
        if (!active) return;
        setCoinError(null);
      } catch {
        if (active) { setCoinError('Coins are temporarily unavailable. Retrying...'); setGeoCoins([]); }
        return;
      }
      const userCoords = positionRef.current;

      const mapped: GeoCoin[] = drops.map((drop) => {
        const dist = userCoords
          ? getDistanceMeters(userCoords.latitude, userCoords.longitude, drop.latitude, drop.longitude)
          : 999999;
        const bearing = userCoords
          ? getBearingDegrees(userCoords.latitude, userCoords.longitude, drop.latitude, drop.longitude)
          : 0;

        return {
          id: drop.id,
          name: drop.name,
          landmark: `${drop.street}, ${drop.city_name}`,
          latitude: drop.latitude,
          longitude: drop.longitude,
          value: drop.value,
          type: drop.coin_type,
          sponsorName: drop.sponsor_name,
          collected: drop.status === 'collected' || sessionCollected.current.has(drop.id),
          distance: dist,
          bearing: bearing,
          motion: drop.motion,
          calibration: drop.calibration === true,
          expiresAt: drop.motion?.endsAt,
          maxDurability: drop.motion ? (drop.motion.endsAt - drop.motion.startsAt) / 1000 : undefined,
          despawned: Boolean(drop.motion && gameTime() >= drop.motion.endsAt),
          originLat: drop.latitude,
          originLon: drop.longitude,
        };
      });

      setGeoCoins(mapped);
      const uncollected = mapped.find((c) => !c.collected);
      setActiveCoinId(previous => mapped.some(c => c.id === previous) ? previous : uncollected?.id || '');
    }

    loadCoins();
    const timer = setInterval(loadCoins, 10000);
    return () => { active = false; clearInterval(timer); };
  }, [cityName]);

  // Advance routes even when the hunter is stationary. Polling never restarts a route.
  useEffect(() => {
    const timer = setInterval(() => {
      const now = gameTime(), user = positionRef.current;
      setGeoCoins(coins => coins.map(coin => {
        if (!coin.motion || coin.collected) return coin;
        const point = movingCoinPosition(coin.motion, now);
        return { ...coin, ...point, despawned: now >= coin.motion.endsAt,
          distance: user ? getDistanceMeters(user.latitude, user.longitude, point.latitude, point.longitude) : 999999,
          bearing: user ? getBearingDegrees(user.latitude, user.longitude, point.latitude, point.longitude) : 0 };
      }));
    }, 250);
    return () => clearInterval(timer);
  }, []);

  const displayedCoins = geoCoins;
  // Get active targeted coin object (must be uncollected and not despawned)
  const activeCoin =
    displayedCoins.find((c) => c.id === activeCoinId && !c.collected && !c.despawned) ||
    displayedCoins.find((c) => !c.collected && !c.despawned);

  // Active coin durability calculation
  const activeDurability = activeCoin
    ? getRemainingDurability(activeCoin)
    : { remainingSeconds: Infinity, percent: 100, isCritical: false, isExpired: false };
  const hasActiveDurability = Boolean(activeCoin?.maxDurability && activeCoin?.expiresAt);

  // Real GPS Distance and Location Checks
  // Show nearby moving coins; their apparent size follows their actual distance.
  const realDistance = activeCoin && userCoords ? collectionDistance(userCoords, activeCoin) : 999999;
  const isCoinInARRange = Boolean(
    activeCoin &&
    !activeCoin.collected &&
    !activeCoin.despawned &&
    userCoords &&
    (userCoords.accuracy ?? Infinity) <= 25 &&
    Date.now() - gpsTimestamp < 15000 &&
    realDistance <= 150.0
  );
  const targetAzimuth = activeCoin ? activeCoin.bearing : 0;
  useEffect(() => {
    if (activeCoin?.id) {
      liveFlightReport.current = null;
      setFlightReports(previous => {
        const next = { ...previous };
        delete next[activeCoin.id];
        return next;
      });
      setFlight(createCoinFlightPath());
    }
  }, [activeCoin?.id]);
  const flightState = activeCoin ? coinEncounterReport(activeCoin, flightReports[activeCoin.id]) : undefined;
  const displayedDistance = flightState?.distance ?? realDistance;
  const fixedLocation = activeCoin?.calibration === true;
  const displayCoords = visualCoords ?? userCoords;
  const canCollectFixed = Boolean(activeCoin && canCollectAt(userCoords, activeCoin, gpsTimestamp, Date.now()));


  // Robust Native Rear Camera Handler for Telegram Mini App
  const startCameraStream = useCallback(async (existingStream?: MediaStream | null) => {
    setCameraError(null);

    let stream = existingStream || null;

    if (!stream) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError('Camera API not supported in this browser');
        return;
      }

      // Stop any previously running tracks to release camera hardware
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }

      try {
        // 1. Try standard ideal environmental rear camera
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: 'environment' },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });
      } catch (err1) {
        console.warn('Ideal environment request failed, trying basic environment facingMode:', err1);
        try {
          // 2. Fallback to basic environment facingMode string
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
            audio: false,
          });
        } catch (err2) {
          try {
            // 3. Fallback to generic video stream
            stream = await navigator.mediaDevices.getUserMedia({
              video: true,
              audio: false,
            });
          } catch (err3) {
            console.error('All camera requests failed:', err3);
            setCameraError('Camera access required. Please allow camera in Telegram.');
            setHasCamera(false);
            return;
          }
        }
      }
    }

    if (stream) {
      streamRef.current = stream;
      if (videoRef.current) {
        const video = videoRef.current;
        video.srcObject = stream;
        video.muted = true;
        video.playsInline = true;
        video.setAttribute('playsinline', '');
        video.setAttribute('webkit-playsinline', '');

        const onFrameReady = () => {
          if (video.videoWidth > 0 || video.readyState >= 2) {
            setHasCamera(true);
          }
        };

        video.onloadeddata = onFrameReady;
        video.onplaying = () => setHasCamera(true);

        try {
          await video.play();
          if (video.videoWidth > 0 || video.readyState >= 2) {
            setHasCamera(true);
          }
        } catch (playErr) {
          console.warn('Video playback error:', playErr);
        }
      }
    }
  }, []);

  // Direct camera initialization on mount with cleanup
  useEffect(() => {
    startCameraStream(initialStream);
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, [startCameraStream, initialStream]);

  // Telegram Native Integration:
  // Show Telegram's native Back button ("←") on top-left.
  // This REPLACES Telegram's "✕ Close" button with Telegram's native Back Arrow ("←").
  const [isTelegram, setIsTelegram] = useState<boolean>(false);

  useEffect(() => {
    const tg = getTelegramWebApp();
    if (tg) {
      setIsTelegram(true);
      const cleanupTgBack = showTelegramBackButton(() => {
        triggerHaptic('light');
        playSound.buttonClick();
        onClose();
      });
      return () => {
        cleanupTgBack();
      };
    } else {
      hideTelegramBackButton();
    }
  }, [onClose]);

  const requestSensorPermission = useCallback(async () => {
    const sensor = window.DeviceOrientationEvent as typeof DeviceOrientationEvent & {
      requestPermission?: (absolute?: boolean) => Promise<string>;
    };
    try {
      if (!sensor) throw new Error('Orientation sensors are unavailable on this device.');
      if (sensor.requestPermission && await sensor.requestPermission(true) !== 'granted') {
        throw new Error('Allow compass access to place coins at their GPS location.');
      }
      setTrackingError(null);
    } catch (error) { setTrackingError((error as Error).message); }
  }, []);

  useEffect(() => {
    const handleOrientation = (event: DeviceOrientationEvent) => {
      if (performance.now() - nativeOrientationAt.current < 500) return;
      const e = event as DeviceOrientationEvent & { webkitCompassHeading?: number; webkitCompassAccuracy?: number };
      if (e.beta === null || e.gamma === null) return;
      let alpha: number;
      if (typeof e.webkitCompassHeading === 'number' && e.webkitCompassHeading >= 0 && (e.webkitCompassAccuracy ?? 0) >= 0) {
        alpha = 360 - e.webkitCompassHeading;
      } else if ((e.absolute || e.type === 'deviceorientationabsolute') && e.alpha !== null) {
        alpha = e.alpha;
      } else return; // Relative yaw has no geographic north reference.
      const angle = window.screen.orientation?.angle ?? (window as Window & { orientation?: number }).orientation ?? 0;
      const quaternion = deviceCameraQuaternion(alpha, e.beta, e.gamma, angle);
      orientationAt.current = Date.now();
      updateCompass(quaternion);
      setTrackingError(previous => previous?.startsWith('GPS:') ? previous : null);
    };
    const cleanupNative = subscribeTelegramOrientation(quaternion => {
      nativeOrientationAt.current = performance.now();
      orientationAt.current = Date.now();
      updateCompass(quaternion);
      setTrackingError(previous => previous?.startsWith('GPS:') ? previous : null);
    });
    window.addEventListener('deviceorientation', handleOrientation);
    window.addEventListener('deviceorientationabsolute', handleOrientation as EventListener);
    return () => {
      cleanupNative();
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation as EventListener);
    };
  }, []);

  // Real-time GPS Location tracking
  useEffect(() => {
    if (!navigator.geolocation) { setTrackingError('GPS is unavailable on this device.'); return; }

    const handlePos = (position: GeolocationPosition) => {
      if (position.timestamp <= lastGpsTimestamp.current) return;
      lastGpsTimestamp.current = position.timestamp;
      const { latitude, longitude, accuracy } = position.coords;
      const coords = { latitude, longitude, accuracy };
      positionRef.current = coords;
      const visual = visualFilter.current.update({ ...coords, timestamp: position.timestamp });
      if (visual) {
        if (!originRef.current) originRef.current = visual;
        setVisualCoords(visual);
      } else if (!originRef.current) {
        originRef.current = { latitude, longitude };
      }
      setUserCoords(coords);
      setGpsTimestamp(position.timestamp);
      setTrackingError(previous => previous?.startsWith('GPS:') ? null : previous);
      setIsGpsReady(true);

      // Recompute true distances for all Service coins relative to real device GPS
      setGeoCoins((prev) =>
        prev.map((coin) => {
          const trueDist = getDistanceMeters(latitude, longitude, coin.latitude, coin.longitude);
          const trueBearing = getBearingDegrees(latitude, longitude, coin.latitude, coin.longitude);
          return { ...coin, distance: trueDist, bearing: trueBearing };
        })
      );
    };

    const handleErr = (error: GeolocationPositionError) => {
      setTrackingError('GPS: ' + error.message);
      setGpsTimestamp(0);
    };

    // Immediate single position request for fast GPS lock
    navigator.geolocation.getCurrentPosition(handlePos, handleErr, {
      enableHighAccuracy: true,
      maximumAge: 1500,
      timeout: 10000,
    });

    const watchId = navigator.geolocation.watchPosition(
      handlePos,
      handleErr,
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, []);

  // Durability Countdown watchdog
  useEffect(() => {
    const timer = setInterval(() => {
      const now = gameTime();
      let newlyDespawnedActive = false;
      let despawnedActiveName = '';
      let despawnedActiveVal = 0;

      setGeoCoins((prevCoins) => {
        let changed = false;
        const updated = prevCoins.map((coin) => {
          if (!coin.collected && !coin.despawned && coin.expiresAt && now >= coin.expiresAt) {
            changed = true;
            if (coin.id === activeCoinId) {
              newlyDespawnedActive = true;
              despawnedActiveName = coin.name;
              despawnedActiveVal = coin.value;
            }
            return { ...coin, despawned: true };
          }
          return coin;
        });
        return changed ? updated : prevCoins;
      });

      setDurabilityTick((t) => t + 1);

      if (newlyDespawnedActive) {
        if (soundEnabled) {
          playSound.coinDespawned();
        }
        triggerHaptic('error');
        setDespawnAlert({ name: despawnedActiveName, value: despawnedActiveVal });
        setTimeout(() => setDespawnAlert(null), 3500);

        setGeoCoins((current) => {
          const available = current.filter((c) => !c.collected && !c.despawned);
          if (available.length > 0) {
            const sorted = [...available].sort((a, b) => a.distance - b.distance);
            setActiveCoinId(sorted[0].id);
          } else {
            setActiveCoinId('');
          }
          return current;
        });
      }

      if (activeCoin && activeCoin.expiresAt && !activeCoin.despawned && !activeCoin.collected) {
        const remainingSec = Math.ceil((activeCoin.expiresAt - now) / 1000);
        if (remainingSec > 0 && remainingSec <= 15 && now - lastWarningSoundRef.current > 4000) {
          lastWarningSoundRef.current = now;
          if (soundEnabled) {
            playSound.warningPulse();
          }
          triggerHaptic('warning');
        }
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeCoinId, activeCoin, soundEnabled, userCoords]);



  // Handle coin collection on direct tap/click on 3D coin
  const collectCoin = useCallback(async () => {
    if (collectingRef.current || isCollecting || !activeCoin || activeCoin.collected || Date.now() - gpsTimestamp >= 15000) return;

    const point = activeCoin.motion ? movingCoinPosition(activeCoin.motion, gameTime()) : activeCoin;
    const report = liveFlightReport.current;
    const flightBlocked = !activeCoin.calibration && (!report || report.escaped || report.distance > 1 || report.timeLeft <= .35);
    if (flightBlocked || !canCollectAt(userCoords, point, gpsTimestamp, Date.now()) || (activeCoin.motion && gameTime() >= activeCoin.motion.endsAt)) {
      triggerHaptic('warning');
      if (soundEnabled) {
        playSound.buttonClick();
      }
      return;
    }

    collectingRef.current = true;
    setSavingReward(true);
    let receipt;
    try {
      receipt = await markCoinCollectedInService(activeCoin.id, userCoords!, gpsTimestamp + gameTime() - Date.now());
    } catch (error) {
      setCoinError(error instanceof Error ? error.message : 'Creditarea nu a fost confirmată. Reîncearcă.');
      collectingRef.current = false;
      setSavingReward(false);
      return;
    }
    setCoinError(null);
    setSavingReward(false);
    setIsCollecting(true);
    const isRare = activeCoin.type === 'rare' || activeCoin.type === 'merchant';
    if (soundEnabled) {
      playSound.coinCollected(isRare);
    }
    triggerHaptic('heavy');

    confetti({
      particleCount: 110,
      spread: 80,
      origin: { y: 0.5 },
      colors: ['#fbbf24', '#f59e0b', '#38bdf8', '#ffffff'],
    });

    setSuccessMessage(receipt.credited ? `+${receipt.value} ELZR` : 'Colectare confirmată');

    onCoinCollected({
      creditedBalance: receipt.balance,
      creditedScore: receipt.score,
      id: activeCoin.id,
      name: activeCoin.name,
      value: activeCoin.value,
      type: activeCoin.type,
      distance: activeCoin.distance,
      azimuth: activeCoin.bearing,
      elevation: 0,
      collected: true,
      sponsorName: activeCoin.sponsorName,
    });

    collectionTimer.current = setTimeout(() => {
      sessionCollected.current.add(activeCoin.id);
      setGeoCoins(coins => coins.map(coin => coin.id === activeCoin.id ? { ...coin, collected: true } : coin));
      setGeoCoins((currentCoins) => {
        const remaining = currentCoins.filter(
          (c) => !c.collected && !c.despawned && c.id !== activeCoin.id
        );
        if (remaining.length > 0) {
          const sorted = [...remaining].sort((a, b) => a.distance - b.distance);
          setActiveCoinId(sorted[0].id);
        } else {
          setActiveCoinId('');
        }
        return currentCoins;
      });

      collectingRef.current = false;
      setIsCollecting(false);
      setSuccessMessage(null);
    }, 1800);
  }, [isCollecting, activeCoin, soundEnabled, onCoinCollected, userCoords, gpsTimestamp]);

  return (
    <div
      className="fixed inset-0 z-50 bg-[#060b13] flex flex-col select-none overflow-hidden"
    >
      {/* 1. REAL-TIME BACKGROUND CAMERA STREAM (FIXED REAR CAMERA) */}
      <video
        id="ar-video"
        ref={videoRef}
        playsInline
        muted
        autoPlay
        onPlaying={() => {
          setHasCamera(true);
        }}
        onLoadedData={() => {
          setHasCamera(true);
        }}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          zIndex: 1,
        }}
        className="opacity-100"
      />

      {hasCamera && <div style={{ position: 'fixed', inset: 0, zIndex: 2 }}>
        <Canvas camera={{ position: [0, 0, 0], fov: 75, near: .1, far: 1000 }}
          gl={{ alpha: true, antialias: true }}
          onCreated={({ gl }) => gl.setClearColor(0x000000, 0)}
          style={{ pointerEvents: 'auto' }}>
          {fixedLocation ? (activeCoin && originRef.current && displayCoords && <GeoCamera
            key={activeCoin.id} origin={originRef.current} user={displayCoords} orientation={geographicOrientation.current}
            orientationReady={hasOrientation} initialFocus={toWorldPosition(activeCoin, originRef.current, 1.3)} />) : <GyroCamera />}
          <ambientLight intensity={1.5} /><directionalLight position={[5, 10, 5]} intensity={2} />
          {fixedLocation && activeCoin && originRef.current && displayCoords && <group position={toWorldPosition(activeCoin, originRef.current, 1.3)}>
            <Suspense fallback={null}>
              <Coin3D scale={0.40} interactive={canCollectFixed && !isCollecting && !savingReward}
                onClick={collectCoin} ghost={!canCollectFixed} collected={isCollecting} isMoving={canCollectFixed} />
            </Suspense>
          </group>}
          {!fixedLocation && activeCoin && <EncounterCoin key={flight.id} flight={flight} isCollecting={isCollecting} savingReward={savingReward} onClick={collectCoin}
            onLiveReport={report => { liveFlightReport.current = report; }}
            onReport={report => setFlightReports(previous => ({ ...previous, [activeCoin.id]: report }))} />}
        </Canvas>
      </div>}

      {/* 3. AR HUD CONTROLS OVERLAY (Radar, Weather, Compass & Stats - NO middle distance message) */}
      <div style={{ position: 'relative', zIndex: 10 }} className="flex-1 flex flex-col justify-between pointer-events-none">
        {/* TOP HUD BAR */}
        <div
          style={{
            paddingTop: isTelegram
              ? 'max(3.5rem, calc(var(--tg-content-safe-area-inset-top, var(--sat)) + 0.5rem))'
              : 'max(0.875rem, calc(var(--sat) + 0.375rem))',
          }}
          className="px-3.5 pb-2 flex items-center justify-between pointer-events-auto transition-all"
        >
          {/* Single Back button:
              If in Telegram, Telegram's native top-left button is active as "←" (replacing "✕ Close").
              If in standalone browser / PWA, render our React "← Back" button.
              This guarantees strictly ONLY 1 Back button and ZERO "✕ Close" buttons. */}
          {!isTelegram ? (
            <button
              onClick={() => {
                triggerHaptic('light');
                playSound.buttonClick();
                onClose();
              }}
              title="Back"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-slate-900/85 backdrop-blur border border-slate-700/80 text-white active:scale-95 transition-all shadow-md cursor-pointer hover:border-cyan-400 hover:text-cyan-300"
            >
              <ArrowLeft className="w-4 h-4 text-cyan-400 stroke-[2.5]" />
              <span className="text-xs font-mono font-bold tracking-wide">Back</span>
            </button>
          ) : (
            <div />
          )}

          {/* Fullscreen, Weather, Skins & Sound Controls Cluster - Pushed cleanly below Telegram 3-dots */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-slate-950/85 backdrop-blur-md border border-slate-700/80 shadow-xl">
            <button
              onClick={async () => {
                triggerHaptic('medium');
                const nextState = await toggleFullscreen();
                setIsFs(nextState);
              }}
              title={isFs ? 'Exit Fullscreen' : 'Enter Fullscreen'}
              className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white active:scale-95 transition-all shadow-md cursor-pointer hover:border-cyan-400"
            >
              {isFs ? <Minimize className="w-4 h-4 text-amber-400" /> : <Maximize className="w-4 h-4 text-cyan-400" />}
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsWeatherModalOpen(true);
              }}
              title="Local Weather Telemetry"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-900 border border-slate-700 text-xs font-mono text-white active:scale-95 transition-all shadow-md cursor-pointer hover:border-cyan-400"
            >
              {weatherData.condition === 'clear' && <CloudSun className="w-3.5 h-3.5 text-amber-400" />}
              {weatherData.condition === 'cloudy' && <Cloud className="w-3.5 h-3.5 text-slate-300" />}
              {weatherData.condition === 'rain' && <CloudRain className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />}
              {weatherData.condition === 'snow' && <Snowflake className="w-3.5 h-3.5 text-sky-300 animate-spin" style={{ animationDuration: '6s' }} />}
              {weatherData.condition === 'fog' && <CloudFog className="w-3.5 h-3.5 text-purple-300" />}
              {weatherData.condition === 'thunder' && <CloudLightning className="w-3.5 h-3.5 text-amber-400 animate-pulse" />}
              <span className="font-extrabold text-[11px]">{weatherData.temperature}°C</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                setIsSkinsMenuOpen(true);
              }}
              title="Visual Skins & Filters"
              className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white active:scale-95 transition-all shadow-md cursor-pointer hover:border-cyan-400"
            >
              <Palette className="w-4 h-4 text-cyan-400" />
            </button>

            <button
              onClick={() => {
                triggerHaptic('light');
                soundManager.toggleMute();
              }}
              title={soundEnabled ? 'Mute Sounds' : 'Unmute Sounds'}
              className="w-9 h-9 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white active:scale-95 transition-transform cursor-pointer"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
            </button>
          </div>
        </div>

        <div className="px-4 text-center text-xs text-white pointer-events-auto">
          {!hasOrientation && <button onClick={requestSensorPermission} className="bg-slate-900 p-3 rounded-xl">Enable compass / motion sensors</button>}
          {(trackingError || coinError || cameraError) && <p role="alert" className="bg-slate-900 p-2 rounded-xl">{trackingError || coinError || cameraError}</p>}
          {!coinError && geoCoins.length === 0 && <p>No active coins available.</p>}
        </div>
        {/* Notifications (Center-Top under header) */}
        <div className="flex flex-col gap-2 pointer-events-none">
          {successMessage && (
            <div className="px-4 flex justify-center animate-bounce">
              <div className="bg-emerald-500 text-slate-950 font-bold px-5 py-2.5 rounded-2xl flex items-center gap-2 shadow-2xl text-sm font-mono">
                <CheckCircle2 className="w-5 h-5" />
                <span>{successMessage}</span>
              </div>
            </div>
          )}

          {despawnAlert && (
            <div className="px-4 flex justify-center animate-bounce">
              <div className="bg-rose-950/95 text-white font-mono font-bold px-4 py-2.5 rounded-2xl border-2 border-rose-500 shadow-2xl flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-400 animate-pulse" />
                <span>{despawnAlert.name} (+{despawnAlert.value} PTS) Despawned!</span>
              </div>
            </div>
          )}
        </div>

        {/* Middle screen area left clean and unobstructed */}

        {/* BOTTOM DOCKED HUD (Docked at bottom so middle 3D coin area is 100% clear & unobstructed) */}
        <div className="px-3.5 pt-3 pb-[max(1rem,calc(var(--sab)+0.5rem))] flex flex-col gap-2 pointer-events-auto bg-gradient-to-t from-black/95 via-black/85 to-transparent">

          {/* Row 1: Compass Telemetry & Radar Map Button */}
          <div className="flex items-center justify-between w-full gap-2">
            {/* Compass & Proximity Pill */}
            <div className="flex items-center gap-1.5 flex-nowrap min-w-0">
              <button
                onClick={() => {
                  triggerHaptic('medium');
                  playSound.buttonClick();
                  setCompassMode((prev) => (prev === 'heading-up' ? 'north-up' : 'heading-up'));
                }}
                className="flex items-center gap-1.5 px-2 py-1.5 shrink-0 whitespace-nowrap rounded-full bg-slate-950/85 backdrop-blur border border-cyan-500/50 shadow-md active:scale-95 transition-all cursor-pointer hover:border-cyan-400"
              >
                <div className="relative w-5 h-5 rounded-full border border-cyan-400/60 bg-[#061224] flex items-center justify-center shrink-0">
                  <div
                    className="absolute inset-0.5 rounded-full border border-cyan-500/30 transition-transform duration-200 flex items-center justify-center"
                    style={{
                      transform: `rotate(${compassMode === 'heading-up' ? -yaw : 0}deg)`,
                    }}
                  >
                    <span className="absolute top-0 text-[6px] font-mono font-black text-rose-400">N</span>
                  </div>
                  <div
                    className="absolute w-full h-full flex items-center justify-center transition-transform duration-200"
                    style={{
                      transform: `rotate(${compassMode === 'north-up' ? yaw : 0}deg)`,
                    }}
                  >
                    <div className="w-0.5 h-2.5 bg-gradient-to-t from-transparent to-rose-500 rounded-full" />
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <span className="text-xs font-mono font-black text-white w-[8ch] tabular-nums">
                    {Math.round(yaw)}° {getCompassDirection(yaw)}
                  </span>
                  <span className="text-[9px] font-mono text-cyan-400 font-bold uppercase w-[6ch]">
                    ({compassMode === 'heading-up' ? 'HDG' : 'N-UP'})
                  </span>
                </div>
              </button>

              {activeCoin && (
                <div className="px-1.5 py-1.5 w-[80px] shrink-0 whitespace-nowrap tabular-nums rounded-full bg-cyan-950/85 backdrop-blur border border-cyan-500/40 text-xs font-mono text-cyan-300 flex items-center justify-center gap-1 shadow-md">
                  <Navigation className="w-3.5 h-3.5 text-cyan-400" />
                  <span>
                    {!userCoords
                      ? 'GPS...'
                      : formatCoinDistance(displayedDistance)}
                  </span>
                </div>
              )}
            </div>

            {/* Radar Map Launch Button */}
            <button
              onClick={() => {
                triggerHaptic('medium');
                setIsRadarOpen(true);
              }}
              aria-label="Open radar map"
              className="flex items-center gap-1 min-[420px]:gap-2 px-2 min-[420px]:px-3.5 py-2 rounded-full bg-cyan-950/90 backdrop-blur border border-cyan-400/80 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] active:scale-95 transition-all cursor-pointer hover:border-cyan-300 hover:text-white shrink-0"
            >
              <div className="relative w-4 h-4 rounded-full border border-cyan-400 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-cyan-400/50 animate-ping" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              </div>
              <span className="whitespace-nowrap text-[10px] min-[420px]:text-xs font-mono font-extrabold tracking-wider text-cyan-200">RADAR MAP</span>
            </button>
          </div>

          {/* Row 2: Location & Hunters Stats Badges */}
          <div className="flex flex-wrap items-center justify-between gap-2 w-full pt-1.5 border-t border-white/10">
            <div className="min-w-0 px-3 py-1 rounded-xl bg-slate-950/70 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-400 fill-rose-400/20 shrink-0" />
              <span className="text-[11px] font-mono font-bold text-white tracking-wide">
                {liveLocationName}
                {liveCity && <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="block text-[8px] font-normal text-slate-400">© OpenStreetMap contributors</a>}
              </span>
            </div>

            <div className="px-3 py-1 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/20 shadow-xl flex items-center gap-2.5">
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-200">
                <Users className="w-3 h-3 text-cyan-400 shrink-0" />
                <span>3 Hunters</span>
              </div>
              <div className="w-[1px] h-3 bg-white/20" />
              <div className="flex items-center gap-1 text-[11px] font-mono text-slate-200">
                <Coins className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-amber-300 font-bold">{elzrInCity} ELZR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      {userCoords && <RadarMapOverlay
        encounterMode={Boolean(flightState)}
        isOpen={isRadarOpen}
        onClose={() => setIsRadarOpen(false)}
        userCoords={userCoords}
        coins={displayedCoins.map(coin => {
          const report = coinEncounterReport(coin, flightReports[coin.id]);
          return report ? { ...coin, distance: report.distance, bearing: report.bearing, collected: coin.collected || report.escaped } : coin;
        })}
        activeCoinId={activeCoinId}
        onSelectCoin={(coinId) => {
          setActiveCoinId(coinId);
          setIsRadarOpen(false);
        }}
        currentYaw={yaw}
      />}

      <CoinSkinsMenu
        isOpen={isSkinsMenuOpen}
        onClose={() => setIsSkinsMenuOpen(false)}
        activeSkinId={activeSkinId}
        onSelectSkin={(skinId) => setActiveSkinId(skinId)}
        activeFilterId={activeFilterId}
        onSelectFilter={(filterId) => setActiveFilterId(filterId)}
      />

      {isWeatherModalOpen && (
        <WeatherSelectorModal
          currentWeather={weatherData}
          isSimulated={isWeatherSimulated}
          onSelectPreset={handleSelectWeatherPreset}
          onResetLive={handleResetLiveWeather}
          onClose={() => setIsWeatherModalOpen(false)}
        />
      )}
    </div>
  );
};

function EncounterCoin({ flight, isCollecting, savingReward, onClick, onReport, onLiveReport }: {
  flight: CoinFlightPath; isCollecting: boolean; savingReward: boolean; onClick: () => void;
  onReport: (report: EncounterReport) => void; onLiveReport: (report: EncounterReport) => void;
}) {
  const coinRef = useRef<Group>(null);
  const [distanceToCoin, setDistanceToCoin] = useState(99);
  const [timeLeft, setTimeLeft] = useState(0);
  const [hasEscaped, setHasEscaped] = useState(false);
  const latest = useRef<EncounterReport>({ distance: 99, bearing: 0, timeLeft: 0, escaped: false });
  const reportCallback = useRef(onReport);
  reportCallback.current = onReport;
  useEffect(() => {
    const timer = setInterval(() => reportCallback.current({ ...latest.current }), HUD_UPDATE_MS);
    return () => clearInterval(timer);
  }, []);
  const COIN_VISIBLE_DISTANCE = 9.0;
  const AR_COLLECT_DISTANCE = 1.0;
  const isCoinVisible = distanceToCoin <= COIN_VISIBLE_DISTANCE;
  const isNearby = distanceToCoin <= AR_COLLECT_DISTANCE;
  const canInteract = !hasEscaped && timeLeft > 0.35 && isNearby;
  return <>
    {!hasEscaped && <>
      <AircoinsCoinMotion coinRef={coinRef} path={flight} onDistanceChange={distance => {
        setDistanceToCoin(distance);
        latest.current.distance = distance;
        const point = coinRef.current?.position;
        if (point) latest.current.bearing = Math.round((Math.atan2(point.x, -point.z) * 180 / Math.PI + 360) % 360);
        onLiveReport({ ...latest.current });
      }} onEscape={() => { latest.current.escaped = true; setHasEscaped(true); }}
        onTimeLeftChange={seconds => { latest.current.timeLeft = seconds; setTimeLeft(seconds); }}
        isPaused={isCollecting || savingReward} />
      <group ref={coinRef} position={[0, -9999, 0]}>
        {isCoinVisible && <Suspense fallback={null}>
          <Coin3D scale={0.40} interactive={canInteract && !isCollecting && !savingReward}
            onClick={onClick} ghost={!canInteract} collected={isCollecting} isMoving={isNearby} />
        </Suspense>}
      </group>
    </>}
  </>;
}
