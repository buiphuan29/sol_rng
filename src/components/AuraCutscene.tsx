import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Icons from 'lucide-react';
import { Aura } from '../types';
import { getSoundEnabled, triggerHaptic } from '../utils/sound';

interface AuraCutsceneProps {
  aura: Aura;
  onClose: () => void;
}

export default function AuraCutscene({ aura, onClose }: AuraCutsceneProps) {
  const [phase, setPhase] = useState<'charging' | 'impact' | 'reveal'>('charging');
  const [percent, setPercent] = useState<number>(0);
  const [showSkip, setShowSkip] = useState<boolean>(false);
  
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Play custom cinematic sound effects
  useEffect(() => {
    let osc: OscillatorNode | null = null;
    let gain: GainNode | null = null;
    let ctxClass: any = window.AudioContext || (window as any).webkitAudioContext;
    let audioCtx: AudioContext | null = null;

    if (getSoundEnabled() && ctxClass) {
      try {
        audioCtx = new ctxClass();
        osc = audioCtx.createOscillator();
        gain = audioCtx.createGain();

        // Unique synth models based on absolute aura rarity
        osc.type = aura.soundType === 'square' || aura.soundType === 'sawtooth' ? aura.soundType : 'sine';
        
        // Custom glide frequency transition
        osc.frequency.setValueAtTime(65, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(aura.baseFrequency * 1.6, audioCtx.currentTime + 1.8);

        gain.gain.setValueAtTime(0.005, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 1.6);
        gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 1.8);

        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
      } catch (err) {
        console.warn('Audio context creation blocked until active interaction');
      }
    }

    // High fidelity vibration trigger
    triggerHaptic(aura.probability >= 1000000 ? 100 : 35);

    // Dynamic suspense scaling
    const interval = setInterval(() => {
      setPercent(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setPhase('impact');
          setTimeout(() => {
            setPhase('reveal');
            playImpactChime();
          }, 300);
          return 100;
        }
        const delta = aura.probability >= 50000000 ? 1.6 : aura.probability >= 1000000 ? 3.2 : 5.5;
        return Math.min(100, prev + delta);
      });
    }, 45);

    // Fast-skip timer
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, 1200);

    const playImpactChime = () => {
      if (audioCtx && getSoundEnabled()) {
        try {
          const t = audioCtx.currentTime;
          // Shimmering divine scale bells
          const notes = [1, 1.25, 1.5, 1.875, 2.25, 2.5, 3.0];
          notes.forEach((ratio, index) => {
            const chimeOsc = audioCtx!.createOscillator();
            const chimeGain = audioCtx!.createGain();
            chimeOsc.type = 'triangle';
            chimeOsc.frequency.setValueAtTime(aura.baseFrequency * ratio, t + index * 0.04);
            chimeGain.gain.setValueAtTime(0.14, t + index * 0.04);
            chimeGain.gain.exponentialRampToValueAtTime(0.0005, t + index * 0.04 + 0.8);
            chimeOsc.connect(chimeGain);
            chimeGain.connect(audioCtx!.destination);
            chimeOsc.start(t + index * 0.04);
            chimeOsc.stop(t + index * 0.04 + 0.82);
          });
        } catch { }
      }
    };

    return () => {
      clearInterval(interval);
      clearTimeout(skipTimer);
      if (osc) {
        try { osc.stop(); } catch {}
      }
      if (audioCtx) {
        try { audioCtx.close(); } catch {}
      }
    };
  }, [aura]);

  // Spectacular Canvas Particle Background Renderer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', handleResize);

    // Particle class customized for cutscene cinematic behaviors
    class StarParticle {
      x = 0;
      y = 0;
      vx = 0;
      vy = 0;
      radius = 0;
      color = '';
      alpha = 0;
      angle = 0;
      orbitSpeed = 0;
      orbitRadius = 0;
      decay = 0;

      constructor(initRandom = true) {
        this.color = aura.textColor;
        this.reset(initRandom);
      }

      reset(initRandom = false) {
        const cx = width / 2;
        const cy = height / 2;
        
        if (initRandom) {
          this.x = Math.random() * width;
          this.y = Math.random() * height;
          this.alpha = Math.random() * 0.7 + 0.1;
        } else {
          this.x = cx;
          this.y = cy;
          this.alpha = 1.0;
        }

        this.radius = Math.random() * 3 + 1;
        this.angle = Math.random() * Math.PI * 2;
        this.orbitRadius = Math.random() * Math.min(width, height) * 0.75 + 10;
        this.orbitSpeed = (Math.random() * 0.01 + 0.002) * (Math.random() > 0.5 ? 1 : -1);
        this.vx = Math.cos(this.angle) * (Math.random() * 4 + 1);
        this.vy = Math.sin(this.angle) * (Math.random() * 4 + 1);
        this.decay = Math.random() * 0.015 + 0.005;
      }

      update(renderPhase: 'charging' | 'impact' | 'reveal') {
        const cx = width / 2;
        const cy = height / 2;

        if (renderPhase === 'charging') {
          // Vortex suction pulling inwards towards center coordinate
          this.angle += this.orbitSpeed * 1.5;
          this.orbitRadius -= (0.8 + (percent / 40));
          if (this.orbitRadius < 10) {
            this.reset(false);
            this.orbitRadius = Math.max(width, height) * 0.6;
          }
          this.x = cx + Math.cos(this.angle) * this.orbitRadius;
          this.y = cy + Math.sin(this.angle) * this.orbitRadius;
          this.alpha = Math.min(0.8, (1 - this.orbitRadius / (Math.max(width, height) * 0.6)));
        } else if (renderPhase === 'impact') {
          // Explosive shrapnel expansion
          this.x += this.vx * 3;
          this.y += this.vy * 3;
          this.alpha -= this.decay * 2;
        } else {
          // Gentle ambient cosmic space float
          this.x += this.vx * 0.12;
          this.y += this.vy * 0.12;
          if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.reset(true);
          }
          this.alpha = Math.max(0.08, this.alpha + (Math.random() - 0.5) * 0.05);
        }
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.globalAlpha = this.alpha;
        c.fillStyle = this.color;
        c.shadowBlur = aura.probability >= 5000 ? 12 : 0;
        c.shadowColor = aura.glowColor;
        c.beginPath();
        c.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        c.fill();
        c.restore();
      }
    }

    const starCount = 120;
    const stars: StarParticle[] = Array.from({ length: starCount }).map(() => new StarParticle(true));

    let animationId = 0;

    const loop = () => {
      ctx.fillStyle = 'rgba(4, 5, 13, 0.12)'; // deep cosmic space feedback trail
      ctx.fillRect(0, 0, width, height);

      // Render aesthetic background grids
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
      ctx.lineWidth = 1;
      const stepGrid = 60;
      for (let x = 0; x < width; x += stepGrid) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += stepGrid) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
      ctx.restore();

      // Update & render particles
      stars.forEach(star => {
        star.update(phase);
        star.draw(ctx);
      });

      // Draw custom center stellar orb effects
      if (phase === 'charging') {
        const cx = width / 2;
        const cy = height / 2;
        ctx.save();
        const pulse = Math.sin(Date.now() / 80) * 12;
        const radius = (20 + (percent * 0.8)) + pulse;
        const radial = ctx.createRadialGradient(cx, cy, 5, cx, cy, radius);
        radial.addColorStop(0, aura.textColor);
        radial.addColorStop(0.4, aura.glowColor);
        radial.addColorStop(1, 'transparent');
        ctx.fillStyle = radial;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      animationId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [aura, phase, percent]);

  const SelectedIcon = (Icons as any)[aura.icon] || Icons.Sparkles;

  const renderDiagnosticUI = () => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between border border-white/5 bg-white/[0.02] rounded-lg p-3 max-w-sm mx-auto">
          <div className="text-left font-mono text-[9px] text-neutral-400 space-y-0.5">
            <div>ENERGY FIELD: <span style={{ color: aura.textColor }}>STABILIZED</span></div>
            <div>FREQUENCY: <span className="text-neutral-200">{aura.baseFrequency} Hz</span></div>
          </div>
          <div className="text-right font-mono text-[9px] text-neutral-400 space-y-0.5">
            <div>COAXIAL INDEX: <span className="text-amber-400">{(aura.probability * 0.04).toFixed(1)}</span></div>
            <div>STRESS FLUX: <span className="text-neutral-200">{Math.min(100, Math.floor(percent * 1.3))}%</span></div>
          </div>
        </div>

        {/* Real-time analytical spectrogram graph simulator */}
        <div className="relative w-full max-w-xs sm:max-w-md mx-auto aspect-[3/1] bg-neutral-950/60 border border-neutral-850 rounded-xl overflow-hidden p-2 flex flex-col justify-end">
          <div className="absolute inset-x-2 top-2 flex justify-between font-mono text-[8px] text-neutral-600">
            <span>[ SPECTRE ANALYSIS WAVE ]</span>
            <span>CH_{aura.id.toUpperCase()}</span>
          </div>
          <div className="w-full h-8 flex items-end justify-center space-x-1">
            {Array.from({ length: 18 }).map((_, i) => {
              const h = Math.abs(Math.sin((i + percent * 0.2) * 1.5)) * 100;
              return (
                <div 
                  key={i} 
                  className="w-1.5 rounded-t"
                  style={{
                    height: `${Math.max(10, h)}%`,
                    backgroundColor: aura.textColor,
                    opacity: 0.15 + (i % 3) * 0.15
                  }}
                />
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="cutscene_viewport" className="fixed inset-0 z-[999] bg-[#04050d] text-neutral-100 flex flex-col items-center justify-center p-4 select-none overflow-hidden">
      
      {/* Immersive Particle Canvas behind the whole screen */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {phase === 'charging' && (
          <motion.div
            key="charging"
            initial={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.15 }}
            transition={{ duration: 0.22 }}
            className="w-full max-w-lg text-center space-y-6 px-6 z-10 flex flex-col items-center"
          >
            <div className="space-y-2">
              <span className="text-[9px] font-bold bg-white/5 border border-white/10 px-3 py-1 rounded-full text-indigo-400 uppercase tracking-widest font-mono">
                Temporal Singularity Link Active
              </span>
              <h2 className="text-2xl sm:text-3xl font-black font-sans tracking-tight uppercase text-white/95">
                Aligning Quantum Signature
              </h2>
            </div>

            {/* Diagnostic Panel */}
            {renderDiagnosticUI()}

            {/* Futuristic Linear Progress tracker */}
            <div className="w-full max-w-xs sm:max-w-md space-y-2">
              <div className="w-full bg-neutral-900/50 border border-neutral-800 rounded-full h-3 overflow-hidden p-0.5 shadow-md">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ ease: "linear" }}
                  className="h-full rounded-full"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${aura.textColor}, ${aura.glowColor || 'indigo'})`,
                    boxShadow: `0 0 10px ${aura.textColor}`
                  }}
                />
              </div>
              <div className="flex justify-between font-mono text-[9px] text-neutral-500">
                <span>VORTEX SYNC STATE</span>
                <span className="font-bold" style={{ color: aura.textColor }}>{Math.floor(percent)}%</span>
              </div>
            </div>

            {showSkip && (
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={onClose}
                className="text-[10px] font-mono text-neutral-500 hover:text-neutral-300 underline underline-offset-4 focus:outline-none transition-colors"
              >
                Interrupt Align Process
              </motion.button>
            )}
          </motion.div>
        )}

        {phase === 'impact' && (
          <motion.div
            key="impact"
            initial={{ opacity: 0, scale: 0.1 }}
            animate={{ opacity: [0, 1, 1, 0], scale: [0.1, 4.5, 5, 0] }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute z-20 w-36 h-36 rounded-full mix-blend-screen pointer-events-none"
            style={{
              background: `radial-gradient(circle, ${aura.textColor} 0%, ${aura.glowColor} 45%, transparent 75%)`
            }}
          />
        )}

        {phase === 'reveal' && (
          <motion.div
            key="reveal"
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-xl text-center space-y-7 px-4 z-10 flex flex-col items-center"
          >
            {/* Soft, pulsing glow ring behind the reveal cards */}
            <div 
              className="absolute w-[400px] h-[400px] sm:w-[600px] sm:h-[600px] pointer-events-none opacity-25 mix-blend-screen bg-radial animate-pulse"
              style={{
                backgroundImage: `radial-gradient(circle, ${aura.glowColor} 0%, transparent 70%)`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                animationDuration: '3s'
              }}
            />

            <div className="space-y-3.5 max-w-md">
              <motion.span 
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 120 }}
                className="inline-block text-[10px] sm:text-xs font-bold font-mono tracking-widest uppercase border px-4 py-1.5 rounded-full shadow-lg"
                style={{
                  color: aura.textColor,
                  borderColor: `${aura.textColor}44`,
                  backgroundColor: `${aura.textColor}12`
                }}
              >
                ✨ SPECTRAL DIMENSION UNLOCKED ✨
              </motion.span>

              {/* Aura Name displaying majestic dropshadows */}
              <motion.h1 
                initial={{ scale: 0.75, opacity: 0 }}
                animate={{ scale: [0.75, 1.08, 1], opacity: 1 }}
                transition={{ duration: 0.55, ease: "easeOut" }}
                className="text-5xl sm:text-7xl font-sans font-black tracking-tight uppercase"
                style={{
                  color: aura.textColor,
                  textShadow: `0 0 25px ${aura.glowColor}, 0 0 55px ${aura.textColor}`
                }}
              >
                {aura.name}
              </motion.h1>

              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
                className="text-xs sm:text-sm font-bold font-mono text-neutral-300 tracking-wider bg-neutral-900/80 border border-neutral-800 py-2 px-6 rounded-full inline-block shadow-inner"
              >
                Alignment Frequency: <span style={{ color: aura.textColor }}>1 in {aura.probability.toLocaleString()}</span>
              </motion.div>
            </div>

            {/* Central Neon Halo Card Wrapper with Hover effect */}
            <motion.div 
              initial={{ rotate: -12, scale: 0.3, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 80, delay: 0.35 }}
              whileHover={{ rotateY: 10, rotateX: -10, scale: 1.05 }}
              className="w-32 h-32 rounded-3xl border shadow-2xl flex flex-col items-center justify-center p-6 relative bg-neutral-950/80 backdrop-blur-md cursor-pointer transition-all"
              style={{
                borderColor: aura.textColor,
                boxShadow: `0 15px 45px ${aura.glowColor}`
              }}
            >
              <div 
                className="absolute inset-0 rounded-3xl opacity-40 animate-pulse"
                style={{
                  boxShadow: `inset 0 0 25px ${aura.glowColor}`
                }}
              />
              <SelectedIcon size={56} style={{ color: aura.textColor }} className="animate-pulse relative z-10" />
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="max-w-md space-y-4"
            >
              <p className="text-sm text-neutral-400 font-sans leading-relaxed px-4">
                {aura.description}
              </p>
              
              <div className="flex items-center justify-center space-x-2 text-[9px] font-mono text-amber-400/90 uppercase tracking-widest bg-amber-500/5 border border-amber-500/10 px-4 py-1.5 rounded-xl max-w-xs mx-auto">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
                <span>ACTIVE RESONANCE INTEGRATED</span>
              </div>
            </motion.div>

            {/* Claims trigger button */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
              onClick={onClose}
              className="px-12 py-4 font-mono font-black text-sm tracking-widest text-[#04050d] rounded-2xl shadow-2xl transition-all hover:brightness-110 active:scale-95 border border-white/20 uppercase"
              style={{
                backgroundColor: aura.textColor,
                boxShadow: `0 10px 35px ${aura.glowColor}`
              }}
            >
              Equip & Channel Spectrum
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
