'use client';

import { useEffect, useState } from 'react';

export default function ScoreRing({ score, size = 128 }: { score: number; size?: number }) {
  const [mounted, setMounted] = useState(false);
  const [displayScore, setDisplayScore] = useState(0);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    const duration = 900;
    const start = performance.now();
    let frame: number;
    const tick = (now: number) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * score));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(frame);
    };
  }, [score]);

  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = mounted ? circumference - (score / 100) * circumference : circumference;
  const color = score >= 80 ? '#317b70' : score >= 50 ? '#e8a13e' : '#c44c3b';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="seo-score-ring -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e6ece8" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-3xl font-bold text-[#102f4d]">{displayScore}</span>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-[#90a5b6]">score</span>
      </div>
    </div>
  );
}
