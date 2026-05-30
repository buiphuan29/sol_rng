import { Aura } from '../types';

export interface GauntletItem {
  id: string;
  name: string;
  description: string;
  slot: 'left' | 'right';
  requiredAuraIds: string[]; // required ingredients
  requiredCoins: number;
  luckMultiplierAdd: number;
  rollSpeedMultiplierAdd: number;
  coinMultiplier?: number; // e.g. 1.5x coins
  vfxDescription: string;
  color: string; // Tailwind glow / text color
  borderColor: string;
  glowClass: string;
  icon: string; // lucide icon name
}

export const GAUNTS: GauntletItem[] = [
  // Left Hand Gauntlets
  {
    id: 'exo_gauntlet',
    name: 'Exo Gauntlet',
    description: 'An advanced hydraulic skeletal gauntlet pulsing with electromagnetic fields. Dramatically boosts your roll ticking speeds.',
    slot: 'left',
    requiredAuraIds: ['magnetic', 'quartz', 'jade'],
    requiredCoins: 1500,
    luckMultiplierAdd: 0.50,
    rollSpeedMultiplierAdd: 0.60,
    coinMultiplier: 1.2,
    vfxDescription: 'Hydraulic gear sparks & green cyber glow rings',
    color: '#10b981', // emerald Green
    borderColor: 'border-emerald-500/40',
    glowClass: 'shadow-emerald-950/50',
    icon: 'Cpu'
  },
  {
    id: 'solar_gauntlet',
    name: 'Solar Overdrive Gauntlet',
    description: 'Harnesses absolute solar flare streams inside a lead-shielded mechanical frame. Ignites extreme luck surges.',
    slot: 'left',
    requiredAuraIds: ['solar', 'ruby', 'gilded'],
    requiredCoins: 5000,
    luckMultiplierAdd: 2.20,
    rollSpeedMultiplierAdd: 0.20,
    coinMultiplier: 1.5,
    vfxDescription: 'Swirling solar flares & fire embers',
    color: '#f59e0b', // Amber yellow
    borderColor: 'border-amber-500/40',
    glowClass: 'shadow-amber-950/50',
    icon: 'Flame'
  },
  {
    id: 'celestial_gauntlet',
    name: 'Celestial Gauntlet',
    description: 'Forged from moonstone crystallization and star-comet residues. Channel absolute lunar and sky potential.',
    slot: 'left',
    requiredAuraIds: ['celestial', 'comet', 'sapphire'],
    requiredCoins: 4000,
    luckMultiplierAdd: 1.80,
    rollSpeedMultiplierAdd: 0.35,
    coinMultiplier: 1.3,
    vfxDescription: 'Bright stardust orbitals & cooling cosmic beams',
    color: '#c084fc', // Purple
    borderColor: 'border-purple-500/40',
    glowClass: 'shadow-purple-950/50',
    icon: 'Moon'
  },
  {
    id: 'gravitational_gauntlet',
    name: 'Gravitational Singularity Glove',
    description: 'Harnesses terminal gravity wells. distorts space to suck extremely high rarity elements into your field.',
    slot: 'left',
    requiredAuraIds: ['antigravity', 'magnetic', 'diamond'],
    requiredCoins: 8000,
    luckMultiplierAdd: 3.50,
    rollSpeedMultiplierAdd: 0.45,
    coinMultiplier: 1.8,
    vfxDescription: 'Dark space curvature particle streams & gravity wells',
    color: '#22d3ee', // Cyan
    borderColor: 'border-cyan-500/40',
    glowClass: 'shadow-cyan-950/50',
    icon: 'Orbit'
  },

  // Right Hand Devices / Gloves
  {
    id: 'haste_glove',
    name: 'Exo-Velocity Glove',
    description: 'Lightweight composite speed glove engineered with micro-thrusters to trigger rapid roll sequences.',
    slot: 'right',
    requiredAuraIds: ['uncommon', 'magnetic', 'quartz'],
    requiredCoins: 800,
    luckMultiplierAdd: 0.20,
    rollSpeedMultiplierAdd: 0.45,
    coinMultiplier: 1.1,
    vfxDescription: 'Rapid electric cyan streaks & micro sonic booms',
    color: '#22d3ee', // Cyan
    borderColor: 'border-cyan-500/40',
    glowClass: 'shadow-cyan-950/50',
    icon: 'Zap'
  },
  {
    id: 'lunar_device',
    name: 'Lunar Eclipse Device',
    description: 'Wraps the hand in dark cold lunar tides, focusing standard particle fields on cosmic alignments.',
    slot: 'right',
    requiredAuraIds: ['lunar', 'bound', 'sapphire'],
    requiredCoins: 4500,
    luckMultiplierAdd: 2.00,
    rollSpeedMultiplierAdd: 0.25,
    vfxDescription: 'Tidal waves & lunar alignment rings',
    color: '#60a5fa', // Blue
    borderColor: 'border-blue-500/40',
    glowClass: 'shadow-blue-950/50',
    icon: 'Moon'
  },
  {
    id: 'wind_talisman_glove',
    name: 'Hurricane Wind Catalyst',
    description: 'A structural pneumatic hand harness condensing wind-vortex energy. Greatly speeds rolling ticks.',
    slot: 'right',
    requiredAuraIds: ['wind', 'blossom', 'emerald'],
    requiredCoins: 3000,
    luckMultiplierAdd: 1.20,
    rollSpeedMultiplierAdd: 0.50,
    vfxDescription: 'Swirling green hurricanes & falling pastel petals',
    color: '#34d399', // Emerald
    borderColor: 'border-emerald-500/40',
    glowClass: 'shadow-emerald-950/50',
    icon: 'Wind'
  },
  {
    id: 'sovereign_gauntlet',
    name: 'Sovereign Imperial Gauntlet',
    description: 'Unlocks absolute RNG dominance. The pinnacle of cosmic achievement. Controls planetary light crowns.',
    slot: 'right',
    requiredAuraIds: ['sovereign', 'origin_singularity', 'galaxy'],
    requiredCoins: 20000,
    luckMultiplierAdd: 6.00,
    rollSpeedMultiplierAdd: 0.80,
    coinMultiplier: 2.5,
    vfxDescription: 'Gigantic rotating imperial crown orbitals & golden lightning streams',
    color: '#fbbf24', // Yellow Amber
    borderColor: 'border-amber-500/50',
    glowClass: 'shadow-amber-950/70',
    icon: 'Crown'
  }
];

export function getGauntletById(id: string): GauntletItem | undefined {
  return GAUNTS.find(g => g.id === id);
}
