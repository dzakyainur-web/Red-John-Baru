"use client";

import { useState } from "react";

const KINETIC_ROWS = [
  [
    { char: "W", isSymbol: false },
    { char: "*", isSymbol: true },
    { char: "RO", isSymbol: false },
    { char: "*", isSymbol: true },
  ],
  [
    { char: "S", isSymbol: false },
    { char: "*=", isSymbol: true },
    { char: "R#", isSymbol: false },
    { char: "+=", isSymbol: true },
    { char: "O", isSymbol: false },
    { char: "+=", isSymbol: true },
  ],
  [
    { char: "+=", isSymbol: true },
    { char: "E", isSymbol: false },
    { char: "**", isSymbol: true },
    { char: "+", isSymbol: true },
    { char: "R", isSymbol: false },
    { char: "*", isSymbol: true },
    { char: "A", isSymbol: false },
    { char: "*", isSymbol: true },
  ],
  [
    { char: "RO", isSymbol: false },
    { char: "-", isSymbol: true },
    { char: "E", isSymbol: false },
    { char: "-", isSymbol: true },
    { char: "E", isSymbol: false },
  ],
];

const GLITCH_SYMBOLS = ["*", "#", "+", "-", "=", "$", "%", "X", "@", "!", "?"];

export default function HeroKineticText() {
  const [glitchState, setGlitchState] = useState<Record<string, string>>({});

  const handleHover = (rowIdx: number, itemIdx: number, original: string) => {
    const key = `${rowIdx}-${itemIdx}`;
    let iterations = 0;
    const interval = setInterval(() => {
      iterations++;
      const randomGlitch = original
        .split("")
        .map(() => GLITCH_SYMBOLS[Math.floor(Math.random() * GLITCH_SYMBOLS.length)])
        .join("");

      setGlitchState((prev) => ({ ...prev, [key]: randomGlitch }));

      if (iterations > 6) {
        clearInterval(interval);
        setGlitchState((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    }, 45);
  };

  return (
    <div className="relative z-10 flex flex-col font-black tracking-tighter select-none">
      {KINETIC_ROWS.map((row, rowIdx) => (
        <div
          key={rowIdx}
          className="flex flex-wrap items-baseline gap-x-2 sm:gap-x-3 leading-[0.88] transition-transform duration-300"
        >
          {row.map((item, itemIdx) => {
            const key = `${rowIdx}-${itemIdx}`;
            const displayChar = glitchState[key] || item.char;

            return (
              <span
                key={itemIdx}
                onMouseEnter={() => handleHover(rowIdx, itemIdx, item.char)}
                className={`cursor-pointer inline-block transition-all duration-150 transform hover:scale-110 ${
                  item.isSymbol
                    ? "text-[#FF3815] text-[clamp(2.5rem,7vw,6.5rem)] font-light opacity-95"
                    : "text-[#FF3815] text-[clamp(3.8rem,11.5vw,10.5rem)] font-[family-name:var(--font-display)] font-extrabold uppercase hover:text-[#FF5533]"
                }`}
                style={{
                  textShadow:
                    "0 0 35px rgba(255, 56, 21, 0.45), 0 0 10px rgba(255, 56, 21, 0.25)",
                }}
              >
                {displayChar}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
