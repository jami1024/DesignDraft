"use client";

import { useEffect, useState } from "react";

import type { GenerationPhase } from "./preview-panel";

type GenerationAnimationProps = {
  phase: GenerationPhase;
};

const CARDS = [
  { dx: -15, dy: -20, targetOpacity: 0.12 },
  { dx: -12, dy: -16, targetOpacity: 0.25 },
  { dx: -9, dy: -12, targetOpacity: 0.40 },
  { dx: -6, dy: -8, targetOpacity: 0.58 },
  { dx: -3, dy: -4, targetOpacity: 0.78 },
  { dx: 0, dy: 0, targetOpacity: 1.0 },
];

const PHASE_CARD_COUNT: Record<GenerationPhase, number> = {
  idle: 0,
  analyzing: 2,
  generating: 5,
  optimizing: 6,
  done: 6,
};

const PHASE_TEXT: Record<GenerationPhase, string> = {
  idle: "",
  analyzing: "正在分析需求…",
  generating: "正在生成页面…",
  optimizing: "正在优化页面…",
  done: "处理完成",
};

export function GenerationAnimation({ phase }: GenerationAnimationProps) {
  const [reducedMotion, setReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const cardCount = PHASE_CARD_COUNT[phase];

  return (
    <div className="flex flex-col items-center">
      <svg
        viewBox="0 0 280 160"
        className="h-[160px] w-[280px]"
        aria-hidden="true"
        role="img"
      >
        <defs>
          <radialGradient id="gen-glow-gradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--gen-glow-color)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
        </defs>

        <ellipse cx="130" cy="80" rx="100" ry="60" fill="url(#gen-glow-gradient)" />

        <g className={reducedMotion ? "" : "gen-stack-float"}>
          {CARDS.map((card, i) => {
            const isVisible = i < cardCount;
            const isFront = i === CARDS.length - 1;
            return (
              <g
                key={i}
                style={{
                  opacity: isVisible ? card.targetOpacity : 0,
                  transform: `translate(${70 + card.dx}px, ${(isVisible ? 44 : 64) + card.dy}px)`,
                  transition: reducedMotion
                    ? "none"
                    : `opacity 0.5s ease-out ${i * 0.15}s, transform 0.5s ease-out ${i * 0.15}s`,
                }}
                className={isFront && isVisible && !reducedMotion ? "gen-card-breathe" : ""}
              >
                <rect
                  x="2" y="2" width="120" height="72" rx="8"
                  fill="var(--gen-card-shadow)"
                />
                <rect
                  width="120" height="72" rx="8"
                  fill="var(--gen-card-bg)"
                  stroke="var(--gen-card-stroke)" strokeWidth="0.5"
                />
                <rect
                  x="12" y="12" width="28" height="3" rx="1.5"
                  fill="var(--gen-card-accent)"
                  opacity={isFront ? 0.8 : 0.35}
                />
                <rect x="12" y="22" width="60" height="2" rx="1" fill="var(--gen-card-line)" />
                <rect x="12" y="29" width="42" height="2" rx="1" fill="var(--gen-card-line)" />
                <rect x="12" y="36" width="72" height="2" rx="1" fill="var(--gen-card-line)" />
                <rect x="12" y="48" width="50" height="2" rx="1" fill="var(--gen-card-line)" opacity="0.5" />
                <rect x="12" y="55" width="38" height="2" rx="1" fill="var(--gen-card-line)" opacity="0.5" />
                <circle
                  cx="100" cy="15" r="6"
                  fill="var(--gen-card-accent)"
                  opacity={isFront ? 0.15 : 0.08}
                />
              </g>
            );
          })}
        </g>

        <g className={reducedMotion ? "" : "gen-depth-pulse"}>
          <text
            x="210" y="68"
            fontSize="9" fontWeight="500"
            fill="var(--gen-card-line)"
            fontFamily="Inter, system-ui, sans-serif"
          >
            分析深度
          </text>
          <text
            x="210" y="86"
            fontSize="18" fontWeight="700"
            fill="var(--gen-card-accent)"
            fontFamily="Inter, system-ui, sans-serif"
          >
            {cardCount}
            <tspan fontSize="11" fontWeight="500" fill="var(--gen-card-line)">/6</tspan>
          </text>
        </g>
      </svg>

      <p className="mt-3 text-sm text-[#78716C] dark:text-[#A8A29E]">
        {PHASE_TEXT[phase]}
      </p>
    </div>
  );
}
