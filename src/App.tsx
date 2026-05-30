/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Dices, Briefcase, ArrowLeftRight, ShoppingBag, MessageSquare, 
  Trophy, Swords, Wifi, WifiOff, Volume2, VolumeX, ShieldAlert, 
  HelpCircle, Copy, Check, Upload, Download, DollarSign, 
  Search, RefreshCw, Layers, Database, UserCheck, Zap, LayoutDashboard, BookOpen,
  Map, Heart
} from 'lucide-react';
import { 
  PlayerProfile, InventoryItem, Aura, MarketplaceListing, 
  ChatMessage, DailyQuest, AnalyticsEvent, PlayerPet
} from './types';
import { AURAS, getAuraById } from './data/auras';
import { getGauntletById } from './data/gauntlets';
import { 
  playRollSound, playAuraUnlockSound, playClickSound, 
  playSuccessChime, triggerHaptic, toggleGlobalSound, getSoundEnabled,
  updateEquippedAuraMusic, stopAuraMusic
} from './utils/sound';

import AuraDisplay from './components/AuraDisplay';
import Inventory from './components/Inventory';
import TradingSystem from './components/TradingSystem';
import Marketplace from './components/Marketplace';
import SocialHub from './components/SocialHub';
import QuestsAndLeaderboard from './components/QuestsAndLeaderboard';
import AuraCutscene from './components/AuraCutscene';
import AuraCodex from './components/AuraCodex';
import SolRNGMap from './components/SolRNGMap';
import PetSanctuary from './components/PetSanctuary';

// Local storage keys
const STATE_LOCAL_KEY = 'sol_rng_save_state_v1';

const INITIAL_PROFILE = (name: string): PlayerProfile => ({
  username: name,
  uuid: 'user_' + Math.random().toString(36).substring(2, 9),
  joinedAt: Date.now(),
  stats: {
    rolls: 0,
    maxRarityRolled: 2,
    coins: 200,
    luckMultiplier: 1.0,
    rollSpeedMultiplier: 1.0,
    rankPoints: 1000
  },
  inventory: [
    { id: 'item_1', auraId: 'common', equipped: true, acquiredAt: Date.now() }
  ],
  equippedAuraId: 'item_1',
  teamId: null,
  cloudSyncedAt: null,
  lastDailyQuestReset: Date.now(),
  equippedLeftGauntletId: null,
  equippedRightGauntletId: null,
  craftedGauntletIds: [],
  equippedPetId: null,
  ownedPets: []
});

const INITIAL_QUESTS: DailyQuest[] = [
  { id: 'q_rolls', description: 'Trigger 25 cosmic auras rolls', targetValue: 25, currentValue: 0, type: 'rolls', rewardCoins: 120, rewardLuck: 0.15, claimed: false },
  { id: 'q_rare', description: 'Acquire a 1:128+ Epic or better aura', targetValue: 1, currentValue: 0, type: 'rare_rolls', rewardCoins: 250, rewardLuck: 0.30, claimed: false },
  { id: 'q_coins', description: 'Invest 200 Sol Coins in Marketplace listings', targetValue: 200, currentValue: 0, type: 'coins_spent', rewardCoins: 100, rewardLuck: 0.10, claimed: false },
  { id: 'q_crafts', description: 'Forge a new Talisman device', targetValue: 1, currentValue: 0, type: 'crafts', rewardCoins: 300, rewardLuck: 0.25, claimed: false }
];

export default function App() {
  const [username, setUsername] = useState<string>('SolBroker_' + Math.floor(Math.random() * 900 + 100));
  const [profile, setProfile] = useState<PlayerProfile | null>(null);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [quests, setQuests] = useState<DailyQuest[]>([]);
  const [marketListings, setMarketListings] = useState<MarketplaceListing[]>([]);
  const [analytics, setAnalytics] = useState<AnalyticsEvent[]>([]);

  // Navigation states
  const [activeNav, setActiveNav] = useState<string>('roll');
  const [audioOn, setAudioOn] = useState<boolean>(true);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [saveCopied, setSaveCopied] = useState<boolean>(false);
  const [saveLoadedAlert, setSaveLoadedAlert] = useState<string>('');

  // Save Code Import string input
  const [importCodeStr, setImportCodeStr] = useState<string>('');

  // RNG states
  const [lastRolledAura, setLastRolledAura] = useState<Aura>(AURAS[0]);
  const [activeCutsceneAura, setActiveCutsceneAura] = useState<Aura | null>(null);
  const [isRolling, setIsRolling] = useState<boolean>(false);
  const [autoRoll, setAutoRoll] = useState<boolean>(false);
  const [speedRoll, setSpeedRoll] = useState<boolean>(false);

  // Sol RNG advanced states
  const [currentBiome, setCurrentBiome] = useState<'normal' | 'windy' | 'rainy' | 'snowy' | 'starfall' | 'hell' | 'corruption' | 'glitch'>('normal');
  const [ticksUntilBiomeChange, setTicksUntilBiomeChange] = useState<number>(30);
  const [autoSellThreshold, setAutoSellThreshold] = useState<string>('all');
  
  // Secret Command Console easter-egg state triggers
  const [isDevTerminalOpen, setIsDevTerminalOpen] = useState<boolean>(false);
  const [isTerminalAuthorized, setIsTerminalAuthorized] = useState<boolean>(false);
  const [terminalPasswordInput, setTerminalPasswordInput] = useState<string>('');
  const [terminalCommandInput, setTerminalCommandInput] = useState<string>('');
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    'SOL RNG QUANTUM HORIZONS SECRET SYSTEM TERMINAL v2.40',
    'SYSTEM INTEGRITY STATUS: 100% ONLINE',
    'ROOT ACCOUNT PRIVILEGE AUTHENTICATION CARD REQUISITE.',
    'ENTER FOUR-DIGIT MASTER LOGIC CODE:'
  ]);
  const [potionsInventory, setPotionsInventory] = useState<{ [potionId: string]: number }>({
    lucky_potion: 2,
    haste_elixir: 1
  });
  const [activeBuffs, setActiveBuffs] = useState<{
    luckRemaining: number;
    luckValue: number;
    speedRemaining: number;
    speedValue: number;
    heavenlyActive: boolean;
  }>({
    luckRemaining: 0,
    luckValue: 0,
    speedRemaining: 0,
    speedValue: 0,
    heavenlyActive: false
  });

  // Matchmaking states
  const [matchingStatus, setMatchingStatus] = useState<'idle' | 'searching' | 'matched' | 'duel_win' | 'duel_loss'>('idle');
  const [duelOpponent, setDuelOpponent] = useState<{ name: string; score: number; auraName: string; auraColor: string } | null>(null);
  const [duelLatency, setDuelLatency] = useState<number>(0);

  // Anti-Cheat protections
  const [antiCheatLog, setAntiCheatLog] = useState<string>('SecuShield active. Core sequence validation verified.');
  const lastRollTimestamp = useRef<number>(0);

  // Load from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STATE_LOCAL_KEY);
    if (saved) {
      try {
        const decoded = JSON.parse(saved);
        const restoredProfile: PlayerProfile = {
          ...decoded.profile,
          equippedPetId: decoded.profile.equippedPetId !== undefined ? decoded.profile.equippedPetId : null,
          ownedPets: decoded.profile.ownedPets !== undefined ? decoded.profile.ownedPets : []
        };
        setProfile(restoredProfile);
        setQuests(decoded.quests || INITIAL_QUESTS);
        setMarketListings(decoded.marketListings || []);
        setChats(decoded.chats || []);
        setAnalytics(decoded.analytics || []);
        setUsername(decoded.profile.username);

        // Optional restore of Sol RNG advanced states
        if (decoded.potionsInventory) setPotionsInventory(decoded.potionsInventory);
        if (decoded.activeBuffs) setActiveBuffs(decoded.activeBuffs);
        if (decoded.currentBiome) setCurrentBiome(decoded.currentBiome);
        if (decoded.ticksUntilBiomeChange !== undefined) setTicksUntilBiomeChange(decoded.ticksUntilBiomeChange);
        if (decoded.autoSellThreshold) setAutoSellThreshold(decoded.autoSellThreshold);

        logAnalytics('cloud_save', 'Core profile restored from offline localStorage cache');
      } catch {
        // Fallback
        initFreshProfile(username);
      }
    } else {
      initFreshProfile(username);
    }
    setAudioOn(getSoundEnabled());
  }, []);

  // Scroll secret command console terminal logs automatically to the bottom
  useEffect(() => {
    if (isDevTerminalOpen) {
      const logsBox = document.getElementById('terminal_logs_box');
      if (logsBox) {
        logsBox.scrollTop = logsBox.scrollHeight;
      }
    }
  }, [terminalLogs, isDevTerminalOpen]);

  // Synchronise equipped aura background theme songs
  useEffect(() => {
    if (profile) {
      const activeEquippedInst = profile.inventory.find(i => i.id === profile.equippedAuraId);
      const activeEquippedAura = getAuraById(activeEquippedInst?.auraId || 'common');
      if (audioOn) {
        updateEquippedAuraMusic(activeEquippedAura);
      } else {
        stopAuraMusic();
      }
    } else {
      stopAuraMusic();
    }
    return () => {
      stopAuraMusic();
    };
  }, [profile?.equippedAuraId, audioOn]);

  const initFreshProfile = (name: string) => {
    const prof = INITIAL_PROFILE(name);
    setProfile(prof);
    setQuests(INITIAL_QUESTS);
    setMarketListings([
      { id: 'list_demo_1', sellerName: 'OrbitSlinger', sellerUuid: 'bot1', auraId: 'gilded', price: 180, createdAt: Date.now(), status: 'active' },
      { id: 'list_demo_2', sellerName: 'Zephyr_X', sellerUuid: 'bot2', auraId: 'sapphire', price: 1200, createdAt: Date.now(), status: 'active' },
      { id: 'list_demo_3', sellerName: 'LunarNexus', sellerUuid: 'bot3', auraId: 'celestial', price: 9500, createdAt: Date.now(), status: 'active' }
    ]);
    const initChat: ChatMessage = {
      id: 'chat_init_1',
      username: 'System Broker',
      message: '🌟 Welcome to Sol RNG Social Hub! Roll auras, create trades, list items in active marketplace and join Factions!',
      equippedAuraName: 'Celestial',
      equippedAuraColor: '#c084fc',
      timestamp: Date.now()
    };
    setChats([initChat]);
    logAnalytics('roll', 'First timeline initialized for profile: ' + name);
  };

  // Perform Auto Roll Loop
  useEffect(() => {
    let timer: any;
    if (autoRoll) {
      const baseDelay = speedRoll ? 340 : 1100;
      let leftGauntletSpeed = 0;
      let rightGauntletSpeed = 0;
      if (profile?.equippedLeftGauntletId) {
        const g = getGauntletById(profile.equippedLeftGauntletId);
        if (g) leftGauntletSpeed = g.rollSpeedMultiplierAdd;
      }
      if (profile?.equippedRightGauntletId) {
        const g = getGauntletById(profile.equippedRightGauntletId);
        if (g) rightGauntletSpeed = g.rollSpeedMultiplierAdd;
      }
      let petSpeed = 0;
      if (profile?.equippedPetId && profile?.ownedPets) {
        const activePet = profile.ownedPets.find(p => p.id === profile.equippedPetId);
        if (activePet) {
          petSpeed = activePet.speedBonus || 0;
        }
      }
      const totalSpeedAdd = (profile?.stats.rollSpeedMultiplier || 1.0) - 1.0 + 
                            (activeBuffs.speedRemaining > 0 ? activeBuffs.speedValue : 0) +
                            leftGauntletSpeed + rightGauntletSpeed + petSpeed;
      const delay = Math.max(120, Math.floor(baseDelay / (1 + totalSpeedAdd)));
      timer = setInterval(() => {
        executeRoll();
      }, delay);
    }
    return () => clearInterval(timer);
  }, [autoRoll, profile, speedRoll, activeBuffs]);

  const logAnalytics = (type: any, desc: string) => {
    const ev: AnalyticsEvent = {
      timestamp: Date.now(),
      eventType: type,
      details: desc
    };
    setAnalytics(prev => [ev, ...prev.slice(0, 15)]);
  };

  // Save state back to local storage
  const saveStateToLocal = (
    updatedProf: PlayerProfile, 
    updatedQuests = quests, 
    updatedListings = marketListings, 
    updatedChats = chats,
    updatedPotions = potionsInventory,
    updatedBuffs = activeBuffs,
    biome = currentBiome,
    ticks = ticksUntilBiomeChange,
    threshold = autoSellThreshold
  ) => {
    const backup = {
      profile: updatedProf,
      quests: updatedQuests,
      marketListings: updatedListings,
      chats: updatedChats,
      analytics,
      potionsInventory: updatedPotions,
      activeBuffs: updatedBuffs,
      currentBiome: biome,
      ticksUntilBiomeChange: ticks,
      autoSellThreshold: threshold
    };
    localStorage.setItem(STATE_LOCAL_KEY, JSON.stringify(backup));
  };

  const handleUpdateUsername = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile || !username.trim()) return;
    playClickSound();
    const updated = { ...profile, username: username.trim() };
    setProfile(updated);
    saveStateToLocal(updated);
    setSaveLoadedAlert('Username set to ' + username);
    setTimeout(() => setSaveLoadedAlert(''), 3000);
  };

  // Sol's RNG Biome-Aware Rolling Algorithm
  const rollAlgorithm = (luck: number, biome: string): Aura => {
    // Sort from rarest to most common
    const sortedAuras = [...AURAS].sort((a, b) => b.probability - a.probability);
    for (const aura of sortedAuras) {
      if (aura.id === 'common') continue;

      let targetProbability = aura.probability;

      // Apply weather biome specific rate adjustments
      if (biome === 'windy' && aura.id === 'wind') {
        targetProbability = 500; // 10x easier (1:500)
      } else if (biome === 'rainy' && aura.id === 'sapphire') {
        targetProbability = 80; // ~6x easier
      } else if (biome === 'starfall') {
        if (aura.id === 'starscourge') {
          targetProbability = 1000000; // 10x easier (1:1M!)
        } else if (aura.id === 'gargantua') {
          targetProbability = 43000000; // 10x easier (1:43M!)
        } else if (aura.id === 'galaxy') {
          targetProbability = 100000; // 5x easier
        } else if (aura.id === 'nebula') {
          targetProbability = 50000; // 5x easier
        }
      } else if (biome === 'hell') {
         if (aura.id === 'ruby') {
           targetProbability = 20; // 6x easier
         } else if (aura.id === 'solar') {
           targetProbability = 10000; // 5x easier
         } else if (aura.id === 'bloodlust') {
           targetProbability = 50000000; // 6x easier (1:50M!)
         }
      } else if (biome === 'corruption') {
         if (aura.id === 'abyssal_void') {
           targetProbability = 20000000; // 5x easier
         } else if (aura.id === 'gravitational') {
           targetProbability = 200000; // 5x easier
         } else if (aura.id === 'impeached') {
           targetProbability = 40000000; // 5x easier (1:40M!)
         }
      } else if (biome === 'glitch') {
         if (aura.id === 'matrix') {
           targetProbability = 800000; // 10x easier
         } else if (aura.id === 'cyber_glitch') {
           targetProbability = 2400000; // 10x easier
         } else if (aura.id === 'glitch') {
           targetProbability = 12000; // Massive glitch rate spike
         }
      }

      // Probability formula: 1 / (targetProbability / luck)
      const rolledChance = Math.random() * (targetProbability / luck);
      if (rolledChance < 1) {
        return aura;
      }
    }
    return AURAS[0]; // Common fallback
  };

  // RNG Rolling Action
  const executeRoll = (): { rolledAura: Aura; isNewMax: boolean; coinPayout: number } | null => {
    if (!profile) return null;

    const now = Date.now();
    // Anti-cheat macro verification
    if (now - lastRollTimestamp.current < 120) {
      setAntiCheatLog('Macro Detected: Execution throttled to protect competitive integrity.');
      triggerHaptic(100);
      return null;
    }
    lastRollTimestamp.current = now;

    // Trigger visual/sound roll indicators
    playRollSound();
    triggerHaptic(1);

    // Calculate current aggregate luck factors
    // Base luck (1.0) + quest claims bonuses + equipment talismans passive
    let activePotionLuck = 0;
    if (activeBuffs.luckRemaining > 0) {
      activePotionLuck = activeBuffs.luckValue;
    }

    // Calculate Gauntlet Equipment Luck
    let leftGauntletLuck = 0;
    let rightGauntletLuck = 0;
    if (profile.equippedLeftGauntletId) {
      const g = getGauntletById(profile.equippedLeftGauntletId);
      if (g) leftGauntletLuck = g.luckMultiplierAdd;
    }
    if (profile.equippedRightGauntletId) {
      const g = getGauntletById(profile.equippedRightGauntletId);
      if (g) rightGauntletLuck = g.luckMultiplierAdd;
    }

    // Calculate Pet Companion Mascot Luck Boost
    let petLuckBoost = 0;
    if (profile.equippedPetId && profile.ownedPets) {
      const activePet = profile.ownedPets.find(p => p.id === profile.equippedPetId);
      if (activePet) {
        petLuckBoost = activePet.luckBonus || 0;
      }
    }

    const baseLuck = profile.stats.luckMultiplier + activePotionLuck + leftGauntletLuck + rightGauntletLuck + petLuckBoost;
    const weatherFactor = currentBiome === 'rainy' ? 1.2 : 1.0;
    const currentLuck = baseLuck * weatherFactor + (activeBuffs.heavenlyActive ? 1000.0 : 0);

    // Roll Element
    const rolled = rollAlgorithm(currentLuck, currentBiome);
    setLastRolledAura(rolled);

    // Trigger full screen custom cutscene for high rarity pulls
    if (rolled.probability >= 1000) {
      setAutoRoll(false);
      setActiveCutsceneAura(rolled);
    }

    // Update Player rolls counts
    const updatedRolls = profile.stats.rolls + 1;
    const isNewRecord = rolled.probability > profile.stats.maxRarityRolled;
    const maxRarity = isNewRecord ? rolled.probability : profile.stats.maxRarityRolled;

    // Auto-sell decision checking
    let keepItem = true;
    let autoSellPayout = 0;
    if (autoSellThreshold !== 'all') {
      const thresholdNum = parseInt(autoSellThreshold, 10);
      if (!isNaN(thresholdNum) && rolled.probability < thresholdNum) {
        keepItem = false;
        autoSellPayout = rolled.probability >= 128 ? Math.floor(Math.sqrt(rolled.probability) * 1.5) + 2 : 2;
      }
    }

    // Payout standard coins (+ autoSell if sold)
    const standardPayout = rolled.probability >= 100 ? Math.floor(Math.sqrt(rolled.probability) * 3.5) + 3 : 1;
    
    // Gauntlet Coin Multiplier additions
    let leftGauntletCoinMult = 1.0;
    let rightGauntletCoinMult = 1.0;
    if (profile.equippedLeftGauntletId) {
      const g = getGauntletById(profile.equippedLeftGauntletId);
      if (g && g.coinMultiplier) leftGauntletCoinMult = g.coinMultiplier;
    }
    if (profile.equippedRightGauntletId) {
      const g = getGauntletById(profile.equippedRightGauntletId);
      if (g && g.coinMultiplier) rightGauntletCoinMult = g.coinMultiplier;
    }
    const totalCoinMult = 1.0 + (leftGauntletCoinMult - 1.0) + (rightGauntletCoinMult - 1.0);
    
    const payoutToScale = keepItem ? standardPayout : autoSellPayout;
    const finalPayout = Math.floor(payoutToScale * totalCoinMult);
    const newCoins = profile.stats.coins + finalPayout;

    let updatedInventory = [...profile.inventory];
    if (keepItem) {
      // Create item instance inside backpack
      const newInstanceId = 'inst_' + Math.random().toString(36).substring(2, 9);
      const newInventoryItem: InventoryItem = {
        id: newInstanceId,
        auraId: rolled.id,
        equipped: false,
        acquiredAt: Date.now()
      };
      updatedInventory.push(newInventoryItem);
    }

    // Auto-equip if rolling an extremely rare aura higher than the current equipped
    if (isNewRecord && rolled.probability >= 1000) {
      playAuraUnlockSound(rolled);
      triggerHaptic(rolled.probability / 10);

      // Auto-unlock active chat announcement
      const systemAnnouncementChat: ChatMessage = {
        id: 'ann_' + Date.now(),
        username: 'System',
        message: `🌟 ${profile.username} HAS UNLOCKED THE RARE [${rolled.name}] AURA (1 in ${rolled.probability.toLocaleString()}) UNDER [${currentBiome.toUpperCase()}] WEATHER!`,
        equippedAuraName: rolled.name,
        equippedAuraColor: rolled.textColor,
        timestamp: Date.now()
      };
      setChats(prev => [...prev.slice(-30), systemAnnouncementChat]);
    }

    // Progress daily quests
    const updatedQuests = quests.map(q => {
      if (q.type === 'rolls') {
        return { ...q, currentValue: Math.min(q.targetValue, q.currentValue + 1) };
      }
      if (q.type === 'rare_rolls' && rolled.probability >= 128) {
        return { ...q, currentValue: Math.min(q.targetValue, q.currentValue + 1) };
      }
      return q;
    });

    // Handle Buff Tick Decrement
    const updatedBuffs = { ...activeBuffs };
    if (updatedBuffs.luckRemaining > 0) {
      updatedBuffs.luckRemaining -= 1;
      if (updatedBuffs.luckRemaining === 0) {
        updatedBuffs.luckValue = 0;
      }
    }
    if (updatedBuffs.speedRemaining > 0) {
      updatedBuffs.speedRemaining -= 1;
      if (updatedBuffs.speedRemaining === 0) {
        updatedBuffs.speedValue = 0;
      }
    }
    if (updatedBuffs.heavenlyActive) {
      updatedBuffs.heavenlyActive = false; // single roll consumption complete!
    }
    setActiveBuffs(updatedBuffs);

    // Tick Biome timer
    let nextBiome = currentBiome;
    let nextTicks = ticksUntilBiomeChange - 1;
    if (nextTicks <= 0) {
      // Shift biome! Windy (15%), Rainy (15%), Snowy (15%), Starfall (12%), Hell (10%), Corruption (10%), Glitch (4%), Normal (19%)
      const randValue = Math.random() * 100;
      if (randValue < 15) {
        nextBiome = 'windy';
      } else if (randValue < 30) {
        nextBiome = 'rainy';
      } else if (randValue < 45) {
        nextBiome = 'snowy';
      } else if (randValue < 57) {
        nextBiome = 'starfall';
      } else if (randValue < 67) {
        nextBiome = 'hell';
      } else if (randValue < 77) {
        nextBiome = 'corruption';
      } else if (randValue < 81) {
        nextBiome = 'glitch';
      } else {
        nextBiome = 'normal';
      }
      nextTicks = Math.floor(Math.random() * 15) + 30; // 30-45 rolls duration

      const announcementMsg: ChatMessage = {
        id: 'biome_' + Date.now(),
        username: 'System Weather',
        message: `🌌 ENVIRONMENT MUTATED INTO [${nextBiome.toUpperCase()}] REGION FOR ${nextTicks} ROLLS! NEW EXOTIC OPPORTUNITIES!`,
        equippedAuraName: 'Weather Machine',
        equippedAuraColor: '#10b981',
        timestamp: Date.now()
      };
      setChats(prev => [...prev.slice(-30), announcementMsg]);
      playSuccessChime();
    }
    setCurrentBiome(nextBiome);
    setTicksUntilBiomeChange(nextTicks);

    const updatedProfile: PlayerProfile = {
      ...profile,
      inventory: updatedInventory,
      stats: {
        ...profile.stats,
        rolls: updatedRolls,
        maxRarityRolled: maxRarity,
        coins: newCoins
      }
    };

    setProfile(updatedProfile);
    setQuests(updatedQuests);
    saveStateToLocal(updatedProfile, updatedQuests, marketListings, chats, potionsInventory, updatedBuffs, nextBiome, nextTicks, autoSellThreshold);

    if (rolled.probability >= 500) {
      logAnalytics('roll', `Special high weight element roll: ${rolled.name} (1 in ${rolled.probability.toLocaleString()})`);
    }

    return { rolledAura: rolled, isNewMax: isNewRecord, coinPayout: keepItem ? standardPayout : autoSellPayout };
  };

  // Equip Aura
  const handleEquipAura = (itemInstanceId: string | null) => {
    if (!profile) return;
    const updatedProfile: PlayerProfile = {
      ...profile,
      equippedAuraId: itemInstanceId
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile);
    logAnalytics('roll', itemInstanceId ? 'Equipped aura element' : 'Unequipped display aura');
  };

  // Craft Assembler
  const handleCraftDevice = (
    recipeId: string,
    auraInstanceIds: string[],
    statsCost: { coins: number },
    luckBoost: number,
    speedBoost: number
  ) => {
    if (!profile) return;

    // Eliminate components from inventory
    const updatedInventory = profile.inventory.filter(i => !auraInstanceIds.includes(i.id));

    // Progress spend quests
    const updatedQuests = quests.map(q => {
      if (q.type === 'coins_spent') {
        return { ...q, currentValue: Math.min(q.targetValue, q.currentValue + statsCost.coins) };
      }
      if (q.type === 'crafts') {
        return { ...q, currentValue: Math.min(q.targetValue, q.currentValue + 1) };
      }
      return q;
    });

    const updatedProfile: PlayerProfile = {
      ...profile,
      inventory: updatedInventory,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins - statsCost.coins,
        luckMultiplier: profile.stats.luckMultiplier + luckBoost,
        rollSpeedMultiplier: profile.stats.rollSpeedMultiplier + speedBoost
      }
    };

    setProfile(updatedProfile);
    setQuests(updatedQuests);
    saveStateToLocal(updatedProfile, updatedQuests);
    logAnalytics('craft', `Forged recipe: ${recipeId}. Multipliers surged!`);
  };

  // Solo Alchemist Herbology Brew Flask handler
  const handleBrewPotion = (recipeId: string, auraInstanceIds: string[], coinsCost: number) => {
    if (!profile) return;

    // Eliminate components from inventory
    const updatedInventory = profile.inventory.filter(i => !auraInstanceIds.includes(i.id));

    const updatedProfile: PlayerProfile = {
      ...profile,
      inventory: updatedInventory,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins - coinsCost
      }
    };

    // Increment in potions index inventory
    const updatedPotions = {
      ...potionsInventory,
      [recipeId]: (potionsInventory[recipeId] || 0) + 1
    };

    setProfile(updatedProfile);
    setPotionsInventory(updatedPotions);
    saveStateToLocal(updatedProfile, quests, marketListings, chats, updatedPotions, activeBuffs, currentBiome, ticksUntilBiomeChange, autoSellThreshold);
    logAnalytics('craft', `Brewed potion in cauldron: ${recipeId}`);
  };

  // Consumes a potion from Flask Storage and sets state values
  const handleUsePotion = (potionId: string) => {
    if (!profile || !potionsInventory[potionId]) return;

    const updatedPotions = {
      ...potionsInventory,
      [potionId]: potionsInventory[potionId] - 1
    };
    setPotionsInventory(updatedPotions);

    const updatedBuffs = { ...activeBuffs };

    if (potionId === 'lucky_potion') {
      updatedBuffs.luckRemaining = 15;
      updatedBuffs.luckValue = 0.50;
    } else if (potionId === 'fortune_potion') {
      updatedBuffs.luckRemaining = 25;
      updatedBuffs.luckValue = 1.50;
    } else if (potionId === 'haste_elixir') {
      updatedBuffs.speedRemaining = 35;
      updatedBuffs.speedValue = 0.35;
    } else if (potionId === 'heavenly_potion') {
      updatedBuffs.heavenlyActive = true;
    }

    setActiveBuffs(updatedBuffs);
    saveStateToLocal(profile, quests, marketListings, chats, updatedPotions, updatedBuffs, currentBiome, ticksUntilBiomeChange, autoSellThreshold);
    logAnalytics('craft', `Consumed potion to amplify statistics: ${potionId}`);

    // Push system alert to local chat if Heavenly Potion is armed!
    if (potionId === 'heavenly_potion') {
      const announceChat: ChatMessage = {
        id: 'heavenly_' + Date.now(),
        username: 'System',
        message: `⚡ ${profile.username} HAS DRUNK A HEAVENLY POTION V2! THE NEXT SINGLE ROLL HAS +100,000% LUCK!`,
        equippedAuraName: 'Heavenly Charged',
        equippedAuraColor: '#d8b4fe',
        timestamp: Date.now()
      };
      setChats(prev => [...prev.slice(-30), announceChat]);
    }
  };

  // Gauntlet Equipment slot setters
  const handleEquipGauntlet = (slot: 'left' | 'right', gauntletId: string | null) => {
    if (!profile) return;
    const updatedProfile: PlayerProfile = {
      ...profile,
      equippedLeftGauntletId: slot === 'left' ? gauntletId : (profile.equippedLeftGauntletId ?? null),
      equippedRightGauntletId: slot === 'right' ? gauntletId : (profile.equippedRightGauntletId ?? null)
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile);
    logAnalytics('craft', gauntletId ? `Equipped ${gauntletId} on ${slot}-hand slot.` : `Unequipped ${slot}-hand equipment.`);
  };

  const handleForgeGauntlet = (gauntletId: string, auraInstanceIds: string[], coinsCost: number) => {
    if (!profile) return;

    // Filter out consumed aura elements from the inventory
    const updatedInventory = profile.inventory.filter(i => !auraInstanceIds.includes(i.id));
    const currentCrafted = profile.craftedGauntletIds || [];
    const updatedCrafted = currentCrafted.includes(gauntletId) ? currentCrafted : [...currentCrafted, gauntletId];

    const updatedProfile: PlayerProfile = {
      ...profile,
      inventory: updatedInventory,
      craftedGauntletIds: updatedCrafted,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins - coinsCost
      }
    };

    const updatedQuests = quests.map(q => {
      if (q.type === 'crafts') {
        return { ...q, currentValue: Math.min(q.targetValue, q.currentValue + 1) };
      }
      return q;
    });

    setProfile(updatedProfile);
    setQuests(updatedQuests);
    saveStateToLocal(updatedProfile, updatedQuests);
    logAnalytics('craft', `Forged legendary gauntlet: ${gauntletId}! Powerful stats unlocked!`);
  };

  // --- COMPANION COMPATIBILITY STATE CONTROLLERS ---
  // --- SECRET PROGRAMMATIC DEV COMMAND HANDLERS ---
  const handleVerifyTerminalPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (terminalPasswordInput.trim() === '1234') {
      setIsTerminalAuthorized(true);
      setTerminalLogs(prev => [
        ...prev,
        `📟 [SUCCESS] CODE GRANTED - ACCESS ENVELOPE ACTIVATED.`,
        `OPERATOR: ROOT LEVEL PRIVILEGES LOADED`,
        `-----------------------------------------------`,
        `CHRONO OVERLORD TELEMETRY CHANNELS ONLINE:`,
        ` - /give luck <number>  --> Magnify client base luck multiplier`,
        ` - /give coin <number>  --> Augment current treasure credits`,
        `-----------------------------------------------`
      ]);
      setTerminalPasswordInput('');
      playSuccessChime();
    } else {
      triggerHaptic(50);
      setTerminalLogs(prev => [
        ...prev,
        `❌ [DENIED] PASSCODE ACCESS ERROR: TOKEN "${terminalPasswordInput}" DOES NOT MATCH SYNC SIGNATURES.`
      ]);
      setTerminalPasswordInput('');
    }
  };

  const handleTerminalCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rawCmd = terminalCommandInput.trim();
    if (!rawCmd) return;

    setTerminalCommandInput('');
    setTerminalLogs(prev => [...prev, `operator@quantum-horizons:~# ${rawCmd}`]);

    const tokens = rawCmd.split(/\s+/);
    const cmdName = tokens[0]?.toLowerCase();

    if (cmdName === '/give') {
      const targetAttr = tokens[1]?.toLowerCase();
      const amountStr = tokens[2];
      const amount = amountStr ? parseFloat(amountStr) : NaN;

      if (isNaN(amount) || amount <= 0) {
        setTerminalLogs(prev => [
          ...prev,
          `❌ CMD RANGE REJECTED: Argument must be a positive number.`,
          `   Format: /give <luck|coin> <positive_number>`
        ]);
        triggerHaptic(50);
        return;
      }

      if (targetAttr === 'luck') {
        if (!profile) return;
        const updated = {
          ...profile,
          stats: {
            ...profile.stats,
            luckMultiplier: profile.stats.luckMultiplier + amount
          }
        };
        setProfile(updated);
        saveStateToLocal(updated);
        playSuccessChime();
        setTerminalLogs(prev => [
          ...prev,
          `⚡ SYSTEM: CREDITED CLIENT +${amount}x BASE LUCK MULTIPLIER!`,
          `   Current client default luck modifier is now: ${updated.stats.luckMultiplier.toFixed(2)}x`
        ]);
        logAnalytics('craft', `Operator executed quantum modifier: +${amount}x Luck!`);
      } else if (targetAttr === 'coin' || targetAttr === 'coins') {
        if (!profile) return;
        const updated = {
          ...profile,
          stats: {
            ...profile.stats,
            coins: profile.stats.coins + Math.floor(amount)
          }
        };
        setProfile(updated);
        saveStateToLocal(updated);
        playSuccessChime();
        setTerminalLogs(prev => [
          ...prev,
          `✨ SYSTEM: COIN BANK ACCREDITED!`,
          `   Added +${Math.floor(amount).toLocaleString()} Coins to treasury.`,
          `   Total treasury reserve: ${updated.stats.coins.toLocaleString()} Coins`
        ]);
        logAnalytics('market', `Operator executed resource allocation: +${Math.floor(amount)} Coins!`);
      } else {
        setTerminalLogs(prev => [
          ...prev,
          `❌ UNKNOWN REGISTER TARGET "${tokens[1]}". Valid targets listed:`,
          `   luck - amplify base default luck stats`,
          `   coin - inflate bank coin inventory`
        ]);
        triggerHaptic(50);
      }
    } else {
      setTerminalLogs(prev => [
        ...prev,
        `❌ UNHANDLED INSTRUCTION DIRECTIVE: "${cmdName}". Permitted ops:`,
        `   /give luck <number>`,
        `   /give coin <number>`
      ]);
      triggerHaptic(50);
    }
  };

  const handlePetEggHatch = (newPet: PlayerPet, costCoins: number) => {
    if (!profile) return;
    const currentPets = profile.ownedPets || [];
    const updatedProfile: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        coins: Math.max(0, profile.stats.coins - costCoins)
      },
      ownedPets: [...currentPets, newPet]
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile);
    logAnalytics('roll', `Hatched capsule companion pet: ${newPet.name}`);
  };

  const handleEquipPet = (petInstanceId: string | null) => {
    if (!profile) return;
    const updatedProfile: PlayerProfile = {
      ...profile,
      equippedPetId: petInstanceId
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile);
    logAnalytics('craft', petInstanceId ? `Equipped cute mascot companion.` : `Unequipped companion mascot.`);
  };

  const handleReleasePet = (petInstanceId: string, returnCoins: number) => {
    if (!profile) return;
    const currentPets = profile.ownedPets || [];
    const updatedPets = currentPets.filter(p => p.id !== petInstanceId);
    const updatedProfile: PlayerProfile = {
      ...profile,
      equippedPetId: profile.equippedPetId === petInstanceId ? null : profile.equippedPetId,
      ownedPets: updatedPets,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins + returnCoins
      }
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile);
    logAnalytics('market', `Recycled companion back to stardust for +${returnCoins} Coins.`);
  };

  const handleNicknamePet = (petInstanceId: string, newNickname: string) => {
    if (!profile) return;
    const currentPets = profile.ownedPets || [];
    const updatedPets = currentPets.map(p => {
      if (p.id === petInstanceId) {
        return { ...p, name: newNickname };
      }
      return p;
    });
    const updatedProfile: PlayerProfile = {
      ...profile,
      ownedPets: updatedPets
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile);
  };

  // Custom interactive 2D Map handler updates
  const handleMapAddCoins = (amount: number) => {
    if (!profile) return;
    const updatedProfile: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins + amount
      }
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile, quests, marketListings, chats, potionsInventory, activeBuffs, currentBiome, ticksUntilBiomeChange, autoSellThreshold);
  };

  const handleMapDeductCoins = (amount: number): boolean => {
    if (!profile || profile.stats.coins < amount) return false;
    const updatedProfile: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins - amount
      }
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile, quests, marketListings, chats, potionsInventory, activeBuffs, currentBiome, ticksUntilBiomeChange, autoSellThreshold);
    return true;
  };

  const handleMapAddPotion = (potionId: string, count: number) => {
    if (!profile) return;
    const updatedPotions = {
      ...potionsInventory,
      [potionId]: (potionsInventory[potionId] || 0) + count
    };
    setPotionsInventory(updatedPotions);
    saveStateToLocal(profile, quests, marketListings, chats, updatedPotions, activeBuffs, currentBiome, ticksUntilBiomeChange, autoSellThreshold);
  };

  const handleMapRemoveInventoryItem = (instanceId: string) => {
    if (!profile) return;
    const updatedInventory = profile.inventory.filter(i => i.id !== instanceId);
    const updatedProfile: PlayerProfile = {
      ...profile,
      inventory: updatedInventory
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile, quests, marketListings, chats, potionsInventory, activeBuffs, currentBiome, ticksUntilBiomeChange, autoSellThreshold);
  };

  const handleMapUpdateRollSpeed = (addSpeed: number) => {
    if (!profile) return;
    const updatedProfile: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        rollSpeedMultiplier: profile.stats.rollSpeedMultiplier + addSpeed
      }
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile, quests, marketListings, chats, potionsInventory, activeBuffs, currentBiome, ticksUntilBiomeChange, autoSellThreshold);
    logAnalytics('craft', `Upgraded machine roll speed multiplier by +${(addSpeed * 100).toFixed(0)}% from Jake!`);
  };

  const handleMapUpdateLuckMultiplier = (addLuck: number) => {
    if (!profile) return;
    const updatedProfile: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        luckMultiplier: profile.stats.luckMultiplier + addLuck
      }
    };
    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile, quests, marketListings, chats, potionsInventory, activeBuffs, currentBiome, ticksUntilBiomeChange, autoSellThreshold);
    logAnalytics('craft', `Upgraded permanent luck multiplier by +${(addLuck * 100).toFixed(0)}%!`);
  };

  const handleMapChangeBiome = (forcedBiome: string) => {
    if (!profile) return;
    setCurrentBiome(forcedBiome as any);
    setTicksUntilBiomeChange(35); // Reset rolls ticks to shift
    
    const weatherMsg: ChatMessage = {
      id: 'weather_cheat_' + Date.now(),
      username: 'Weather Guide Lime',
      message: `🌌 SHIFTED BIOME INTO [${forcedBiome.toUpperCase()}] USING ATMOSPHERIC OVERRIDE CONTROLS!`,
      equippedAuraName: 'Weather Controller',
      equippedAuraColor: '#10b981',
      timestamp: Date.now()
    };
    setChats(prev => [...prev.slice(-30), weatherMsg]);
    playSuccessChime();
    saveStateToLocal(profile, quests, marketListings, chats, potionsInventory, activeBuffs, forcedBiome, 35, autoSellThreshold);
  };

  // Secure Swap Trading Action complete
  const handleTradeComplete = (
    partnerName: string,
    offeredInstanceId: string | null,
    receivedAuraId: string | null,
    coinDiff: number
  ) => {
    if (!profile) return;

    let updatedInventory = [...profile.inventory];
    if (offeredInstanceId) {
      updatedInventory = updatedInventory.filter(i => i.id !== offeredInstanceId);
    }

    if (receivedAuraId) {
      const newInstanceId = 'inst_tr_' + Math.random().toString(36).substring(2, 9);
      updatedInventory.push({
        id: newInstanceId,
        auraId: receivedAuraId,
        equipped: false,
        acquiredAt: Date.now()
      });
    }

    // Progress quests for spends if negative diff
    const updatedQuests = quests.map(q => {
      if (q.type === 'coins_spent' && coinDiff < 0) {
        return { ...q, currentValue: Math.min(q.targetValue, q.currentValue + Math.abs(coinDiff)) };
      }
      return q;
    });

    const updatedProfile: PlayerProfile = {
      ...profile,
      inventory: updatedInventory,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins + coinDiff
      }
    };

    setProfile(updatedProfile);
    setQuests(updatedQuests);
    saveStateToLocal(updatedProfile, updatedQuests);
    logAnalytics('trade', `Executed atomic swap with broker ${partnerName}.`);

    setSaveLoadedAlert(`Trade complete! Swapped elements.`);
    setTimeout(() => setSaveLoadedAlert(''), 3000);
  };

  // Marketplace Listings Action
  const handleAddMarketListing = (auraInstanceId: string, price: number) => {
    if (!profile) return;

    const itemObj = profile.inventory.find(i => i.id === auraInstanceId);
    if (!itemObj) return;

    const newListing: MarketplaceListing = {
      id: 'market_list_' + Math.random().toString(36).substring(2, 9),
      sellerName: profile.username,
      sellerUuid: profile.uuid,
      auraId: itemObj.auraId,
      price,
      createdAt: Date.now(),
      status: 'active'
    };

    // Remove listed item from inventory during active queue listing
    const updatedInventory = profile.inventory.filter(i => i.id !== auraInstanceId);

    const updatedMarketListings = [newListing, ...marketListings];
    const updatedProfile = {
      ...profile,
      inventory: updatedInventory
    };

    setProfile(updatedProfile);
    setMarketListings(updatedMarketListings);
    saveStateToLocal(updatedProfile, quests, updatedMarketListings);
    logAnalytics('marketplace_sell', `Listed aura ${itemObj.auraId} on active global exchange index.`);
  };

  const handleBuyMarketListing = (listingId: string) => {
    if (!profile) return;

    const listObj = marketListings.find(l => l.id === listingId);
    if (!listObj) return;

    const newInstanceId = 'inst_buy_' + Math.random().toString(36).substring(2, 9);
    const updatedInventory = [...profile.inventory, {
      id: newInstanceId,
      auraId: listObj.auraId,
      equipped: false,
      acquiredAt: Date.now()
    }];

    // Mark listing as completed
    const updatedMarket = marketListings.map(l => {
      if (l.id === listingId) return { ...l, status: 'sold' as any };
      return l;
    });

    const updatedProfile: PlayerProfile = {
      ...profile,
      inventory: updatedInventory,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins - listObj.price
      }
    };

    setProfile(updatedProfile);
    setMarketListings(updatedMarket);
    saveStateToLocal(updatedProfile, quests, updatedMarket);
    logAnalytics('marketplace_sell', `Acquired listing of aura ${listObj.auraId} for ${listObj.price} Sol`);
  };

  const handleQuickSellImmediate = (auraInstanceId: string) => {
    if (!profile) return;

    const item = profile.inventory.find(i => i.id === auraInstanceId);
    if (!item) return;

    const aura = getAuraById(item.auraId);
    // Base recycle price calculation
    const value = aura.id === 'common' ? 5 : Math.floor(Math.sqrt(aura.probability) * 12) + Math.floor(aura.probability * 0.05) + 15;

    const updatedInventory = profile.inventory.filter(i => i.id !== auraInstanceId);
    const updatedProfile: PlayerProfile = {
      ...profile,
      inventory: updatedInventory,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins + value
      }
    };

    setProfile(updatedProfile);
    saveStateToLocal(updatedProfile);
    logAnalytics('marketplace_sell', `Fast liquidated aura element ${aura.name} for ${value} Coins.`);
  };

  // Claim Quest Reward
  const handleClaimQuestReward = (questId: string) => {
    if (!profile) return;

    const quest = quests.find(q => q.id === questId);
    if (!quest) return;

    const updatedQuests = quests.map(q => {
      if (q.id === questId) return { ...q, claimed: true };
      return q;
    });

    const updatedProfile: PlayerProfile = {
      ...profile,
      stats: {
        ...profile.stats,
        coins: profile.stats.coins + quest.rewardCoins,
        luckMultiplier: profile.stats.luckMultiplier + quest.rewardLuck
      }
    };

    setProfile(updatedProfile);
    setQuests(updatedQuests);
    saveStateToLocal(updatedProfile, updatedQuests);
    logAnalytics('quest_complete', `Redeemed daily task: ${quest.description}`);
  };

  const handleRefreshDailyQuests = () => {
    if (!profile) return;
    playClickSound();
    setQuests(INITIAL_QUESTS);
    saveStateToLocal(profile, INITIAL_QUESTS);
    setSaveLoadedAlert('Quests randomized and reset!');
    setTimeout(() => setSaveLoadedAlert(''), 3000);
  };

  const handleAddChatMsg = (composed: string) => {
    if (!profile) return;

    if (composed.startsWith('_bot_chat_:')) {
      const parsed: ChatMessage = JSON.parse(composed.substring(11));
      setChats(prev => [...prev.slice(-30), parsed]);
      return;
    }

    const equippedInst = profile.inventory.find(i => i.id === profile.equippedAuraId);
    const equippedAura = getAuraById(equippedInst?.auraId || 'common');

    const newChat: ChatMessage = {
      id: Math.random().toString(),
      username: profile.username,
      message: composed,
      equippedAuraName: equippedAura.name,
      equippedAuraColor: equippedAura.textColor,
      timestamp: Date.now()
    };

    setChats(prev => [...prev.slice(-30), newChat]);
  };

  const handleJoinTeam = (teamId: string) => {
    if (!profile) return;
    const updated = { ...profile, teamId };
    setProfile(updated);
    saveStateToLocal(updated);
    logAnalytics('trade', `Pledged allegiance under team guild division: ${teamId}.`);
  };

  // Matchmaking Queues
  const triggerArenaQueue = () => {
    if (!profile) return;
    playClickSound();
    setMatchingStatus('searching');
    setDuelLatency(Math.floor(Math.random() * 4) + 1); // 1-4ms ultra fast!

    const opponents = ['NovaBroker', 'MatrixPro', 'VoidCrasher', 'AntiMatter'];
    const selectedOpponent = opponents[Math.floor(Math.random() * opponents.length)];

    setTimeout(() => {
      setMatchingStatus('matched');
      const opponentScore = Math.floor(Math.random() * 200000);
      const playerEquipped = profile.inventory.find(i => i.id === profile.equippedAuraId);
      const playerAura = getAuraById(playerEquipped?.auraId || 'common');
      const winValue = playerAura.probability > opponentScore / 1000;

      setDuelOpponent({
        name: selectedOpponent,
        score: opponentScore,
        auraName: opponentScore > 50000 ? 'Nebula' : opponentScore > 10000 ? 'Celestial' : 'Rare',
        auraColor: opponentScore > 50000 ? '#e879f9' : opponentScore > 10000 ? '#c084fc' : '#60a5fa'
      });

      // Show winner sequence
      setTimeout(() => {
        if (winValue) {
          setMatchingStatus('duel_win');
          playSuccessChime();
          // Give rankPoints and some Sol Coins
          const updated = {
            ...profile,
            stats: {
              ...profile.stats,
              rankPoints: profile.stats.rankPoints + 50,
              coins: profile.stats.coins + 150
            }
          };
          setProfile(updated);
          saveStateToLocal(updated);
        } else {
          setMatchingStatus('duel_loss');
          triggerHaptic(100);
          const updated = {
            ...profile,
            stats: {
              ...profile.stats,
              rankPoints: Math.max(100, profile.stats.rankPoints - 25)
            }
          };
          setProfile(updated);
          saveStateToLocal(updated);
        }
      }, 1500);

    }, 2000);
  };

  // Cross-Platform Cloud Save Codes Generators
  const generateExportSaveCode = (): string => {
    if (!profile) return '';
    const stateObj = {
      profile,
      quests,
      marketListings
    };
    try {
      // Encapsulate to simple base64 string safely
      return btoa(JSON.stringify(stateObj));
    } catch {
      return '';
    }
  };

  const handleCopyCloudCode = () => {
    const code = generateExportSaveCode();
    navigator.clipboard.writeText(code);
    playClickSound();
    setSaveCopied(true);
    triggerHaptic(50);
    setTimeout(() => setSaveCopied(false), 3000);
  };

  const handleImportSaveCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importCodeStr.trim()) return;

    try {
      const decodedStr = atob(importCodeStr.trim());
      const stateParsed = JSON.parse(decodedStr);
      if (stateParsed && stateParsed.profile) {
        setProfile(stateParsed.profile);
        setQuests(stateParsed.quests || INITIAL_QUESTS);
        setMarketListings(stateParsed.marketListings || []);
        setUsername(stateParsed.profile.username);
        saveStateToLocal(stateParsed.profile, stateParsed.quests, stateParsed.marketListings);
        playSuccessChime();
        setSaveLoadedAlert('Cloud synchronised. State successfully re-linked!');
        setImportCodeStr('');
      } else {
        setSaveLoadedAlert('Invalid cloud backup segment syntax.');
      }
    } catch {
      setSaveLoadedAlert('Decryption of the cloud state segment failed.');
    }
    setTimeout(() => setSaveLoadedAlert(''), 4000);
  };

  const toggleSoundConfig = () => {
    const res = toggleGlobalSound();
    setAudioOn(res);
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-neutral-950 text-neutral-100 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <RefreshCw className="animate-spin text-indigo-400 mx-auto" size={36} />
          <p className="text-xs font-mono text-neutral-500">Retrieving offline blockchain index...</p>
        </div>
      </div>
    );
  }

  const activeEquippedInst = profile.inventory.find(i => i.id === profile.equippedAuraId);
  const activeEquippedAura = getAuraById(activeEquippedInst?.auraId || 'common');

  return (
    <div className="min-h-screen bg-[#050609] text-neutral-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 relative overflow-x-hidden retro-grid-backdrop pb-16">
      {/* Immersive Graphics Background Glows (Quantum Ambient Nebula) */}
      <div className="absolute top-10 left-1/4 w-[450px] h-[450px] rounded-full bg-indigo-900/[0.08] blur-[120px] pointer-events-none animate-core-pulse z-0" />
      <div className="absolute bottom-20 right-1/4 w-[500px] h-[500px] rounded-full bg-purple-950/[0.08] blur-[140px] pointer-events-none animate-core-pulse z-0" style={{ animationDelay: '3s' }} />
      
      {/* HEADER HUD BAR */}
      <header className="sticky top-0 z-50 bg-[#090b14]/90 backdrop-blur-md border-b border-neutral-900 px-4 md:px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 shadow-lg shadow-indigo-950/40 text-white">
              <Dices size={24} className="animate-pulse" />
            </div>
            <div>
              <h1 className="text-sm md:text-base font-black tracking-widest uppercase bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-1.5">
                Sol RNG 
                <span 
                  onClick={() => {
                    playClickSound();
                    setIsDevTerminalOpen(true);
                  }}
                  className="font-mono text-xs font-bold text-neutral-500 hover:text-indigo-400 px-1.5 py-0.5 rounded bg-neutral-900/80 border border-neutral-850 transition cursor-pointer flex items-center gap-0.5 select-none"
                  title="Unlock Secret Command Console"
                >
                  v2.40 <span className="text-[10px]">🔒</span>
                </span>
              </h1>
              <p className="text-[10px] text-neutral-500 font-mono tracking-wide">SEASON 2: QUANTUM HORIZONS</p>
            </div>
          </div>
          
          {/* Mobile icons menu */}
          <div className="flex items-center space-x-2 md:hidden">
            <button 
              onClick={toggleSoundConfig}
              className="p-1.5 rounded-lg bg-neutral-900 border border-neutral-800 text-neutral-400"
            >
              {audioOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>
            <span className="text-[9px] font-mono bg-indigo-500/10 text-indigo-400 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
              ● Live
            </span>
          </div>
        </div>

        {/* Mid Stats */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 justify-between md:justify-end">
          <div className="flex items-center space-x-3 text-xs">
            {/* Coin Wallet */}
            <div className="bg-neutral-950 px-3 py-1.5 bg-[#0e101f] border border-neutral-850 rounded-xl flex items-center space-x-1.5 shadow-sm">
              <DollarSign size={14} className="text-amber-400" />
              <span className="font-bold font-mono text-amber-300">{profile.stats.coins.toLocaleString()}</span>
              <span className="text-[9px] text-neutral-500 font-mono">Coins</span>
            </div>

            {/* Rank Points */}
            <div className="bg-neutral-950 px-3 py-1.5 bg-[#031518] border border-neutral-850 rounded-xl flex items-center space-x-1.5 shadow-sm">
              <Zap size={14} className="text-emerald-400" />
              <span className="font-bold font-mono text-slate-300">{profile.stats.rankPoints.toLocaleString()}</span>
              <span className="text-[9px] text-neutral-500 font-mono">Rating</span>
            </div>
          </div>

          {/* Cloud Sync Status */}
          <div className="hidden md:flex items-center space-x-2.5">
            <button 
              onClick={toggleSoundConfig}
              className="p-2 rounded-xl bg-[#0d0f19] hover:bg-neutral-800 border border-neutral-850 text-neutral-400 transition"
              title={audioOn ? 'Mute Sounds' : 'Unmute Sounds'}
            >
              {audioOn ? <Volume2 size={16} /> : <VolumeX size={16} />}
            </button>

            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-500/10 text-green-400 border border-green-500/20 rounded-full font-mono text-[10px] font-bold">
              <Wifi size={12} className="animate-pulse" /> CLOUD COMPATIBLE
            </span>
          </div>
        </div>
      </header>

      {/* CORE FRAME LAYOUT */}
      <main className="max-w-7xl mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: THE CENTRAL PARTICLE REACTOR (SOL RNG GENERATOR) */}
        <section className="lg:col-span-5 flex flex-col space-y-4">
          
          <AuraDisplay 
            aura={lastRolledAura} 
            isRolling={isRolling} 
            rollCount={profile.stats.rolls} 
          />

          {/* Roll modifiers banner */}
          <div className="bg-neutral-950 border border-neutral-850 p-3 rounded-2xl flex items-center justify-between font-mono text-[10px]">
            <div className="flex items-center space-x-2 text-indigo-400">
              <Zap size={14} className="shrink-0 animate-bounce" />
              <span>PASSIVE LUCK ENERGY CORRIDOR:</span>
            </div>
            <span className="font-bold text-green-400 text-xs px-2 py-0.5 rounded bg-green-500/5 border border-green-500/10">
              x{profile.stats.luckMultiplier.toFixed(2)} Luck
            </span>
          </div>

          {/* ACTIVE BIOME VISUAL ATMOSPHERE - HIGH FIDELITY */}
          {(() => {
            const biomeMetas = {
              normal: {
                name: 'Normal Weather Corridor',
                desc: 'Standard solar stream. Baseline rolling index rates active.',
                bg: 'bg-gradient-to-r from-blue-950/30 to-indigo-950/10',
                border: 'border-blue-500/20 text-blue-400',
                icon: '🌍',
                stats: 'Standard 1.0x Core Luck'
              },
              windy: {
                name: 'Swirling Windy Gales',
                desc: 'Intense micro-gales. The elusive [Wind Aura] probability increased by 10x (1:500)!',
                bg: 'bg-gradient-to-r from-teal-950/40 to-neutral-950/40 animate-pulse',
                border: 'border-teal-500/30 text-teal-400',
                icon: '💨',
                stats: '🌪️ 10x Wind Aura frequency!'
              },
              rainy: {
                name: 'Precipitating Acid Rain',
                desc: 'Static electric rain droplets. [Sapphire Aura] increased to 1:80 (6x easier)! Global rolls luck multiplied by 1.2x.',
                bg: 'bg-gradient-to-r from-cyan-950/40 to-neutral-950/40 border-cyan-500/30',
                border: 'border-cyan-500/40 text-cyan-400',
                icon: '🌧️',
                stats: '☔ +20% GLOBAL Luck, 6x Sapphire rate!'
              },
              snowy: {
                name: 'Glacial Cryo Blizzard',
                desc: 'Sub-zero cryo-fractures. Deep frozen elements are 3x easier to lock onto.',
                bg: 'bg-gradient-to-r from-sky-950/40 to-neutral-950/40',
                border: 'border-sky-400/20 text-sky-300',
                icon: '❄️',
                stats: '☃️ Glacial crystals unlocked!'
              },
              starfall: {
                name: '🌠 Neon Starfall Event',
                desc: 'Hyper-space astral shower! [Sovereign, Gargantua & Starscourge] 10x easier! [Galaxy & Nebula] 5x easier!',
                bg: 'bg-gradient-to-r from-indigo-950 text-indigo-200 border-indigo-500 animate-pulse',
                border: 'border-indigo-400 border-2 text-indigo-300 shadow-indigo-900/40 shadow-md',
                icon: '🌠',
                stats: '🌌 10x GARGANTUA/SOVEREIGN, 10x Starscourge!'
              },
              hell: {
                name: '🔥 Underworld Hellfire',
                desc: 'Fierce core brimstone waves. [Bloodlust] 6x easier! [Solar] 5x easier! [Ruby] rate scales to 1:20!',
                bg: 'bg-gradient-to-r from-red-950 text-red-200 border-red-500',
                border: 'border-red-500 text-red-400 shadow-red-950 shadow-md',
                icon: '🔥',
                stats: '🔥 6x BLOODLUST, 5x Solar, 6x Ruby!'
              },
              corruption: {
                name: '🦠 Parasitic Corrupted Void',
                desc: 'Decaying purple dimensional rot. [Abyssal Void, Impeached & Gravitational] 5x easier!',
                bg: 'bg-gradient-to-r from-fuchsia-950 text-fuchsia-250 border-fuchsia-500',
                border: 'border-fuchsia-500 text-fuchsia-400 shadow-fuchsia-950 shadow-sm',
                icon: '🦠',
                stats: '🧬 5x ABYSSAL VOID & IMPEACHED rate!'
              },
              glitch: {
                name: '⚠️ CRITICAL REALITY GLITCH ⚠️',
                desc: 'Server timeline failure! [Matrix & Cyber Glitch] 10x easier! Extreme rare [Glitch] aura rate limits shattered!',
                bg: 'bg-gradient-to-r from-rose-950 text-rose-100 border-red-600 bg-red-950/40 border-2 animate-bounce',
                border: 'border-rose-500 text-rose-300 shadow-rose-950/60 shadow-lg',
                icon: '👾',
                stats: '💀 10X MATRIX & CYBER GLITCH, 1:12k Glitch limit!'
              }
            };
            const meta = biomeMetas[currentBiome] || biomeMetas.normal;

            return (
              <div className={`p-4 rounded-2xl border ${meta.border} ${meta.bg} flex flex-col space-y-2.5 shadow-xl`}>
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <span className="text-xl leading-none">{meta.icon}</span>
                    <h4 className="text-sm font-black uppercase tracking-tight">{meta.name}</h4>
                  </div>
                  <span className="text-[10px] bg-black/40 px-2 py-0.5 rounded-full font-mono text-neutral-400 flex items-center gap-1">
                    ⌛ Shift: <strong>{ticksUntilBiomeChange} rolls</strong>
                  </span>
                </div>
                <p className="text-[10.5px] text-neutral-300 leading-relaxed font-sans">{meta.desc}</p>
                <div className="p-1.5 px-2 bg-black/40 rounded-lg text-[9.5px] font-mono text-amber-300 border border-neutral-800">
                  Active Buff: {meta.stats}
                </div>
              </div>
            );
          })()}

          {/* AUTO-SELL RATIO FILTERS PANEL */}
          <div className="bg-[#0b0c13]/60 backdrop-blur-md border border-neutral-800/80 p-4 rounded-2xl space-y-2 shadow-[0_8px_30px_rgb(0,0,0,0.5)] glow-card-border hover:border-indigo-500/15 duration-350 transition-all">
            <div className="flex justify-between items-center border-b border-neutral-850 pb-1.5">
              <span className="text-xs font-mono font-black text-neutral-300 uppercase flex items-center gap-1.5 tracking-wider">
                ♻️ Auto-Sell Filters
              </span>
              <span className="text-[9px] font-mono text-neutral-500">Auto-converts under-tier items to Coins</span>
            </div>
            
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-1.5 pt-1">
              {[
                { id: 'all', text: 'Keep All' },
                { id: '16', text: 'Keep ≥16' },
                { id: '128', text: 'Keep ≥128' },
                { id: '1000', text: 'Keep ≥1k' },
                { id: '10000', text: 'Keep ≥10k' },
                { id: '100000', text: 'Keep ≥100k' },
                { id: '1000000', text: 'Keep ≥1M' },
                { id: '10000000', text: 'Keep ≥10M' },
                { id: '100000000', text: 'Keep ≥100M' }
              ].map((filter) => {
                const isSelected = autoSellThreshold === filter.id;
                return (
                  <button
                    key={filter.id}
                    onClick={() => { playClickSound(); setAutoSellThreshold(filter.id); }}
                    className={`text-[10px] py-1 font-mono font-bold rounded-lg transition select-none ${
                      isSelected 
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.15)] font-black'
                        : 'bg-neutral-950 text-neutral-450 border border-neutral-850 hover:text-neutral-200'
                    }`}
                  >
                    {filter.text}
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] text-neutral-500 leading-tight">
              {autoSellThreshold === 'all' 
                ? 'Saving every single signature code. Warning: Backpack may clutter up rapidly.'
                : `Instantly liquidates any roll under 1:${parseInt(autoSellThreshold, 10).toLocaleString()} for squared-root bonus Coins.`}
            </p>
          </div>

          {/* Trigger Console Box */}
          <div className="bg-[#0b0c13]/80 backdrop-blur-md border border-neutral-800/80 p-4 sm:p-5 rounded-2xl space-y-4 shadow-[0_8px_30px_rgb(0,0,0,0.5)] glow-card-border hover:border-indigo-500/15 duration-350 transition-all">
            <div className="flex gap-2">
              <button
                onClick={executeRoll}
                disabled={autoRoll}
                className="flex-1 bg-gradient-to-tr from-indigo-500 via-indigo-600 to-purple-600 hover:from-indigo-400 hover:to-purple-500 py-3.5 rounded-xl font-bold font-mono text-sm tracking-widest shadow-xl shadow-indigo-950/60 hover:shadow-indigo-500/20 transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-40 flex items-center justify-center gap-2 select-none border border-indigo-500/25 text-white"
              >
                <Dices size={16} className="animate-spin text-white" /> ROLL SIGNAL
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3.5 pt-1.5">
              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-neutral-850">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Auto Roll</span>
                <button
                  onClick={() => { playClickSound(); setAutoRoll(!autoRoll); }}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${autoRoll ? 'bg-indigo-600' : 'bg-neutral-800'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${autoRoll ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between bg-black/40 p-2.5 rounded-xl border border-neutral-850">
                <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest">Speed Hack</span>
                <button
                  onClick={() => { playClickSound(); setSpeedRoll(!speedRoll); }}
                  className={`w-11 h-6 rounded-full transition-colors relative focus:outline-none ${speedRoll ? 'bg-purple-600' : 'bg-neutral-800'}`}
                >
                  <span className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-all duration-200 ${speedRoll ? 'left-6' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* USER SETTINGS / CLOUD CONTROL PORTLET */}
          <div className="bg-[#0b0c13]/60 backdrop-blur-md border border-neutral-800/80 p-4 rounded-2xl space-y-3 shadow-[0_8px_30px_rgb(0,0,0,0.5)] glow-card-border hover:border-indigo-500/15 duration-350 transition-all">
            <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
              <h4 className="text-xs font-mono font-black tracking-widest text-neutral-305 uppercase">Dynamic Cloud Operations</h4>
              <span className="text-[8.5px] font-mono text-neutral-500">Cross-Platform Sync ready</span>
            </div>

            {saveLoadedAlert && (
              <div className="p-2 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-mono rounded">
                {saveLoadedAlert}
              </div>
            )}

            {/* Username settings bar */}
            <form onSubmit={handleUpdateUsername} className="flex gap-2">
              <input
                type="text"
                placeholder="Declare broker name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 text-xs px-3 py-1.5 rounded-lg text-neutral-200 outline-none focus:border-indigo-500/50"
              />
              <button 
                type="submit" 
                className="text-[10px] font-mono px-3.5 py-1.5 bg-neutral-800 text-neutral-200 hover:bg-neutral-700 transition rounded-lg border border-neutral-750"
              >
                Set Name
              </button>
            </form>

            <div className="flex flex-col sm:flex-row gap-2 pt-1 font-mono text-[10px]">
              {/* Copy cloud code button */}
              <button
                onClick={handleCopyCloudCode}
                className="flex-1 flex items-center justify-center gap-1.5 bg-neutral-950 hover:bg-neutral-850 p-2 border border-neutral-800 rounded-xl text-neutral-300 transition"
              >
                {saveCopied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                {saveCopied ? 'Save Copied' : 'Export Save Code'}
              </button>
            </div>

            {/* Import cloud save box */}
            <form onSubmit={handleImportSaveCode} className="flex gap-2 pt-1">
              <input
                type="password"
                placeholder="Paste save code dynamic segment..."
                value={importCodeStr}
                onChange={(e) => setImportCodeStr(e.target.value)}
                className="flex-1 bg-neutral-950 border border-neutral-800 text-xs px-3 py-1.5 rounded-lg text-neutral-500 outline-none"
              />
              <button 
                type="submit"
                className="text-[10px] font-mono px-3 bg-indigo-950/40 text-indigo-400 hover:text-indigo-200 border border-indigo-500/20 rounded-lg transition"
              >
                Load String
              </button>
            </form>
          </div>

        </section>

        {/* RIGHT COLUMN: INTERACTIVE OPERATION DRAWER */}
        <section className="lg:col-span-7 flex flex-col space-y-4">
          
          {/* Main Action Tabs bar */}
          <nav className="flex bg-[#0e111d] p-1.5 rounded-2xl border border-neutral-850 overflow-x-auto gap-1">
            {[
              { id: 'map', icon: Map, text: 'Sol 2D Map' },
              { id: 'inventory', icon: Briefcase, text: 'Backpack & Forge' },
              { id: 'pets', icon: Heart, text: 'Mascot Sanctuary' },
              { id: 'trade', icon: ArrowLeftRight, text: 'Swap Brokers' },
              { id: 'market', icon: ShoppingBag, text: 'Market & Liquidate' },
              { id: 'social', icon: MessageSquare, text: 'Channels (Teams)' },
              { id: 'quests', icon: Trophy, text: 'Quests' },
              { id: 'arena', icon: Swords, text: 'Match Arena' },
              { id: 'codex', icon: BookOpen, text: 'Aura Codex' }
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => { playClickSound(); setActiveNav(tab.id); }}
                  className={`flex items-center space-x-1.5 text-xs font-semibold py-2 px-3.5 rounded-xl transition ${
                    activeNav === tab.id
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-950/40'
                      : 'text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <Icon size={14} />
                  <span className="hidden sm:inline">{tab.text}</span>
                </button>
              );
            })}
          </nav>

          {/* Active Navigation Render */}
          <div className="min-h-[460px]">
            {activeNav === 'map' && (
              <SolRNGMap 
                playerProfile={profile} 
                currentBiome={currentBiome} 
                ticksUntilBiomeChange={ticksUntilBiomeChange} 
                potionsInventory={potionsInventory} 
                activeBuffs={activeBuffs} 
                onAddCoins={handleMapAddCoins} 
                onDeductCoins={handleMapDeductCoins} 
                onAddPotion={handleMapAddPotion} 
                onRemoveInventoryItem={handleMapRemoveInventoryItem} 
                onUpdateRollSpeed={handleMapUpdateRollSpeed} 
                onUpdateLuckMultiplier={handleMapUpdateLuckMultiplier} 
                onChangeBiome={handleMapChangeBiome} 
                onTriggerMapRoll={executeRoll} 
              />
            )}

            {activeNav === 'inventory' && (
              <Inventory 
                playerProfile={profile} 
                onEquipAura={handleEquipAura} 
                onCraftDevice={handleCraftDevice} 
                potionsInventory={potionsInventory}
                activeBuffs={activeBuffs}
                onBrewPotion={handleBrewPotion}
                onUsePotion={handleUsePotion}
                onEquipGauntlet={handleEquipGauntlet}
                onForgeGauntlet={handleForgeGauntlet}
              />
            )}

            {activeNav === 'pets' && profile && (
              <PetSanctuary 
                playerProfile={profile} 
                onEggHatch={handlePetEggHatch} 
                onEquipPet={handleEquipPet} 
                onReleasePet={handleReleasePet} 
                onNicknamePet={handleNicknamePet} 
              />
            )}

            {activeNav === 'trade' && (
              <TradingSystem 
                playerProfile={profile} 
                onTradeComplete={handleTradeComplete} 
              />
            )}

            {activeNav === 'market' && (
              <Marketplace 
                playerProfile={profile} 
                marketListings={marketListings} 
                onAddListing={handleAddMarketListing} 
                onBuyListing={handleBuyMarketListing} 
                onQuickSell={handleQuickSellImmediate} 
              />
            )}

            {activeNav === 'social' && (
              <SocialHub 
                playerProfile={profile} 
                chats={chats} 
                onAddChat={handleAddChatMsg} 
                onJoinTeam={handleJoinTeam} 
              />
            )}

            {activeNav === 'quests' && (
              <QuestsAndLeaderboard 
                playerProfile={profile} 
                quests={quests} 
                onClaimQuest={handleClaimQuestReward} 
                onRefreshQuests={handleRefreshDailyQuests} 
              />
            )}

            {activeNav === 'arena' && (
              /* MATCHMAKING MULTIPLAYER SIMULATOR */
              <div id="match_arena_panel" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col space-y-4">
                <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-lg">
                      <Swords size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-base text-neutral-100 uppercase tracking-wider">Sub-Space Arena</h3>
                      <p className="text-xs text-neutral-500 font-sans">Multiplayer instant matching based on active rank score values</p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-neutral-500">Latency: {duelLatency}ms</span>
                </div>

                <AnimatePresence mode="wait">
                  {matchingStatus === 'idle' && (
                    <motion.div 
                      key="idle"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center p-8 space-y-4"
                    >
                      <p className="text-xs text-neutral-400 font-sans">
                        Challenge active global players. Opponents are selected instantly based on rank power index compatibility.
                      </p>
                      
                      <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl max-w-sm mx-auto space-y-1 text-center font-mono text-[10px]">
                        <p className="text-neutral-500 uppercase">Your Active Arena Signature</p>
                        <p className="font-bold text-indigo-400">{activeEquippedAura.name} (Rarity: 1 in {activeEquippedAura.probability.toLocaleString()})</p>
                      </div>

                      <button
                        onClick={triggerArenaQueue}
                        className="bg-emerald-600 hover:bg-emerald-500 py-2.5 px-8 font-bold font-mono text-xs rounded-xl text-white transition transform hover:scale-105 active:scale-95 shadow-md shadow-emerald-950/40 border border-emerald-500/20 select-none"
                      >
                        Find Opponent
                      </button>
                    </motion.div>
                  )}

                  {matchingStatus === 'searching' && (
                    <motion.div 
                      key="searching"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center p-8 space-y-3"
                    >
                      <RefreshCw className="animate-spin text-emerald-400 mx-auto" size={36} />
                      <p className="text-xs font-mono text-neutral-400 uppercase tracking-widest">Compiling matchmaking pools...</p>
                    </motion.div>
                  )}

                  {matchingStatus === 'matched' && (
                    <motion.div 
                      key="matched"
                      initial={{ opacity:0, scale:0.95 }}
                      animate={{ opacity:1, scale:1 }}
                      exit={{ opacity: 0 }}
                      className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl space-y-6 text-center"
                    >
                      <p className="text-xs font-mono text-emerald-400 font-bold uppercase tracking-wider animate-pulse">Opponent Locked - Beginning Duel!</p>
                      
                      <div className="grid grid-cols-5 items-center">
                        <div className="col-span-2 text-right">
                          <p className="text-sm font-bold text-indigo-400">{profile.username}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">1 in {activeEquippedAura.probability.toLocaleString()}</p>
                        </div>

                        <div className="col-span-1 text-center text-rose-500 text-sm font-black italic">VS</div>

                        <div className="col-span-2 text-left">
                          <p className="text-sm font-bold text-neutral-200">{duelOpponent?.name}</p>
                          <p className="text-[10px] text-neutral-500 font-mono">1 in {duelOpponent?.score?.toLocaleString()}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {(matchingStatus === 'duel_win' || matchingStatus === 'duel_loss') && (
                    <motion.div 
                      key="result"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 bg-neutral-950 border border-neutral-800 rounded-xl text-center space-y-4"
                    >
                      {matchingStatus === 'duel_win' ? (
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-green-400 tracking-wider">VICTORY SECURED</h4>
                          <p className="text-xs text-neutral-400">Your equipped {activeEquippedAura.name} aura easily overwhelmed {duelOpponent?.name}&apos;s element!</p>
                          <p className="text-[10px] font-mono text-amber-400">+150 Coins | +50 Rating Points</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <h4 className="text-xl font-black text-red-500 tracking-wider">DEFEAT RENDERED</h4>
                          <p className="text-xs text-neutral-400">Your equipped aura was overwhelmed by {duelOpponent?.name}&apos;s rare {duelOpponent?.auraName} (1 in {duelOpponent?.score?.toLocaleString()}).</p>
                          <p className="text-[10px] font-mono text-red-400">-25 Rating Points</p>
                        </div>
                      )}

                      <button
                        onClick={() => setMatchingStatus('idle')}
                        className="py-1.5 px-5 bg-neutral-800 text-neutral-200 text-xs font-mono rounded hover:bg-neutral-700 transition"
                      >
                        Return to Arena
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {activeNav === 'codex' && profile && (
              <AuraCodex playerProfile={profile} />
            )}
          </div>

        </section>

      </main>

      {/* CORE TELEMETRY FOOTER & REAL-TIME EVENT ANALYTICS */}
      <footer className="mt-8 border-t border-neutral-900 bg-[#060811] px-4 md:px-6 py-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 text-xs">
        
        {/* Anti Cheat / Anti macro log display */}
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
            <UserCheck size={14} />
          </div>
          <div>
            <p className="font-mono text-[10px] text-neutral-400 leading-snug font-semibold uppercase">SecuShield Anti-Cheat Ledger</p>
            <p className="text-[9px] text-neutral-500 font-mono">{antiCheatLog}</p>
          </div>
        </div>

        {/* Real-time analytical streaming metrics */}
        <div className="flex flex-wrap gap-4 font-mono text-[9px] text-neutral-500 text-right">
          <div>
            <span>SYSTEM ENTRU PY:</span> <span className="text-indigo-400 font-bold">12E-9 Hz</span>
          </div>
          <div>
            <span>RETE NTION SECU:</span> <span className="text-purple-400 font-bold">99.8%</span>
          </div>
          <div>
            <span>LATENCY DRIFT:</span> <span className="text-green-500 font-bold">0.62ms</span>
          </div>
        </div>

      </footer>

      {/* Cinematic Overlays */}
      <AnimatePresence>
        {activeCutsceneAura && (
          <AuraCutscene 
            aura={activeCutsceneAura} 
            onClose={() => setActiveCutsceneAura(null)} 
          />
        )}

        {isDevTerminalOpen && (
          <motion.div
            key="dev-terminal-modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Terminal Title Bar */}
              <div className="bg-neutral-950 border-b border-neutral-850 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="font-mono text-xs font-bold text-neutral-400 uppercase tracking-widest">
                    Chrono Control Console v2.40
                  </span>
                </div>
                <button
                  onClick={() => {
                    playClickSound();
                    setIsDevTerminalOpen(false);
                  }}
                  className="p-1 px-2.5 rounded bg-neutral-900 hover:bg-neutral-800 border border-neutral-850 hover:text-white transition text-[10px] font-mono cursor-pointer font-bold"
                >
                  [ESC] CLOSE
                </button>
              </div>

              {/* Terminal Logs Display Container */}
              <div className="p-4 bg-[#05060b] flex flex-col space-y-4">
                <div id="terminal_logs_box" className="h-64 overflow-y-auto bg-black border border-neutral-850/60 p-3 rounded-xl font-mono text-[11px] leading-relaxed select-text space-y-1.5 scroll-smooth">
                  {terminalLogs.map((log, idx) => (
                    <div 
                      key={idx} 
                      className={`whitespace-pre-wrap break-all ${
                        log.startsWith('❌') 
                          ? 'text-red-400' 
                          : log.startsWith('✅') || log.startsWith('📟') || log.startsWith('💰') || log.startsWith('✨') || log.startsWith('⚡')
                          ? 'text-emerald-400 font-bold' 
                          : log.startsWith('operator') || log.startsWith('>')
                          ? 'text-indigo-400 font-bold'
                          : 'text-neutral-350'
                      }`}
                    >
                      {log}
                    </div>
                  ))}
                </div>

                {/* Secret terminal controls */}
                {!isTerminalAuthorized ? (
                  <form onSubmit={handleVerifyTerminalPassword} className="flex gap-2 items-center">
                    <span className="font-mono text-xs text-neutral-400 shrink-0 select-none">CODE:</span>
                    <input
                      type="password"
                      placeholder="ENTER PIN CODE TO UNLOCK..."
                      value={terminalPasswordInput}
                      onChange={(e) => setTerminalPasswordInput(e.target.value)}
                      className="flex-1 bg-black border border-neutral-850 focus:border-red-500 rounded-xl px-4 py-2 font-mono text-xs text-center text-white placeholder-neutral-700 focus:outline-none focus:ring-1 focus:ring-red-500 transition-all uppercase tracking-widest"
                      maxLength={12}
                      autoFocus
                    />
                    <button
                      type="submit"
                      className="bg-red-950/20 hover:bg-red-900 border border-red-500/35 text-red-350 px-5 py-2 rounded-xl text-xs font-mono font-black transition cursor-pointer select-none"
                    >
                      DECRYPT
                    </button>
                  </form>
                ) : (
                  <div className="space-y-3">
                    {/* Input command box */}
                    <form onSubmit={handleTerminalCommandSubmit} className="flex gap-2 items-center bg-black border border-neutral-850 p-1.5 px-3 rounded-xl">
                      <span className="font-mono text-xs text-indigo-400 shrink-0 select-none">operator@quantum:~#</span>
                      <input
                        type="text"
                        placeholder="Type standard system commands..."
                        value={terminalCommandInput}
                        onChange={(e) => setTerminalCommandInput(e.target.value)}
                        className="flex-1 bg-transparent text-white font-mono text-xs focus:outline-none placeholder-neutral-700"
                        autoFocus
                      />
                      <button
                        type="submit"
                        className="bg-indigo-950/40 hover:bg-indigo-900 text-indigo-300 px-4 py-1.5 rounded-lg border border-indigo-500/20 text-xs font-mono font-bold transition cursor-pointer"
                      >
                        RUN
                      </button>
                    </form>

                    {/* Quick macros buttons */}
                    <div className="flex flex-wrap gap-2 items-center text-xs">
                      <span className="font-mono text-[10px] text-neutral-500">QUICK MACROS:</span>
                      <button
                        onClick={() => {
                          setTerminalCommandInput('/give luck 100');
                          playClickSound();
                        }}
                        className="p-1 px-2.5 rounded bg-neutral-950 border border-neutral-850 hover:border-indigo-500/45 text-neutral-400 hover:text-white font-mono text-[10px] transition cursor-pointer"
                      >
                        ⚡ luck 100
                      </button>
                      <button
                        onClick={() => {
                          setTerminalCommandInput('/give luck 10000');
                          playClickSound();
                        }}
                        className="p-1 px-2.5 rounded bg-neutral-950 border border-neutral-850 hover:border-indigo-500/45 text-neutral-400 hover:text-white font-mono text-[10px] transition cursor-pointer"
                      >
                        🔥 luck 10,000
                      </button>
                      <button
                        onClick={() => {
                          setTerminalCommandInput('/give coin 10000');
                          playClickSound();
                        }}
                        className="p-1 px-2.5 rounded bg-neutral-950 border border-neutral-850 hover:border-amber-500/45 text-neutral-400 hover:text-white font-mono text-[10px] transition cursor-pointer"
                      >
                        💰 coin 10k
                      </button>
                      <button
                        onClick={() => {
                          setTerminalCommandInput('/give coin 500000');
                          playClickSound();
                        }}
                        className="p-1 px-2.5 rounded bg-neutral-950 border border-neutral-850 hover:border-amber-500/45 text-neutral-400 hover:text-white font-mono text-[10px] transition cursor-pointer"
                      >
                        🌟 coin 500k
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
