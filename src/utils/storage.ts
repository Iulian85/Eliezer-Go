import { UserState, AdCampaign } from '../types';

const STORAGE_KEY_USER = 'elzr_hunter_user_state_v1';
const STORAGE_KEY_CAMPAIGNS = 'elzr_hunter_campaigns_v1';

export const initialUserState: UserState = {
  elzrCollected: 0,
  city: '',
  globalHunters: 0,
  activeHunters: 0,
  elzrInCity: 0,
  points: {
    gameplay: 0,
    rareCoins: 0,
    eventCoins: 0,
    miningRewards: 0,
    merchantDrops: 0,
  },
  referral: {
    code: 'ELZR0C102F1B',
    activeFrens: 0,
    referralPts: 0,
    hasActivatedCode: false,
    activatedCode: null,
  },
  wallet: {
    connected: false,
    address: null,
    walletType: null,
    network: 'TON Mainnet',
    tonBalance: 0,
    gramBalance: 0,
  },
  dailyCheckIn: {
    currentStreak: 0,
    lastCheckInDate: null,
    totalCheckIns: 0,
  },
  achievements: {},
};

export const initialCampaigns: AdCampaign[] = [
  {
    id: 'camp_1',
    brandName: 'CyberBrew Augsburg',
    website: 'cyberbrew.io',
    email: 'contact@cyberbrew.io',
    street: 'Bahnhofstraße 12',
    city: 'Gersthofen',
    country: 'Germany',
    coinsDropped: 25,
    collectedCount: 14,
    createdAt: '2026-10-20',
    status: 'active',
    rewardPerCoin: 150,
  },
  {
    id: 'camp_2',
    brandName: 'NeoTech Store',
    website: 'neotech.shop',
    email: 'promo@neotech.shop',
    street: 'Augsburger Str. 45',
    city: 'Gersthofen',
    country: 'Germany',
    coinsDropped: 50,
    collectedCount: 38,
    createdAt: '2026-10-18',
    status: 'active',
    rewardPerCoin: 200,
  }
];

export function loadUserState(): UserState {
  if (typeof window === 'undefined') return initialUserState;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USER);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...initialUserState,
        ...parsed,
        city: '',
        globalHunters: 0,
        activeHunters: 0,
        elzrInCity: 0,
        points: { ...initialUserState.points, ...(parsed.points || {}) },
        dailyCheckIn: { ...initialUserState.dailyCheckIn, ...(parsed.dailyCheckIn || {}) },
        achievements: { ...initialUserState.achievements, ...(parsed.achievements || {}) },
      };
    }
  } catch {}
  return initialUserState;
}

export function saveUserState(state: UserState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(state));
  } catch {}
}

export function loadCampaigns(): AdCampaign[] {
  if (typeof window === 'undefined') return initialCampaigns;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CAMPAIGNS);
    if (raw) return JSON.parse(raw);
  } catch {}
  return initialCampaigns;
}

export function saveCampaigns(campaigns: AdCampaign[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY_CAMPAIGNS, JSON.stringify(campaigns));
  } catch {}
}
