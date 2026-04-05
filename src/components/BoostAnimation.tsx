import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';

interface BoostAnimationProps {
  onComplete: () => void;
}

export function BoostAnimation({ onComplete }: BoostAnimationProps) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState<'idle' | 'boosting' | 'done'>('idle');
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playPowerUpSound = useCallback(() => {
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;

      // Rising tone (turbine effect)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(80, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 3);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.15, ctx.currentTime + 2.5);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 3.2);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 3.5);

      // Ding at the end
      setTimeout(() => {
        const ding = ctx.createOscillator();
        const dGain = ctx.createGain();
        ding.type = 'sine';
        ding.frequency.setValueAtTime(1200, ctx.currentTime);
        dGain.gain.setValueAtTime(0.2, ctx.currentTime);
        dGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.5);
        ding.connect(dGain).connect(ctx.destination);
        ding.start();
        ding.stop(ctx.currentTime + 1.5);
      }, 3200);
    } catch {
      /* Web Audio not supported */
    }
  }, []);

  const startBoost = () => {
    setPhase('boosting');
    setProgress(0);
    playPowerUpSound();
  };

  useEffect(() => {
    if (phase !== 'boosting') return;
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setPhase('done');
          return 100;
        }
        return p + 2;
      });
    }, 60);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (phase === 'done') {
      const t = setTimeout(() => onComplete(), 4000);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  useEffect(() => {
    return () => { audioCtxRef.current?.close(); };
  }, []);

  if (phase === 'idle') {
    return (
      <Button
        onClick={startBoost}
        className="w-full bg-gradient-to-r from-primary to-secondary text-primary-foreground font-bold py-3 hover:opacity-90"
      >
        <Zap className="w-5 h-5 mr-2" />
        ⚡ Activer le Boost RAM (+10 Go)
      </Button>
    );
  }

  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-4 py-6">
      {/* Energy Circle */}
      <div className="relative w-44 h-44">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 160 160">
          <circle cx="80" cy="80" r="70" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
          <circle
            cx="80" cy="80" r="70" fill="none"
            stroke="url(#boostGrad)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-100"
          />
          <defs>
            <linearGradient id="boostGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="hsl(var(--primary))" />
              <stop offset="100%" stopColor="hsl(var(--secondary))" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <Zap className={`w-8 h-8 text-primary ${phase === 'boosting' ? 'animate-pulse' : ''}`} />
          <span className="text-2xl font-bold text-foreground">{progress}%</span>
        </div>
      </div>

      {phase === 'boosting' && (
        <p className="text-sm text-muted-foreground animate-pulse">
          Optimisation en cours... Compression LZ4 activée
        </p>
      )}

      {phase === 'done' && (
        <div className="text-center space-y-2 animate-fade-in">
          <p className="text-lg font-bold text-secondary">
            ✅ Système Lomba Technologie Activé
          </p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Votre téléphone dispose désormais de 10 Go de RAM virtuelle et de 10 010 Go de stockage Cloud. Naviguez sans limites !
          </p>
        </div>
      )}
    </div>
  );
}
