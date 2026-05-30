export interface PetTemplate {
  id: string;
  name: string;
  probability: number; // 1 in X (lower values mean more common)
  emoji: string;
  rarityText: string;
  color: string;
  glowColor: string;
  bgGradient: string;
  luckBonus: number;
  speedBonus: number;
  description: string;
}

export const PET_TEMPLATES: PetTemplate[] = [
  {
    id: 'chrono_slime',
    name: 'Chrono Slime',
    probability: 1, // Basetype fallback
    emoji: '🟢',
    rarityText: 'Common',
    color: '#10b981',
    glowColor: 'rgba(16, 185, 129, 0.4)',
    bgGradient: 'from-emerald-400 to-teal-500',
    luckBonus: 0.08,
    speedBonus: 0.05,
    description: 'An adorable bouncing gelatinous slime infused with chronomancy ticks.'
  },
  {
    id: 'peach_purr',
    name: 'Peach Spark Kitty',
    probability: 6, // 1 in 6 odds on capsule hatch
    emoji: '🐱',
    rarityText: 'Uncommon',
    color: '#fb923c',
    glowColor: 'rgba(251, 146, 60, 0.4)',
    bgGradient: 'from-orange-400 to-amber-500',
    luckBonus: 0.20,
    speedBonus: 0.10,
    description: 'A little cute ginger kitten with a static electricity charged tail that loves play-rolling!'
  },
  {
    id: 'nebula_hamster',
    name: 'Nebula Hamster',
    probability: 25, // 1 in 25 odds
    emoji: '🐹',
    rarityText: 'Rare',
    color: '#c084fc',
    glowColor: 'rgba(192, 132, 252, 0.4)',
    bgGradient: 'from-fuchsia-500 to-purple-600',
    luckBonus: 0.45,
    speedBonus: 0.20,
    description: 'Chews on glowing cosmic meteors. Holds a tiny personal wormhole space inside its cheeks!'
  },
  {
    id: 'star_axolotl',
    name: 'Star Axolotl',
    probability: 120, // 1 in 120 odds
    emoji: '🦎',
    rarityText: 'Epic',
    color: '#f43f5e',
    glowColor: 'rgba(244, 63, 94, 0.6)',
    bgGradient: 'from-rose-400 to-pink-600',
    luckBonus: 0.95,
    speedBonus: 0.35,
    description: 'A super cute pastel-pink amphibian that floats on celestial stellar wind current.'
  },
  {
    id: 'void_dragonette',
    name: 'Void Dragonette',
    probability: 600, // 1 in 600 odds
    emoji: '🐲',
    rarityText: 'Legendary',
    color: '#818cf8',
    glowColor: 'rgba(99, 102, 241, 0.8)',
    bgGradient: 'from-indigo-600 to-violet-800',
    luckBonus: 1.80,
    speedBonus: 0.60,
    description: 'A baby black dragon that sneezes sparks of cosmic dark matter. Emits a strong passive grav-field.'
  }
];

export function getPetTemplateById(id: string): PetTemplate {
  return PET_TEMPLATES.find(p => p.id === id) || PET_TEMPLATES[0];
}
