import { Aura } from '../types';

let audioCtx: AudioContext | null = null;
let masterVolume: GainNode | null = null;
let musicVolume: GainNode | null = null;
let soundEnabled = true;

let activeMusicInterval: any = null;
let currentMusicAuraId: string | null = null;
let musicStep = 0;

const initAudio = () => {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
      masterVolume = audioCtx.createGain();
      masterVolume.gain.setValueAtTime(0.3, audioCtx.currentTime); // Standard comfortable volume
      masterVolume.connect(audioCtx.destination);

      musicVolume = audioCtx.createGain();
      musicVolume.gain.setValueAtTime(0.18, audioCtx.currentTime); // Background music comfortable gain
      musicVolume.connect(masterVolume);
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
};

export const toggleGlobalSound = (): boolean => {
  soundEnabled = !soundEnabled;
  if (!soundEnabled) {
    stopAuraMusic();
  }
  return soundEnabled;
};

export const getSoundEnabled = (): boolean => {
  return soundEnabled;
};

/**
 * Stops any currently playing background aura theme music loop
 */
export const stopAuraMusic = () => {
  if (activeMusicInterval) {
    clearInterval(activeMusicInterval);
    activeMusicInterval = null;
  }
  currentMusicAuraId = null;
};

/**
 * Trigger mobile device physical vibration (haptic feedback) with varying intensities
 */
export const triggerHaptic = (rarity: number) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (rarity >= 1000000) {
        // Supreme Cosmic / Glitch Godly: Heavy epic sequence
        navigator.vibrate([100, 50, 100, 50, 200, 100, 500]);
      } else if (rarity >= 100000) {
        // Cosmic (Nebula/Galaxy): Triple punch
        navigator.vibrate([80, 40, 80, 40, 150]);
      } else if (rarity >= 10000) {
        // Mythic/Celestial: Double pulse
        navigator.vibrate([60, 40, 120]);
      } else if (rarity >= 1000) {
        // Legendary: Strong medium pulse
        navigator.vibrate(80);
      } else if (rarity >= 100) {
        // Epic: Short sharp pulse
        navigator.vibrate(40);
      } else {
        // Standard roll feedback (very subtle)
        navigator.vibrate(15);
      }
    } catch {
      // Browsers safely ignore if user hasn't interacted or in sandboxed iframes
    }
  }
};

/**
 * Plays a beautiful sci-fi roll sequence
 */
export const playRollSound = () => {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || !masterVolume) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sawtooth';
  // Sweep frequency down like a drop
  osc.frequency.setValueAtTime(450, t);
  osc.frequency.exponentialRampToValueAtTime(100, t + 0.15);

  gain.gain.setValueAtTime(0.08, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

  osc.connect(gain);
  gain.connect(masterVolume);

  osc.start(t);
  osc.stop(t + 0.15);
};

/**
 * Plays an epic chime/drone when matching an aura
 */
export const playAuraUnlockSound = (aura: Aura) => {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || !masterVolume) return;

  const t = audioCtx.currentTime;
  const rarity = aura.probability;

  // Let's create a richer sound for rarer auras
  const oscCount = rarity >= 10000 ? 3 : rarity >= 100 ? 2 : 1;
  const duration = rarity >= 1000000 ? 2.5 : rarity >= 10000 ? 1.5 : rarity >= 100 ? 0.8 : 0.4;

  for (let i = 0; i < oscCount; i++) {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    // Set waveshape based on config
    osc.type = aura.soundType || 'sine';

    // Slightly detune multiple oscillators for natural chorus/width
    const baseFreq = aura.baseFrequency || 200;
    const offset = i === 1 ? -12 : i === 2 ? 12 : 0;
    const frequency = baseFreq * Math.pow(2, offset / 12);

    osc.frequency.setValueAtTime(frequency, t);

    // Give it a rising slide if extremely rare
    if (rarity >= 10000) {
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, t + duration);
    }

    // Set up volume envelope
    const maxVol = rarity >= 1000000 ? 0.25 : rarity >= 10000 ? 0.18 : rarity >= 100 ? 0.12 : 0.08;
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(maxVol, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + duration);

    osc.connect(gain);
    gain.connect(masterVolume);

    osc.start(t);
    osc.stop(t + duration);
  }
};

/**
 * UI Click feedback sound
 */
export const playClickSound = () => {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || !masterVolume) return;

  const t = audioCtx.currentTime;
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(600, t);
  osc.frequency.setValueAtTime(300, t + 0.03);

  gain.gain.setValueAtTime(0.05, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);

  osc.connect(gain);
  gain.connect(masterVolume);

  osc.start(t);
  osc.stop(t + 0.08);
};

/**
 * Success event chime
 */
export const playSuccessChime = () => {
  if (!soundEnabled) return;
  initAudio();
  if (!audioCtx || !masterVolume) return;

  const t = audioCtx.currentTime;
  const freqs = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  freqs.forEach((freq, idx) => {
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t + idx * 0.06);

    gain.gain.setValueAtTime(0.01, t + idx * 0.06);
    gain.gain.linearRampToValueAtTime(0.06, t + idx * 0.06 + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.3);

    osc.connect(gain);
    gain.connect(masterVolume);

    osc.start(t + idx * 0.06);
    osc.stop(t + idx * 0.06 + 0.3);
  });
};

/**
 * Interactive Real-Time Procedural Music Synthesizer for equipped auras.
 * Dynamically plays beautiful, customized note loops, atmospheric soundscapes and chimes.
 */
const playAuraStep = (auraId: string, step: number, baseFreq: number, soundType: 'sine' | 'square' | 'sawtooth' | 'triangle') => {
  if (!audioCtx || !musicVolume || !soundEnabled) return;
  const t = audioCtx.currentTime;

  let scale: number[] = [1, 1.25, 1.5, 1.875]; // major triad + maj7 relative rates (1, 5/4, 3/2, 15/8)
  let duration = 0.6;
  let synthType: 'sine' | 'square' | 'sawtooth' | 'triangle' = soundType;
  let sweepFilter = false;
  let delayEffect = false;
  let heartbeatEffect = false;
  let filterCutoff = 1200;
  let qValue = 1.0;

  // Specific music themes tailored precisely for each aura signature
  switch (auraId) {
    case 'common':
      scale = [1, 1.5, 2, 1.5]; // low humble tonic-fifth drone
      duration = 1.2;
      filterCutoff = 800;
      break;
    case 'uncommon':
      scale = [1, 1.25, 1.5, 1.6]; // soft rhythmic garden tones
      duration = 0.8;
      break;
    case 'rare':
      scale = [1, 1.2, 1.5, 1.8]; // cooling fluid liquid drops
      duration = 0.5;
      delayEffect = true;
      break;
    case 'divinus':
      scale = [1, 1.25, 1.5, 1.875, 2.25]; // ethereal celestial lydian bells
      duration = 1.5;
      synthType = 'sine';
      filterCutoff = 1800;
      break;
    case 'gilded':
      scale = [1, 1.33, 1.5, 1.77, 2.0]; // golden coin metallic sparkles
      duration = 0.4;
      filterCutoff = 2400;
      break;
    case 'ruby':
      scale = [1, 1.15, 1.45, 1.5]; // hot crackling flame friction
      synthType = 'triangle';
      duration = 0.45;
      filterCutoff = 1000;
      break;
    case 'emerald':
      scale = [1, 1.25, 1.5, 1.66, 1.875]; // calming vibrant jade wind-chimes
      duration = 1.0;
      break;
    case 'sapphire':
      scale = [1, 1.2, 1.4, 1.5, 1.8]; // deep hydrostatic water surges
      duration = 2.0;
      sweepFilter = true;
      break;
    case 'diamond':
      scale = [1, 1.5, 2.0, 2.5, 3.0]; // unbreakable glass perfect fifths
      duration = 0.6;
      filterCutoff = 2000;
      break;
    case 'magnetic':
      scale = [1, 1.35, 1.5, 1.9, 2.0]; // rhythmic electromagnetic pulse discharges
      synthType = 'triangle';
      sweepFilter = true;
      break;
    case 'jade':
      scale = [1, 1.2, 1.5, 1.68, 1.8]; // zen flow peaceful melody
      duration = 1.1;
      break;
    case 'bound':
      scale = [0.5, 0.75, 1.0, 1.05, 1.2]; // heavy restricting force gravity bends
      duration = 1.8;
      filterCutoff = 400;
      break;
    case 'blossom':
      scale = [1, 1.25, 1.5, 1.66, 1.875, 2.2]; // delicate cherry blossom wind steps
      duration = 0.8;
      delayEffect = true;
      break;
    case 'wind':
      scale = [1, 1.4, 1.8, 1.4]; // whistling cyclonic draft
      synthType = 'sine';
      sweepFilter = true;
      duration = 1.6;
      break;
    case 'quartz':
      scale = [1, 1.5, 1.75, 2.25]; // direct resonant mineral clinks
      duration = 0.7;
      break;
    case 'celestial':
      scale = [1, 1.25, 1.5, 1.875, 2.5, 3.0, 3.75]; // cosmic celestial ascendancy
      duration = 1.0;
      delayEffect = true;
      break;
    case 'undead':
      scale = [0.5, 0.55, 0.8, 0.85]; // dark spectral ghostly low drone
      synthType = 'sawtooth';
      duration = 2.2;
      filterCutoff = 320;
      break;
    case 'comet':
      scale = [1.5, 1.875, 2.25, 3.0, 3.75, 4.5]; // fast starry stardust twinkles
      duration = 0.25;
      break;
    case 'solar':
      scale = [1, 1.5, 1.8, 2.2, 2.5]; // violent thermonuclear solar flares
      synthType = 'triangle';
      duration = 1.2;
      sweepFilter = true;
      break;
    case 'lunar':
      scale = [1, 1.2, 1.5, 1.75, 2.1]; // chilly lunar tide ambient chords
      duration = 2.0;
      break;
    case 'exotic':
      scale = [1, 1.14, 1.37, 1.56, 1.83]; // erratic offset microtones
      duration = 0.9;
      break;
    case 'nebula':
      scale = [1, 1.5, 1.875, 2.5, 3.0]; // vast interstellar gas cloud pads
      duration = 2.5;
      sweepFilter = true;
      break;
    case 'galaxy':
      scale = [1, 1.25, 1.5, 1.875, 2.0, 2.5, 3.0]; // majestic orbital spiral themes
      duration = 1.8;
      delayEffect = true;
      break;
    case 'starscourge':
      scale = [0.5, 0.75, 0.9, 1.0, 1.35]; // heavy grinding star-annihilator
      synthType = 'sawtooth';
      duration = 0.8;
      filterCutoff = 600;
      break;
    case 'twilight':
      scale = [1, 1.25, 1.5, 1.875, 2.25, 2.5]; // serene orange sunset shifts
      duration = 1.6;
      break;
    case 'matrix':
      scale = [1, 2, 1.5, 3, 2, 4]; // cyber fast high-bpm 8-bit chip tunes
      synthType = 'square';
      duration = 0.18;
      break;
    case 'antigravity':
      scale = [1.2, 1.44, 1.72, 2.07, 2.48]; // floating space chords
      duration = 1.2;
      break;
    case 'cyber_glitch':
      scale = [1.2, 1.5, 1.9, 2.4, 3.1, 0.8]; // randomized data-burst glitch elements
      synthType = 'square';
      duration = 0.15;
      delayEffect = true;
      break;
    case 'chromatic':
      scale = [1, 1.06, 1.12, 1.18, 1.25, 1.33, 1.41, 1.5, 1.6, 1.68, 1.78, 1.89]; // scales sliding upwards
      duration = 0.5;
      break;
    case 'starscourge_radiant':
      scale = [1, 1.5, 2.0, 2.5, 3.0, 4.0]; // blinding supernova chimes
      synthType = 'sawtooth';
      duration = 1.0;
      delayEffect = true;
      filterCutoff = 1550;
      break;
    case 'twilight_iridescent':
      scale = [1, 1.25, 1.5, 1.875, 2.25, 3.0]; // dual iridescent rainbow bells
      duration = 1.2;
      delayEffect = true;
      break;
    case 'chromatic_genesis':
      scale = [1, 1.25, 1.5, 1.875, 2.0, 2.5, 3.0, 3.75, 4.0]; // genesis dawn symphony chords
      duration = 2.4;
      sweepFilter = true;
      break;
    case 'abyssal_void':
      scale = [0.5, 0.6, 0.75, 0.9]; // absolute silence dark outer void winds
      duration = 3.0;
      filterCutoff = 180;
      break;
    case 'impeached':
      scale = [0.5, 0.66, 0.75, 0.84, 1.0, 1.33]; // majestic thunderous brass/cathedral tolls
      synthType = 'triangle';
      duration = 3.5;
      break;
    case 'archangel':
      scale = [1, 1.25, 1.5, 1.875, 2.25, 2.5, 3.0]; // divine pure church pipe pad
      synthType = 'sine';
      duration = 2.6;
      delayEffect = true;
      break;
    case 'bloodlust':
      scale = [1, 1.05, 1.1]; // pounding aggressive heartbeat
      synthType = 'sawtooth';
      duration = 0.35;
      heartbeatEffect = true;
      filterCutoff = 220;
      break;
    case 'gargantua':
      scale = [0.25, 0.37, 0.5, 0.75]; // giant blackhole hyper-gravity rumble
      synthType = 'sawtooth';
      duration = 2.5;
      filterCutoff = 250;
      break;
    case 'origin_singularity':
      scale = [1, 1.5, 2.25, 3.37, 5.06]; // extreme cosmic core microtonals
      synthType = 'triangle';
      duration = 0.5;
      break;
    case 'sovereign':
      scale = [1, 1.25, 1.5, 1.875, 2.0, 2.5, 3.0, 4.0]; // royal sovereign brass fanfare arches
      synthType = 'triangle';
      duration = 1.4;
      delayEffect = true;
      break;
    default:
      // Programmatically hashed procedural melody fallback
      const hash = auraId.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
      const isMinor = hash % 2 === 0;
      scale = isMinor ? [1, 1.2, 1.5, 1.8] : [1, 1.25, 1.5, 1.875];
      duration = 0.8;
      break;
  }

  const rate = scale[step % scale.length];
  let freq = baseFreq * rate;

  if (auraId === 'chromatic') {
    // shift frequency root pitch by mod measures
    const shift = (Math.floor(step / 12) % 3) * 2;
    freq = freq * Math.pow(2, shift / 12);
  }

  const osc = audioCtx.createOscillator();
  const oscGain = audioCtx.createGain();
  const filter = audioCtx.createBiquadFilter();

  osc.type = synthType;
  osc.frequency.setValueAtTime(freq, t);

  filter.type = 'lowpass';
  filter.Q.setValueAtTime(qValue, t);

  if (sweepFilter) {
    filter.frequency.setValueAtTime(100, t);
    filter.frequency.exponentialRampToValueAtTime(filterCutoff * 2.5, t + duration * 0.4);
    filter.frequency.exponentialRampToValueAtTime(100, t + duration);
  } else {
    filter.frequency.setValueAtTime(filterCutoff, t);
  }

  // Attack-Decay-Sustain-Release simulation Envelope
  const maxGain = 0.05 * (auraId === 'abyssal_void' ? 0.35 : 1);

  if (heartbeatEffect) {
    oscGain.gain.setValueAtTime(0.001, t);
    oscGain.gain.linearRampToValueAtTime(maxGain * 1.5, t + 0.02);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);

    setTimeout(() => {
      if (!soundEnabled || !audioCtx || !musicVolume) return;
      const t2 = audioCtx.currentTime;
      const osc2 = audioCtx.createOscillator();
      const oscGain2 = audioCtx.createGain();
      const filter2 = audioCtx.createBiquadFilter();

      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(freq * 0.95, t2);
      filter2.type = 'lowpass';
      filter2.frequency.setValueAtTime(150, t2);

      oscGain2.gain.setValueAtTime(0.001, t2);
      oscGain2.gain.linearRampToValueAtTime(maxGain * 1.2, t2 + 0.02);
      oscGain2.gain.exponentialRampToValueAtTime(0.001, t2 + 0.12);

      osc2.connect(filter2);
      filter2.connect(oscGain2);
      oscGain2.connect(musicVolume);
      osc2.start(t2);
      osc2.stop(t2 + 0.15);
    }, 150);
  } else {
    oscGain.gain.setValueAtTime(0.001, t);
    oscGain.gain.linearRampToValueAtTime(maxGain, t + 0.04);
    oscGain.gain.exponentialRampToValueAtTime(0.001, t + duration);
  }

  osc.connect(filter);
  filter.connect(oscGain);
  oscGain.connect(musicVolume);

  osc.start(t);
  osc.stop(t + duration + 0.1);

  // Echoplex Delay Layer
  if (delayEffect && Math.random() < 0.6) {
    setTimeout(() => {
      if (!soundEnabled || !audioCtx || !musicVolume) return;
      const delayTime = audioCtx.currentTime;
      const delayOsc = audioCtx.createOscillator();
      const delayGain = audioCtx.createGain();

      delayOsc.type = synthType === 'sine' ? 'sine' : 'triangle';
      delayOsc.frequency.setValueAtTime(freq * 1.5, delayTime);
      delayGain.gain.setValueAtTime(0.001, delayTime);
      delayGain.gain.linearRampToValueAtTime(maxGain * 0.4, delayTime + 0.02);
      delayGain.gain.exponentialRampToValueAtTime(0.0001, delayTime + duration * 0.5);

      delayOsc.connect(delayGain);
      delayGain.connect(musicVolume);
      delayOsc.start(delayTime);
      delayOsc.stop(delayTime + duration * 0.5 + 0.1);
    }, 280);
  }
};

/**
 * Interactive Real-Time Procedural Music Synthesizer for equipped auras.
 * Synchronizes background loops relative to the currently active equipped spectral footprint.
 */
export const updateEquippedAuraMusic = (aura: Aura | null) => {
  if (!soundEnabled || !aura) {
    stopAuraMusic();
    return;
  }

  if (currentMusicAuraId === aura.id) {
    return;
  }

  stopAuraMusic();
  initAudio();
  if (!audioCtx || !musicVolume) return;

  currentMusicAuraId = aura.id;
  musicStep = 0;

  let intervalMs = 800; // standard tempo sequence (75 bpm)
  if (aura.id === 'matrix' || aura.id === 'cyber_glitch' || aura.id === 'bloodlust' || aura.id === 'comet') {
    intervalMs = 380; // hyper-speed tempo
  } else if (aura.id === 'abyssal_void' || aura.id === 'impeached' || aura.id === 'gargantua' || aura.id === 'nebula') {
    intervalMs = 1800; // cosmic slow tempo
  }

  playAuraStep(aura.id, musicStep++, aura.baseFrequency || 220, aura.soundType || 'sine');

  activeMusicInterval = setInterval(() => {
    if (!soundEnabled || currentMusicAuraId !== aura.id) {
      stopAuraMusic();
      return;
    }
    playAuraStep(aura.id, musicStep++, aura.baseFrequency || 220, aura.soundType || 'sine');
  }, intervalMs);
};

