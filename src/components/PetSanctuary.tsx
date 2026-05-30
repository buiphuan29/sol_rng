import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Heart, HelpCircle, Star, Tag, Compass, 
  Trash2, Coins, Dumbbell, Shield, Zap, Eye, Gift
} from 'lucide-react';
import { PlayerProfile, PlayerPet } from '../types';
import { PET_TEMPLATES, PetTemplate, getPetTemplateById } from '../data/pets';
import { playClickSound, playSuccessChime, triggerHaptic } from '../utils/sound';

interface PetSanctuaryProps {
  playerProfile: PlayerProfile;
  onEggHatch: (pet: PlayerPet, costCoins: number) => void;
  onEquipPet: (petInstanceId: string | null) => void;
  onReleasePet: (petInstanceId: string, returnCoins: number) => void;
  onNicknamePet: (petInstanceId: string, newNickname: string) => void;
}

export default function PetSanctuary({
  playerProfile,
  onEggHatch,
  onEquipPet,
  onReleasePet,
  onNicknamePet
}: PetSanctuaryProps) {
  const [hatching, setHatching] = useState<boolean>(false);
  const [justHatched, setJustHatched] = useState<PlayerPet | null>(null);
  const [activeTab, setActiveTab] = useState<'stable' | 'egg'>('stable');
  const [namingId, setNamingId] = useState<string | null>(null);
  const [nicknameInput, setNicknameInput] = useState<string>('');

  const eggCost = 500;
  const releaseRefund = 150;

  // Probability distribution for hatches:
  // Chrono Slime (Common): ~55%
  // Peach Spark Kitty (Uncommon): ~25%
  // Nebula Hamster (Rare): ~14%
  // Star Axolotl (Epic): ~5%
  // Void Dragonette (Legendary): ~1%
  const handleHatchEgg = () => {
    if (hatching) return;
    if (playerProfile.stats.coins < eggCost) {
      triggerHaptic(50);
      return;
    }

    playClickSound();
    setHatching(true);
    setJustHatched(null);
    triggerHaptic(120);

    // Dynamic shake timeline then hatch!
    setTimeout(() => {
      const roll = Math.random() * 100;
      let chosenTemplate: PetTemplate = PET_TEMPLATES[0];

      if (roll < 1) {
        chosenTemplate = PET_TEMPLATES[4]; // Void Dragonette (Legendary)
      } else if (roll < 6) {
        chosenTemplate = PET_TEMPLATES[3]; // Star Axolotl (Epic)
      } else if (roll < 20) {
        chosenTemplate = PET_TEMPLATES[2]; // Nebula Hamster (Rare)
      } else if (roll < 45) {
        chosenTemplate = PET_TEMPLATES[1]; // Peach Spark Kitty (Uncommon)
      } else {
        chosenTemplate = PET_TEMPLATES[0]; // Chrono Slime (Common)
      }

      // 10% chance of being Shiny!
      const isShiny = Math.random() < 0.10;
      const finalLuckBonus = isShiny ? chosenTemplate.luckBonus * 1.5 : chosenTemplate.luckBonus;
      const finalSpeedBonus = isShiny ? chosenTemplate.speedBonus * 1.5 : chosenTemplate.speedBonus;

      const newPetInstance: PlayerPet = {
        id: 'pet_inst_' + Math.random().toString(36).substring(2, 9),
        petId: chosenTemplate.id,
        name: isShiny ? `✨ Tiny Shiny ${chosenTemplate.name}` : chosenTemplate.name,
        rarityText: chosenTemplate.rarityText,
        color: chosenTemplate.color,
        glowColor: chosenTemplate.glowColor,
        emoji: chosenTemplate.emoji,
        luckBonus: parseFloat(finalLuckBonus.toFixed(2)),
        speedBonus: parseFloat(finalSpeedBonus.toFixed(2)),
        acquiredAt: Date.now(),
        shiny: isShiny
      };

      setJustHatched(newPetInstance);
      setHatching(false);
      onEggHatch(newPetInstance, eggCost);
      playSuccessChime();
    }, 2200);
  };

  const handleEquipToggle = (pet: PlayerPet) => {
    playClickSound();
    if (playerProfile.equippedPetId === pet.id) {
      onEquipPet(null);
    } else {
      onEquipPet(pet.id);
    }
  };

  const handleTriggerNickname = (pet: PlayerPet) => {
    playClickSound();
    setNamingId(pet.id);
    setNicknameInput(pet.name);
  };

  const handleSubmitNickname = (e: React.FormEvent, petId: string) => {
    e.preventDefault();
    if (!nicknameInput.trim()) return;
    playClickSound();
    onNicknamePet(petId, nicknameInput.trim().substring(0, 24));
    setNamingId(null);
  };

  const activeEquippedPet = playerProfile.ownedPets?.find(p => p.id === playerProfile.equippedPetId) || null;

  return (
    <div id="pets_sanctuary_panel" className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 sm:p-6 shadow-2xl flex flex-col space-y-4">
      {/* Decorative header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-neutral-800 pb-4 gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-pink-950/40 border border-pink-500/20 text-rose-400 rounded-xl animate-pulse">
            <Heart size={20} className="fill-rose-500" />
          </div>
          <div>
            <h3 className="font-extrabold text-base text-neutral-100 uppercase tracking-widest flex items-center gap-2">
              Companion Mascot Sanctuary
              <span className="text-[9px] bg-pink-500/15 text-pink-400 border border-pink-500/10 px-2 py-0.5 rounded font-mono font-black animate-pulse">
                NEW UPDATED
              </span>
            </h3>
            <p className="text-xs text-neutral-400 font-sans mt-0.5">Hatch charming, loyal companion mascots that amplify your core luck and speed statistics.</p>
          </div>
        </div>

        {/* Inner Tabs toggle */}
        <div className="flex bg-neutral-950/80 border border-neutral-800 p-1 rounded-xl text-xs space-x-1 select-none w-full sm:w-auto font-mono">
          <button
            onClick={() => { playClickSound(); setActiveTab('stable'); }}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition capitalize font-bold text-center ${
              activeTab === 'stable' 
                ? 'bg-rose-600 font-black text-white shadow-lg shadow-rose-600/20' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            🐾 My Stable ({playerProfile.ownedPets?.length || 0})
          </button>
          <button
            onClick={() => { playClickSound(); setActiveTab('egg'); }}
            className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg transition capitalize font-bold text-center flex items-center justify-center gap-1.5 ${
              activeTab === 'egg' 
                ? 'bg-rose-600 font-black text-white shadow-lg shadow-rose-600/20' 
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <span>🥚 Hatch Capsule</span>
          </button>
        </div>
      </div>

      {activeTab === 'stable' && (
        <div className="space-y-4">
          {/* EQUIPPED COMPANION HIGHLIGHT */}
          {activeEquippedPet ? (
            <div className="p-5 bg-neutral-950 border border-pink-550/20 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between shadow-xl relative overflow-hidden"
                 style={{ borderColor: `${activeEquippedPet.glowColor || 'rgba(244,63,94,0.1)'}` }}>
              {/* Backglow element */}
              <div className="absolute -left-10 -top-10 w-44 h-44 rounded-full opacity-10 filter blur-3xl pointer-events-none" 
                   style={{ backgroundColor: activeEquippedPet.color }} />

              <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left z-10 w-full md:w-auto">
                <div className="w-16 h-16 rounded-full flex items-center justify-center text-4xl bg-gradient-to-tr from-neutral-900 to-neutral-850 p-3 border-2 shadow-2xl relative"
                     style={{ borderColor: activeEquippedPet.color, boxShadow: `0 0 20px ${activeEquippedPet.glowColor}` }}>
                  <span className="transform hover:scale-125 transition-transform duration-300 block">{activeEquippedPet.emoji}</span>
                  {activeEquippedPet.shiny && (
                    <span className="absolute -top-1 -right-1 text-xs animate-ping">✨</span>
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-1.5">
                    <span className={`text-[9px] font-mono font-black uppercase px-2 py-0.5 rounded border ${
                      activeEquippedPet.shiny ? 'bg-gradient-to-r from-yellow-500/20 to-rose-500/20 text-yellow-400 border-yellow-500/25 animate-pulse' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                    }`}>
                      {activeEquippedPet.shiny ? '✨ SHINY MASCOT' : `${activeEquippedPet.rarityText}`}
                    </span>
                    <span className="text-[10px] bg-neutral-900 px-2 py-0.5 rounded text-neutral-400 font-mono">ACTIVE EQUIPPED</span>
                  </div>

                  <h4 className="text-base font-extrabold text-neutral-100 flex items-center gap-1.5 justify-center sm:justify-start">
                    {activeEquippedPet.name}
                  </h4>

                  <p className="text-xs text-neutral-400 leading-normal font-sans">
                    Fidelity: floats as your mini companion on the coordinate map!
                  </p>
                </div>
              </div>

              {/* STATS BREAKDOWN */}
              <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 z-10">
                <div className="flex gap-2 w-full sm:w-auto">
                  <div className="bg-[#0e0f18] border border-neutral-800 p-2 px-3 rounded-xl text-center w-24">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">Luck Buff</span>
                    <span className="text-sm font-black text-emerald-400 font-mono">+{activeEquippedPet.luckBonus.toFixed(2)}x</span>
                  </div>
                  <div className="bg-[#0e0f18] border border-neutral-800 p-2 px-3 rounded-xl text-center w-24">
                    <span className="text-[9px] font-mono text-neutral-500 block uppercase">Speed Buff</span>
                    <span className="text-sm font-black text-cyan-400 font-mono">+{activeEquippedPet.speedBonus.toFixed(2)}x</span>
                  </div>
                </div>

                <button
                  onClick={() => handleEquipToggle(activeEquippedPet)}
                  className="w-full sm:w-auto py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900 text-rose-300 font-bold font-mono text-[11px] rounded-xl border border-rose-500/20 cursor-pointer transition-colors"
                >
                  Unequip
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[#0e0f19] border border-neutral-850 rounded-2xl flex items-center space-x-3 text-neutral-400">
              <span className="text-2xl animate-bounce">😿</span>
              <div>
                <p className="text-xs font-semibold text-neutral-300">No active Companion equipped.</p>
                <p className="text-[11px] text-neutral-500 font-sans mt-0.5">Equip an adorable mascot below to harness passive stat boosts and display beside your character on the map viewport!</p>
              </div>
            </div>
          )}

          {/* PET COLLECTION GRID */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold font-mono text-neutral-400 uppercase tracking-wider">Your Sanctuary Mascots Stable ({playerProfile.ownedPets?.length || 0})</h4>

            {!playerProfile.ownedPets || playerProfile.ownedPets.length === 0 ? (
              <div className="p-8 text-center bg-neutral-950 border border-neutral-850/60 border-dashed rounded-2xl flex flex-col items-center justify-center space-y-3">
                <p className="text-xs text-neutral-500">Your Stable vault is empty.</p>
                <button
                  onClick={() => { playClickSound(); setActiveTab('egg'); }}
                  className="py-2 px-5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-750 font-mono text-[10px] font-black rounded-lg text-neutral-300 transition-colors cursor-pointer uppercase"
                >
                  Go to Capsule Hatch Hatchery
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {playerProfile.ownedPets.map(pet => {
                  const isEquipped = playerProfile.equippedPetId === pet.id;
                  const isNaming = namingId === pet.id;

                  return (
                    <div 
                      key={pet.id} 
                      className={`p-3 bg-neutral-950 border border-neutral-850 rounded-xl space-y-3 flex flex-col justify-between transition-all duration-200 outline-none hover:border-neutral-700 ${
                        isEquipped ? 'ring-1 ring-rose-500/40 border-rose-500/20 bg-pink-950/5' : ''
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2.5">
                        <div className="flex items-center space-x-2.5">
                          {/* Pet Avatar icon */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-2.5xl bg-neutral-900 border ${
                            isEquipped ? 'border-rose-500 shadow-md' : 'border-neutral-800'
                          }`}
                          style={{ borderColor: isEquipped ? pet.color : undefined }}>
                            {pet.emoji}
                          </div>

                          <div className="min-w-0">
                            {isNaming ? (
                              <form onSubmit={(e) => handleSubmitNickname(e, pet.id)} className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  autoFocus
                                  value={nicknameInput}
                                  onChange={(e) => setNicknameInput(e.target.value)}
                                  className="w-24 bg-neutral-900 border border-neutral-750 text-[10px] p-0.5 px-1.5 rounded text-white"
                                />
                                <button type="submit" className="text-[10px] bg-indigo-600 text-white px-1.5 py-0.5 rounded text-[9px] font-mono">OK</button>
                              </form>
                            ) : (
                              <h5 className="font-extrabold text-[12.5px] text-neutral-250 truncate flex items-center gap-1">
                                {pet.name}
                                <button 
                                  onClick={() => handleTriggerNickname(pet)}
                                  className="text-neutral-500 hover:text-white shrink-0" 
                                  title="Nickname mascot"
                                >
                                  <Tag size={10} />
                                </button>
                              </h5>
                            )}
                            <p className="text-[10px] font-mono text-neutral-500 font-bold capitalize tracking-wide">{pet.rarityText}</p>
                          </div>
                        </div>

                        {!isEquipped && (
                          <button
                            onClick={() => { playClickSound(); onReleasePet(pet.id, releaseRefund); }}
                            className="p-1 px-1.5 text-neutral-600 hover:text-red-400 rounded hover:bg-red-500/5 transition"
                            title="Dismiss to retrieve coins"
                          >
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>

                      {/* Mascot Buff metrics */}
                      <div className="grid grid-cols-2 gap-1.5 bg-neutral-900/60 p-2 rounded-lg font-mono text-[10px] border border-neutral-850">
                        <div className="flex items-center space-x-1 justify-center">
                          <Zap size={11} className="text-emerald-400" />
                          <span className="text-emerald-300 font-bold">+{pet.luckBonus.toFixed(2)}x</span>
                        </div>
                        <div className="flex items-center space-x-1 justify-center">
                          <Compass size={11} className="text-cyan-400" />
                          <span className="text-cyan-300 font-bold">+{pet.speedBonus.toFixed(2)}x</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEquipToggle(pet)}
                          className={`flex-1 py-1 px-3 text-[10px] font-bold font-mono rounded-lg border cursor-pointer text-center select-none uppercase tracking-wide transition ${
                            isEquipped 
                              ? 'bg-neutral-900 hover:bg-neutral-850 text-rose-300 border-neutral-800' 
                              : 'bg-rose-950/20 hover:bg-rose-600 text-rose-300 hover:text-white border-rose-500/20'
                          }`}
                        >
                          {isEquipped ? 'Unequip' : 'Equip Mascot'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'egg' && (
        <div className="flex flex-col items-center justify-center p-6 space-y-6 text-center select-none">
          <AnimatePresence mode="wait">
            {hatching ? (
              <motion.div
                key="hatching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center space-y-4"
              >
                {/* Shake capsule egg animation */}
                <motion.div
                  animate={{ 
                    y: [0, -14, 0],
                    rotate: [0, -10, 10, -5, 5, 0],
                    scale: [1, 1.05, 1]
                  }}
                  transition={{ 
                    repeat: Infinity, 
                    duration: 0.65,
                    ease: "easeInOut"
                  }}
                  className="w-24 h-24 rounded-full bg-gradient-to-tr from-rose-500 to-amber-400 border border-white/20 flex items-center justify-center text-5xl shadow-[0_0_35px_rgba(251,146,60,0.4)]"
                >
                  🥚
                </motion.div>

                <div className="space-y-1">
                  <p className="text-xs font-mono text-rose-400 uppercase tracking-widest font-black animate-pulse">INCUBATING ASTRAL CAPSULE...</p>
                  <p className="text-[10px] text-neutral-500 font-sans">Synthesizing DNA coordinates under the biome atmosphere</p>
                </div>
              </motion.div>
            ) : justHatched ? (
              <motion.div
                key="justHatched"
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="p-5 flex flex-col items-center space-y-4 w-full max-w-sm bg-neutral-950 border rounded-2xl shadow-2xl relative"
                style={{ borderColor: justHatched.color }}
              >
                {/* Ray bursts behind */}
                <div className="absolute inset-0 pointer-events-none rounded-2xl opacity-15 filter blur-3xl"
                     style={{ background: `radial-gradient(circle, ${justHatched.color} 0%, transparent 70%)` }} />

                <div className="w-20 h-20 rounded-full flex items-center justify-center text-5xl p-2 bg-neutral-900 border-2"
                     style={{ borderColor: justHatched.color, boxShadow: `0 0 25px ${justHatched.glowColor}` }}>
                  <motion.span 
                    animate={{ scale: [1, 1.15, 1] }} 
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="block"
                  >
                    {justHatched.emoji}
                  </motion.span>
                </div>

                <div className="space-y-1">
                  <h4 className="text-[11px] font-mono tracking-wider uppercase font-extrabold" style={{ color: justHatched.color }}>
                    🎉 {justHatched.shiny ? '✨ SHINY COMPANION' : `${justHatched.rarityText} MATED` }!
                  </h4>
                  <h3 className="text-lg font-black text-white">{justHatched.name}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 bg-neutral-900/60 p-3 rounded-xl border border-neutral-850 font-mono text-[11px] w-full">
                  <div className="text-center">
                    <span className="text-neutral-500 text-[9px] block uppercase">Luck Multiplier</span>
                    <strong className="text-emerald-400 font-black">+{justHatched.luckBonus.toFixed(2)}x</strong>
                  </div>
                  <div className="text-center">
                    <span className="text-neutral-500 text-[9px] block uppercase">Speed Parameter</span>
                    <strong className="text-cyan-400 font-black">+{justHatched.speedBonus.toFixed(2)}x</strong>
                  </div>
                </div>

                <p className="text-[10.5px] text-neutral-400 font-sans leading-normal px-2">
                  {getPetTemplateById(justHatched.petId).description}
                </p>

                <div className="flex gap-2 w-full pt-1">
                  <button
                    onClick={() => handleEquipToggle(justHatched)}
                    className="flex-1 py-2 px-4 bg-rose-600 hover:bg-rose-500 font-mono text-xs font-black rounded-lg text-white transition shadow-lg shadow-rose-600/20 cursor-pointer"
                  >
                    {playerProfile.equippedPetId === justHatched.id ? 'Equipped!' : 'Equip Mascot'}
                  </button>
                  <button
                    onClick={() => { playClickSound(); setJustHatched(null); }}
                    className="py-2 px-4 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-400 font-mono text-xs font-bold rounded-lg transition"
                  >
                    Dismiss
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="egg-idle"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center space-y-4 max-w-sm"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-neutral-900 to-neutral-850 border border-neutral-800 flex items-center justify-center text-4xl shadow-inner animate-bounce">
                  🥚
                </div>

                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-sm text-neutral-200">Astral Companion Capsule Egg</h4>
                  <p className="text-xs text-neutral-400 leading-normal">
                    Harness dynamic biomic gravity particles to lock onto exotic life signatures. Guaranteed to hatch one cute stable mascot!
                  </p>
                </div>

                {/* Egg hatch odds breakdown */}
                <div className="w-full bg-neutral-950 p-3 rounded-xl border border-neutral-850 font-mono text-[9px] leading-relaxed text-left text-neutral-400 space-y-1">
                  <p className="font-bold text-neutral-300 text-[10px] mb-1.5 border-b border-neutral-850 pb-1">Hatch Odds Blueprint:</p>
                  <div className="flex justify-between"><span className="text-emerald-400 font-bold">🟢 Chrono Slime (Common):</span> <span>55% odds</span></div>
                  <div className="flex justify-between"><span className="text-orange-400 font-bold">🐱 Peach Spark Kitty (Uncommon):</span> <span>25% odds</span></div>
                  <div className="flex justify-between"><span className="text-fuchsia-400 font-bold">Hamster (Rare):</span> <span>14% odds</span></div>
                  <div className="flex justify-between"><span className="text-rose-450 font-bold">🦎 Star Axolotl (Epic):</span> <span>5% odds</span></div>
                  <div className="flex justify-between"><span className="text-indigo-400 font-bold">🐲 Void Dragonette (Legendary):</span> <span className="font-black text-rose-300 animate-pulse">1% odds</span></div>
                  <p className="text-neutral-500 text-[8.5px] text-center pt-1.5 border-t border-neutral-850/60 mt-1">✨ 10% Flat chance to unlock a SHINY mascot with +50% boosted buffs!</p>
                </div>

                <div className="pt-2">
                  <button
                    onClick={handleHatchEgg}
                    disabled={playerProfile.stats.coins < eggCost}
                    className="w-full sm:w-auto bg-gradient-to-tr from-rose-600 to-red-700 hover:from-rose-500 hover:to-red-600 font-mono text-xs font-black py-3 px-8 text-white rounded-xl shadow-lg hover:shadow-rose-500/20 active:scale-95 disabled:opacity-40 transition cursor-pointer flex items-center justify-center gap-2 select-none"
                  >
                    <Coins size={14} className="text-amber-300 animate-spin" />
                    Hatch Capsule Egg ({eggCost} Coins)
                  </button>
                  {playerProfile.stats.coins < eggCost && (
                    <p className="text-[9px] text-red-400 font-mono mt-2 flex items-center gap-0.5 justify-center">
                      ⚠️ Insolvent cash flow. Complete daily quests or roll more rare auras!
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
