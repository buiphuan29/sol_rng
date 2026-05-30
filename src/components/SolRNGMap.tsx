import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map, Compass, HelpCircle, AlertTriangle, Play, Sparkles, 
  Flame, Zap, Trophy, RefreshCw, Star, Coins, ArrowLeft, 
  ShieldCheck, Heart, User, Cpu, Hammer, Shield, Sliders, Info
} from 'lucide-react';
import { PlayerProfile, Aura } from '../types';
import { AURAS, getAuraById } from '../data/auras';
import { playClickSound, playSuccessChime, triggerHaptic } from '../utils/sound';

export interface SolRNGMapProps {
  playerProfile: PlayerProfile | null;
  currentBiome: string;
  ticksUntilBiomeChange: number;
  potionsInventory: { [potionId: string]: number };
  activeBuffs: {
    luckRemaining: number;
    luckValue: number;
    speedRemaining: number;
    speedValue: number;
    heavenlyActive: boolean;
  };
  onAddCoins: (amount: number) => void;
  onDeductCoins: (amount: number) => boolean;
  onAddPotion: (potionId: string, count: number) => void;
  onRemoveInventoryItem: (instanceId: string) => void;
  onUpdateRollSpeed: (addSpeed: number) => void;
  onUpdateLuckMultiplier: (addLuck: number) => void;
  onChangeBiome: (forcedBiome: string) => void;
  onTriggerMapRoll: () => { rolledAura: Aura; isNewMax: boolean; coinPayout: number } | null;
}

interface MapStructure {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  glow: string;
  icon: string;
  description: string;
}

const STRUCTURES: MapStructure[] = [
  {
    id: 'altar',
    name: 'Gacha Altar of Providence',
    x: 400,
    y: 300,
    width: 100,
    height: 100,
    color: '#312e81',
    glow: 'rgba(99, 102, 241, 0.45)',
    icon: '🔮',
    description: 'The focal vertex where celestial signals and particle currents merge. Click here to roll or use your keyboard.'
  },
  {
    id: 'forge',
    name: 'Forge of Legends',
    x: 650,
    y: 120,
    width: 110,
    height: 90,
    color: '#451a03',
    glow: 'rgba(249, 115, 22, 0.45)',
    icon: '⚒️',
    description: "NPC Jake's industrial hot-iron station. Upgrades sub-atomic roll speed and consumes metal scraps to build accessories."
  },
  {
    id: 'alchemy',
    name: "Stella's Mystic Cauldron",
    x: 130,
    y: 420,
    width: 110,
    height: 90,
    color: '#14532d',
    glow: 'rgba(34, 197, 94, 0.45)',
    icon: '🧪',
    description: 'Bubble, bubble, toil and trouble! Play the arcade herb mini-game to earn free powerful potions.'
  },
  {
    id: 'void_rift',
    name: 'Cosmic Singularity Rift',
    x: 670,
    y: 450,
    width: 90,
    height: 90,
    color: '#3b0764',
    glow: 'rgba(168, 85, 247, 0.55)',
    icon: '🌀',
    description: 'A crack in the server wall where void elements escape. Offer high-tier auras to obtain legendary Void Catalysts.'
  }
];

interface NpcCharacter {
  id: string;
  name: string;
  title: string;
  x: number;
  y: number;
  color: string;
  avatarColor: string;
  emoji: string;
  dialogueLines: string[];
}

const NPCS: NpcCharacter[] = [
  {
    id: 'lime',
    name: 'Helper Lime',
    title: 'The Sol Beacon Guide',
    x: 350,
    y: 220,
    color: '#10b981',
    avatarColor: 'bg-emerald-500',
    emoji: '🟢',
    dialogueLines: [
      "Hello wanderer! I can forecast sub-atomic biomes, and I have a quick brain quiz if you want free Sol coins!",
      "Sol RNG is a dimension of pure fortune. Did you know some auras are 5x more common under specific skies?",
      "Need a storm? I have the climate override tool! Just let me know when you want to spin the weather gauge."
    ]
  },
  {
    id: 'jake',
    name: 'Blacksmith Jake',
    title: 'Anvil Slinger',
    x: 580,
    y: 140,
    color: '#ef4444',
    avatarColor: 'bg-red-500',
    emoji: '⚒️',
    dialogueLines: [
      "Keep back from the hot-coals, kid! I have hammers to forge talismans and roll speed catalysts.",
      "My gears are jammed. Fetch me a Magnetic or Gilded element and I'll permanent-boost your luck calibration in return!",
      "Sol Coins are fine, but forge mastery requires rare sub-atomic matter. Tell me when you want to tune up your speed."
    ]
  },
  {
    id: 'stella',
    name: 'Alchemist Stella',
    title: 'The Witch of the Swamp',
    x: 220,
    y: 380,
    color: '#a855f7',
    avatarColor: 'bg-purple-500',
    emoji: '🧙‍♀️',
    dialogueLines: [
      "Don't touch my mushrooms, dear! They bite. But did you come to brew some fresh Fortune Flasks?",
      "Catch some falling ingredients in my swamp marsh mini-game, and I will mix you a top-tier luck potion!",
      "Double, double, boil mud and bubble! Let's get cooking."
    ]
  },
  {
    id: 'ranger',
    name: 'Void Ranger',
    title: 'Eternity Wanders',
    x: 620,
    y: 430,
    color: '#3b82f6',
    avatarColor: 'bg-blue-600',
    emoji: '👁️',
    dialogueLines: [
      "The server is cracking... files are corrupting. I look for those who carry the scent of the Void.",
      "Bring me a Divinus, Emerald, or Sapphire from your inventory. I will compress its radiation into a temporary Void Catalyst!",
      "A Sovereignty pull is one in five million. Only the void knows if you have that luck."
    ]
  }
];

interface FallingIngredient {
  id: string;
  x: number;
  y: number;
  type: 'speed_spore' | 'luck_herb' | 'toadstool' | 'star_plasma';
  speed: number;
  size: number;
}

// Particle helper interfaces
interface CustomEmber {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface PlayerTrail {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  decay: number;
}

interface CauldronFume {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  decay: number;
}

export default function SolRNGMap({
  playerProfile,
  currentBiome,
  ticksUntilBiomeChange,
  potionsInventory,
  activeBuffs,
  onAddCoins,
  onDeductCoins,
  onAddPotion,
  onRemoveInventoryItem,
  onUpdateRollSpeed,
  onUpdateLuckMultiplier,
  onChangeBiome,
  onTriggerMapRoll
}: SolRNGMapProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  
  // Game coordinates & tracking vectors
  const [playerPos, setPlayerPos] = useState({ x: 400, y: 340 });
  const playerPosRef = useRef(playerPos);
  
  useEffect(() => {
    playerPosRef.current = playerPos;
  }, [playerPos]);

  const [activeNpc, setActiveNpc] = useState<NpcCharacter | null>(null);
  const [dialogueIndex, setDialogueIndex] = useState(0);
  const [quizState, setQuizState] = useState<'idle' | 'question' | 'success' | 'fail' | 'already_done'>('idle');
  const [selectedQuizIndex, setSelectedQuizIndex] = useState<number | null>(null);
  const [jakeService, setJakeService] = useState<'idle' | 'upgrade' | 'quest_check' | 'success' | 'fail'>('idle');
  const [rangerService, setRangerService] = useState<'idle' | 'infuse' | 'success' | 'fail' | 'not_found'>('idle');
  const [floatingRolls, setFloatingRolls] = useState<Array<{ id: string; name: string; color: string; x: number; y: number; opacity: number }>>([]);
  
  // Frame tick indicator
  const [, setFrameTick] = useState(0);

  // Keyboard control tracking states
  const activeKeys = useRef<{ [key: string]: boolean }>({});

  const RIDDLES = [
    {
      question: "Which of these aura elements yields the absolute highest multiplier chance bonus when equipped?",
      options: ["Divinus", "Sapphire", "Common", "Rare"],
      correct: 1, // Sapphire (1:512) vs Divinus (1:32)
      explanation: "Sapphire has a 1:512 rarity ratio, dwarfing Divinus (1:32) and Rare (1:8)!"
    },
    {
      question: "Which atmospheric weather biome boosts Sapphire drops by 6x and awards +20% global luck?",
      options: ["Glitch Outbreak", "Hellfire Core", "Precipitating Rain", "Glacial Blizzard"],
      correct: 2, // Precipitating Rain
      explanation: "Rain makes Sapphires shine bright, multiplying luck by 1.2x and Sapphire rates by 6x!"
    },
    {
      question: "What is the primary action required to progress the Daily Quest 'Forge a new Talisman'?",
      options: ["Buy something off Marketplace", "Craft a module at the Quantum Forge", "Defeat duelists in Arena", "Roll a common aura 100 times"],
      correct: 1, // Craft a module
      explanation: "Talisman forging resides in the Backpack Forge assembly menu!"
    }
  ];
  const [currentRiddleIdx, setCurrentRiddleIdx] = useState(0);

  // Stella's game parameters
  const [stellaMiniGame, setStellaMiniGame] = useState<boolean>(false);
  const [stellaScore, setStellaScore] = useState(0);
  const [basketX, setBasketX] = useState(250);
  const [stellaGameTime, setStellaGameTime] = useState(20); 
  const [fallingItems, setFallingItems] = useState<FallingIngredient[]>([]);

  // Quantum Particle Reservoirs (Canvas level)
  const embersRef = useRef<CustomEmber[]>([]);
  const trailRef = useRef<PlayerTrail[]>([]);
  const cauldronFumesRef = useRef<CauldronFume[]>([]);

  // Setup canvas drawings and premium high fidelity visualizer ticks
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let localFrame = 0;
    let animationId: number;

    // Generate beautiful starry constellation coordinates
    const skyStars: Array<{ x: number; y: number; r: number; val: number; speed: number; col: string }> = [];
    const starColors = ['#818cf8', '#a5b4fc', '#c084fc', '#38bdf8', '#ffffff'];
    for (let i = 0; i < 75; i++) {
      skyStars.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        r: Math.random() * 2.0 + 0.5,
        val: Math.random() * Math.PI * 2,
        speed: 0.02 + Math.random() * 0.03,
        col: starColors[Math.floor(Math.random() * starColors.length)]
      });
    }

    // Weather particles
    const weatherParticles: Array<{ x: number; y: number; speedY: number; speedX: number; size: number; alpha: number; angle: number }> = [];
    for (let i = 0; i < 60; i++) {
      weatherParticles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        speedY: Math.random() * 2 + 1.2,
        speedX: Math.random() * 1.5 - 0.75,
        size: Math.random() * 2.5 + 1.0,
        alpha: Math.random() * 0.5 + 0.3,
        angle: Math.random() * Math.PI
      });
    }

    const render = () => {
      localFrame++;
      setFrameTick(localFrame);

      // --- 1. RADIAL CYBER-COSMIC ENVIRONMENT BIOMES ---
      let bgGrad = ctx.createRadialGradient(400, 300, 50, 400, 300, 520);
      if (currentBiome === 'normal') {
        bgGrad.addColorStop(0, '#0a1024');
        bgGrad.addColorStop(1, '#020306');
      } else if (currentBiome === 'windy') {
        bgGrad.addColorStop(0, '#041d18');
        bgGrad.addColorStop(1, '#010403');
      } else if (currentBiome === 'rainy') {
        bgGrad.addColorStop(0, '#07153b');
        bgGrad.addColorStop(1, '#010207');
      } else if (currentBiome === 'snowy') {
        bgGrad.addColorStop(0, '#15294d');
        bgGrad.addColorStop(1, '#01040d');
      } else if (currentBiome === 'starfall') {
        bgGrad.addColorStop(0, '#1c053a');
        bgGrad.addColorStop(0.7, '#070114');
        bgGrad.addColorStop(1, '#000000');
      } else if (currentBiome === 'hell') {
        bgGrad.addColorStop(0, '#420606');
        bgGrad.addColorStop(0.8, '#0d0101');
        bgGrad.addColorStop(1, '#000000');
      } else if (currentBiome === 'corruption') {
        bgGrad.addColorStop(0, '#2e0a47');
        bgGrad.addColorStop(0.8, '#0b0114');
        bgGrad.addColorStop(1, '#020005');
      } else if (currentBiome === 'glitch') {
        bgGrad.addColorStop(0, '#021a08');
        bgGrad.addColorStop(0.9, '#000000');
        bgGrad.addColorStop(1, '#030101');
      } else {
        bgGrad.addColorStop(0, '#0f0f12');
        bgGrad.addColorStop(1, '#020203');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 800, 600);

      // Render flowing grid systems (Tech Lattice Ground)
      ctx.save();
      ctx.strokeStyle = currentBiome === 'glitch' 
        ? 'rgba(34, 197, 94, 0.05)' 
        : currentBiome === 'hell' 
          ? 'rgba(239, 68, 68, 0.04)' 
          : 'rgba(99, 102, 241, 0.04)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      const offset = (localFrame * 0.4) % gridSize;
      
      // Vertical grid leylines
      for (let x = offset; x < 800; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 600);
        ctx.stroke();
      }
      // Horizontal grid leylines
      for (let y = offset; y < 600; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(800, y);
        ctx.stroke();
      }
      ctx.restore();

      // Render shiny parallax stargraph lines (Floating systems connect)
      skyStars.forEach((star, index) => {
        star.val += star.speed;
        const pulse = Math.abs(Math.sin(star.val));
        ctx.fillStyle = star.col;
        ctx.shadowColor = star.col;
        ctx.shadowBlur = pulse * 8;
        ctx.globalAlpha = 0.2 + pulse * 0.7;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;

        // Trace very subtle connections to nearby stars (constellation physics)
        if (index < skyStars.length - 1 && index % 6 === 0) {
          const nextStar = skyStars[index + 1];
          const dist = Math.hypot(star.x - nextStar.x, star.y - nextStar.y);
          if (dist < 80) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(star.x, star.y);
            ctx.lineTo(nextStar.x, nextStar.y);
            ctx.stroke();
            ctx.restore();
          }
        }
      });

      // --- 2. VECTOR HIGH-TECH NEON LEYLINE BRIDGES ---
      // Draw flowing energy streams across the coordinate bridges
      const drawEnergyLeyline = (startX: number, startY: number, endX: number, endY: number, curveX: number, curveY: number, color1: string, color2: string, frameFactor: number) => {
        ctx.save();
        // Base pipeline shadow
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.9)';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(curveX, curveY, endX, endY);
        ctx.stroke();

        // Neon neon stream base
        ctx.strokeStyle = color1;
        ctx.lineWidth = 3;
        ctx.shadowColor = color2;
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(curveX, curveY, endX, endY);
        ctx.stroke();

        // Pulsate energy cells creeping down leylines
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4.5;
        ctx.setLineDash([12, 140]);
        ctx.lineDashOffset = -frameFactor * 3.5;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(curveX, curveY, endX, endY);
        ctx.stroke();
        ctx.restore();
      };

      // A) Bridge to Forge (Center 400,300 to Forge 650,120) with hot-orange flare
      drawEnergyLeyline(400, 300, 650, 120, 520, 210, 'rgba(249, 115, 22, 0.5)', '#f97316', localFrame);

      // B) Bridge to Stella swamp (Center 400,300 to Alchemy 130,420) with pure emerald glow
      drawEnergyLeyline(400, 300, 130, 420, 265, 360, 'rgba(16, 185, 129, 0.45)', '#10b981', -localFrame * 0.8);

      // C) Glitchy deep purple/fuchsia beam to Void Seeker (Center 400,300 to Void 670,450)
      drawEnergyLeyline(400, 300, 670, 450, 535, 375, 'rgba(168, 85, 247, 0.55)', '#d946ef', localFrame * 1.5);

      // --- 3. FLOATING CYBER-ISLANDS WITH CHROME BORDERS ---
      const drawBeautifulIsland = (cx: number, cy: number, w: number, h: number, isCircle: boolean, baseStyle: string, neonColor: string, hoverFreq: number) => {
        // Subtle out-of-phase vertical bobbing
        const islandBob = Math.sin(localFrame * 0.04 + hoverFreq) * 4.5;

        ctx.save();
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 24;
        ctx.shadowOffsetY = 15;

        // Bottom geological cliff extrusion shadows
        ctx.fillStyle = '#090a0f';
        ctx.beginPath();
        if (isCircle) {
          ctx.arc(cx, cy + 18 + islandBob, w, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cx - w / 2, cy - h / 2 + 18 + islandBob, w, h, 24);
        }
        ctx.fill();
        ctx.shadowColor = 'transparent';

        // High contrast stone geology layer
        ctx.fillStyle = '#141724';
        ctx.beginPath();
        if (isCircle) {
          ctx.arc(cx, cy + 10 + islandBob, w, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cx - w / 2, cy - h / 2 + 10 + islandBob, w, h, 24);
        }
        ctx.fill();

        // Rocks, debris elements sticking out from cliffs
        ctx.fillStyle = '#202538';
        for (let j = 0; j < 5; j++) {
          const rx = cx + Math.cos(j * 15) * (w * 0.68);
          const ry = cy + Math.sin(j * 20) * (h * 0.35 + (isCircle ? w * 0.35 : 0)) + 12 + islandBob;
          ctx.beginPath();
          ctx.arc(rx, ry, 6 + (j % 3) * 4, 0, Math.PI * 2);
          ctx.fill();
        }

        // Elegant Grass Turf top surface flat plate
        ctx.fillStyle = baseStyle;
        ctx.beginPath();
        if (isCircle) {
          ctx.arc(cx, cy + islandBob, w, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cx - w / 2, cy - h / 2 + islandBob, w, h, 24);
        }
        ctx.fill();

        // Neon glowing platform outlines
        ctx.strokeStyle = neonColor;
        ctx.lineWidth = 1.8;
        ctx.shadowColor = neonColor;
        ctx.shadowBlur = 12 + Math.sin(localFrame * 0.08) * 3;
        ctx.beginPath();
        if (isCircle) {
          ctx.arc(cx, cy + islandBob, w, 0, Math.PI * 2);
        } else {
          ctx.roundRect(cx - w / 2, cy - h / 2 + islandBob, w, h, 24);
        }
        ctx.stroke();

        // Technology geometric markings on platform surface
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1.0;
        ctx.shadowBlur = 0;
        ctx.beginPath();
        if (isCircle) {
          ctx.arc(cx, cy + islandBob, w * 0.72, 0, Math.PI * 2);
          ctx.moveTo(cx - w * 0.5, cy + islandBob);
          ctx.lineTo(cx + w * 0.5, cy + islandBob);
        } else {
          ctx.strokeRect(cx - w / 2 + 10, cy - h / 2 + 10 + islandBob, w - 20, h - 20);
        }
        ctx.stroke();

        ctx.restore();
      };

      // Island A: Central Altar platform (Obsidian Deep Purple, indigo glow)
      drawBeautifulIsland(400, 300, 145, 145, true, '#090a14', '#6366f1', 0);
      
      // Island B: Blacksmith Forge deck (Warm dark rust deck)
      drawBeautifulIsland(650, 120, 140, 100, false, '#100a08', '#f97316', 3.14);
      
      // Island C: Witch Stella Swamp land (Eerie dark teal turf)
      drawBeautifulIsland(130, 420, 140, 110, false, '#04120f', '#10b981', 1.57);
      
      // Island D: Void Ranger Observatory (Cosmic abyss violet)
      drawBeautifulIsland(670, 450, 130, 110, false, '#090612', '#a855f7', 4.71);


      // --- 4. LANDMARKS & STRUCTURE DECORATIONS ---
      STRUCTURES.forEach(s => {
        const islandBob = Math.sin(localFrame * 0.04 + (s.id === 'altar' ? 0 : s.id === 'forge' ? 3.14 : s.id === 'alchemy' ? 1.57 : 4.71)) * 4.5;
        const curY = s.y + islandBob;

        if (s.id === 'altar') {
          // GACHA ALTAR CHRONO RING VISUALIZATIONS
          ctx.save();
          // Spinning rune wheels
          ctx.shadowColor = '#6366f1';
          ctx.shadowBlur = 20;

          // Triple concentric orbit rings spinning oppositely
          ctx.strokeStyle = 'rgba(129, 140, 248, 0.7)';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(s.x, curY, s.width / 2 + 10, localFrame * 0.015, localFrame * 0.015 + Math.PI * 1.5);
          ctx.stroke();

          ctx.strokeStyle = 'rgba(167, 139, 250, 0.4)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 10]);
          ctx.beginPath();
          ctx.arc(s.x, curY, s.width / 2 + 22, -localFrame * 0.009, -localFrame * 0.009 + Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // Altar glowing Core Singularity Orb
          let coreGrad = ctx.createRadialGradient(s.x, curY, 1, s.x, curY, 32);
          coreGrad.addColorStop(0, '#ffffff');
          coreGrad.addColorStop(0.3, '#818cf8');
          coreGrad.addColorStop(0.7, '#4f46e5');
          coreGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = coreGrad;
          ctx.beginPath();
          ctx.arc(s.x, curY, 32, 0, Math.PI * 2);
          ctx.fill();

          // Infinite energy light pillar shooting high up matching equipped aura spec
          if (playerProfile) {
            const activeAuraId = playerProfile.inventory.find(i => i.id === playerProfile.equippedAuraId)?.auraId || 'common';
            const activeAura = getAuraById(activeAuraId);
            
            // Draw column gradients
            ctx.shadowBlur = 24;
            ctx.shadowColor = activeAura.textColor;
            ctx.fillStyle = activeAura.textColor;
            const laserWidth = 14 + Math.sin(localFrame * 0.12) * 4;
            ctx.globalAlpha = 0.15 + Math.sin(localFrame * 0.08) * 0.05;
            ctx.fillRect(s.x - laserWidth / 2, 0, laserWidth, curY);

            // Blistering white hot center stream
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.55 + Math.sin(localFrame * 0.15) * 0.12;
            ctx.fillRect(s.x - 2.5, 0, 5, curY);
            ctx.globalAlpha = 1.0;
          }
          ctx.restore();

        } else if (s.id === 'forge') {
          // BLACKSMITH HOT FORGE ANVIL CORE
          ctx.save();
          // Forge container housing
          ctx.fillStyle = '#1e2030';
          ctx.lineWidth = 2.5;
          ctx.strokeStyle = '#323754';
          ctx.beginPath();
          ctx.roundRect(s.x - 38, curY - 26, 76, 52, 10);
          ctx.fill();
          ctx.stroke();

          // Active coal hearth furnace orange glow
          let coalsGrad = ctx.createRadialGradient(s.x, curY, 2, s.x, curY, 24);
          coalsGrad.addColorStop(0, '#ffedd5');
          coalsGrad.addColorStop(0.4, '#f97316');
          coalsGrad.addColorStop(0.8, '#ea580c');
          coalsGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = coalsGrad;
          ctx.beginPath();
          ctx.arc(s.x, curY, 24, 0, Math.PI * 2);
          ctx.fill();

          // Tiny mechanical sparks spawning randomly inside forge
          if (localFrame % 14 === 0) {
            embersRef.current.push({
              x: s.x + (Math.random() * 20 - 10),
              y: curY + (Math.random() * 10 - 5),
              vx: Math.random() * 1.5 - 0.75,
              vy: -(Math.random() * 1.5 + 1),
              size: Math.random() * 2 + 1,
              color: '#fb923c',
              alpha: 1.0,
              decay: 0.03
            });
          }
          ctx.restore();

        } else if (s.id === 'alchemy') {
          // WITCH STELLA'S GURGLING POTION CAULDRON
          ctx.save();
          // Heavy runic stand cauldron outline
          ctx.fillStyle = '#0f172a';
          ctx.strokeStyle = '#022c22';
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.roundRect(s.x - 32, curY - 14, 64, 40, 12);
          ctx.fill();
          ctx.stroke();

          // Bubbling bubbling toxic emerald broth
          let potionGrad = ctx.createRadialGradient(s.x, curY - 10, 2, s.x, curY - 10, 22);
          potionGrad.addColorStop(0, '#a7f3d0');
          potionGrad.addColorStop(0.5, '#10b981');
          potionGrad.addColorStop(0.9, '#047857');
          potionGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = potionGrad;
          ctx.beginPath();
          ctx.arc(s.x, curY - 10, 22, 0, Math.PI * 2);
          ctx.fill();

          // Spawning bubbling potion fumes
          if (localFrame % 8 === 0) {
            cauldronFumesRef.current.push({
              x: s.x + (Math.random() * 24 - 12),
              y: curY - 12,
              vx: (Math.random() - 0.5) * 0.8,
              vy: -(Math.random() * 1.2 + 0.8),
              radius: Math.random() * 4 + 2,
              color: Math.random() > 0.5 ? '#34d399' : '#c084fc',
              alpha: 0.8,
              decay: 0.015
            });
          }
          ctx.restore();

        } else if (s.id === 'void_rift') {
          // DEEP SPACE INTERSTELLAR RIFT HOLE
          ctx.save();
          // Void core whirlpool glow
          ctx.shadowColor = '#a855f7';
          ctx.shadowBlur = 25;
          ctx.fillStyle = '#0f051d';
          ctx.beginPath();
          ctx.arc(s.x, curY, 26, 0, Math.PI * 2);
          ctx.fill();

          // Accretion disk spinning spirals
          ctx.strokeStyle = 'rgba(217, 70, 239, 0.7)';
          ctx.lineWidth = 2.5;
          ctx.beginPath();
          ctx.arc(s.x, curY, 34 + Math.sin(localFrame * 0.08) * 3, localFrame * 0.04, localFrame * 0.04 + Math.PI * 0.7);
          ctx.stroke();
          
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(s.x, curY, 34 + Math.sin(localFrame * 0.08) * 3, localFrame * 0.04 + Math.PI, localFrame * 0.04 + Math.PI * 1.7);
          ctx.stroke();

          // Small vortex sparkles sucked inside core
          if (localFrame % 14 === 0) {
            const angle = Math.random() * Math.PI * 2;
            const radius = 55;
            embersRef.current.push({
              x: s.x + Math.cos(angle) * radius,
              y: curY + Math.sin(angle) * radius,
              vx: -Math.cos(angle) * 1.6,
              vy: -Math.sin(angle) * 1.6,
              size: Math.random() * 2.5 + 1,
              color: '#a855f7',
              alpha: 1.0,
              decay: 0.015
            });
          }
          ctx.restore();
        }

        // Beautiful structural headers
        ctx.fillStyle = '#e2e8f0';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 3;
        ctx.fillText(s.name.toUpperCase(), s.x, curY - s.height / 2 - 12);
        ctx.shadowBlur = 0;
      });


      // --- 5. DETAILED SCI-FI CYBERNETIC SPECIALIZED NPCS ---
      NPCS.forEach(n => {
        const islandBob = Math.sin(localFrame * 0.04 + (n.id === 'lime' ? 0 : n.id === 'jake' ? 3.14 : n.id === 'stella' ? 1.57 : 4.71)) * 4.5;
        const curY = n.y + islandBob;

        // Interactive standing shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.beginPath();
        ctx.ellipse(n.x, curY + 18, 14, 6, 0, 0, Math.PI * 2);
        ctx.fill();

        // Idle character animation float factor
        const bob = Math.sin(localFrame * 0.065 + n.x) * 4;

        if (n.id === 'lime') {
          // --- HELPER LIME (🟢 High-Tech Cyber Guideway Mech) ---
          // Under-feet magnetic hovering disk
          ctx.save();
          ctx.fillStyle = '#064e3b';
          ctx.strokeStyle = '#10b981';
          ctx.lineWidth = 2;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = IO_GlowState;
          ctx.beginPath();
          ctx.ellipse(n.x, curY + 14 + bob, 14, 4.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          // Sleek armor body suit
          ctx.fillStyle = '#047857';
          ctx.beginPath();
          ctx.roundRect(n.x - 11, curY - 3 + bob, 22, 17, 7);
          ctx.fill();

          // Pilot neon shoulder pads
          ctx.fillStyle = '#10b981';
          ctx.fillRect(n.x - 14, curY - 2 + bob, 4, 6);
          ctx.fillRect(n.x + 10, curY - 2 + bob, 4, 6);

          // Head with custom hair braids
          ctx.fillStyle = '#fed7aa';
          ctx.beginPath();
          ctx.arc(n.x, curY - 12 + bob, 8, 0, Math.PI * 2);
          ctx.fill();

          // Spiky cybernetic braids
          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.moveTo(n.x - 8, curY - 14 + bob);
          ctx.lineTo(n.x - 13, curY - 21 + bob);
          ctx.lineTo(n.x - 3, curY - 17 + bob);
          ctx.lineTo(n.x, curY - 24 + bob);
          ctx.lineTo(n.x + 3, curY - 17 + bob);
          ctx.lineTo(n.x + 13, curY - 21 + bob);
          ctx.lineTo(n.x + 8, curY - 14 + bob);
          ctx.fill();

          // Minty scanning cyber goggles visor
          ctx.fillStyle = '#34d399';
          ctx.shadowColor = '#34d399';
          ctx.shadowBlur = 8;
          ctx.fillRect(n.x - 7, curY - 15 + bob, 14, 4);
          ctx.restore();

          // Mini cyber sentinel drone circling Lime
          const droneR = 24;
          const droneAngle = localFrame * 0.045;
          const dx = n.x + Math.cos(droneAngle) * droneR;
          const dy = curY - 15 + Math.sin(droneAngle) * 9 + bob;
          ctx.save();
          ctx.fillStyle = '#10b981';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#10b981';
          ctx.beginPath();
          ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
          ctx.fill();
          
          // Connect track scanner beam from drone to Lime
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.25)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(dx, dy);
          ctx.lineTo(n.x, curY - 12 + bob);
          ctx.stroke();
          ctx.restore();

        } else if (n.id === 'jake') {
          // --- BLACKSMITH JAKE (⚒️ Robotic Forge Juggernaut) ---
          // Heavy cybernetic frame exo-arm
          ctx.save();
          ctx.fillStyle = '#3f3f46';
          ctx.beginPath();
          ctx.roundRect(n.x - 12, curY - 3 + bob, 24, 20, 5);
          ctx.fill();

          // Apron of blazing core steel
          ctx.fillStyle = '#ea580c';
          ctx.fillRect(n.x - 9, curY + 2 + bob, 18, 15);

          // Head protected by thick iron visor helmet
          ctx.fillStyle = '#27272a';
          ctx.beginPath();
          ctx.arc(n.x, curY - 11 + bob, 8.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#ea580c';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          // Blazing orange visor band
          ctx.fillStyle = '#f97316';
          ctx.shadowColor = '#f97316';
          ctx.shadowBlur = 8;
          ctx.fillRect(n.x - 6, curY - 14 + bob, 12, 3);
          ctx.restore();

          // Massive pneumatic power hammer
          ctx.save();
          const strikeBob = Math.sin(localFrame * 0.1) > 0.85;
          if (strikeBob) {
            // Smash coordinates! Trigger spark splatters
            ctx.fillStyle = '#f43f5e';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#f43f5e';
            ctx.beginPath();
            ctx.arc(n.x + 16, curY + 12 + bob, 14, 0, Math.PI * 2);
            ctx.fill();

            if (localFrame % 4 === 0) {
              for (let as = 0; as < 8; as++) {
                embersRef.current.push({
                  x: n.x + 16,
                  y: curY + 12 + bob,
                  vx: (Math.random() * 4 - 1.5) * 1.5,
                  vy: -(Math.random() * 3 + 2),
                  size: Math.random() * 3.5 + 1.2,
                  color: '#f97316',
                  alpha: 1.0,
                  decay: 0.02
                });
              }
            }
          }

          // Render hammer asset in hand
          const hammerYOffset = strikeBob ? 10 : 0;
          ctx.fillStyle = '#71717a';
          ctx.fillRect(n.x + 12, curY - 4 + bob + hammerYOffset, 8, 12);
          ctx.fillStyle = '#b45309';
          ctx.fillRect(n.x + 15, curY + 8 + bob + hammerYOffset, 2, 8);
          ctx.restore();

        } else if (n.id === 'stella') {
          // --- ALCHEMIST STELLA (🧙‍♀️ Emerald Witch, Potion orbits) ---
          // Holographic hexagon protective plasma shield
          ctx.save();
          ctx.strokeStyle = 'rgba(52, 211, 153, 0.45)';
          ctx.lineWidth = 1.5;
          ctx.shadowColor = '#10b981';
          ctx.shadowBlur = 14 + Math.sin(localFrame * 0.1) * 4;
          ctx.beginPath();
          ctx.arc(n.x, curY + bob, 22, 0, Math.PI * 2);
          ctx.stroke();

          // Purple mystic flow witch robes
          ctx.fillStyle = '#7c3aed';
          ctx.beginPath();
          ctx.moveTo(n.x - 11, curY + 17 + bob);
          ctx.lineTo(n.x - 4, curY - 4 + bob);
          ctx.lineTo(n.x + 4, curY - 4 + bob);
          ctx.lineTo(n.x + 11, curY + 17 + bob);
          ctx.fill();

          // Emerald gemstone core on torso
          ctx.fillStyle = '#059669';
          ctx.beginPath();
          ctx.arc(n.x, curY + 4 + bob, 3.5, 0, Math.PI * 2);
          ctx.fill();

          // Face
          ctx.fillStyle = '#ffedd5';
          ctx.beginPath();
          ctx.arc(n.x, curY - 11 + bob, 8, 0, Math.PI * 2);
          ctx.fill();

          // Giant wide-brim pointed spellcraft hat with glowing tip
          ctx.fillStyle = '#5b21b6';
          ctx.beginPath();
          ctx.moveTo(n.x - 16, curY - 15 + bob);
          ctx.lineTo(n.x + 16, curY - 15 + bob);
          ctx.lineTo(n.x, curY - 35 + bob);
          ctx.fill();

          // Hat peak starry spark
          ctx.fillStyle = '#67e8f9';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#67e8f9';
          ctx.beginPath();
          ctx.arc(n.x, curY - 35 + bob, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Orbiting micro chemical flash objects
          const orbitalRadius = 18;
          const rateFlaskSpeed = -localFrame * 0.05;
          const fx = n.x + Math.cos(rateFlaskSpeed) * orbitalRadius;
          const fy = curY - 5 + Math.sin(rateFlaskSpeed) * 6 + bob;
          ctx.save();
          ctx.fillStyle = '#ec4899';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#ec4899';
          ctx.beginPath();
          ctx.arc(fx, fy, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

        } else if (n.id === 'ranger') {
          // --- VOID RANGER (👁️ Abyssal Singularity Phantom Spectre) ---
          // Dark twilight hooded cloak
          ctx.save();
          // Accretion gravitational distortion field behind him
          let abyssRadial = ctx.createRadialGradient(n.x, curY, 2, n.x, curY, 25);
          abyssRadial.addColorStop(0, '#000000');
          abyssRadial.addColorStop(0.5, '#581c87');
          abyssRadial.addColorStop(1, 'transparent');
          ctx.fillStyle = abyssRadial;
          ctx.beginPath();
          ctx.arc(n.x, curY, 25, 0, Math.PI * 2);
          ctx.fill();

          // Main cloak body
          ctx.fillStyle = '#1e1b4b';
          ctx.beginPath();
          ctx.roundRect(n.x - 12, curY - 3 + bob, 24, 19, 6);
          ctx.fill();
          ctx.strokeStyle = '#c084fc';
          ctx.lineWidth = 1;
          ctx.stroke();

          // Void face aperture (pure darkness with central cyan scan optic)
          ctx.fillStyle = '#020617';
          ctx.beginPath();
          ctx.arc(n.x, curY - 12 + bob, 9, 0, Math.PI * 2);
          ctx.fill();

          // Pulsing central scanning visor visor
          ctx.fillStyle = '#22d3ee';
          ctx.shadowColor = '#22d3ee';
          ctx.shadowBlur = 10;
          const pulseScan = 4.5 + Math.sin(localFrame * 0.15) * 3;
          ctx.beginPath();
          ctx.ellipse(n.x, curY - 12 + bob, pulseScan, 2.5, 0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Dual futuristic rings revolving around the ranger
          ctx.save();
          ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
          ctx.lineWidth = 1.25;
          ctx.beginPath();
          ctx.ellipse(n.x, curY + 6 + bob, 18, 6, localFrame * 0.02, 0, Math.PI * 2);
          ctx.stroke();
          ctx.beginPath();
          ctx.ellipse(n.x, curY + 6 + bob, 18, 6, -localFrame * 0.02, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        // Subtitle labels with majestic tracking values
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 4;
        ctx.fillText(n.name.toUpperCase(), n.x, curY - 22 + bob);

        ctx.fillStyle = n.color;
        ctx.font = 'bold 8px monospace';
        ctx.fillText(`• ${n.title.toUpperCase()} •`, n.x, curY + 28 + bob);
        ctx.restore();
      });


      // --- 6. DRAW PLAYER AVATAR WITH EXOTIC ENERGY TRAILS ---
      if (playerProfile) {
        const activeAuraId = playerProfile.inventory.find(i => i.id === playerProfile.equippedAuraId)?.auraId || 'common';
        const activeAura = getAuraById(activeAuraId);

        // Movement bob mechanics
        const isMoving = activeKeys.current['w'] || activeKeys.current['a'] || activeKeys.current['s'] || activeKeys.current['d'] || 
                         activeKeys.current['arrowup'] || activeKeys.current['arrowdown'] || activeKeys.current['arrowleft'] || activeKeys.current['arrowright'];
        const wBob = isMoving ? Math.sin(localFrame * 0.18) * 4.5 : Math.sin(localFrame * 0.08) * 2;

        // Populate beautiful movement trail pool if player is moving
        if (isMoving && localFrame % 3 === 0) {
          trailRef.current.push({
            x: playerPos.x,
            y: playerPos.y + wBob,
            size: Math.random() * 5 + 3,
            color: activeAura.textColor,
            alpha: 0.8,
            decay: 0.04
          });
        }

        // Render player trails
        ctx.save();
        trailRef.current.forEach(t => {
          ctx.fillStyle = t.color;
          ctx.globalAlpha = t.alpha;
          ctx.shadowBlur = 10;
          ctx.shadowColor = t.color;
          ctx.beginPath();
          ctx.arc(t.x, t.y, t.size, 0, Math.PI * 2);
          ctx.fill();
          
          t.alpha -= t.decay;
          t.size = Math.max(0.1, t.size - 0.15);
        });
        trailRef.current = trailRef.current.filter(t => t.alpha > 0);
        ctx.restore();

        // Dual spinning rings around the player matching equipped aura spectrum
        ctx.save();
        ctx.shadowBlur = 14 + Math.sin(localFrame * 0.12) * 5;
        ctx.shadowColor = activeAura.textColor;
        ctx.strokeStyle = activeAura.textColor;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(playerPos.x, playerPos.y + wBob, 20, 6, localFrame * 0.035, 0, Math.PI * 2);
        ctx.stroke();

        ctx.beginPath();
        ctx.ellipse(playerPos.x, playerPos.y + wBob, 20, 6, -localFrame * 0.035, 0, Math.PI * 2);
        ctx.stroke();

        // Player solid armor
        ctx.shadowBlur = 4;
        ctx.fillStyle = '#0f172a'; // Carbon fiber armor plates
        ctx.beginPath();
        ctx.arc(playerPos.x, playerPos.y + wBob, 12, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.2;
        ctx.stroke();

        // Neon gold visual HUD helmet crest
        ctx.fillStyle = '#fbbf24';// Gilded visor specs
        ctx.shadowBlur = 8;
        ctx.shadowColor = '#fbbf24';
        ctx.fillRect(playerPos.x - 7.5, playerPos.y - 3 + wBob, 15, 4.5);
        ctx.restore();

        // Beautiful Player labels
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 9.5px sans-serif';
        ctx.textAlign = 'center';
        ctx.shadowColor = 'rgba(0,0,0,0.85)';
        ctx.shadowBlur = 4;
        ctx.fillText(`${playerProfile.username.toUpperCase()} (YOU)`, playerPos.x, playerPos.y - 20);

        ctx.fillStyle = activeAura.textColor;
        ctx.font = 'bold 9px monospace';
        ctx.fillText(`⚡ ${activeAura.name.toUpperCase()}`, playerPos.x, playerPos.y + 24);
        ctx.restore();

        // Draw matching Bobbing equipped Pet Companion Mascot next to Player avatar
        if (playerProfile.equippedPetId && playerProfile.ownedPets) {
          const equippedPet = playerProfile.ownedPets.find(p => p.id === playerProfile.equippedPetId);
          if (equippedPet) {
            const petAngle = localFrame * 0.045;
            const petBob = Math.sin(localFrame * 0.06) * 3;
            const px = playerPos.x + 24 + Math.cos(petAngle) * 3;
            const py = playerPos.y - 12 + wBob + petBob;

            // Micro trailing particles behind the pet companion
            if (localFrame % 5 === 0) {
              trailRef.current.push({
                x: px,
                y: py,
                size: Math.random() * 2.5 + 1.2,
                color: equippedPet.color || '#fb923c',
                alpha: 0.7,
                decay: 0.05
              });
            }

            // Shiny sparkling aura for high tier pets or shiny status
            if (equippedPet.shiny && localFrame % 8 === 0) {
              embersRef.current.push({
                x: px + (Math.random() * 8 - 4),
                y: py + (Math.random() * 8 - 4),
                vx: (Math.random() - 0.5) * 0.5,
                vy: -Math.random() * 0.5 - 0.3,
                size: Math.random() * 2 + 1,
                color: '#fbbf24',
                alpha: 1.0,
                decay: 0.03
              });
            }

            // Underfoot magnetic tiny pet shadow
            ctx.save();
            ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
            ctx.beginPath();
            ctx.ellipse(px, py + 12, 6, 2.5, 0, 0, Math.PI * 2);
            ctx.fill();

            // Render the pet emoji
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.shadowColor = equippedPet.color || '#ec4899';
            ctx.shadowBlur = equippedPet.shiny ? 10 : 5;
            ctx.fillText(equippedPet.emoji, px, py);

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 7px sans-serif';
            ctx.shadowColor = 'rgba(0,0,0,0.8)';
            ctx.shadowBlur = 3;
            const nicknameText = equippedPet.name.length > 8 ? equippedPet.name.substring(0, 7) + '..' : equippedPet.name;
            ctx.fillText(nicknameText.toUpperCase(), px, py - 9);
            ctx.restore();
          }
        }
      }


      // --- 7. WEATHER SPECTRE PARTICLES OVERLAYS ---
      weatherParticles.forEach(p => {
        let flakeColor = '#ffffff';
        ctx.save();

        if (currentBiome === 'rainy') {
          p.speedY = 10;
          p.speedX = -1.5;
          flakeColor = 'rgba(14, 165, 233, 0.6)';
          ctx.fillStyle = flakeColor;
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#0ea5e9';
          ctx.fillRect(p.x, p.y, 1.5, 14);
        } else if (currentBiome === 'windy') {
          p.speedY = 0.5;
          p.speedX = 14;
          p.size = Math.random() * 2 + 1;
          flakeColor = 'rgba(45, 212, 191, 0.25)';
          ctx.fillStyle = flakeColor;
          ctx.fillRect(p.x, p.y, 45, 1.5);
        } else if (currentBiome === 'snowy') {
          p.speedY = 1.6;
          p.speedX = Math.sin(localFrame * 0.04 + p.x) * 1.5;
          flakeColor = '#f8fafc';
          ctx.fillStyle = flakeColor;
          ctx.shadowBlur = 6;
          ctx.shadowColor = '#ffffff';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentBiome === 'starfall') {
          p.speedY = 5.5;
          p.speedX = -4.0;
          ctx.fillStyle = 'rgba(168, 85, 247, 0.85)';
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#c084fc';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.8, 0, Math.PI * 2);
          ctx.fill();
          
          // Constellation falling tracers
          ctx.strokeStyle = 'rgba(168, 85, 247, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x + 22, p.y - 18);
          ctx.stroke();
        } else if (currentBiome === 'hell') {
          p.speedY = -2.5; // Ascending magma embers
          p.speedX = Math.sin(localFrame * 0.03 + p.y) * 1.5;
          flakeColor = 'rgba(239, 68, 68, 0.9)';
          ctx.fillStyle = flakeColor;
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#ef4444';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.4, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentBiome === 'corruption') {
          p.speedY = Math.sin(localFrame * 0.05 + p.x) * 2;
          p.speedX = Math.cos(localFrame * 0.05 + p.y) * 2;
          p.size = Math.max(1, p.size - 0.05);
          flakeColor = 'rgba(236, 72, 153, 0.85)';
          ctx.fillStyle = flakeColor;
          ctx.shadowBlur = 10;
          ctx.shadowColor = '#db2777';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
          ctx.fill();
        } else if (currentBiome === 'glitch') {
          // Cyber code fragments sliding down screens
          p.speedY = 6.0;
          p.speedX = 0;
          ctx.fillStyle = 'rgba(16, 185, 129, 0.95)';
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#10b981';
          ctx.font = '9px monospace';
          ctx.fillText(Math.random() > 0.5 ? '1' : '0', p.x, p.y);
        } else {
          // Standard grass spores
          p.speedY = 0.8;
          p.speedX = Math.sin(localFrame * 0.02 + p.x) * 0.8;
          flakeColor = 'rgba(52, 211, 153, 0.4)';
          ctx.fillStyle = flakeColor;
          ctx.beginPath();
          ctx.ellipse(p.x, p.y, 4, 1.8, Math.PI / 4, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();

        p.y += p.speedY;
        p.x += p.speedX;

        // Wrap particles loop
        if (p.y > 600) p.y = -10;
        if (p.y < -15) p.y = 595;
        if (p.x > 800) p.x = -10;
        if (p.x < -10) p.x = 795;
      });


      // --- 8. EMBER, SPLATTERS & CAULDRON STEAM RENDER POOL ---
      ctx.save();
      // Anvil Forge Embers
      embersRef.current.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.globalAlpha = e.alpha;
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.size, 0, Math.PI * 2);
        ctx.fill();

        e.x += e.vx;
        e.y += e.vy;
        e.alpha -= e.decay;
        e.size = Math.max(0.1, e.size - 0.05);
      });
      embersRef.current = embersRef.current.filter(e => e.alpha > 0);

      // Stella Alchemy Gurgling fumes
      cauldronFumesRef.current.forEach(f => {
        ctx.fillStyle = f.color;
        ctx.globalAlpha = f.alpha;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2);
        ctx.fill();

        f.x += f.vx;
        f.y += f.vy;
        f.alpha -= f.decay;
        f.radius = Math.max(0.1, f.radius + 0.12); // Steam inflates
      });
      cauldronFumesRef.current = cauldronFumesRef.current.filter(f => f.alpha > 0);
      ctx.restore();


      // --- 9. INTERACTIVE PROXIMITY DIALOG KEYS ---
      let showingPrompt = false;

      // Find closest NPC (radius 75px)
      let closestNpcRender: NpcCharacter | null = null;
      let minDistanceRender = 75;
      NPCS.forEach(n => {
        const dist = Math.hypot(playerPos.x - n.x, playerPos.y - n.y);
        if (dist < minDistanceRender) {
          minDistanceRender = dist;
          closestNpcRender = n;
        }
      });

      if (closestNpcRender && !stellaMiniGame) {
        showingPrompt = true;
        ctx.save();
        ctx.shadowColor = closestNpcRender.color;
        ctx.shadowBlur = 14;
        ctx.fillStyle = 'rgba(8, 10, 20, 0.95)';
        ctx.strokeStyle = closestNpcRender.color;
        ctx.lineWidth = 2.0;

        const floatPromptY = closestNpcRender.y - 48 + Math.sin(localFrame * 0.08) * 2;
        ctx.beginPath();
        ctx.roundRect(closestNpcRender.x - 45, floatPromptY, 90, 19, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 8px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[E] DISCOURSE', closestNpcRender.x, floatPromptY + 12.5);
        ctx.restore();
      }

      // Stand close to Altar
      if (!showingPrompt && !activeNpc && !stellaMiniGame) {
        const altarDist = Math.hypot(playerPos.x - 400, playerPos.y - 300);
        if (altarDist < 75) {
          ctx.save();
          ctx.shadowColor = '#6366f1';
          ctx.shadowBlur = 15;
          ctx.fillStyle = 'rgba(8, 10, 20, 0.95)';
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2.0;

          const floatPromptY = 244 + Math.sin(localFrame * 0.08) * 2;
          ctx.beginPath();
          ctx.roundRect(400 - 45, floatPromptY, 90, 19, 8);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 8px monospace';
          ctx.textAlign = 'center';
          ctx.fillText('[E] ROLL GACHA', 400, floatPromptY + 12.5);
          ctx.restore();
        }
      }

      // --- 10. SYSTEM STATUS DATA GRAPH CORNER ---
      ctx.save();
      ctx.fillStyle = 'rgba(8, 9, 20, 0.85)';
      ctx.fillRect(8, 8, 235, 26);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 1;
      ctx.strokeRect(8, 8, 235, 26);

      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(18, 21, 3.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 8.5px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`SYSTEM COAX_LINK: ONLINE // WASD/D-PAD`, 28, 24);
      ctx.restore();

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [playerPos, currentBiome, playerProfile, activeNpc, stellaMiniGame]);

  // Handle player parameters checks
  const IO_GlowState = 8 + Math.sin(Date.now() / 150) * 4;

  // Handle keyboard coordinates modifications
  useEffect(() => {
    let movementInterval: any;

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
        activeKeys.current[key] = true;
        e.preventDefault();
      }

      if (key === 'e') {
        e.preventDefault();
        if (stellaMiniGame) return;

        if (activeNpc) {
          handleNextDialogue();
          return;
        }

        const currentPos = playerPosRef.current;

        // Proximity NPC locator
        let closestNpc: NpcCharacter | null = null;
        let minDistance = 75;
        NPCS.forEach(n => {
          const dist = Math.hypot(currentPos.x - n.x, currentPos.y - n.y);
          if (dist < minDistance) {
            minDistance = dist;
            closestNpc = n;
          }
        });

        if (closestNpc) {
          handleInteractWithNpc(closestNpc);
        } else {
          const altarDist = Math.hypot(currentPos.x - 400, currentPos.y - 300);
          if (altarDist < 75) {
            handleTriggerAltarRoll();
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key in activeKeys.current) {
        activeKeys.current[key] = false;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    movementInterval = setInterval(() => {
      let dx = 0;
      let dy = 0;
      const speed = 7.5;

      if (activeKeys.current['w'] || activeKeys.current['arrowup']) dy -= speed;
      if (activeKeys.current['s'] || activeKeys.current['arrowdown']) dy += speed;
      if (activeKeys.current['a'] || activeKeys.current['arrowleft']) dx -= speed;
      if (activeKeys.current['d'] || activeKeys.current['arrowright']) dx += speed;

      if (dx !== 0 || dy !== 0) {
        setPlayerPos(prev => {
          const next = {
            x: Math.max(20, Math.min(780, prev.x + dx)),
            y: Math.max(20, Math.min(580, prev.y + dy))
          };
          
          let collides = false;
          STRUCTURES.forEach(s => {
            if (s.id === 'altar') {
              const dist = Math.hypot(next.x - s.x, next.y - s.y);
              if (dist < s.width / 2) collides = true;
            } else {
              const left = s.x - s.width / 2;
              const right = s.x + s.width / 2;
              const top = s.y - s.height / 2;
              const bottom = s.y + s.height / 2;
              if (next.x > left - 10 && next.x < right + 10 && next.y > top - 10 && next.y < bottom + 10) {
                collides = true;
              }
            }
          });

          return collides ? prev : next;
        });
      }
    }, 30);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      clearInterval(movementInterval);
    };
  }, [activeNpc, stellaMiniGame]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    playClickSound();

    setPlayerPos({
      x: Math.max(20, Math.min(780, Math.floor(clickX))),
      y: Math.max(20, Math.min(580, Math.floor(clickY)))
    });

    let touchedNpc = false;
    NPCS.forEach(n => {
      const dist = Math.hypot(clickX - n.x, clickY - n.y);
      if (dist < 45) {
        handleInteractWithNpc(n);
        touchedNpc = true;
      }
    });

    if (!touchedNpc) {
      const altarDist = Math.hypot(clickX - 400, clickY - 300);
      if (altarDist < 50) {
        handleTriggerAltarRoll();
      } else {
        setActiveNpc(null);
      }
    }
  };

  const handleInteractWithNpc = (npc: NpcCharacter) => {
    setActiveNpc(npc);
    setDialogueIndex(0);
    setQuizState('idle');
    setJakeService('idle');
    setRangerService('idle');
    triggerHaptic(60);
  };

  const handleNextDialogue = () => {
    playClickSound();
    if (dialogueIndex < activeNpc!.dialogueLines.length - 1) {
      setDialogueIndex(prev => prev + 1);
    } else {
      if (activeNpc?.id === 'lime' && quizState === 'idle') {
        const rIndex = Math.floor(Math.random() * RIDDLES.length);
        setCurrentRiddleIdx(rIndex);
        setQuizState('question');
        setSelectedQuizIndex(null);
      } else if (activeNpc?.id === 'jake' && jakeService === 'idle') {
        setJakeService('upgrade');
      } else if (activeNpc?.id === 'ranger' && rangerService === 'idle') {
        setRangerService('infuse');
      } else if (activeNpc?.id === 'stella' && !stellaMiniGame) {
        setStellaMiniGame(true);
        setStellaScore(0);
        setStellaGameTime(20);
        setFallingItems([]);
        playSuccessChime();
      } else {
        setActiveNpc(null);
      }
    }
  };

  const handleTriggerAltarRoll = () => {
    if (!onTriggerMapRoll) return;
    const result = onTriggerMapRoll();
    if (!result) return;

    playSuccessChime();
    triggerHaptic(120);

    const newFloat = {
      id: 'f_' + Math.random().toString(36).substring(2, 9),
      name: `${result.rolledAura.name} (+${result.coinPayout} Coins)`,
      color: result.rolledAura.textColor,
      x: playerPos.x,
      y: playerPos.y - 15,
      opacity: 1.0
    };

    setFloatingRolls(prev => [...prev, newFloat]);

    setTimeout(() => {
      setFloatingRolls(prev => prev.filter(f => f.id !== newFloat.id));
    }, 1400);
  };

  const handleAnswerQuiz = (optionIdx: number) => {
    playClickSound();
    setSelectedQuizIndex(optionIdx);
    const riddle = RIDDLES[currentRiddleIdx];
    if (optionIdx === riddle.correct) {
      setQuizState('success');
      onAddCoins(100); 
      playSuccessChime();
    } else {
      setQuizState('fail');
      triggerHaptic(40);
    }
  };

  const currentSpeedMult = playerProfile?.stats.rollSpeedMultiplier || 1.0;
  const upgradeCost = Math.floor(currentSpeedMult * 500);

  const handleForgeSpeedUpgrade = () => {
    if (!playerProfile) return;
    if (playerProfile.stats.coins < upgradeCost) {
      setJakeService('fail');
      triggerHaptic(50);
      return;
    }

    const deducted = onDeductCoins(upgradeCost);
    if (deducted) {
      onUpdateRollSpeed(0.10); 
      setJakeService('success');
      playSuccessChime();
    }
  };

  const handleForgeQuestDonate = () => {
    if (!playerProfile) return;
    
    const scrapIndex = playerProfile.inventory.findIndex(i => (i.auraId === 'magnetic' || i.auraId === 'gilded') && i.id !== playerProfile.equippedAuraId);
    
    if (scrapIndex === -1) {
      setJakeService('quest_check'); 
      setTimeout(() => setJakeService('upgrade'), 3500);
      return;
    }

    const scrapItem = playerProfile.inventory[scrapIndex];
    onRemoveInventoryItem(scrapItem.id);
    onUpdateLuckMultiplier(0.15); 
    onAddCoins(150); 
    setJakeService('success');
    playSuccessChime();
  };

  const handleInfuseVoidCatalyst = () => {
    if (!playerProfile) return;

    const eligibleIndex = playerProfile.inventory.findIndex(item => {
      if (item.id === playerProfile.equippedAuraId) return false; 
      const aura = getAuraById(item.auraId);
      return aura.probability >= 256; 
    });

    if (eligibleIndex === -1) {
      setRangerService('not_found');
      setTimeout(() => setRangerService('infuse'), 3000);
      return;
    }

    const targetItem = playerProfile.inventory[eligibleIndex];
    onRemoveInventoryItem(targetItem.id);

    onUpdateLuckMultiplier(0.30); 
    onAddCoins(400); 
    setRangerService('success');
    playSuccessChime();
  };

  useEffect(() => {
    if (!stellaMiniGame) return;

    const countdown = setInterval(() => {
      setStellaGameTime(t => Math.max(0, t - 1));
    }, 1000);

    return () => clearInterval(countdown);
  }, [stellaMiniGame]);

  useEffect(() => {
    if (!stellaMiniGame || stellaGameTime > 0) return;

    setStellaMiniGame(false);
    
    if (stellaScore >= 12) {
      onAddPotion('fortune_potion', 1);
      onAddCoins(100);
    } else if (stellaScore >= 5) {
      onAddPotion('lucky_potion', 1);
    }
    setActiveNpc(null);
    playSuccessChime();
  }, [stellaGameTime, stellaMiniGame, stellaScore, onAddPotion, onAddCoins]);

  useEffect(() => {
    if (!stellaMiniGame) return;

    const interval = setInterval(() => {
      setFallingItems(prev => {
        const types: Array<'speed_spore' | 'luck_herb' | 'toadstool' | 'star_plasma'> = ['speed_spore', 'luck_herb', 'toadstool', 'star_plasma'];
        const chosenType = types[Math.floor(Math.random() * types.length)];
        
        const newItem: FallingIngredient = {
          id: Math.random().toString(),
          x: Math.random() * 460 + 20,
          y: -20,
          type: chosenType,
          speed: Math.random() * 3.5 + 4,
          size: chosenType === 'star_plasma' ? 16 : 11
        };
        return [...prev, newItem];
      });
    }, 750);

    return () => clearInterval(interval);
  }, [stellaMiniGame]);

  useEffect(() => {
    if (!stellaMiniGame) return;

    const gameFrame = setInterval(() => {
      let collidedWeight = 0;
      setFallingItems(prev => {
        const updated: FallingIngredient[] = [];
        prev.forEach(item => {
          const nextY = item.y + item.speed;
          
          const basketMin = basketX - 45;
          const basketMax = basketX + 45;
          const collidesBasket = nextY >= 235 && nextY <= 255 && item.x >= basketMin && item.x <= basketMax;

          if (collidesBasket) {
            triggerHaptic(40);
            if (item.type === 'luck_herb') {
              collidedWeight += 1;
            } else if (item.type === 'speed_spore') {
              collidedWeight += 1;
            } else if (item.type === 'star_plasma') {
              collidedWeight += 3; 
            } else if (item.type === 'toadstool') {
              collidedWeight -= 3; 
            }
          } else if (nextY < 290) {
            updated.push({ ...item, y: nextY });
          }
        });
        return updated;
      });

      if (collidedWeight !== 0) {
        setStellaScore(s => Math.max(0, s + collidedWeight));
      }
    }, 40);

    return () => clearInterval(gameFrame);
  }, [stellaMiniGame, basketX]);

  return (
    <div className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col">
      {/* Dynamic atmospheric header control panel */}
      <div className="bg-[#0c0d1b] border-b border-neutral-800 p-4 px-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 z-10">
        <div>
          <h3 className="font-extrabold text-sm text-neutral-100 flex items-center gap-2">
            <Compass className="text-indigo-400 animate-spin" size={16} />
            CHRONO COAXIAL MAP VIEWPORT
            <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded font-mono uppercase tracking-widest font-black">
              CORESYNC v3.2
            </span>
          </h3>
          <p className="text-xs text-neutral-400 font-sans mt-0.5">
            Slide coordinate tracks, trade with specialized cyber NPCs, upgrade roll speeds, and synthesize toxic swamp spores.
          </p>
        </div>

        {/* Rapid manual Biome triggers */}
        <div className="flex bg-neutral-950/80 border border-neutral-800 p-1 rounded-xl text-[10px] items-center space-x-1 max-w-full overflow-x-auto select-none font-mono">
          <span className="px-2 text-neutral-500 font-bold uppercase tracking-wider text-[9px]">override weather:</span>
          {['normal', 'rainy', 'starfall', 'hell', 'glitch'].map((b) => (
            <button
              key={b}
              onClick={() => { playClickSound(); onChangeBiome(b); }}
              className={`px-3 py-1 rounded-lg transition capitalize font-bold text-[10px] ${
                currentBiome === b 
                  ? 'bg-indigo-600 font-black text-white shadow-lg shadow-indigo-600/30' 
                  : 'text-neutral-400 hover:text-white hover:bg-neutral-900'
              }`}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      {/* Main 2D Canvas viewport screen */}
      <div className="relative w-full aspect-[4/3] max-h-[500px] bg-[#020204] overflow-hidden flex justify-center items-center">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          onClick={handleCanvasClick}
          className="w-full h-full block cursor-crosshair max-w-full"
        />

        {/* Floating text indicators from rolls */}
        {floatingRolls.map(f => (
          <motion.div
            key={f.id}
            initial={{ opacity: 1, scale: 0.8, y: f.y }}
            animate={{ opacity: 0, scale: 1.25, y: f.y - 85 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
            className="absolute font-bold font-mono text-[11px] whitespace-nowrap bg-[#090b16]/90 px-3.5 py-1.5 rounded-xl border border-neutral-800 pointer-events-none text-center shadow-2xl"
            style={{ 
              color: f.color, 
              left: `calc(${(f.x / 800) * 100}% - 40px)`,
              top: `${(f.y / 600) * 100}%`,
              boxShadow: `0 10px 25px ${f.color}25`,
              zIndex: 30
            }}
          >
            ✦ RESONANCE QUANTIZE ✦
            <div className="text-[12px] font-black tracking-tight mt-0.5">{f.name}</div>
          </motion.div>
        ))}

        {/* Sleek transparent glassy D-Pad controls overlay */}
        <div className="absolute bottom-4 right-4 flex flex-col items-center gap-1.5 bg-neutral-950/70 p-3 rounded-2xl border border-white/10 pointer-events-auto z-10 backdrop-blur-md select-none w-32">
          <span className="text-[8px] font-mono text-neutral-400 uppercase tracking-widest font-black">vector d-pad</span>
          
          <div className="flex justify-center w-full">
            <button
              onMouseDown={() => { activeKeys.current['w'] = true; }}
              onMouseUp={() => { activeKeys.current['w'] = false; }}
              onMouseLeave={() => { activeKeys.current['w'] = false; }}
              onTouchStart={() => { activeKeys.current['w'] = true; }}
              onTouchEnd={() => { activeKeys.current['w'] = false; }}
              className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-700/80 active:bg-indigo-600 active:border-indigo-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              ▲
            </button>
          </div>
          
          <div className="flex justify-between w-full items-center gap-1">
            <button
              onMouseDown={() => { activeKeys.current['a'] = true; }}
              onMouseUp={() => { activeKeys.current['a'] = false; }}
              onMouseLeave={() => { activeKeys.current['a'] = false; }}
              onTouchStart={() => { activeKeys.current['a'] = true; }}
              onTouchEnd={() => { activeKeys.current['a'] = false; }}
              className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-700/80 active:bg-indigo-600 active:border-indigo-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              ◀
            </button>
            <button
              onClick={handleTriggerAltarRoll}
              className="w-9 h-9 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:scale-90 text-white flex items-center justify-center shadow-lg border border-indigo-400 font-bold transition-transform cursor-pointer"
              title="Quick Gacha Altar Roll"
            >
              🎲
            </button>
            <button
              onMouseDown={() => { activeKeys.current['d'] = true; }}
              onMouseUp={() => { activeKeys.current['d'] = false; }}
              onMouseLeave={() => { activeKeys.current['d'] = false; }}
              onTouchStart={() => { activeKeys.current['d'] = true; }}
              onTouchEnd={() => { activeKeys.current['d'] = false; }}
              className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-700/80 active:bg-indigo-600 active:border-indigo-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              ▶
            </button>
          </div>
          
          <div className="flex justify-center w-full">
            <button
              onMouseDown={() => { activeKeys.current['s'] = true; }}
              onMouseUp={() => { activeKeys.current['s'] = false; }}
              onMouseLeave={() => { activeKeys.current['s'] = false; }}
              onTouchStart={() => { activeKeys.current['s'] = true; }}
              onTouchEnd={() => { activeKeys.current['s'] = false; }}
              className="w-9 h-9 rounded-xl bg-neutral-900 border border-neutral-700/80 active:bg-indigo-600 active:border-indigo-400 hover:text-white flex items-center justify-center font-bold text-sm transition-all shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer"
            >
              ▼
            </button>
          </div>
        </div>

        {/* Stella Cauldron fall mini game interface OVERLAY MODAL */}
        <AnimatePresence>
          {stellaMiniGame && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-4 bg-[#051a14]/95 border-2 border-emerald-500 rounded-3xl flex flex-col p-5 z-20 shadow-2xl backdrop-blur-xl"
            >
              <div className="flex justify-between items-center border-b border-emerald-800/60 pb-3">
                <div className="flex items-center space-x-3 text-emerald-400">
                  <span className="text-2xl drop-shadow-md">🧙‍♀️</span>
                  <div>
                    <h4 className="text-sm font-black uppercase tracking-widest text-emerald-300">Stella's Swamp Spore Hunt</h4>
                    <p className="text-[10px] text-emerald-500 font-mono">Quantize falling herbs, steer clear of lethal Toadstools!</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3 text-xs">
                  <span className="font-mono text-white bg-black/50 px-3 py-1.5 rounded-xl border border-emerald-900/60">
                    Broth Index: <strong className="text-amber-400">{stellaScore} pts</strong>
                  </span>
                  <span className="font-mono text-rose-300 bg-rose-950/40 px-3 py-1.5 rounded-xl border border-rose-900/40">
                    Fumes Decays: {stellaGameTime}s
                  </span>
                </div>
              </div>

              {/* Game board rendering */}
              <div className="flex-1 relative bg-[#020705]/80 rounded-2xl overflow-hidden mt-4 max-h-[290px] border border-emerald-900 border-dashed">
                {/* HUD goals */}
                <div className="absolute top-3 left-3 bg-neutral-950/90 border border-emerald-800/80 p-2.5 rounded-xl text-[9px] text-emerald-400 leading-normal font-mono shadow-lg">
                  <span className="text-amber-400 font-bold block mb-1">🏺 RECIPES COOKBOOK BONUS:</span>
                  🏆 Broth &gt;= 12 pts: <strong className="text-white">1x Fortune Flask!</strong><br />
                  🎖️ Broth &gt;= 5 pts: <strong className="text-neutral-300">1x Lime Lucky Potion!</strong>
                </div>

                {/* Draw falling elements */}
                {fallingItems.map(item => {
                  let visualIcon = '🌱';
                  let itemColor = 'text-green-300';
                  let filterGlow = 'drop-shadow-[0_0_8px_rgba(74,222,128,0.6)]';
                  if (item.type === 'speed_spore') {
                    visualIcon = '🌀'; 
                    itemColor = 'text-cyan-300';
                    filterGlow = 'drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]';
                  } else if (item.type === 'toadstool') {
                    visualIcon = '💀'; 
                    itemColor = 'text-rose-500';
                    filterGlow = 'drop-shadow-[0_0_8px_rgba(239,68,68,0.6)]';
                  } else if (item.type === 'star_plasma') {
                    visualIcon = '🌟'; 
                    itemColor = 'text-yellow-300 animate-pulse';
                    filterGlow = 'drop-shadow-[0_0_12px_rgba(250,204,21,0.8)]';
                  }

                  return (
                    <div
                      key={item.id}
                      className={`absolute font-black text-xs leading-none select-none ${itemColor} ${filterGlow}`}
                      style={{ 
                        left: `${(item.x / 500) * 100}%`,
                        top: `${item.y}px`,
                        fontSize: `${item.size}px`
                      }}
                    >
                      {visualIcon}
                    </div>
                  );
                })}

                {/* Catcher Cauldron container */}
                <div 
                  className="absolute bottom-2 h-8 bg-gradient-to-r from-indigo-950 to-indigo-900 border-2 border-indigo-400 rounded-2xl flex items-center justify-center text-xs shadow-[0_0_15px_rgba(99,102,241,0.4)] shadow-indigo-500/10 px-2 select-none"
                  style={{ 
                    left: `calc(${(basketX / 500) * 100}% - 40px)`,
                    width: '80px',
                    transition: 'left 0.05s ease-out'
                  }}
                >
                  <span className="animate-pulse mr-1">🧪</span>
                  <span className="font-bold text-indigo-200 tracking-wider font-mono">COAX_POT</span>
                </div>

                {/* Left/Right manual touch controls */}
                <div className="absolute bottom-2 w-full flex justify-between px-5 pointer-events-none z-10 select-none">
                  <button
                    onMouseDown={() => { setBasketX(b => Math.max(40, b - 45)); }}
                    onTouchStart={() => { setBasketX(b => Math.max(40, b - 45)); }}
                    className="w-16 h-9 rounded-xl bg-emerald-800/80 pointer-events-auto active:bg-emerald-500 text-white font-black text-xs border border-emerald-500 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                  >
                    ◀ LEFT
                  </button>
                  <button
                    onMouseDown={() => { setBasketX(b => Math.min(460, b + 45)); }}
                    onTouchStart={() => { setBasketX(b => Math.min(460, b + 45)); }}
                    className="w-16 h-9 rounded-xl bg-emerald-800/80 pointer-events-auto active:bg-emerald-500 text-white font-black text-xs border border-emerald-500 shadow-lg flex items-center justify-center cursor-pointer transition-all hover:scale-105"
                  >
                    RIGHT ▶
                  </button>
                </div>
              </div>

              {/* Bottom directions */}
              <div className="mt-4 flex justify-between items-center text-[10px] text-emerald-400 font-mono">
                <span>Hold button rails or slide mouse cursor columns</span>
                <button
                  onClick={() => { playClickSound(); setStellaMiniGame(false); }}
                  className="bg-rose-950/50 hover:bg-rose-900 border border-rose-500/40 px-4 py-1.5 rounded-xl text-red-300 font-black uppercase text-[10px]"
                >
                  Abort Escape
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Cyberpunk conversation overlay box when talking to NPCs */}
      <AnimatePresence>
        {activeNpc && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className={`p-5 sm:p-6 bg-[#04050b]/95 border-t-2-compatible border-t border-neutral-800 flex flex-col md:flex-row gap-6 items-stretch z-10 shadow-[0_-15px_35px_rgba(0,0,0,0.5)]`}
            style={{ borderTopColor: `${activeNpc.color}35` }}
          >
            {/* Portrait Layout card */}
            <div className="flex items-center space-x-4 md:flex-col md:space-x-0 md:space-y-3 md:items-center w-full md:w-40 text-center shrink-0 bg-neutral-950/70 p-4 rounded-2xl border border-neutral-800">
              <div className={`p-4 rounded-2xl ${activeNpc.avatarColor} text-white font-black text-3xl flex items-center justify-center border-b-4 border-black/35 shadow-xl`}>
                {activeNpc.emoji}
              </div>
              <div className="text-left md:text-center">
                <h4 className="text-xs font-black text-neutral-100 uppercase tracking-widest leading-none">{activeNpc.name}</h4>
                <p className="text-[9px] text-neutral-400 font-mono mt-1" style={{ color: activeNpc.color }}>{activeNpc.title.toUpperCase()}</p>
              </div>
            </div>

            {/* Operations interface panels */}
            <div className="flex-1 min-w-0 flex flex-col justify-between space-y-4">
              
              {/* Dialogue balloon text */}
              <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850 shadow-inner">
                <p className="text-xs sm:text-sm text-neutral-200 leading-relaxed font-sans font-medium">
                  "{activeNpc.dialogueLines[dialogueIndex]}"
                </p>
              </div>

              {/* LIME OPTION: QUESTION / ANSWER SOLVER */}
              {activeNpc.id === 'lime' && quizState === 'question' && (
                <div className="space-y-3.5">
                  <div className="p-3 bg-emerald-950/10 border border-emerald-500/20 text-xs rounded-xl text-emerald-400 font-mono leading-relaxed flex items-center gap-2">
                    <Sliders size={14} className="text-emerald-400" />
                    <div>
                      <strong>SOL DECODER RIDDLE:</strong> {RIDDLES[currentRiddleIdx].question}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {RIDDLES[currentRiddleIdx].options.map((option, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleAnswerQuiz(idx)}
                        className={`text-left p-3 text-xs rounded-xl border font-bold transition-all hover:scale-[1.015] ${
                          selectedQuizIndex === idx 
                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' 
                            : 'bg-neutral-950 border-neutral-850 text-neutral-300 hover:border-neutral-700'
                        }`}
                      >
                        {idx + 1}. {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeNpc.id === 'lime' && (quizState === 'success' || quizState === 'fail') && (
                <div className={`p-4 rounded-xl text-xs leading-relaxed font-sans border ${
                  quizState === 'success' 
                    ? 'bg-gradient-to-r from-emerald-950/50 to-neutral-950/30 text-green-300 border-green-500/25 shadow-lg shadow-emerald-950/15' 
                    : 'bg-rose-950/20 text-rose-350 border-red-500/25'
                }`}>
                  <span className="font-black uppercase block font-mono text-[10px] tracking-widest mb-1.5" style={{ color: quizState === 'success' ? '#10b981' : '#f43f5e' }}>
                    {quizState === 'success' ? '✦ DECODER CALIBRATED SUCCESSFULLY' : '💀 CALIBRATION FAULT DETECTED'}
                  </span>
                  <p className="text-neutral-300 leading-normal mb-2">{RIDDLES[currentRiddleIdx].explanation}</p>
                  {quizState === 'success' && (
                    <div className="inline-flex items-center gap-1.5 text-yellow-300 bg-yellow-950/40 border border-yellow-500/20 py-1 px-3 rounded-xl font-mono font-bold text-[10px] uppercase">
                      <Coins size={11} className="text-yellow-400 animate-pulse" />
                      Awarded: +100 Sol Coins
                    </div>
                  )}
                  <button 
                    onClick={() => { playClickSound(); setQuizState('idle'); setActiveNpc(null); }}
                    className="mt-3 block text-[9px] font-mono uppercase bg-neutral-900 border border-neutral-700 p-1.5 px-4 rounded-xl text-neutral-200 hover:text-white transition-colors"
                  >
                    Proceed Sequence
                  </button>
                </div>
              )}

              {/* JAKE OPTION: FORGE HARDENING SPEED CALIBRATION */}
              {activeNpc.id === 'jake' && jakeService === 'upgrade' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Calibrate motor specs */}
                  <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-2xl flex flex-col justify-between transition-all hover:border-neutral-700 shadow-md">
                    <div>
                      <h4 className="text-xs font-black text-rose-400 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-mono uppercase tracking-widest">⚙️ pneumatic torque gear</span>
                        <span className="bg-amber-400/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded font-mono text-[10px] font-black">{upgradeCost} Coins</span>
                      </h4>
                      <p className="text-[11px] text-neutral-400 leading-normal mt-2 select-none">
                        Dials higher pressure pneumatic tubes to execute rolls x0.10 faster! Current Speed: <strong className="text-white bg-neutral-900 px-1.5 py-0.5 rounded ml-1 font-mono">x{currentSpeedMult.toFixed(2)}</strong>
                      </p>
                    </div>
                    <button
                      onClick={handleForgeSpeedUpgrade}
                      className="w-full mt-4 py-2.5 bg-rose-950/40 hover:bg-rose-600 border border-red-500/30 text-rose-300 hover:text-white font-mono text-[10px] font-black rounded-xl transition-all cursor-pointer hover:shadow-lg shadow-rose-950/50 uppercase tracking-wider"
                    >
                      Conduct High Calibration
                    </button>
                  </div>

                  {/* Scraps barter */}
                  <div className="p-4 bg-neutral-950 border border-neutral-850 rounded-2xl flex flex-col justify-between transition-all hover:border-neutral-700 shadow-md">
                    <div>
                      <h4 className="text-xs font-black text-orange-400 flex items-center gap-1.5 font-mono uppercase tracking-widest">
                        <Hammer size={12} className="text-orange-400 animate-pulse" />
                        iron scrap materials exchange
                      </h4>
                      <p className="text-[11px] text-neutral-400 leading-normal mt-2 select-none">
                        Fuses <strong>1x Magnetic</strong> or <strong>1x Gilded</strong> aura from your inventory into your apparatus parameters. Yields <strong className="text-white">+15% flat luck coefficient</strong> forever!
                      </p>
                    </div>
                    <button
                      onClick={handleForgeQuestDonate}
                      className="w-full mt-4 py-2.5 bg-neutral-900 border border-neutral-800 hover:bg-neutral-800 text-neutral-300 font-mono text-[10px] font-bold rounded-xl transition-all cursor-pointer uppercase tracking-wider"
                    >
                      Deconstruct Metal Element
                    </button>
                  </div>

                </div>
              )}

              {activeNpc.id === 'jake' && (jakeService === 'success' || jakeService === 'fail' || jakeService === 'quest_check') && (
                <div className="p-4 rounded-xl border text-xs leading-relaxed bg-neutral-950 border-neutral-800 text-neutral-300 font-sans shadow-md">
                  {jakeService === 'success' && (
                    <div className="flex items-start gap-3 text-green-400">
                      <span className="text-lg">⚒️</span>
                      <div>
                        <strong>SUCCESSFULLY ATTAINED!</strong>
                        <p className="text-neutral-300 mt-1">"Borders and gears are completely aligned. The pneumatic speed calibrations are complete."</p>
                      </div>
                    </div>
                  )}
                  {jakeService === 'fail' && (
                    <div className="flex items-start gap-3 text-rose-400">
                      <span className="text-lg">⚠️</span>
                      <div>
                        <strong>LIQUIDITY STRESS!</strong>
                        <p className="text-neutral-300 mt-1">"You are completely insolvent of Sol Coins! Return to me when you hold appropriate cash flow coordinates."</p>
                      </div>
                    </div>
                  )}
                  {jakeService === 'quest_check' && (
                    <div className="flex items-start gap-3 text-amber-400">
                      <span className="text-lg">🚫</span>
                      <div>
                        <strong>MISSING BARTER MATERIALS!</strong>
                        <p className="text-neutral-300 mt-1">"You hold no raw unequipped Magnetic or Gilded signatures inside your Chrono-Vault to dismantle!"</p>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => { playClickSound(); setJakeService('upgrade'); }}
                    className="mt-4 text-[9px] font-mono uppercase bg-neutral-900 border border-neutral-800 p-1.5 px-4 rounded-xl text-neutral-200 hover:text-white transition-transform"
                  >
                    Adjust Gears Again
                  </button>
                </div>
              )}

              {/* RANGER OPTION: RITUAL INC INDEX SACRIFICE */}
              {activeNpc.id === 'ranger' && rangerService === 'infuse' && (
                <div className="p-5 bg-[#090514]/80 border border-purple-500/20 rounded-2xl space-y-4 shadow-xl shadow-purple-950/20">
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-2">
                    <span className="w-2 h-2 bg-purple-500 rounded-full animate-ping" />
                    VOID SINGULARITY RESONATOR RITUAL
                  </h4>
                  <p className="text-[11px] text-neutral-300 leading-relaxed font-sans">
                    Sacrifice any spare raw element that exceeds <strong className="text-white">1:256 rarity index weight</strong> (e.g. Emerald, Sapphire, Celestial etc). 
                    The ranger will fuse the residual atoms directly into your core, permanent-increasing your <strong className="text-emerald-400">RNG luck multiplier by +30% flat</strong> and awarding <strong className="text-yellow-400">400 Sol Coins</strong>.
                  </p>
                  <button
                    onClick={handleInfuseVoidCatalyst}
                    className="py-2.5 px-6 bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-[10px] font-black rounded-xl transition-all cursor-pointer shadow-lg shadow-indigo-600/30 uppercase tracking-wider block text-center"
                  >
                    Commence Void Imbuement
                  </button>
                </div>
              )}

              {activeNpc.id === 'ranger' && (rangerService === 'success' || rangerService === 'not_found') && (
                <div className="p-4 rounded-xl border text-xs bg-neutral-950 border-purple-900/30 font-sans shadow-md">
                  {rangerService === 'success' && (
                    <div className="flex items-start gap-2.5 text-fuchsia-400">
                      <span>🌀</span>
                      <div>
                        <strong>VOID INFUSION COMPLETE</strong>
                        <p className="text-neutral-300 mt-1">"The radiation has been absorbed securely. Your dimensional coefficients have expanded by +30%!"</p>
                      </div>
                    </div>
                  )}
                  {rangerService === 'not_found' && (
                    <div className="flex items-start gap-2.5 text-rose-400">
                      <span>👁️</span>
                      <div>
                        <strong>RITUAL DENIED!</strong>
                        <p className="text-neutral-300 mt-1">"Your backpack holds no powerful elements exceeding 1:256 probability spare! Keep your sacrificial candidates unequipped."</p>
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => { playClickSound(); setRangerService('infuse'); }}
                    className="mt-4 text-[9px] font-mono bg-neutral-900 border border-neutral-800 p-1.5 px-4 rounded-xl text-neutral-250 hover:text-white transition-all uppercase"
                  >
                    Retry Ritual
                  </button>
                </div>
              )}

              {/* Dynamic bottom dialogue control footer */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pt-3 border-t border-neutral-850 gap-2 font-mono text-[10px]">
                <p className="text-neutral-500 flex items-center gap-1">
                  <Info size={11} />
                  Coordinates map is reactive. Proceed prompts to execute operations.
                </p>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button
                    onClick={handleNextDialogue}
                    className="flex-1 sm:flex-initial px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 text-white font-black rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
                  >
                    <span>Proceed discourse</span>
                    <Play size={10} className="fill-white" />
                  </button>
                  <button
                    onClick={() => { playClickSound(); setActiveNpc(null); }}
                    className="px-4 py-2 text-xs bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-850 rounded-xl transition-colors cursor-pointer uppercase tracking-wider font-bold"
                  >
                    Dismiss
                  </button>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
