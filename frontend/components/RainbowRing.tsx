"use client";

import React from "react";

/**
 * 3D Glowing Rainbow Arch with dynamic liquid RGB animation.
 * Retains the exact high-fidelity vector geometry & 3D specular sheen
 * while animating the RGB spectrum continuously across the arc.
 */
export default function RainbowRing({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute bottom-0 left-1/2 -translate-x-1/2 flex items-end justify-center overflow-hidden w-full max-w-5xl h-[220px] sm:h-[280px] md:h-[340px] select-none ${className}`}
    >
      <style>{`
        @keyframes ambientPulse {
          0%, 100% {
            opacity: 0.42;
            transform: translate(-50%, 0) scale(1);
          }
          50% {
            opacity: 0.62;
            transform: translate(-50%, -6px) scale(1.05);
          }
        }

        @keyframes spectrumHue {
          0% {
            filter: hue-rotate(0deg);
          }
          100% {
            filter: hue-rotate(360deg);
          }
        }

        .animate-ambient-pulse {
          animation: ambientPulse 6s ease-in-out infinite;
        }

        .animate-subtle-hue {
          animation: spectrumHue 18s linear infinite;
        }
      `}</style>

      {/* Background ambient diffused glow with soft pulsing */}
      <div
        className="absolute bottom-[-40px] left-1/2 w-[520px] h-[220px] rounded-full blur-[90px] pointer-events-none animate-ambient-pulse"
        style={{
          background:
            "conic-gradient(from 180deg at 50% 50%, #00e5ff 0deg, #10b981 60deg, #ffd600 120deg, #ff6d00 180deg, #ff1744 240deg, #e040fb 300deg, #00e5ff 360deg)",
        }}
      />

      <svg
        viewBox="0 0 1000 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-[340px] translate-y-[20%] sm:translate-y-[15%] animate-subtle-hue"
        preserveAspectRatio="xMidYMax meet"
      >
        <defs>
          {/* Main animated rainbow gradient flowing continuously along the horizontal arc */}
          <linearGradient
            id="rainbowSweep"
            x1="0"
            y1="0"
            x2="720"
            y2="0"
            gradientUnits="userSpaceOnUse"
            spreadMethod="repeat"
          >
            {/* Seamless 360° color loop starting and ending on electric cyan (#00E5FF) */}
            <stop offset="0%" stopColor="#00E5FF" />
            <stop offset="12%" stopColor="#00E676" />
            <stop offset="25%" stopColor="#AEEA00" />
            <stop offset="38%" stopColor="#FFD600" />
            <stop offset="50%" stopColor="#FF6D00" />
            <stop offset="65%" stopColor="#FF1744" />
            <stop offset="78%" stopColor="#E040FB" />
            <stop offset="90%" stopColor="#7C4DFF" />
            <stop offset="95%" stopColor="#2979FF" />
            <stop offset="100%" stopColor="#00E5FF" />

            {/* Continuous SVG translation animation moving the spectrum across the arc */}
            <animateTransform
              attributeName="gradientTransform"
              type="translate"
              from="0 0"
              to="-720 0"
              dur="7s"
              repeatCount="indefinite"
            />
          </linearGradient>

          {/* Secondary highlight gradient for 3D tubular specular sheen */}
          <linearGradient id="specularGlow" x1="50%" y1="0%" x2="50%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <stop offset="35%" stopColor="#ffffff" stopOpacity="0.3" />
            <stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
            <stop offset="100%" stopColor="#000000" stopOpacity="0.4" />
          </linearGradient>

          {/* Soft blur for outer neon halo */}
          <filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="16" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          {/* Deep diffused ambient blur */}
          <filter id="deepBlur" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="32" />
          </filter>

          {/* Mask to smoothly fade bottom edges into pitch black background */}
          <linearGradient id="bottomFadeMask" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" />
            <stop offset="75%" stopColor="white" />
            <stop offset="100%" stopColor="black" />
          </linearGradient>
          <mask id="fadeMask">
            <rect x="0" y="0" width="1000" height="500" fill="url(#bottomFadeMask)" />
          </mask>
        </defs>

        <g mask="url(#fadeMask)">
          {/* Layer 1: Ambient wide neon dispersion (animated flow) */}
          <path
            d="M 120 500 A 380 380 0 0 1 880 500"
            stroke="url(#rainbowSweep)"
            strokeWidth="90"
            strokeLinecap="round"
            filter="url(#deepBlur)"
            opacity="0.45"
          />

          {/* Layer 2: Medium glow halo (animated flow) */}
          <path
            d="M 140 500 A 360 360 0 0 1 860 500"
            stroke="url(#rainbowSweep)"
            strokeWidth="68"
            strokeLinecap="round"
            filter="url(#arcGlow)"
            opacity="0.75"
          />

          {/* Layer 3: Sharp, high-saturation core rainbow ribbon (animated flow) */}
          <path
            d="M 140 500 A 360 360 0 0 1 860 500"
            stroke="url(#rainbowSweep)"
            strokeWidth="56"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Layer 4: 3D Top-edge specular glossy highlight (fixed light reflection) */}
          <path
            d="M 154 500 A 346 346 0 0 1 846 500"
            stroke="url(#specularGlow)"
            strokeWidth="10"
            strokeLinecap="round"
            style={{ mixBlendMode: "overlay" }}
            opacity="0.8"
          />

          {/* Layer 5: Inner rim luminous accent */}
          <path
            d="M 166 500 A 334 334 0 0 1 834 500"
            stroke="url(#rainbowSweep)"
            strokeWidth="6"
            strokeLinecap="round"
            opacity="0.5"
          />
        </g>
      </svg>
    </div>
  );
}
