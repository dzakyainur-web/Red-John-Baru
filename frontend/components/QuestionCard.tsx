"use client";

import React, { useEffect } from "react";

export interface QuestionCardOption {
  id: string;
  text: string;
  badge?: string; // Optional letter override (e.g. "A", "B")
  disabled?: boolean;
}

export interface QuestionCardProps {
  /** Top-left header title (defaults to "Questions") */
  headerTitle?: string;
  /** Custom icon for the top-left rounded badge */
  headerIcon?: React.ReactNode;
  /** Current step index (1-based) */
  step?: number;
  /** Total number of steps */
  totalSteps?: number;
  /** Question headline / title */
  title: string;
  /** Subtitle or context description below headline */
  description?: string;
  /** Additional custom context (e.g. simulated incoming message box) */
  contextBox?: React.ReactNode;
  /** List of choices for multiple-choice or binary question */
  options?: QuestionCardOption[];
  /** The currently selected option ID */
  selectedId?: string | null;
  /** Callback fired when an option is selected */
  onSelect?: (id: string) => void;
  /** Custom body (for free text input, debrief feedback, custom forms) */
  children?: React.ReactNode;

  /** Previous button handler */
  onPrevious?: () => void;
  canPrevious?: boolean;
  previousLabel?: string;

  /** Skip button handler */
  onSkip?: () => void;
  canSkip?: boolean;
  skipLabel?: string;

  /** Continue / Submit button handler */
  onContinue?: () => void;
  canContinue?: boolean;
  continueLabel?: string;
  /** Keyboard shortcut hints inside the Continue button (defaults to ['⌘', '↵']) */
  shortcuts?: string[];

  /** Custom footer overrides if needed */
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;

  /** Enable keyboard navigation: A/B/C/D to select, Enter/Cmd+Enter to continue */
  enableKeyboardShortcuts?: boolean;

  className?: string;
}

/**
 * QuestionCard
 * Pixel-accurate recreation of the Kobra Systems Question Card:
 * https://kobra.systems/components/question-card
 */
export default function QuestionCard({
  headerTitle = "Questions",
  headerIcon,
  step,
  totalSteps,
  title,
  description,
  contextBox,
  options,
  selectedId,
  onSelect,
  children,
  onPrevious,
  canPrevious = true,
  previousLabel = "Previous",
  onSkip,
  canSkip = true,
  skipLabel = "Skip",
  onContinue,
  canContinue = true,
  continueLabel = "Continue",
  shortcuts = ["⌘", "↵"],
  footerLeft,
  footerRight,
  enableKeyboardShortcuts = true,
  className = "",
}: QuestionCardProps) {
  // Calculate progress ratio (0 to 100)
  const progress =
    step && totalSteps && totalSteps > 0
      ? Math.min(100, Math.max(0, (step / totalSteps) * 100))
      : 0;

  // SVG Circular progress stroke calculations
  const radius = 8.5;
  const circumference = 2 * Math.PI * radius; // ~53.4
  const strokeOffset = circumference - (progress / 100) * circumference;

  // Keyboard shortcut listener
  useEffect(() => {
    if (!enableKeyboardShortcuts) return;

    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        if (e.key === "Enter" && !e.shiftKey) {
          if (canContinue && onContinue) {
            e.preventDefault();
            onContinue();
          }
        }
        return;
      }

      // 1. Enter key or Cmd+Enter / Ctrl+Enter -> Continue
      if (e.key === "Enter") {
        if (canContinue && onContinue) {
          e.preventDefault();
          onContinue();
        }
        return;
      }

      // 2. Options selection keys: A, B, C, D, E or 1, 2, 3, 4, 5
      if (options && options.length > 0 && onSelect) {
        const key = e.key.toUpperCase();
        const letterIndex = key.charCodeAt(0) - 65; // 'A' = 0, 'B' = 1, etc.
        if (letterIndex >= 0 && letterIndex < options.length) {
          e.preventDefault();
          const targetOpt = options[letterIndex];
          if (!targetOpt.disabled) {
            onSelect(targetOpt.id);
          }
          return;
        }

        // Numeric keys 1, 2, 3...
        const num = parseInt(e.key, 10);
        if (!isNaN(num) && num >= 1 && num <= options.length) {
          e.preventDefault();
          const targetOpt = options[num - 1];
          if (!targetOpt.disabled) {
            onSelect(targetOpt.id);
          }
          return;
        }
      }

      // 3. ArrowLeft / Backspace -> Previous (if enabled)
      if (e.key === "ArrowLeft" && canPrevious && onPrevious) {
        onPrevious();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    enableKeyboardShortcuts,
    options,
    onSelect,
    canContinue,
    onContinue,
    canPrevious,
    onPrevious,
  ]);

  return (
    <div
      className={`relative mx-auto w-full max-w-[580px] rounded-2xl border border-white/[0.08] bg-[#161817] p-6 font-sans shadow-2xl shadow-black/60 sm:p-7 ${className}`}
      role="region"
      aria-label={headerTitle}
    >
      {/* ─── Top Header ────────────────────────────────────────── */}
      <div className="mb-5 flex items-center justify-between">
        {/* Left: Blue icon box + Title */}
        <div className="flex items-center gap-3">
          <div
            className="flex size-8 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.06] text-white shadow-inner"
            aria-hidden="true"
          >
            {headerIcon ? (
              headerIcon
            ) : (
              /* Kobra default question-bubble icon */
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" strokeWidth="2.8" />
              </svg>
            )}
          </div>
          <span className="text-[16px] font-heading font-bold tracking-[-0.01em] text-white">
            {headerTitle}
          </span>
        </div>

        {/* Right: Circular Progress Ring Indicator */}
        <div
          className="relative flex size-6 items-center justify-center"
          title={step && totalSteps ? `${step} dari ${totalSteps}` : undefined}
          aria-label={
            step && totalSteps ? `Langkah ${step} dari ${totalSteps}` : undefined
          }
        >
          <svg
            className="size-5.5 -rotate-90 transform"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            {/* Background track circle */}
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.2"
              className="text-[#0d0e0d]"
              fill="none"
            />
            {/* Progress circle */}
            <circle
              cx="12"
              cy="12"
              r={radius}
              stroke="currentColor"
              strokeWidth="2.2"
              strokeDasharray={circumference}
              strokeDashoffset={strokeOffset}
              strokeLinecap="round"
              className="text-white transition-all duration-300 ease-out"
              fill="none"
            />
          </svg>
        </div>
      </div>

      {/* ─── Question Title & Subtitle ──────────────────────────── */}
      <div className="mb-5 space-y-1.5">
        <h2 className="font-heading text-[20px] font-bold leading-snug tracking-[-0.02em] text-white sm:text-[21px]">
          {title}
        </h2>
        {description && (
          <p className="text-[15px] leading-relaxed text-[#A0A0A0]">
            {description}
          </p>
        )}
      </div>

      {/* ─── Custom Context (e.g. simulated message) ────────────── */}
      {contextBox && <div className="mb-5">{contextBox}</div>}

      {/* ─── Options list ───────────────────────────────────────── */}
      {options && options.length > 0 && (
        <div className="mb-6 space-y-2">
          {options.map((opt, i) => {
            const letter =
              opt.badge ?? String.fromCharCode(65 + i); // 'A', 'B', 'C', 'D'
            const isSelected = selectedId === opt.id;

            return (
              <button
                key={opt.id}
                type="button"
                disabled={opt.disabled}
                onClick={() => onSelect && onSelect(opt.id)}
                className={`group flex w-full cursor-pointer items-center rounded-xl px-3.5 py-3 text-left transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40 ${
                  isSelected
                    ? "border border-white/25 bg-white/[0.06]"
                    : "border border-white/[0.06] bg-[#0d0e0d] hover:border-white/20"
                }`}
              >
                {/* Letter Key Badge */}
                <span
                  className={`mr-3.5 flex size-7 shrink-0 items-center justify-center rounded-lg text-[13px] transition-all duration-150 ${
                    isSelected
                      ? "bg-white font-bold text-black"
                      : "border border-white/10 bg-white/[0.04] font-semibold text-[#888] group-hover:border-white/30 group-hover:text-white"
                  }`}
                >
                  {letter}
                </span>

                {/* Option Text */}
                <span
                  className={`text-[15px] font-medium leading-snug transition-colors ${
                    isSelected ? "text-white" : "text-[#D4D4D4] group-hover:text-white"
                  }`}
                >
                  {opt.text}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {/* ─── Custom Body (for input, debrief, etc.) ─────────────── */}
      {children && <div className="mb-6">{children}</div>}

      {/* ─── Footer Action Bar ──────────────────────────────────── */}
      <div className="flex items-center justify-between pt-2">
        {/* Left Side: Previous button */}
        {footerLeft !== undefined ? (
          footerLeft
        ) : onPrevious ? (
          <button
            type="button"
            onClick={onPrevious}
            disabled={!canPrevious}
            className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-[#D4D4D4] transition-all hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
          >
            {previousLabel}
          </button>
        ) : (
          <div />
        )}

        {/* Right Side: Skip + Continue */}
        {footerRight !== undefined ? (
          footerRight
        ) : (
          <div className="flex items-center gap-2">
            {onSkip && (
              <button
                type="button"
                onClick={onSkip}
                disabled={!canSkip}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-[13px] font-medium text-[#D4D4D4] transition-all hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-30"
              >
                {skipLabel}
              </button>
            )}

            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                disabled={!canContinue}
                className="flex cursor-pointer items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition-all hover:bg-[#EDEDED] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
              >
                <span>{continueLabel}</span>
                {shortcuts && shortcuts.length > 0 && (
                  <span className="flex items-center gap-0.5 rounded bg-black/15 px-1.5 py-0.5 font-[family-name:var(--font-supa-mono)] text-[11px] font-bold leading-none text-black/70">
                    {shortcuts.map((sc, idx) => (
                      <span key={idx}>{sc}</span>
                    ))}
                  </span>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
