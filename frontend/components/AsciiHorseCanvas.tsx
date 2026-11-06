"use client";

import { useEffect, useRef, useState } from "react";

interface AsciiHorseCanvasProps {
  interactive?: boolean;
}

// Character density palette inspired by Orange Horse matrix
const DENSITY_CHARS = " .:-=+*#%@EROSNH";

export default function AsciiHorseCanvas({ interactive = true }: AsciiHorseCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;

    let animationFrameId: number;
    let isDestroyed = false;

    // Load background image
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = "/orange-horse-bg.webp";

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

    let mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.targetX = e.clientX - rect.left;
      mouse.targetY = e.clientY - rect.top;
      mouse.active = true;
    };

    const handleMouseLeave = () => {
      mouse.active = false;
      mouse.targetX = -1000;
      mouse.targetY = -1000;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const rect = canvas.getBoundingClientRect();
        mouse.targetX = e.touches[0].clientX - rect.left;
        mouse.targetY = e.touches[0].clientY - rect.top;
        mouse.active = true;
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    let cellW = 11;
    let cellH = 15;
    let cols = 0;
    let rows = 0;

    const resize = () => {
      if (!canvas || !containerRef.current) return;
      const width = containerRef.current.clientWidth || window.innerWidth;
      const height = containerRef.current.clientHeight || window.innerHeight;

      // Handle mobile vs desktop density
      const isMobile = width < 768;
      cellW = isMobile ? 8 : 11;
      cellH = isMobile ? 12 : 16;

      canvas.width = width;
      canvas.height = height;

      cols = Math.floor(width / cellW);
      rows = Math.floor(height / cellH);

      offscreen.width = cols;
      offscreen.height = rows;
    };

    resize();
    window.addEventListener("resize", resize);

    img.onload = () => {
      if (isDestroyed) return;
      setLoaded(true);
    };

    let time = 0;

    const render = () => {
      if (isDestroyed) return;
      time += 0.03;

      // Smooth mouse position lerp
      mouse.x += (mouse.targetX - mouse.x) * 0.15;
      mouse.y += (mouse.targetY - mouse.y) * 0.15;

      ctx.fillStyle = "#070707";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (img.complete && img.naturalWidth > 0 && offCtx && cols > 0 && rows > 0) {
        // Draw image stretched/contained into offscreen canvas
        offCtx.drawImage(img, 0, 0, cols, rows);
        const imgData = offCtx.getImageData(0, 0, cols, rows).data;

        ctx.font = `${cellH - 2}px "Geist Mono", monospace, monospace`;
        ctx.textBaseline = "top";

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) * 4;
            const red = imgData[idx];
            const green = imgData[idx + 1];
            const blue = imgData[idx + 2];
            const alpha = imgData[idx + 3];

            if (alpha < 10) continue;

            const brightness = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
            if (brightness < 0.05) continue;

            const posX = c * cellW;
            const posY = r * cellH;

            // Distance to mouse for interactive spotlight & halo effect
            const dx = posX - mouse.x;
            const dy = posY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const mouseHoverRadius = 140;

            let charIndex = Math.floor(brightness * (DENSITY_CHARS.length - 1));
            let fillStyle = `rgba(180, 185, 195, ${Math.min(1, brightness * 0.95)})`;

            // Mouse proximity highlight (blue-cyan electric aura as seen in the screenshot!)
            if (interactive && dist < mouseHoverRadius) {
              const proximity = 1 - dist / mouseHoverRadius;
              // Random glitch roll when near cursor
              if (Math.random() < 0.2) {
                charIndex = Math.floor(Math.random() * DENSITY_CHARS.length);
              }

              // Glowing cyan/white lighting around cursor
              const cyanR = Math.round(90 + 165 * proximity);
              const cyanG = Math.round(180 + 75 * proximity);
              const cyanB = Math.round(240 + 15 * proximity);
              const op = Math.min(1, brightness * 0.5 + proximity * 0.9);
              fillStyle = `rgba(${cyanR}, ${cyanG}, ${cyanB}, ${op})`;
            } else if (red > green + 30 && red > blue + 30 && brightness > 0.3) {
              // Subtle warm red/orange highlights from the image
              fillStyle = `rgba(255, 90, 40, ${Math.min(1, brightness)})`;
            } else if (blue > red + 15) {
              // Subtle cool highlights
              fillStyle = `rgba(100, 160, 210, ${Math.min(1, brightness * 0.85)})`;
            }

            const char = DENSITY_CHARS[charIndex] || " ";
            ctx.fillStyle = fillStyle;
            ctx.fillText(char, posX, posY);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      isDestroyed = true;
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [interactive]);

  return (
    <div ref={containerRef} className="absolute inset-0 overflow-hidden pointer-events-none select-none z-0">
      {/* Background canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block" />

      {/* Atmospheric vignette & radial dark gradient */}
      <div className="absolute inset-0 bg-radial from-transparent via-[#070707]/60 to-[#070707] pointer-events-none" />

      {/* Subtle scanline texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.8) 50%, rgba(0,0,0,0.8) 50%)",
          backgroundSize: "100% 4px",
        }}
      />
    </div>
  );
}
