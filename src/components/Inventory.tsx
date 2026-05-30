import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Briefcase, Sparkles, Filter, Search, ShieldCheck, CheckCircle2, 
  HelpCircle, Trash2, Zap, Hammer, ChevronRight, Settings, Flame,
  Cpu, Moon, Orbit, Crown, ShieldAlert, Volume2, Activity
} from 'lucide-react';
import { InventoryItem, PlayerStats, PlayerProfile, Aura } from '../types';
import { AURAS, getAuraById } from '../data/auras';
import { GAUNTS, GauntletItem, getGauntletById } from '../data/gauntlets';
import { playClickSound, playSuccessChime, triggerHaptic } from '../utils/sound';

const ICON_COMPONENTS: Record<string, React.ComponentType<any>> = {
  Cpu, Moon, Orbit, Crown, ShieldAlert, Zap, Hammer, Settings, Sparkles, Activity, Flame
};

export interface PotionRecipe {
  id: string;
  name: string;
  description: string;
  requiredAuraIds: string[]; // list of auraIds needed
  requiredCoins: number;
  type: 'luck' | 'speed' | 'heavenly';
  strength: number;
  durationRolls: number;
  colorClass: string;
  borderClass: string;
}

export const POTION_RECIPES: PotionRecipe[] = [
  {
    id: 'lucky_potion',
    name: 'Lucky Potion',
    description: 'A glowing lime liquid of boiled magical moss. Increases passive Luck multiplier by +0.50 flat for the next 15 rolls.',
    requiredAuraIds: ['common', 'common', 'uncommon'],
    requiredCoins: 50,
    type: 'luck',
    strength: 0.50,
    durationRolls: 15,
    colorClass: 'text-green-400 bg-green-950/20',
    borderClass: 'border-green-500/20'
  },
  {
    id: 'fortune_potion',
    name: 'Fortune Flask',
    description: 'An effervescent gold brew with amber flakes. Boosts luck multiplier by +1.50 for the next 25 rolls.',
    requiredAuraIds: ['rare', 'divinus', 'gilded'],
    requiredCoins: 200,
    type: 'luck',
    strength: 1.50,
    durationRolls: 25,
    colorClass: 'text-yellow-400 bg-yellow-950/20',
    borderClass: 'border-yellow-500/20'
  },
  {
    id: 'haste_elixir',
    name: 'Exo-Elixir of Haste',
    description: 'A vibrating blue liquid inside a reinforced lead tube. Drastically decreases roll intermissions (comp. speed +35%) for 35 rolls.',
    requiredAuraIds: ['uncommon', 'uncommon', 'magnetic'],
    requiredCoins: 120,
    type: 'speed',
    strength: 0.35,
    durationRolls: 35,
    colorClass: 'text-cyan-400 bg-cyan-950/20',
    borderClass: 'border-cyan-500/20'
  },
  {
    id: 'heavenly_potion',
    name: 'Heavenly Potion v2',
    description: 'The supreme holy Grail. Grants +100,000% (+1,000.0) Luck multiplier for EXACTLY ONE single roll. True godhood awaits.',
    requiredAuraIds: ['gilded', 'gilded', 'divinus', 'emerald'],
    requiredCoins: 1200,
    type: 'heavenly',
    strength: 1000.0,
    durationRolls: 1,
    colorClass: 'text-purple-400 bg-purple-950/30 animate-pulse',
    borderClass: 'border-purple-500/45'
  }
];

interface InventoryProps {
  playerProfile: PlayerProfile;
  onEquipAura: (itemInstanceId: string | null) => void;
  onCraftDevice: (recipeId: string, auraInstanceIds: string[], statsCost: { coins: number }, luckBoost: number, speedBoost: number) => void;
  potionsInventory: { [potionId: string]: number };
  activeBuffs: {
    luckRemaining: number;
    luckValue: number;
    speedRemaining: number;
    speedValue: number;
    heavenlyActive: boolean;
  };
  onBrewPotion: (recipeId: string, auraInstanceIds: string[], coinsCost: number) => void;
  onUsePotion: (potionId: string) => void;
  onEquipGauntlet?: (slot: 'left' | 'right', gauntletId: string | null) => void;
  onForgeGauntlet?: (gauntletId: string, auraInstanceIds: string[], coinsCost: number) => void;
}

interface CraftRecipe {
  id: string;
  name: string;
  description: string;
  requiredAuraIds: string[]; // List of auraIds needed
  requiredCoins: number;
  luckMultiplierAdd: number;
  rollSpeedMultiplierAdd: number;
  icon: string;
}

const RECIPES: CraftRecipe[] = [
  {
    id: 'luck_talisman_1',
    name: 'Luck Talisman v1',
    description: 'A modest stone woven with magnetic wire. Boosts passive Luck multiplier.',
    requiredAuraIds: ['common', 'uncommon', 'rare'],
    requiredCoins: 150,
    luckMultiplierAdd: 0.10,
    rollSpeedMultiplierAdd: 0,
    icon: 'Zap'
  },
  {
    id: 'heavenly_device_1',
    name: 'Heavenly Device v1',
    description: 'An ancient mechanical module compressing quartz plasma energy lines.',
    requiredAuraIds: ['gilded', 'ruby', 'emerald'],
    requiredCoins: 500,
    luckMultiplierAdd: 0.25,
    rollSpeedMultiplierAdd: 0.05,
    icon: 'Hammer'
  },
  {
    id: 'velocity_engine_1',
    name: 'Exo-Velocity Engine',
    description: 'Lightweight structural alloy designed to trigger extremely fast rolling ticks.',
    requiredAuraIds: ['uncommon', 'gilded', 'quartz'],
    requiredCoins: 800,
    luckMultiplierAdd: 0,
    rollSpeedMultiplierAdd: 0.20,
    icon: 'Settings'
  },
  {
    id: 'supreme_singularity',
    name: 'Supreme Singularity Ring',
    description: 'A mythical ring harnessing gravitational fields. Majorly augments performance.',
    requiredAuraIds: ['celestial', 'diamond', 'sapphire'],
    requiredCoins: 2500,
    luckMultiplierAdd: 0.50,
    rollSpeedMultiplierAdd: 0.15,
    icon: 'Sparkles'
  }
];

export default function Inventory({ 
  playerProfile, 
  onEquipAura, 
  onCraftDevice,
  potionsInventory,
  activeBuffs,
  onBrewPotion,
  onUsePotion,
  onEquipGauntlet,
  onForgeGauntlet
}: InventoryProps) {
  const [activeTab, setActiveTab] = useState<'inventory' | 'crafting' | 'alchemy' | 'gauntlets'>('inventory');
  
  // Search state
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [craftStatus, setCraftStatus] = useState<string>('');

  // Find occurrences of ingredients in standard inventory which are not equipped
  const getIngredientMatches = (requiredAuraIds: string[]): { [auraId: string]: string[] } => {
    const matches: { [auraId: string]: string[] } = {};
    requiredAuraIds.forEach(id => {
      matches[id] = [];
    });

    playerProfile.inventory.forEach(item => {
      if (item.id === playerProfile.equippedAuraId) return; // Cannot craft/brew with equipped
      if (requiredAuraIds.includes(item.auraId)) {
        matches[item.auraId].push(item.id);
      }
    });

    return matches;
  };

  const handleCraft = (recipe: CraftRecipe) => {
    if (playerProfile.stats.coins < recipe.requiredCoins) {
      setCraftStatus(`Crafting failed: Insufficient coins. Needs ${recipe.requiredCoins} Sol Coins.`);
      triggerHaptic(50);
      return;
    }

    const matches = getIngredientMatches(recipe.requiredAuraIds);
    const instanceIdsToConsume: string[] = [];
    let possible = true;

    // We must count occurrences correctly of ingredients (some might repeat)
    const requiredCounts: { [auraId: string]: number } = {};
    recipe.requiredAuraIds.forEach(id => {
      requiredCounts[id] = (requiredCounts[id] || 0) + 1;
    });

    for (const requiredId of Object.keys(requiredCounts)) {
      const needed = requiredCounts[requiredId];
      const available = matches[requiredId] || [];
      if (available.length >= needed) {
        // Take them
        for (let idx = 0; idx < needed; idx++) {
          instanceIdsToConsume.push(available[idx]);
        }
      } else {
        possible = false;
        break;
      }
    }

    if (!possible) {
      setCraftStatus(`Crafting failed: Missing required ingredients.`);
      triggerHaptic(50);
      return;
    }

    onCraftDevice(
      recipe.id,
      instanceIdsToConsume,
      { coins: recipe.requiredCoins },
      recipe.luckMultiplierAdd,
      recipe.rollSpeedMultiplierAdd
    );

    playSuccessChime();
    triggerHaptic(100);
    setCraftStatus(`Assembled ${recipe.name}! Multipliers successfully scaled up.`);
    setTimeout(() => setCraftStatus(''), 5000);
  };

  const handleBrewPotionClick = (recipe: PotionRecipe) => {
    if (playerProfile.stats.coins < recipe.requiredCoins) {
      setCraftStatus(`Alchemy failed: Insufficient coins. Needs ${recipe.requiredCoins} Sol Coins.`);
      triggerHaptic(50);
      return;
    }

    const matches = getIngredientMatches(recipe.requiredAuraIds);
    const instanceIdsToConsume: string[] = [];
    let possible = true;

    const requiredCounts: { [auraId: string]: number } = {};
    recipe.requiredAuraIds.forEach(id => {
      requiredCounts[id] = (requiredCounts[id] || 0) + 1;
    });

    for (const requiredId of Object.keys(requiredCounts)) {
      const needed = requiredCounts[requiredId];
      const available = matches[requiredId] || [];
      if (available.length >= needed) {
        for (let idx = 0; idx < needed; idx++) {
          instanceIdsToConsume.push(available[idx]);
        }
      } else {
        possible = false;
        break;
      }
    }

    if (!possible) {
      setCraftStatus(`Alchemy failed: Missing required list ingredients.`);
      triggerHaptic(50);
      return;
    }

    onBrewPotion(recipe.id, instanceIdsToConsume, recipe.requiredCoins);
    playSuccessChime();
    triggerHaptic(80);
    setCraftStatus(`Successfully brewed 1x ${recipe.name}! Liquid added to flask storage.`);
    setTimeout(() => setCraftStatus(''), 5000);
  };

  const filteredItems = playerProfile.inventory.filter(item => {
    const aura = getAuraById(item.auraId);
    const matchesSearch = aura.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          aura.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRarity = rarityFilter === 'all' || aura.rarityText.toLowerCase().includes(rarityFilter.toLowerCase());
    return matchesSearch && matchesRarity;
  });

  return (
    <div id="inventory_sub_system" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col space-y-4">
      {/* Tab select header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-2">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-rose-950/40 border border-rose-500/20 text-rose-400 rounded-lg">
            <Briefcase size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-100 flex items-center gap-1.5">
              Quantum Vault, Forge & Synthesizer
              <span className="text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Full-Feature Block
              </span>
            </h3>
            <p className="text-xs text-neutral-500">Safeguard spatial alignments, forge multi-dimensional multipliers, or synthesize temporary cosmic catalysts</p>
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-neutral-950 p-1 rounded-xl border border-neutral-800 scrollbar-none overflow-x-auto max-w-full">
          <button
            onClick={() => { playClickSound(); setActiveTab('inventory'); }}
            className={`text-xs px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'inventory'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            <Briefcase size={12} /> Chrono-Vault
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('gauntlets'); }}
            className={`text-xs px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'gauntlets'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            <Cpu size={12} className="text-emerald-400 animate-pulse" /> Anomalous Over-Loaders
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('crafting'); }}
            className={`text-xs px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'crafting'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            <Hammer size={12} /> Catalyst Crucible
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('alchemy'); }}
            className={`text-xs px-2.5 py-1.5 rounded-lg transition font-medium flex items-center gap-1 whitespace-nowrap ${
              activeTab === 'alchemy'
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/10 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-100'
            }`}
          >
            <Flame size={12} className="text-orange-400 animate-pulse" /> Spectrum Synthesizer
          </button>
        </div>
      </div>

      {craftStatus && (
        <div className="p-2.5 rounded-lg bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-mono">
          {craftStatus}
        </div>
      )}

      {/* Main Container */}
      <AnimatePresence mode="wait">
        {activeTab === 'inventory' && (
          <motion.div
            key="inventory_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Active Gauntlet / Glove Rig Area */}
            <div className="bg-neutral-950 border border-neutral-850 p-3.5 rounded-xl space-y-2.5">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-extrabold flex items-center gap-1.5 border-b border-neutral-900 pb-1.5">
                🦾 Active Dual-Rig Glove Ports
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Left Hand Slot */}
                {(() => {
                  const leftId = playerProfile.equippedLeftGauntletId;
                  const leftG = leftId ? getGauntletById(leftId) : null;
                  const LeftIcon = leftG && ICON_COMPONENTS[leftG.icon] ? ICON_COMPONENTS[leftG.icon] : Cpu;

                  return (
                    <div className={`p-2.5 rounded-lg bg-black/40 border flex items-center justify-between transition-all ${
                      leftG ? 'border-emerald-500/20 shadow-inner' : 'border-neutral-850 opacity-60'
                    }`}>
                      <div className="flex items-center space-x-2.5 font-sans">
                        <div className="p-2 rounded-md bg-neutral-950 border border-neutral-850">
                          <LeftIcon size={16} className={leftG ? 'text-emerald-400 animate-pulse' : 'text-neutral-600'} />
                        </div>
                        <div>
                          <p className="text-[8px] font-mono text-neutral-400 uppercase leading-none">Left Hand Slot (Passive Luck)</p>
                          <p className="text-xs font-black text-neutral-255 mt-1 leading-tight truncate max-w-[125px]">{leftG ? leftG.name : 'Unmounted Rig'}</p>
                          {leftG ? (
                            <p className="text-[9.5px] text-emerald-400 font-mono font-medium mt-0.5">
                              +{leftG.luckMultiplierAdd.toFixed(2)}x Luck | +{(leftG.rollSpeedMultiplierAdd * 100).toFixed(0)}% Spd
                            </p>
                          ) : (
                            <p className="text-[9px] text-neutral-500 font-mono mt-0.5">Link Forged Gauntlet</p>
                          )}
                        </div>
                      </div>

                      {leftG ? (
                        <button
                          onClick={() => {
                            playClickSound();
                            if (onEquipGauntlet) onEquipGauntlet('left', null);
                          }}
                          className="px-2 py-1 font-mono text-[9.5px] font-extrabold text-rose-400 bg-rose-950/20 hover:bg-rose-500/20 rounded border border-rose-500/10 transition"
                        >
                          Unequip
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono text-neutral-650 pr-2 select-none">Socket Free</span>
                      )}
                    </div>
                  );
                })()}

                {/* Right Hand Slot */}
                {(() => {
                  const rightId = playerProfile.equippedRightGauntletId;
                  const rightG = rightId ? getGauntletById(rightId) : null;
                  const RightIcon = rightG && ICON_COMPONENTS[rightG.icon] ? ICON_COMPONENTS[rightG.icon] : Orbit;

                  return (
                    <div className={`p-2.5 rounded-lg bg-black/40 border flex items-center justify-between transition-all ${
                      rightG ? 'border-cyan-500/20 shadow-inner' : 'border-neutral-850 opacity-60'
                    }`}>
                      <div className="flex items-center space-x-2.5 font-sans">
                        <div className="p-2 rounded-md bg-neutral-950 border border-neutral-850">
                          <RightIcon size={16} className={rightG ? 'text-cyan-400 animate-pulse' : 'text-neutral-600'} />
                        </div>
                        <div>
                          <p className="text-[8px] font-mono text-neutral-400 uppercase leading-none">Right Hand Slot (Roll Velocity)</p>
                          <p className="text-xs font-black text-neutral-255 mt-1 leading-tight truncate max-w-[125px]">{rightG ? rightG.name : 'Unmounted Rig'}</p>
                          {rightG ? (
                            <p className="text-[9.5px] text-cyan-400 font-mono font-medium mt-0.5">
                              +{rightG.luckMultiplierAdd.toFixed(2)}x Luck | +{(rightG.rollSpeedMultiplierAdd * 100).toFixed(0)}% Spd
                            </p>
                          ) : (
                            <p className="text-[9px] text-neutral-500 font-mono mt-0.5">Link Forged Device</p>
                          )}
                        </div>
                      </div>

                      {rightG ? (
                        <button
                          onClick={() => {
                            playClickSound();
                            if (onEquipGauntlet) onEquipGauntlet('right', null);
                          }}
                          className="px-2 py-1 font-mono text-[9.5px] font-extrabold text-rose-400 bg-rose-950/20 hover:bg-rose-500/20 rounded border border-rose-500/10 transition"
                        >
                          Unequip
                        </button>
                      ) : (
                        <span className="text-[9px] font-mono text-neutral-650 pr-2 select-none">Socket Free</span>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Search/filter panel */}
            <div className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-2.5 top-2.5 text-neutral-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Identify spectral signature name..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg text-xs p-2 pl-8 text-neutral-200 outline-none"
                />
              </div>

              <div className="flex items-center space-x-2 bg-neutral-950 px-2 rounded-lg border border-neutral-800">
                <Filter size={12} className="text-neutral-500 ml-1" />
                <select
                  value={rarityFilter}
                  onChange={(e) => setRarityFilter(e.target.value)}
                  className="bg-transparent border-none text-xs text-neutral-400 p-1.5 outline-none select-none max-w-[120px]"
                >
                  <option value="all">All Tiers</option>
                  <option value="common">Common</option>
                  <option value="uncommon">Uncommon</option>
                  <option value="epic">Epic</option>
                  <option value="legendary">Legendary</option>
                  <option value="mythic">Mythic</option>
                  <option value="cosmic">Cosmic</option>
                  <option value="godly">Godly</option>
                </select>
              </div>
            </div>

            {/* Inventory Grid list */}
            {filteredItems.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950 border border-neutral-800 border-dashed rounded-xl space-y-1">
                <p className="text-xs text-neutral-500 font-mono">Backpack Empty</p>
                <p className="text-[10px] text-neutral-600">Perform sub-atomic rolls to acquire your first spectral signals.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
                {filteredItems.map((item) => {
                  const aura = getAuraById(item.auraId);
                  const isEquipped = item.id === playerProfile.equippedAuraId;

                  return (
                    <div 
                      key={item.id}
                      className={`p-3 bg-neutral-950 border rounded-xl flex flex-col justify-between transition-colors relative ${
                        isEquipped ? 'border-green-500 bg-neutral-900/60' : 'border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      {isEquipped && (
                        <span className="absolute top-2 right-2 text-green-400">
                          <CheckCircle2 size={14} className="fill-green-950" />
                        </span>
                      )}

                      <div className="space-y-1.5">
                        <span 
                          className="text-xs font-black block tracking-tight truncate pr-4"
                          style={{ color: aura.textColor }}
                        >
                          {aura.name}
                        </span>
                        <div className="space-y-0.5">
                          <p className="text-[8.5px] font-mono text-neutral-500 uppercase">{aura.rarityText}</p>
                          <p className="text-[9px] font-mono text-neutral-400">1:{aura.probability.toLocaleString()}</p>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          playClickSound();
                          onEquipAura(isEquipped ? null : item.id);
                        }}
                        className={`w-full mt-3 py-1 font-mono text-[9px] font-bold rounded ${
                          isEquipped 
                            ? 'bg-neutral-800 hover:bg-neutral-700 text-neutral-300' 
                            : 'bg-indigo-950/30 hover:bg-indigo-600/30 text-indigo-400 hover:text-indigo-200 border border-indigo-500/20'
                        } transition`}
                      >
                        {isEquipped ? 'Unequip' : 'Equip Element'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'crafting' && (
          <motion.div
            key="crafting_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {RECIPES.map((recipe) => {
                const matches = getIngredientMatches(recipe.requiredAuraIds);
                let craftable = playerProfile.stats.coins >= recipe.requiredCoins;

                // Build unique counts for checks
                const requiredCounts: { [auraId: string]: number } = {};
                recipe.requiredAuraIds.forEach(id => {
                  requiredCounts[id] = (requiredCounts[id] || 0) + 1;
                });

                const ingredientsList = Object.keys(requiredCounts).map((requiredId, index) => {
                  const aura = getAuraById(requiredId);
                  const needed = requiredCounts[requiredId];
                  const availableCount = (matches[requiredId] || []).length;
                  const satisfied = availableCount >= needed;
                  if (!satisfied) craftable = false;

                  return (
                    <div key={`${requiredId}-${index}`} className="flex justify-between items-center text-[10px] bg-neutral-950 p-1 px-2 rounded border border-neutral-900">
                      <span style={{ color: aura.textColor }} className="font-bold flex items-center gap-1">
                        ● {aura.name}
                      </span>
                      <span className={`font-mono font-bold ${satisfied ? 'text-green-400' : 'text-neutral-500'}`}>
                        {availableCount}/{needed}
                      </span>
                    </div>
                  );
                });

                return (
                  <div 
                    key={recipe.id}
                    className="p-4 bg-neutral-950 border border-neutral-800 rounded-xl flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center border-b border-neutral-900 pb-1">
                          <span className="text-xs font-black text-rose-300 uppercase font-sans">{recipe.name}</span>
                          <span className="text-[9px] font-mono text-amber-400 flex items-center">
                            Cost: {recipe.requiredCoins} Sol
                          </span>
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-normal mt-1 font-sans">{recipe.description}</p>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[8px] uppercase tracking-wider font-mono text-neutral-500">Atomic Ingredients:</p>
                        {ingredientsList}
                      </div>

                      <div className="bg-rose-500/5 p-1.5 px-2 rounded border border-rose-500/10 text-[9px] text-neutral-400 font-mono flex justify-between">
                        <span>Buff Payout:</span>
                        <span className="text-rose-400 font-bold">
                          {recipe.luckMultiplierAdd > 0 ? `+${recipe.luckMultiplierAdd * 100}% Passive Luck` : ''}
                          {recipe.rollSpeedMultiplierAdd > 0 ? `+${recipe.rollSpeedMultiplierAdd * 100}% Comp. speed` : ''}
                        </span>
                      </div>
                    </div>

                    <button
                      disabled={!craftable}
                      onClick={() => handleCraft(recipe)}
                      className="w-full mt-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center gap-1"
                    >
                      <Hammer size={12} /> Forge Device
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {activeTab === 'alchemy' && (
          <motion.div
            key="alchemy_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Real-time active buffs container */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-neutral-950 p-4 rounded-xl border border-neutral-800">
              <div>
                <h4 className="text-xs font-extrabold text-neutral-300 uppercase mb-2 flex items-center gap-1.5">
                  <Flame size={12} className="text-orange-500" /> Active Flask Buffs
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs text-neutral-400">
                    <span>Lucky Buff:</span>
                    <span className={`font-mono font-bold ${activeBuffs.luckRemaining > 0 ? 'text-green-400 animate-pulse' : 'text-neutral-600'}`}>
                      {activeBuffs.luckRemaining > 0 ? `+${activeBuffs.luckValue.toFixed(1)}x Luck (${activeBuffs.luckRemaining} rolls)` : 'Inactive'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-neutral-400">
                    <span>Haste Buff:</span>
                    <span className={`font-mono font-bold ${activeBuffs.speedRemaining > 0 ? 'text-cyan-400 animate-pulse' : 'text-neutral-600'}`}>
                      {activeBuffs.speedRemaining > 0 ? `+${(activeBuffs.speedValue * 100).toFixed(0)}% Speed (${activeBuffs.speedRemaining} rolls)` : 'Inactive'}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-extrabold text-neutral-300 uppercase mb-2 flex items-center gap-1.5">
                  ⭐ Heavenly Charge (1 Roll Boost)
                </h4>
                <div className="p-3 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-center flex flex-col items-center justify-center">
                  <span className={`text-[10px] uppercase font-bold tracking-widest ${activeBuffs.heavenlyActive ? 'text-fuchsia-400 animate-bounce' : 'text-neutral-500'}`}>
                    {activeBuffs.heavenlyActive ? '🌟 HEAVENLY CHARGED (1000x Luck!)' : 'No Charge Active'}
                  </span>
                  <p className="text-[9px] text-neutral-500 mt-1 whitespace-normal">
                    Heavenly Potions completely eliminate standard rules. Next single roll has 1000x greater chance for Mythic, Infinite, and Sovereign auras!
                  </p>
                </div>
              </div>
            </div>

            {/* Brewing potions table */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Potions Cookbook Recipes</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {POTION_RECIPES.map((recipe) => {
                  const matches = getIngredientMatches(recipe.requiredAuraIds);
                  let brewable = playerProfile.stats.coins >= recipe.requiredCoins;

                  // Unique counts
                  const requiredCounts: { [auraId: string]: number } = {};
                  recipe.requiredAuraIds.forEach(id => {
                    requiredCounts[id] = (requiredCounts[id] || 0) + 1;
                  });

                  const ingredientsText = Object.keys(requiredCounts).map((requiredId, index) => {
                    const aura = getAuraById(requiredId);
                    const needed = requiredCounts[requiredId];
                    const availableCount = (matches[requiredId] || []).length;
                    const satisfied = availableCount >= needed;
                    if (!satisfied) brewable = false;

                    return (
                      <span 
                        key={index} 
                        style={{ color: aura.textColor }}
                        className={`text-[9.5px] px-1.5 py-0.5 rounded bg-neutral-900 border border-neutral-950 font-bold ${satisfied ? 'opacity-100' : 'opacity-40'}`}
                      >
                        {aura.name}: {availableCount}/{needed}
                      </span>
                    );
                  });

                  // Check if player already owns this brewed potion
                  const ownedQuantity = potionsInventory[recipe.id] || 0;

                  return (
                    <div 
                      key={recipe.id}
                      className={`p-4 bg-neutral-950/90 border border-neutral-800 rounded-xl flex flex-col justify-between ${recipe.borderClass}`}
                    >
                      <div className="space-y-3">
                        <div className="flex justify-between items-start border-b border-neutral-900 pb-1.5">
                          <div>
                            <span className={`text-xs font-black uppercase tracking-wide tracking-tight ${recipe.colorClass} px-2 py-0.5 rounded-md`}>
                              {recipe.name}
                            </span>
                            <span className="text-[10px] text-neutral-500 block mt-1">Owned: <strong className="text-indigo-400">{ownedQuantity}x</strong></span>
                          </div>
                          <span className="text-[10px] font-mono text-amber-500">
                            {recipe.requiredCoins} Coins
                          </span>
                        </div>

                        <p className="text-[10px] text-neutral-400 leading-normal font-sans">{recipe.description}</p>

                        <div className="space-y-1">
                          <p className="text-[8px] uppercase font-mono text-neutral-500">Brewing Materials:</p>
                          <div className="flex flex-wrap gap-1.5">
                            {ingredientsText}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <button
                          disabled={!brewable}
                          onClick={() => handleBrewPotionClick(recipe)}
                          className="py-1.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 text-neutral-100 text-[10px] font-mono font-bold rounded transition disabled:opacity-30 disabled:cursor-not-allowed select-none"
                        >
                          🧪 Brew Flask
                        </button>

                        <button
                          disabled={ownedQuantity <= 0}
                          onClick={() => {
                            playClickSound();
                            onUsePotion(recipe.id);
                          }}
                          className={`py-1.5 text-[10px] font-mono font-bold rounded transition disabled:opacity-30 disabled:cursor-not-allowed select-none ${
                            recipe.id === 'heavenly_potion' 
                              ? 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white animate-pulse'
                              : 'bg-green-600 hover:bg-green-500 text-white'
                          }`}
                        >
                          ⚡ Drink ({ownedQuantity})
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'gauntlets' && (
          <motion.div
            key="gauntlets_view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4 font-sans"
          >
            <div className="p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-1">
              <h4 className="text-xs font-black text-emerald-400 uppercase">🔬 Exo-Dynamics Heavy Forge Rigs</h4>
              <p className="text-[10px] text-neutral-400">
                Unlock heavyweight Left-Hand and Right-Hand heavy attachments using exceptionally rare auras. Rigs grant massive static bonuses to rolls, multiplier ticks, and resource liquidations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {GAUNTS.map((g) => {
                const isOwned = (playerProfile.craftedGauntletIds || []).includes(g.id);
                const isEquippedLeft = playerProfile.equippedLeftGauntletId === g.id;
                const isEquippedRight = playerProfile.equippedRightGauntletId === g.id;
                const isCurrentlyEquipped = isEquippedLeft || isEquippedRight;
                const GearIcon = ICON_COMPONENTS[g.icon] || Cpu;

                const matches = getIngredientMatches(g.requiredAuraIds);
                let forgeable = playerProfile.stats.coins >= g.requiredCoins;

                const requiredCounts: { [auraId: string]: number } = {};
                g.requiredAuraIds.forEach(id => {
                  requiredCounts[id] = (requiredCounts[id] || 0) + 1;
                });

                const ingredientsElements = Object.keys(requiredCounts).map((requiredId, index) => {
                  const aura = getAuraById(requiredId);
                  const needed = requiredCounts[requiredId];
                  const availableCount = (matches[requiredId] || []).length;
                  const satisfied = availableCount >= needed;
                  if (!satisfied) forgeable = false;

                  return (
                    <div key={`${g.id}_${requiredId}_${index}`} className="flex justify-between items-center text-[10px] bg-neutral-950 p-1 px-2 rounded border border-neutral-900">
                      <span style={{ color: aura.textColor }} className="font-bold flex items-center gap-1 text-[9.5px]">
                        ● {aura.name}
                      </span>
                      <span className={`font-mono font-bold ${satisfied ? 'text-green-400' : 'text-neutral-600'}`}>
                        {availableCount}/{needed}
                      </span>
                    </div>
                  );
                });

                return (
                  <div 
                    key={g.id}
                    className={`p-4 bg-neutral-950 border rounded-xl flex flex-col justify-between transition-all ${
                      isCurrentlyEquipped 
                        ? 'border-indigo-500/40 shadow-inner bg-indigo-950/5' 
                        : isOwned 
                          ? 'border-neutral-700' 
                          : 'border-neutral-850'
                    }`}
                  >
                    <div className="space-y-3">
                      <div>
                        {/* Title bar */}
                        <div className="flex justify-between items-start border-b border-neutral-905 pb-1.5 font-sans">
                          <div className="flex items-center space-x-2">
                            <div className="p-1.5 rounded-md bg-neutral-900 border border-neutral-850">
                              <GearIcon size={14} style={{ color: g.color }} />
                            </div>
                            <div>
                              <span className="text-xs font-black block tracking-tight truncate max-w-[150px]" style={{ color: g.color }}>
                                {g.name}
                              </span>
                              <span className="text-[8px] font-mono uppercase bg-neutral-900 px-1.5 py-0.5 rounded text-neutral-400 border border-neutral-850">
                                {g.slot === 'left' ? 'Left Hand Glove' : 'Right Hand Device'}
                              </span>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            {isOwned ? (
                              <span className="text-[9px] font-mono uppercase font-bold text-green-400 bg-green-950/20 px-2 py-0.5 rounded border border-green-500/10">Owned</span>
                            ) : (
                              <span className="text-[9px] font-mono font-bold text-amber-500">
                                {g.requiredCoins.toLocaleString()} Coins
                              </span>
                            )}
                          </div>
                        </div>

                        <p className="text-[10px] text-neutral-400 leading-normal mt-2 font-sans">{g.description}</p>
                      </div>

                      {/* Display passives */}
                      <div className="space-y-1 bg-neutral-950/40 p-2 rounded border border-neutral-900 text-[10px] font-mono">
                        <p className="text-[8px] font-mono uppercase text-indigo-400 font-extrabold pb-0.5">Static Passives:</p>
                        <div className="flex justify-between">
                          <span>Luck Multiplier:</span>
                          <span className="text-green-400 font-bold">+{g.luckMultiplierAdd.toFixed(2)}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Auto-Roll Velocity:</span>
                          <span className="text-cyan-400 font-bold">+{(g.rollSpeedMultiplierAdd * 100).toFixed(0)}% speed</span>
                        </div>
                        {g.coinMultiplier && g.coinMultiplier > 1.0 && (
                          <div className="flex justify-between text-yellow-500">
                            <span>Double coins payout:</span>
                            <span className="font-bold">+{((g.coinMultiplier - 1.0) * 100).toFixed(0)}% coins</span>
                          </div>
                        )}
                        <p className="text-[8px] text-neutral-500 pt-1 flex items-center gap-1 border-t border-neutral-900 mt-1 uppercase leading-none">
                          ⚡ Orbit VFX: {g.vfxDescription}
                        </p>
                      </div>

                      {/* Requirements */}
                      {!isOwned && (
                        <div className="space-y-1">
                          <p className="text-[8px] uppercase tracking-wider font-mono text-neutral-500">Forge Ingredients Required:</p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                            {ingredientsElements}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer button */}
                    <div className="pt-4">
                      {isOwned ? (
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              playClickSound();
                              if (onEquipGauntlet) {
                                onEquipGauntlet(g.slot, isCurrentlyEquipped ? null : g.id);
                              }
                            }}
                            className={`w-full py-2 font-mono text-xs font-bold rounded-lg transition ${
                              isCurrentlyEquipped
                                ? 'bg-rose-950/45 hover:bg-rose-610/40 text-rose-300 border border-rose-500/10'
                                : g.slot === 'left'
                                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  : 'bg-cyan-600 hover:bg-cyan-500 text-white'
                            }`}
                          >
                            {isCurrentlyEquipped ? 'Unequip Rig' : `Equip to ${g.slot === 'left' ? 'Left Slot' : 'Right Slot'}`}
                          </button>
                        </div>
                      ) : (
                        <button
                          disabled={!forgeable}
                          onClick={() => {
                            if (playerProfile.stats.coins < g.requiredCoins) {
                              setCraftStatus(`Forge failed: Insufficient coins.`);
                              triggerHaptic(50);
                              return;
                            }

                            const matchedAuras = getIngredientMatches(g.requiredAuraIds);
                            const instanceIdsToConsume: string[] = [];
                            let possible = true;

                            const requiredCountsMap: { [auraId: string]: number } = {};
                            g.requiredAuraIds.forEach(id => {
                              requiredCountsMap[id] = (requiredCountsMap[id] || 0) + 1;
                            });

                            for (const requiredId of Object.keys(requiredCountsMap)) {
                              const needed = requiredCountsMap[requiredId];
                              const available = matchedAuras[requiredId] || [];
                              if (available.length >= needed) {
                                for (let idx = 0; idx < needed; idx++) {
                                  instanceIdsToConsume.push(available[idx]);
                                }
                              } else {
                                possible = false;
                                break;
                              }
                            }

                            if (!possible) {
                              setCraftStatus(`Forge failed: Missing required ingredients.`);
                              triggerHaptic(50);
                              return;
                            }

                            if (onForgeGauntlet) {
                              onForgeGauntlet(g.id, instanceIdsToConsume, g.requiredCoins);
                              playSuccessChime();
                              triggerHaptic(120);
                              setCraftStatus(`Successfully built premium rig: ${g.name}! Equip it now to apply stats.`);
                              setTimeout(() => setCraftStatus(''), 5000);
                            }
                          }}
                          className="w-full py-2 bg-rose-600 hover:bg-rose-500 text-white font-mono text-xs font-bold rounded-lg transition disabled:opacity-30 disabled:cursor-not-allowed select-none flex items-center justify-center gap-1.5"
                        >
                          <Hammer size={12} /> Assemble Rig
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
