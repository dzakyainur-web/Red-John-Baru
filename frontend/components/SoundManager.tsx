"use client";

import { createContext, useContext, useState, useEffect } from "react";

interface SoundContextType {
  soundEnabled: boolean;
  toggleSound: () => void;
  playClick: () => void;
  playHover: () => void;
  playSuccess: () => void;
  playAlert: () => void;
}

const SoundContext = createContext<SoundContextType>({
  soundEnabled: false,
  toggleSound: () => {},
  playClick: () => {},
  playHover: () => {},
  playSuccess: () => {},
  playAlert: () => {},
});

export const useSound = () => useContext(SoundContext);

export function SoundProvider({ children }: { children: React.ReactNode }) {
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [audioCtx, setAudioCtx] = useState<AudioContext | null>(null);

  useEffect(() => {
    // Check saved preference
    const saved = localStorage.getItem("sound_preference");
    if (saved === "true") {
      setSoundEnabled(true);
    }
  }, []);

  const getAudioContext = () => {
    if (audioCtx) return audioCtx;
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    setAudioCtx(ctx);
    return ctx;
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem("sound_preference", String(next));
    if (next) {
      const ctx = getAudioContext();
      if (ctx && ctx.state === "suspended") {
        ctx.resume();
      }
      playClick();
    }
  };

  const playClick = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {
      // AudioContext not ready or blocked
    }
  };

  const playHover = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "triangle";
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(560, ctx.currentTime + 0.03);

      gain.gain.setValueAtTime(0.03, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.03);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.03);
    } catch {}
  };

  const playSuccess = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now + idx * 0.05);
        gain.gain.setValueAtTime(0.06, now + idx * 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.12);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.05);
        osc.stop(now + idx * 0.05 + 0.12);
      });
    } catch {}
  };

  const playAlert = () => {
    if (!soundEnabled) return;
    try {
      const ctx = getAudioContext();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.linearRampToValueAtTime(220, now + 0.15);
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch {}
  };

  return (
    <SoundContext.Provider
      value={{ soundEnabled, toggleSound, playClick, playHover, playSuccess, playAlert }}
    >
      {children}
    </SoundContext.Provider>
  );
}
