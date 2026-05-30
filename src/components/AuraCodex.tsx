import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, SlidersHorizontal, Eye, Volume2, ShieldCheck, 
  Lock, BookOpen, Sparkles, Filter, Award, ChevronRight, Ban 
} from 'lucide-react';
import { Aura, PlayerProfile } from '../types';
import { AURAS } from '../data/auras';
import { playClickSound, playAuraUnlockSound, triggerHaptic } from '../utils/sound';
import AuraDisplay from './AuraDisplay';

interface AuraCodexProps {
  playerProfile: PlayerProfile;
}

export default function AuraCodex({ playerProfile }: AuraCodexProps) {
  const [selectedAuraId, setSelectedAuraId] = useState<string>(AURAS[0].id);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<'all' | 'uncommon' | 'epic' | 'legendary' | 'godly_supreme'>('all');

  const selectedAura = AURAS.find(a => a.id === selectedAuraId) || AURAS[0];

  // Check if ever discovered
  // Proxy: If the player's max rolled rarity is at least this aura's probability, OR if it's currently in their inventory
  const isDiscovered = (aura: Aura): boolean => {
    if (aura.id === 'common') return true;
    const inInventory = playerProfile.inventory.some(item => item.auraId === aura.id);
    const inMaxRolled = playerProfile.stats.maxRarityRolled >= aura.probability;
    return inInventory || inMaxRolled;
  };

  const getTierCategory = (aura: Aura) => {
    const prob = aura.probability;
    if (prob <= 8) return 'common';
    if (prob <= 64) return 'uncommon';
    if (prob <= 256) return 'epic';
    if (prob <= 10000) return 'legendary';
    return 'godly_supreme';
  };

  const filteredAuras = AURAS.filter(aura => {
    const matchesSearch = aura.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          aura.rarityText.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          aura.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (tierFilter === 'all') return matchesSearch;
    const tier = getTierCategory(aura);
    if (tierFilter === 'godly_supreme' && (tier === 'godly_supreme')) return matchesSearch;
    return tier === tierFilter && matchesSearch;
  });

  const handlePreviewSound = (aura: Aura) => {
    playClickSound();
    playAuraUnlockSound(aura);
    triggerHaptic(50);
  };

  // Calculate stats
  const totalAurasCount = AURAS.length;
  const discoveredAurasCount = AURAS.filter(a => isDiscovered(a)).length;
  const percentComplete = Math.floor((discoveredAurasCount / totalAurasCount) * 100);

  return (
    <div id="neural_aura_atlas" className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-xl flex flex-col space-y-4">
      
      {/* Header index panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-3 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-950/40 border border-indigo-500/20 text-indigo-400 rounded-lg">
            <BookOpen size={20} />
          </div>
          <div>
            <h3 className="font-bold text-lg text-neutral-100 flex items-center gap-1.5 font-sans">
              Chrono-Aura Lexicon
              <span className="text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full uppercase tracking-wider">
                Quantum Database
              </span>
            </h3>
            <p className="text-xs text-neutral-500 leading-normal">Inspect and diagnose spatial field configurations, wave trajectories, and energetic oscillations</p>
          </div>
        </div>

        {/* Unlocked stats bar */}
        <div className="flex bg-neutral-950 px-3.5 py-2 rounded-xl border border-neutral-850 items-center space-x-3 self-stretch sm:self-auto justify-between">
          <div className="space-y-0.5 text-left">
            <p className="text-[8px] font-mono text-neutral-500 uppercase tracking-widest">Discovery Ledger</p>
            <p className="text-xs font-mono font-bold text-neutral-200">
              {discoveredAurasCount} / {totalAurasCount} <span className="text-neutral-500">({percentComplete}%)</span>
            </p>
          </div>
          <div className="w-16 bg-neutral-900 h-1.5 rounded-full overflow-hidden p-0.5 border border-neutral-800">
            <div className="bg-indigo-500 h-full rounded-full" style={{ width: `${percentComplete}%` }} />
          </div>
        </div>
      </div>

      {/* Main layout split: Left lists, Right preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        
        {/* LEFT COLUMN: LIST INDEX (5 Columns) */}
        <div className="lg:col-span-5 flex flex-col space-y-3">
          {/* Controls row */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search size={13} className="absolute left-2.5 top-2.5 text-neutral-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Analyze energetic wave registries..."
                className="w-full bg-neutral-950 border border-neutral-850 rounded-lg text-xs p-2 pl-8 text-neutral-200 outline-none placeholder-neutral-600 focus:border-indigo-500/30"
              />
            </div>

            {/* Filter buttons selector */}
            <div className="flex items-center space-x-1.5 bg-neutral-950 px-1.5 rounded-lg border border-neutral-850">
              <Filter size={11} className="text-neutral-500" />
              <select
                value={tierFilter}
                onChange={(e) => { playClickSound(); setTierFilter(e.target.value as any); }}
                className="bg-transparent border-none text-[10.5px] text-neutral-400 py-1.5 pr-6 pl-0.5 outline-none select-none max-w-[110px]"
              >
                <option value="all">All Tiers</option>
                <option value="uncommon">Uncommon</option>
                <option value="epic">Epic</option>
                <option value="legendary">Legendary</option>
                <option value="godly_supreme">Supreme</option>
              </select>
            </div>
          </div>

          {/* List grid */}
          <div className="flex flex-col gap-1.5 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
            {filteredAuras.map((aura) => {
              const discovered = isDiscovered(aura);
              const isSelected = aura.id === selectedAuraId;

              return (
                <button
                  key={aura.id}
                  onClick={() => { playClickSound(); setSelectedAuraId(aura.id); }}
                  className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                    isSelected 
                      ? 'bg-indigo-950/20 border-indigo-600 text-neutral-100 shadow-md' 
                      : 'bg-neutral-950/40 border-neutral-850 hover:bg-neutral-950 hover:border-neutral-750 text-neutral-400'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 min-w-0">
                    <span 
                      className="w-2.5 h-2.5 rounded-full shrink-0 flex items-center justify-center font-bold text-[8px]" 
                      style={{ backgroundColor: discovered ? aura.textColor : '#404040' }}
                    />
                    
                    <div className="truncate">
                      <span 
                        className="text-xs font-black block tracking-tight truncate pr-2"
                        style={{ color: discovered ? aura.textColor : '#737373' }}
                      >
                        {discovered ? aura.name : 'Unknown Signal'}
                      </span>
                      <span className="text-[9px] font-mono text-neutral-500 block">
                        {discovered ? `Rarity 1:${aura.probability.toLocaleString()}` : `Rarity 1:${aura.probability.toLocaleString()} (Locked)`}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-1.5 shrink-0">
                    {discovered ? (
                      <span className="text-[8.5px] font-mono bg-green-500/10 text-green-400 border border-green-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">
                        Discovered
                      </span>
                    ) : (
                      <Lock size={10} className="text-neutral-600 mr-1" />
                    )}
                    <ChevronRight size={12} className="text-neutral-500" />
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: HIGH FIDELITY SIMULATION (7 Columns) */}
        <div className="lg:col-span-7 bg-neutral-950 p-4 border border-neutral-850 rounded-2xl flex flex-col space-y-4">
          <div className="flex justify-between items-start border-b border-neutral-900 pb-3 gap-2">
            <div>
              <p className="text-[8.5px] font-mono text-neutral-500 uppercase tracking-widest">Active Simulator Portlet</p>
              <h4 className="text-sm font-bold text-neutral-100" style={{ color: isDiscovered(selectedAura) ? selectedAura.textColor : '#808080' }}>
                {isDiscovered(selectedAura) ? `Spectral Field: ${selectedAura.name}` : `Classified Signature`}
              </h4>
            </div>

            <div className="flex gap-2 shrink-0">
              {isDiscovered(selectedAura) && (
                <button
                  onClick={() => handlePreviewSound(selectedAura)}
                  className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 p-1.5 px-2.5 rounded-lg text-neutral-300 font-mono text-[10px] flex items-center gap-1.5 transition active:scale-95"
                >
                  <Volume2 size={12} className="text-rose-400" /> Hear Drone
                </button>
              )}
            </div>
          </div>

          {/* Active Mini Sandbox */}
          {isDiscovered(selectedAura) ? (
            <div className="relative h-[220px] rounded-xl overflow-hidden border border-neutral-900 bg-[#060812]">
              {/* Force non-rolling display */}
              <AuraDisplay aura={selectedAura} isRolling={false} rollCount={1} />
            </div>
          ) : (
            <div className="h-[220px] rounded-xl border border-neutral-900 border-dashed bg-neutral-950 flex flex-col items-center justify-center p-6 text-center space-y-2">
              <Ban size={30} className="text-neutral-700 animate-pulse" />
              <div className="space-y-0.5">
                <p className="text-xs font-mono font-bold text-neutral-500 uppercase">Aura Classified</p>
                <p className="text-[10px] text-neutral-600 max-w-xs leading-normal">
                  You must roll and unlock 1 in {selectedAura.probability.toLocaleString()} element before decrypting simulation matrices. 
                </p>
              </div>
            </div>
          )}

          {/* Metadata ledger */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 font-mono text-[10px]">
            <div className="p-2 bg-neutral-900 border border-neutral-850 rounded-xl space-y-1">
              <span className="text-neutral-500 block lowercase">VFX particles</span>
              <span className="text-neutral-300 font-bold block uppercase">{isDiscovered(selectedAura) ? (selectedAura.vfxType || 'standard') : 'CLASSIFIED'}</span>
            </div>

            <div className="p-2 bg-neutral-900 border border-neutral-850 rounded-xl space-y-1">
              <span className="text-neutral-500 block lowercase">sound driver</span>
              <span className="text-neutral-300 font-bold block uppercase">{isDiscovered(selectedAura) ? selectedAura.soundType : 'CLASSIFIED'}</span>
            </div>

            <div className="p-2 bg-neutral-900 border border-neutral-850 rounded-xl space-y-1 col-span-2 sm:col-span-1">
              <span className="text-neutral-500 block lowercase">oscillator pitch</span>
              <span className="text-neutral-300 font-bold block">{isDiscovered(selectedAura) ? `${selectedAura.baseFrequency} Hz` : 'CLASSIFIED'}</span>
            </div>
          </div>

          <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-3 text-[11px] text-neutral-400 font-sans leading-normal">
            {isDiscovered(selectedAura) ? (
              <span className="block border-l-2 pl-2 border-indigo-500">{selectedAura.description}</span>
            ) : (
              <span className="block italic text-neutral-600 text-center">Spectral index signals remain encrypted in hyper space. Perform Sol cosmic rolls to unlock signal diagnostics.</span>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
