export interface Aura {
  id: string;
  name: string;
  probability: number; // 1 in X
  color: string; // Tailwind class or color string
  glowColor: string; // Shadow / Glow color
  textColor: string;
  rarityText: string;
  bgGradient: string;
  icon: string;
  description: string;
  soundType: 'sine' | 'square' | 'sawtooth' | 'triangle';
  baseFrequency: number;
  vfxType?: 'orbit' | 'vortex' | 'matrix' | 'sparks' | 'beams' | 'glitch' | 'eclipse' | 'abyss' | 'singularity' | 'standard';
  cutsceneTheme?: 'cosmic' | 'glitch' | 'void' | 'eclipse' | 'solar' | 'lunar' | 'abyss' | 'standard';
}

export interface InventoryItem {
  id: string; // Unique instance ID
  auraId: string;
  equipped: boolean;
  acquiredAt: number;
}

export interface PlayerStats {
  rolls: number;
  maxRarityRolled: number;
  coins: number;
  luckMultiplier: number;
  rollSpeedMultiplier: number;
  rankPoints: number;
}

export interface PlayerProfile {
  username: string;
  uuid: string;
  joinedAt: number;
  stats: PlayerStats;
  inventory: InventoryItem[];
  equippedAuraId: string | null; // instance id
  teamId: string | null;
  cloudSyncedAt: number | null;
  lastDailyQuestReset: number;
  equippedLeftGauntletId?: string | null;
  equippedRightGauntletId?: string | null;
  craftedGauntletIds?: string[];
  equippedPetId?: string | null;
  ownedPets?: PlayerPet[];
}

export interface PlayerPet {
  id: string;
  petId: string;
  name: string;
  rarityText: string;
  color: string;
  glowColor: string;
  emoji: string;
  luckBonus: number;
  speedBonus: number;
  acquiredAt: number;
  shiny?: boolean;
}

export interface MarketplaceListing {
  id: string;
  sellerName: string;
  sellerUuid: string;
  auraId: string;
  price: number;
  createdAt: number;
  status: 'active' | 'sold' | 'cancelled';
}

export interface TradeOffer {
  id: string;
  senderName: string;
  senderUuid: string;
  senderOffer: {
    auraInstanceId: string;
    auraId: string;
    coins: number;
  };
  receiverName: string;
  receiverUuid: string;
  receiverOffer: {
    auraInstanceId: string | null;
    auraId: string | null;
    coins: number;
  } | null; // Null means pending their response
  status: 'pending' | 'accepted' | 'declined' | 'completed';
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  username: string;
  message: string;
  equippedAuraName: string;
  equippedAuraColor: string;
  timestamp: number;
  system?: boolean;
}

export interface DailyQuest {
  id: string;
  description: string;
  targetValue: number;
  currentValue: number;
  type: 'rolls' | 'coins_spent' | 'rare_rolls' | 'crafts';
  rewardCoins: number;
  rewardLuck: number; // Temporary luck buff percentage
  claimed: boolean;
}

export interface Team {
  id: string;
  name: string;
  color: string;
  memberCount: number;
  totalRankPoints: number;
  description: string;
  faction: 'Cosmos' | 'Void' | 'Solar' | 'Lunar';
}

export interface AnalyticsEvent {
  timestamp: number;
  eventType: 'roll' | 'trade' | 'marketplace_sell' | 'quest_complete' | 'craft' | 'cloud_save';
  details: string;
}
