import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, Shield, Gem, Crown, Flame, Heart, Droplet, Sparkle, 
  Sun, Activity, Wind, Moon, FlameKindling, MoonStar, Atom, 
  Globe, ShieldAlert, Code, Orbit, HelpCircle, Loader2 
} from 'lucide-react';
import { Aura } from '../types';

interface AuraDisplayProps {
  aura: Aura;
  isRolling: boolean;
  rollCount: number;
}

const ICON_MAP: Record<string, React.ComponentType<any>> = {
  Sparkles, Shield, Gem, Crown, Flame, Heart, Droplet, Sparkle,
  Sun, Activity, Wind, Moon, FlameKindling, MoonStar, Atom,
  Globe, Radioactive: ShieldAlert, Code, Orbit
};

export default function AuraDisplay({ aura, isRolling, rollCount }: AuraDisplayProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const TargetIcon = ICON_MAP[aura.icon] || HelpCircle;

  // Render a responsive high-fidelity particle field customized by Aura properties
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 400);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 450);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.parentElement?.clientWidth || 400;
      height = canvas.height = canvas.parentElement?.clientHeight || 450;
    };
    window.addEventListener('resize', handleResize);

    const particles: Particle[] = [];
    const maxParticles = Math.min(80, Math.ceil(Math.sqrt(aura.probability) * 5) + 16);

    class Particle {
      x = 0;
      y = 0;
      size = 0;
      speedY = 0;
      speedX = 0;
      alpha = 0;
      color = '';
      pulse = 0;
      pulseDir = 1;
      angle = 0;
      radius = 0;
      char = '';

      constructor() {
        this.reset();
        // Disperse them randomly across coordinates initially
        this.y = Math.random() * height;
        this.alpha = Math.random() * 0.6 + 0.1;
      }

      reset() {
        this.x = Math.random() * width;
        this.y = height + Math.random() * 20;
        this.size = Math.random() * 2.5 + 1;
        this.speedY = -(Math.random() * 1.5 + 0.3) * (1 + Math.log10(aura.probability + 1) * 0.12);
        this.speedX = (Math.random() - 0.5) * 0.7;
        this.alpha = Math.random() * 0.5 + 0.2;
        this.color = aura.textColor;
        this.pulse = Math.random() * 0.04 + 0.008;
        this.pulseDir = 1;
        this.angle = Math.random() * Math.PI * 2;
        this.radius = Math.random() * Math.min(width, height) * 0.55 + 15;

        if (aura.vfxType === 'matrix') {
          const chars = "0101010101XØΞΣΩ🤖👾🚀⚡🔒";
          this.char = chars[Math.floor(Math.random() * chars.length)];
          this.size = Math.random() * 8 + 8;
          this.speedY = Math.random() * 2 + 1.5;
          this.y = Math.random() * -height;
          this.x = Math.random() * width;
        } else if (aura.vfxType === 'beams') {
          this.size = Math.random() * 8 + 2;
          this.speedY = -(Math.random() * 2.5 + 0.8);
          this.speedX = 0;
        } else if (aura.vfxType === 'vortex' || aura.vfxType === 'abyss' || aura.vfxType === 'singularity') {
          this.radius = Math.random() * Math.min(width, height) * 0.55 + 10;
          this.speedY = Math.random() * 1.5 + 0.8; 
        } else if (aura.vfxType === 'sparks') {
          this.size = Math.random() * 2 + 0.5;
          this.speedY = (Math.random() - 0.5) * 3;
          this.speedX = (Math.random() - 0.5) * 3;
          this.x = width / 2;
          this.y = height / 2;
        }
      }

      update() {
        if (aura.vfxType === 'matrix') {
          this.y += this.speedY;
          if (this.y > height) {
            this.reset();
          }
          if (Math.random() < 0.08) {
            const chars = "0101010101XØΞΣΩ🤖👾🚀⚡🔒";
            this.char = chars[Math.floor(Math.random() * chars.length)];
          }
        } else if (aura.vfxType === 'beams') {
          this.y += this.speedY;
          if (this.y < -50) {
            this.reset();
          }
        } else if (aura.vfxType === 'orbit') {
          this.angle += 0.015 * (1 + Math.log10(aura.probability + 1) * 0.04);
          this.x = width / 2 + Math.cos(this.angle) * this.radius;
          this.y = height / 2 + Math.sin(this.angle) * this.radius * 0.55;
        } else if (aura.vfxType === 'vortex') {
          this.angle += 0.025;
          this.radius -= 0.6;
          if (this.radius <= 4) {
            this.reset();
          }
          this.x = width / 2 + Math.cos(this.angle) * this.radius;
          this.y = height / 2 + Math.sin(this.angle) * this.radius;
        } else if (aura.vfxType === 'abyss') {
          this.angle += 0.02;
          this.radius -= 1.0;
          if (this.radius <= 6) {
            this.reset();
            this.radius = Math.min(width, height) * 0.6 + Math.random() * 40;
          }
          this.x = width / 2 + Math.cos(this.angle) * this.radius;
          this.y = height / 2 + Math.sin(this.angle) * this.radius;
        } else if (aura.vfxType === 'singularity') {
          this.angle += 0.04;
          this.radius -= 1.5;
          if (this.radius <= 2) {
            this.reset();
            this.radius = Math.min(width, height) * 0.7;
          }
          this.x = width / 2 + Math.cos(this.angle) * this.radius;
          this.y = height / 2 + Math.sin(this.angle) * this.radius * 0.7;
        } else if (aura.vfxType === 'sparks') {
          this.x += this.speedX;
          this.y += this.speedY;
          if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
            this.reset();
          }
        } else {
          // Standard / Glitch
          this.y += this.speedY;
          this.x += this.speedX;

          if (this.y < 0) {
            this.reset();
          }
          if (this.x < 0 || this.x > width) {
            this.speedX *= -1;
          }
        }

        // Glow pulse
        this.alpha += this.pulse * this.pulseDir;
        if (this.alpha > 0.9) this.pulseDir = -1;
        if (this.alpha < 0.15) this.pulseDir = 1;
      }

      draw(c: CanvasRenderingContext2D) {
        c.save();
        c.globalAlpha = this.alpha;
        c.fillStyle = this.color;
        c.shadowBlur = aura.probability >= 1000 ? 12 : 0;
        c.shadowColor = aura.glowColor;

        if (aura.vfxType === 'matrix') {
          c.font = `bold ${this.size}px monospace`;
          c.fillText(this.char, this.x, this.y);
        } else if (aura.vfxType === 'beams') {
          c.fillRect(this.x - this.size / 2, 0, this.size, height);
        } else {
          c.beginPath();
          c.arc(this.x, this.y, this.size, 0, Math.PI * 2);
          c.fill();
        }
        c.restore();
      }
    }

    // Populate particles
    for (let i = 0; i < maxParticles; i++) {
      particles.push(new Particle());
    }

    // Animation Loop
    const draw = () => {
      ctx.clearRect(0, 0, width, height);

      // Simple grid backing subtle pulse
      ctx.strokeStyle = 'rgba(255,255,255,0.012)';
      ctx.lineWidth = 1;
      const gridSize = 45;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // Draw custom background radial gradient
      const gradient = ctx.createRadialGradient(width / 2, height / 2, 40, width / 2, height / 2, Math.max(width, height) / 1.5);
      gradient.addColorStop(0, `rgba(0,0,0,0)`);
      gradient.addColorStop(1, `rgba(8,10,20,0.96)`);
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Render updated particles
      if (!isRolling) {
        particles.forEach((p) => {
          p.update();
          p.draw(ctx);
        });
      }

      // Eclipse custom renderer (Corona center star)
      if (aura.vfxType === 'eclipse' && !isRolling) {
        const cx = width / 2;
        const cy = height / 2;
        const radius = 55 + Math.sin(Date.now() / 180) * 3;

        ctx.save();
        ctx.shadowBlur = 45;
        ctx.shadowColor = aura.textColor;
        ctx.globalAlpha = 0.65;
        const totalRays = 16;
        for (let idx = 0; idx < totalRays; idx++) {
          const rAngle = (idx / totalRays) * Math.PI * 2 + (Date.now() / 8200);
          const outerRadius = radius + 38 + Math.sin(rAngle * 4 + Date.now() / 250) * 12;
          ctx.beginPath();
          ctx.strokeStyle = aura.textColor;
          ctx.lineWidth = 4;
          ctx.moveTo(cx + Math.cos(rAngle) * radius, cy + Math.sin(rAngle) * radius);
          ctx.lineTo(cx + Math.cos(rAngle) * outerRadius, cy + Math.sin(rAngle) * outerRadius);
          ctx.stroke();
        }
        ctx.restore();

        // Eclipse central blackout sphere
        ctx.save();
        ctx.beginPath();
        const outerGrad = ctx.createRadialGradient(cx, cy, radius - 6, cx, cy, radius + 22);
        outerGrad.addColorStop(0, '#000');
        outerGrad.addColorStop(0.3, aura.textColor);
        outerGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = outerGrad;
        ctx.arc(cx, cy, radius + 22, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#060714';
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Abyssal gravity blackhole center
      if (aura.vfxType === 'abyss' && !isRolling) {
        const cx = width / 2;
        const cy = height / 2;
        const radiusToken = 35 + Math.sin(Date.now() / 120) * 2;

        ctx.save();
        ctx.shadowBlur = 30;
        ctx.shadowColor = aura.textColor;
        ctx.beginPath();
        const abyssGrad = ctx.createRadialGradient(cx, cy, radiusToken - 4, cx, cy, radiusToken + 40);
        abyssGrad.addColorStop(0, '#000000');
        abyssGrad.addColorStop(0.15, '#000000');
        abyssGrad.addColorStop(0.5, aura.textColor);
        abyssGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = abyssGrad;
        ctx.arc(cx, cy, radiusToken + 40, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = '#000000';
        ctx.arc(cx, cy, radiusToken, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Glitch visual screen horizontal lines triggers
      if (aura.vfxType === 'glitch' && !isRolling && Math.random() < 0.04) {
        ctx.save();
        ctx.fillStyle = `rgba(229, 29, 72, ${Math.random() * 0.15 + 0.05})`;
        ctx.fillRect(0, Math.random() * height, width, Math.random() * 5 + 1);
        ctx.restore();
      }

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationId);
    };
  }, [aura, isRolling]);

  return (
    <div 
      id="aura_display_wrapper" 
      className="relative w-full h-[450px] overflow-hidden rounded-3xl bg-neutral-950 border transition-all duration-1000 flex flex-col items-center justify-center p-6 text-center select-none animate-quantum-float shadow-2xl"
      style={{
        borderColor: isRolling ? 'rgba(79, 70, 229, 0.25)' : `${aura.textColor}25`,
        boxShadow: isRolling ? '0 10px 40px rgba(0,0,0,0.5)' : `0 15px 50px rgba(0,0,0,0.4), 0 0 35px ${aura.textColor}15, inset 0 0 20px ${aura.textColor}08`,
      }}
    >
      {/* Cybernetic Scanlines and Digital Backdrop Grid */}
      <div className="absolute inset-0 cyber-scanline opacity-[0.08] pointer-events-none z-0" style={{ mixBlendMode: 'overlay' }} />
      <div className="absolute inset-0 retro-grid-backdrop opacity-[0.4] pointer-events-none z-0" />

      {/* Dynamic Background Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />

      {/* Rarity Spotlights / Radial Burst Layer */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 mix-blend-screen opacity-30"
        style={{
          background: `radial-gradient(circle at center, ${aura.glowColor} 0%, rgba(0,0,0,0) 70%)`
        }}
      />

      <AnimatePresence mode="wait">
        {isRolling ? (
          <motion.div
            key="rolling"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center justify-center space-y-4 z-10"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 0.5, ease: "linear" }}
              className="p-4 rounded-full bg-indigo-950/40 border border-indigo-500/30 text-indigo-400"
            >
              <Loader2 size={44} className="animate-spin" />
            </motion.div>
            <div className="space-y-1">
              <p className="text-sm font-mono tracking-wider text-indigo-400/80 uppercase">Initiating Dimensional Corridor Link</p>
              <p className="text-xs text-neutral-500 font-mono">Quantum Interference Tick #{rollCount.toLocaleString()}</p>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key={aura.id}
            initial={{ opacity: 0, y: 15, scale: 0.95 }}
            animate={{ 
              opacity: 1, 
              y: [0, -6, 0], 
              scale: 1 
            }}
            exit={{ opacity: 0, y: -15, scale: 1.05 }}
            transition={{ 
              y: {
                repeat: Infinity,
                duration: 5,
                ease: "easeInOut"
              },
              default: {
                type: 'spring', 
                damping: 15, 
                stiffness: 100 
              }
            }}
            className="flex flex-col items-center select-none z-10 w-full max-w-sm"
          >
            {/* Visual Icon Halo with slowly rotating stardust ring */}
            <div className="relative mb-6 flex items-center justify-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
                className="absolute w-24 h-24 rounded-full border border-dashed opacity-45 pointer-events-none"
                style={{ borderColor: aura.textColor, borderWidth: '1.5px' }}
              />
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ repeat: Infinity, duration: 30, ease: "linear" }}
                className="absolute w-28 h-28 rounded-full border border-double opacity-20 pointer-events-none"
                style={{ borderColor: aura.textColor, borderWidth: '2px' }}
              />
              <motion.div
                initial={{ rotate: -15, scale: 0.8 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className={`relative p-5 rounded-2xl bg-gradient-to-tr ${aura.bgGradient} border shadow-2xl flex items-center justify-center z-10`}
                style={{
                  borderColor: aura.textColor,
                  boxShadow: `0 10px 30px ${aura.glowColor}`
                }}
              >
                <TargetIcon size={46} style={{ color: aura.textColor }} />
              </motion.div>
            </div>

            {/* Aura Name with customizable dropshadow */}
            <h2 
              className="text-4xl md:text-5xl font-black tracking-tighter mb-2"
              style={{
                color: aura.textColor,
                textShadow: `0 0 15px ${aura.glowColor}, 0 0 35px ${aura.glowColor}`
              }}
            >
              {aura.name}
            </h2>

            {/* In 1 in X indicator */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 mb-6 shadow-inner">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: aura.textColor }} />
              <p className="text-sm font-mono font-medium text-neutral-300">
                1 in {aura.probability.toLocaleString()}
              </p>
            </div>

            {/* Aura Classification & Description */}
            <div className="w-full px-4 text-center">
              <p 
                className="text-xs font-mono tracking-widest uppercase mb-2 font-bold"
                style={{ color: aura.textColor }}
              >
                {aura.rarityText} Signature
              </p>
              <p className="text-sm text-neutral-400 font-sans leading-relaxed line-clamp-3">
                {aura.description}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute bottom-4 right-4 flex items-center space-x-1.5 opacity-40 hover:opacity-100 transition-opacity pointer-events-none sm:pointer-events-auto">
        <HelpCircle size={14} className="text-neutral-500" />
        <span className="text-[10px] font-mono text-neutral-500">Resonator Engine Engaged</span>
      </div>
    </div>
  );
}
