"use client";

import { useEffect, useRef, useState } from "react";

interface AsciiEmblemCanvasProps {
  interactive?: boolean;
}

// Character density palette inspired by matrix terminals
const DENSITY_CHARS = " .:-=+*#%@EROSNH";

export default function AsciiEmblemCanvas({ interactive = true }: AsciiEmblemCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [, setLoaded] = useState(false);

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
    img.src = "/red-john-logo.png";

    const offscreen = document.createElement("canvas");
    const offCtx = offscreen.getContext("2d", { willReadFrequently: true });

    const mouse = { x: -1000, y: -1000, targetX: -1000, targetY: -1000, active: false };

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
      setLoaded(true);
    };

    let tick = 0;

    const render = () => {
      if (isDestroyed) return;
      tick++;

      // Smooth mouse follow
      mouse.x += (mouse.targetX - mouse.x) * 0.12;
      mouse.y += (mouse.targetY - mouse.y) * 0.12;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (img.complete && img.naturalWidth > 0 && offCtx && cols > 0 && rows > 0) {
        // Fit logo into the grid, preserving aspect ratio and centering it
        offCtx.clearRect(0, 0, cols, rows);
        const scale = Math.min(cols / img.naturalWidth, rows / img.naturalHeight) * 0.8;
        const drawW = img.naturalWidth * scale;
        const drawH = img.naturalHeight * scale;
        offCtx.drawImage(img, (cols - drawW) / 2, (rows - drawH) / 2, drawW, drawH);
        const imgData = offCtx.getImageData(0, 0, cols, rows);
        const data = imgData.data;

        ctx.font = `${cellH - 2}px monospace`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";

        for (let r = 0; r < rows; r++) {
          for (let c = 0; c < cols; c++) {
            const idx = (r * cols + c) * 4;
            const red = data[idx];
            const green = data[idx + 1];
            const blue = data[idx + 2];
            const alpha = data[idx + 3];

            if (alpha < 10) continue;

            const brightness = (red * 0.299 + green * 0.587 + blue * 0.114) / 255;
            if (brightness < 0.05) continue;

            const posX = c * cellW;
            const posY = r * cellH;

            // Distance to mouse for interactive spotlight
            const dx = posX - mouse.x;
            const dy = posY - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const mouseHoverRadius = 150;

            let charIndex = Math.floor(brightness * (DENSITY_CHARS.length - 1));
            // Subtle ambient opacity so text on top remains crystal clear
            let fillStyle = `rgba(160, 175, 200, ${Math.min(0.25, brightness * 0.24)})`;

            // Mouse proximity highlight (Electric Cyan & Violet aura ala Unkey)
            if (interactive && dist < mouseHoverRadius) {
              const proximity = 1 - dist / mouseHoverRadius;
              if (Math.random() < 0.15) {
                charIndex = Math.floor(Math.random() * DENSITY_CHARS.length);
              }

              // Subtle glowing cyan-blue spotlight around cursor
              const rCol = Math.round(56 + 120 * proximity);
              const gCol = Math.round(189 + 60 * proximity);
              const bCol = Math.round(248 + 7 * proximity);
              const op = Math.min(0.75, brightness * 0.25 + proximity * 0.5);
              fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${op})`;
            } else if (red > green + 20 && brightness > 0.3) {
              // Brand red ink
              fillStyle = `rgba(255, 56, 21, ${Math.min(0.45, brightness * 0.5)})`;
            } else if (blue > red + 10) {
              // Subtle sky-cyan highlights
              fillStyle = `rgba(56, 189, 248, ${Math.min(0.25, brightness * 0.25)})`;
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
    <div ref={containerRef} className="absolute inset-0 size-full overflow-hidden pointer-events-none select-none">
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  );
}
