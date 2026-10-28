export type WeatherCondition = 'clear' | 'cloudy' | 'fog' | 'rain' | 'snow' | 'thunder';

export interface WeatherData {
  condition: WeatherCondition;
  label: string;
  temperature: number; // in °C
  windSpeed: number; // in km/h
  weatherCode: number;
  isSimulated?: boolean;
}

export type AchievementRarity = 'bronze' | 'silver' | 'gold' | 'diamond';

export interface AchievementProgress {
  unlocked: boolean;
  unlockedAt: string | null;
  claimedReward?: boolean;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  category: 'hunting' | 'streak' | 'social' | 'web3';
  rarity: AchievementRarity;
  target: number;
  pointsReward: number;
  iconName: string;
}

export interface UserState {
  elzrCollected: number;
  city: string;
  globalHunters: number;
  activeHunters: number;
  elzrInCity: number;
  points: {
    gameplay: number;
    rareCoins: number;
    eventCoins: number;
    miningRewards: number;
    merchantDrops: number;
  };
  referral: {
    code: string;
    activeFrens: number;
    referralPts: number;
    hasActivatedCode: boolean;
    activatedCode: string | null;
  };
  wallet: {
    connected: boolean;
    address: string | null;
    walletType: 'tonkeeper' | 'telegram' | 'gram' | 'mytonwallet' | 'openmask' | null;
    network: 'TON Mainnet' | 'GRAM Core' | 'Testnet';
    tonBalance: number;
    gramBalance: number;
  };
  dailyCheckIn: {
    currentStreak: number;
    lastCheckInDate: string | null;
    totalCheckIns: number;
  };
  achievements: Record<string, AchievementProgress>;
}

export interface AdCampaign {
  id: string;
  brandName: string;
  website: string;
  email: string;
  street: string;
  city: string;
  country: string;
  latitude?: number;
  longitude?: number;
  coinsDropped: number;
  collectedCount: number;
  createdAt: string;
  status: 'active' | 'paused' | 'completed';
  rewardPerCoin: number;
}

export interface ARCoinTarget {
  id: string;
  name: string;
  value: number;
  type: 'standard' | 'rare' | 'merchant';
  distance: number; // in meters
  azimuth: number; // in degrees (0 - 360)
  elevation: number; // in degrees (-30 to +30)
  collected: boolean;
  sponsorName?: string;
  maxDurability?: number; // total spawn duration in seconds (e.g. 60 or 90 for rare coins)
  expiresAt?: number; // timestamp in ms when coin will despawn
  despawned?: boolean; // whether coin has vanished due to expired durability
}

