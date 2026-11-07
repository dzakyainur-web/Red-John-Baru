"use client";

import { useState } from "react";
import Link from "next/link";
import { useSound } from "./SoundManager";
import {
  RED_JOHN_ROUNDS,
  type GameChoice,
  type GameRound,
  type TextInputEvaluation,
} from "@/lib/game-scenarios";

type GameState = "intro" | "playing" | "round_feedback" | "victory" | "game_over";

export default function RedJohnGame() {
  const [gameState, setGameState] = useState<GameState>("intro");
  const [currentRoundIdx, setCurrentRoundIdx] = useState(0);
  const [hp, setHp] = useState(100);
  const [score, setScore] = useState(0);
  const [textInput, setTextInput] = useState("");
  const [showJaneClue, setShowJaneClue] = useState(false);
  const [feedbackData, setFeedbackData] = useState<{
    isSafe: boolean;
    consequence: string;
    janeIntervention: string;
    manipulationTactic: string;
    userSaid?: string;
    redJohnReaction?: string;
  } | null>(null);
  const [history, setHistory] = useState<{ round: number; safe: boolean; title: string }[]>([]);
  const { playClick, playHover, playSuccess, playAlert } = useSound();

  const currentRound: GameRound = RED_JOHN_ROUNDS[currentRoundIdx];

  const startGame = () => {
    playClick();
    setGameState("playing");
    setCurrentRoundIdx(0);
    setHp(100);
    setScore(0);
    setTextInput("");
    setShowJaneClue(false);
    setFeedbackData(null);
    setHistory([]);
  };

  const handleSelectChoice = (choice: GameChoice) => {
    if (choice.isSafe) {
      playSuccess();
      setScore((prev) => prev + 200);
      setHistory((prev) => [
        ...prev,
        { round: currentRound.roundNumber, safe: true, title: currentRound.title },
      ]);
    } else {
      playAlert();
      setHp((prev) => Math.max(0, prev - 20));
      setScore((prev) => prev + 40);
      setHistory((prev) => [
        ...prev,
        { round: currentRound.roundNumber, safe: false, title: currentRound.title },
      ]);
    }

    setFeedbackData({
      isSafe: choice.isSafe,
      consequence: choice.consequence,
      janeIntervention: choice.janeIntervention,
      manipulationTactic: choice.manipulationTactic,
    });
    setGameState("round_feedback");
  };

  const handleSubmitTextInput = (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;

    if (currentRound.evaluateInput) {
      const evaluation: TextInputEvaluation = currentRound.evaluateInput(textInput);
      if (evaluation.isSafe) {
        playSuccess();
        setScore((prev) => prev + 250);
        setHistory((prev) => [
          ...prev,
          { round: currentRound.roundNumber, safe: true, title: currentRound.title },
        ]);
      } else {
        playAlert();
        setHp((prev) => Math.max(0, prev - 25));
        setScore((prev) => prev + 30);
        setHistory((prev) => [
          ...prev,
          { round: currentRound.roundNumber, safe: false, title: currentRound.title },
        ]);
      }

      setFeedbackData({
        isSafe: evaluation.isSafe,
        consequence: evaluation.consequence,
        janeIntervention: evaluation.janeIntervention,
        manipulationTactic: evaluation.manipulationTactic,
        userSaid: evaluation.userSaid,
        redJohnReaction: evaluation.redJohnReaction,
      });
      setGameState("round_feedback");
    }
  };

  const handleNextRound = () => {
    playClick();
    setShowJaneClue(false);
    setTextInput("");

    if (currentRoundIdx + 1 < RED_JOHN_ROUNDS.length) {
      if (hp <= 0) {
        setGameState("game_over");
      } else {
        setCurrentRoundIdx((prev) => prev + 1);
        setFeedbackData(null);
        setGameState("playing");
      }
    } else {
      setGameState(hp > 0 ? "victory" : "game_over");
    }
  };

  const safeCount = history.filter((h) => h.safe).length;

  return (
    <div className="relative w-full rounded-3xl bg-[#080808] border border-white/10 overflow-hidden font-[family-name:var(--font-geist-mono)] shadow-[0_0_80px_rgba(0,0,0,0.9)]">
      {/* =========================================================================
          TOP STATUS BAR & DUAL CHARACTER MONITOR
          ========================================================================= */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 sm:p-6 border-b border-white/10 bg-[#0d0d0d]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="size-2.5 rounded-full bg-[#FF3815] animate-ping" />
            <span className="text-xs font-black tracking-widest text-white uppercase">
              DUEL INTELIJEN // <span className="text-[#FF3815]">RED JOHN</span> VS{" "}
              <span className="text-amber-400">JANE BOT</span>
            </span>
          </div>
          <span className="hidden sm:inline text-xs text-zinc-600">•</span>
          <span className="hidden sm:inline text-xs text-zinc-400">10 Babak Cerita Simulasi</span>
        </div>

        {gameState !== "intro" && (
          <div className="flex items-center gap-5 text-xs">
            {/* Round indicator */}
            <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-full border border-white/10">
              <span className="text-zinc-400">BABAK:</span>
              <span className="font-bold text-white">
                {currentRoundIdx + 1}/{RED_JOHN_ROUNDS.length}
              </span>
            </div>

            {/* Defense Integrity HP */}
            <div className="flex items-center gap-2">
              <span className="text-zinc-400">INTEGRITAS:</span>
              <div className="w-20 sm:w-28 h-2.5 rounded-full bg-white/10 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    hp > 50 ? "bg-amber-400" : hp > 25 ? "bg-amber-600" : "bg-[#FF3815]"
                  }`}
                  style={{ width: `${hp}%` }}
                />
              </div>
              <span
                className={`font-black tabular-nums ${
                  hp > 50 ? "text-amber-400" : hp > 25 ? "text-amber-500" : "text-[#FF3815]"
                }`}
              >
                {hp}%
              </span>
            </div>

            {/* Score */}
            <div className="hidden md:flex items-center gap-1.5">
              <span className="text-zinc-500">SKOR INTEL:</span>
              <span className="font-black text-amber-400">{score}</span>
            </div>
          </div>
        )}
      </div>

      {/* =========================================================================
          VIEW 1: INTRO SCREEN (STORYLINE & CHARACTER SHOWCASE)
          ========================================================================= */}
      {gameState === "intro" && (
        <div className="p-6 sm:p-12 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column: Narrative Hook & Rules */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#FF3815]/10 border border-[#FF3815]/30 text-xs font-bold text-[#FF3815]">
                <span className="size-2 rounded-full bg-[#FF3815]" />
                <span>MISI INVESTIGASI // 10 BABAK SIMULASI</span>
              </div>

              <h2 className="text-3xl sm:text-5xl font-black uppercase tracking-tight text-white font-[family-name:var(--font-display)]">
                BERLOMBA NALAR MELAWAN <span className="text-[#FF3815]">RED JOHN</span> BERSAMA{" "}
                <span className="text-amber-400">JANE BOT</span>
              </h2>

              <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                Di dunia digital, ancaman terbesar bukanlah peretasan kode rumit, melainkan{" "}
                <strong>rekayasa sosial (social engineering)</strong> yang memanfaatkan kepanikan,
                empati, dan rasa takut manusia. Dalang kejahatan ini menjuluki dirinya{" "}
                <strong className="text-[#FF3815]">Red John</strong>.
              </p>

              <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                Untuk menandinginya, kamu dibekali bot pendamping bernama{" "}
                <strong className="text-amber-400">Jane</strong> — bot AI hangat dan cerdas yang siap
                memberimu petunjuk taktis. Apabila kamu salah melangkah atau terkecoh oleh trik Red
                John, <strong>Jane akan langsung mengintervensi dengan perisai darurat</strong> dan
                mengajarimu cara membongkar jebakan tersebut.
              </p>

              {/* Character Dual Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Red John Card: Seram, Merah, Berdarah */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2a0808] to-[#120404] border-2 border-[#FF3815]/60 shadow-[0_0_30px_rgba(255,56,21,0.25)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🩸</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-950 text-red-300 border border-[#FF3815]/40">
                      ANTAGONIS SIBER
                    </span>
                  </div>
                  <div className="text-base font-black text-[#FF3815] uppercase tracking-wide">
                    RED JOHN
                  </div>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    Menakutkan, manipulatif, dan licik. Menggunakan todongan OTP, dokumen APK palsu,
                    urgensi perbankan, dan ancaman pemerasan.
                  </p>
                </div>

                {/* Jane Bot Card: Kuning Hangat, Ramah, Cerdas */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-[#2b1c05] to-[#120c02] border-2 border-amber-400/60 shadow-[0_0_30px_rgba(251,191,36,0.2)] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">🤖✨</span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-400/40">
                      BOT PENDAMPING
                    </span>
                  </div>
                  <div className="text-base font-black text-amber-400 uppercase tracking-wide">
                    JANE BOT
                  </div>
                  <p className="text-xs text-zinc-300 font-sans leading-relaxed">
                    Sahabat setiamu. Memberikan analisis psikologis, membongkar trik Red John, dan
                    menyelamatkanmu saat kamu salah memilih.
                  </p>
                </div>
              </div>

              {/* Start Button */}
              <div className="pt-4 flex items-center gap-4">
                <button
                  type="button"
                  onClick={startGame}
                  onMouseEnter={playHover}
                  className="px-8 py-4 rounded-full bg-[#FF3815] hover:bg-[#FF5533] text-black font-black text-sm tracking-wider uppercase transition-all duration-300 shadow-[0_0_40px_rgba(255,56,21,0.5)] hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-3"
                >
                  <span>MULAI PETUALANGAN INVESTIGASI</span>
                  <span className="text-lg">&rarr;</span>
                </button>
              </div>
            </div>

            {/* Right Column: 10 Storyline Chapters Overview */}
            <div className="lg:col-span-5 rounded-2xl bg-black/70 border border-white/10 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">
                  ALUR CERITA (10 BABAK)
                </span>
                <span className="text-[10px] text-zinc-500">DIVERSE INPUT MODES</span>
              </div>

              <div className="space-y-2.5 text-xs font-sans text-zinc-300 max-h-[380px] overflow-y-auto pr-1">
                <div className="flex items-start gap-2">
                  <span className="text-[#FF3815] font-mono font-bold">01.</span>
                  <span>SMS Panik Pembatalan Transaksi BCA (3 Pilihan)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold">02.</span>
                  <span>Izin Akses File Kurir JNE Palsu (Pilihan Iya / Tidak)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#FF3815] font-mono font-bold">03.</span>
                  <span>Tawaran Freelance Like Video YouTube (3 Pilihan)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold">04.</span>
                  <span>Todongan OTP Langsung oleh Red John (Input Teks Bebas!)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#FF3815] font-mono font-bold">05.</span>
                  <span>Chat Pinjam Uang dari Sahabat Karib (Pilihan Iya / Tidak)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold">06.</span>
                  <span>Phishing Hak Cipta Akun Instagram (3 Pilihan)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#FF3815] font-mono font-bold">07.</span>
                  <span>Gertakan Pemerasan Data Pribadi KTP (Input Teks Bebas!)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold">08.</span>
                  <span>Investasi Robot Trading Kripto 20%/Hari (Pilihan Iya / Tidak)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-[#FF3815] font-mono font-bold">09.</span>
                  <span>Surat Undangan Pernikahan Digital APK (3 Pilihan)</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-amber-400 font-mono font-bold">10.</span>
                  <span>Konfrontasi Terakhir: Melumpuhkan Red John (Input Perintah Final!)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 2: PLAYING ROUND (RED JOHN MANEUVER + JANE CLUE)
          ========================================================================= */}
      {gameState === "playing" && (
        <div className="p-6 sm:p-10 space-y-8">
          {/* Round Storyline Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
            <div>
              <div className="text-[11px] text-[#FF3815] font-bold uppercase tracking-widest flex items-center gap-2">
                <span>{currentRound.chapterTitle}</span>
                <span className="text-zinc-600">•</span>
                <span>{currentRound.threatType}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black uppercase text-white mt-1">
                {currentRound.title}
              </h3>
            </div>

            {/* Hint toggle button */}
            <button
              type="button"
              onClick={() => {
                playClick();
                setShowJaneClue(!showJaneClue);
              }}
              className="px-4 py-2 rounded-full bg-amber-500/10 hover:bg-amber-500/20 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.15)]"
            >
              <span>{showJaneClue ? "🙈 SEMBUNYIKAN PETUNJUK" : "💡 TANYA JANE (MINTA PETUNJUK)"}</span>
            </button>
          </div>

          {/* Story narration prelude */}
          <div className="p-4 rounded-xl bg-white/[0.03] border-l-2 border-zinc-500 text-xs text-zinc-300 font-sans italic">
            &ldquo;{currentRound.storyContext}&rdquo;
          </div>

          {/* Red John's Menacing Transmission (Seram Merah Berdarah) */}
          <div className="relative rounded-2xl bg-gradient-to-b from-[#240606] via-[#150404] to-[#0c0202] border-2 border-[#FF3815]/70 p-5 sm:p-7 shadow-[0_0_40px_rgba(255,56,21,0.25)] animate-in fade-in slide-in-from-top-2">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#FF3815]/20">
              <div className="flex items-center gap-3">
                <div className="size-11 rounded-full bg-[#FF3815] text-black font-black flex items-center justify-center text-base shadow-[0_0_20px_rgba(255,56,21,0.8)]">
                  🩸
                </div>
                <div>
                  <div className="text-xs font-black text-[#FF3815] uppercase tracking-wider flex items-center gap-2">
                    <span>RED JOHN</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 border border-[#FF3815]/40 text-red-200">
                      TRANSMISI BAHAYA
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-500">Dalang Rekayasa Sosial Siber</div>
                </div>
              </div>

              {currentRound.redJohnTaunt && (
                <div className="hidden sm:block text-[11px] text-[#FF5533] italic max-w-xs text-right font-sans">
                  &ldquo;{currentRound.redJohnTaunt}&rdquo;
                </div>
              )}
            </div>

            <div className="p-4 sm:p-5 rounded-xl bg-black/85 border border-[#FF3815]/30 font-sans text-sm sm:text-base text-zinc-100 leading-relaxed whitespace-pre-line select-text">
              {currentRound.redJohnMessage}
            </div>
          </div>

          {/* Jane's Yellow Tactical Clue Whisper (Kuning Hangat) */}
          {showJaneClue && (
            <div className="flex items-start gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#2b1c05] to-[#160f03] border-2 border-amber-400/50 text-xs text-amber-200 shadow-[0_0_30px_rgba(251,191,36,0.15)] animate-in fade-in duration-300">
              <span className="text-2xl">🤖✨</span>
              <div className="space-y-1">
                <div className="font-bold text-amber-400 uppercase tracking-wider text-xs">
                  PETUNJUK ANALISIS TAKTIS DARI JANE BOT:
                </div>
                <p className="font-sans leading-relaxed text-amber-100">{currentRound.janeClue}</p>
              </div>
            </div>
          )}

          {/* =========================================================================
              INTERACTION MODE 1: MULTIPLE CHOICE (3 PILIHAN)
              ========================================================================= */}
          {currentRound.kind === "multiple_choice" && currentRound.choices && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>APA KEPUTUSAN YANG AKAN KAMU AMBIL?</span>
                <span className="text-zinc-600">PILIH SATU RESPON</span>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {currentRound.choices.map((choice) => (
                  <button
                    key={choice.id}
                    type="button"
                    onClick={() => handleSelectChoice(choice)}
                    onMouseEnter={playHover}
                    className="group relative flex items-start gap-4 p-4 sm:p-5 rounded-xl bg-[#121212] hover:bg-[#1c1c1c] border border-white/10 hover:border-amber-400/60 text-left transition-all duration-200 cursor-pointer shadow-sm"
                  >
                    <span className="size-8 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-zinc-400 group-hover:text-black group-hover:bg-amber-400 group-hover:border-amber-400 flex items-center justify-center shrink-0 transition-colors uppercase font-mono">
                      {choice.id}
                    </span>
                    <p className="text-xs sm:text-sm text-zinc-200 group-hover:text-white leading-relaxed font-sans pt-0.5">
                      {choice.text}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* =========================================================================
              INTERACTION MODE 2: BINARY CHOICE ("IYA" vs "TIDAK")
              ========================================================================= */}
          {currentRound.kind === "binary" && currentRound.choices && (
            <div className="space-y-4">
              <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider text-center">
                AMBIL KEPUTUSAN SEKARANG: &ldquo;IYA&rdquo; ATAU &ldquo;TIDAK&rdquo;?
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {currentRound.choices.map((choice) => {
                  const isIya = choice.id.toLowerCase() === "iya";
                  return (
                    <button
                      key={choice.id}
                      type="button"
                      onClick={() => handleSelectChoice(choice)}
                      onMouseEnter={playHover}
                      className={`group p-6 rounded-2xl border-2 text-left transition-all duration-300 cursor-pointer ${
                        isIya
                          ? "bg-[#180808] hover:bg-[#250a0a] border-[#FF3815]/40 hover:border-[#FF3815] hover:shadow-[0_0_30px_rgba(255,56,21,0.3)]"
                          : "bg-[#0b1a0e] hover:bg-[#102414] border-emerald-500/40 hover:border-emerald-400 hover:shadow-[0_0_30px_rgba(16,185,129,0.3)]"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span
                          className={`text-2xl font-black uppercase tracking-wider font-[family-name:var(--font-display)] ${
                            isIya ? "text-[#FF3815]" : "text-emerald-400"
                          }`}
                        >
                          {isIya ? "⚠️ IYA" : "🛡️ TIDAK"}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase">
                          RESPON CEPAT
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
                        {choice.text}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* =========================================================================
              INTERACTION MODE 3: FREE TEXT INPUT (LOGIKA RESPON SESUAI APA YANG DIKETIK)
              ========================================================================= */}
          {currentRound.kind === "text_input" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-wider">
                <span>{currentRound.inputPrompt || "KETIK BALASANMU KE RED JOHN:"}</span>
                <span className="text-amber-400">INPUT CERDAS AKTIF</span>
              </div>

              <form onSubmit={handleSubmitTextInput} className="space-y-3">
                <div className="relative">
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={currentRound.inputPlaceholder}
                    className="w-full rounded-2xl bg-black/90 border-2 border-white/20 focus:border-amber-400 p-4 sm:p-5 font-mono text-sm sm:text-base text-zinc-100 placeholder:text-zinc-600 focus:outline-none transition-all shadow-inner"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={!textInput.trim()}
                      className="px-6 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-30 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_20px_rgba(251,191,36,0.4)]"
                    >
                      KIRIM RESPON &rarr;
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between text-[11px] text-zinc-500 font-sans px-1">
                  <span>
                    💡 <em>Coba ketik penolakan seperti: &ldquo;gamau&rdquo;, &ldquo;tidak&rdquo;, atau &ldquo;kamu penipu&rdquo;!</em>
                  </span>
                  <span>{textInput.length} karakter</span>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          VIEW 3: ROUND FEEDBACK (JANE'S INTERVENTION & STORY CONSEQUENCE)
          ========================================================================= */}
      {gameState === "round_feedback" && feedbackData && (
        <div className="p-6 sm:p-10 space-y-6">
          {/* Header result banner */}
          <div
            className={`p-5 sm:p-6 rounded-2xl border-2 flex flex-wrap items-center justify-between gap-4 ${
              feedbackData.isSafe
                ? "bg-gradient-to-r from-[#122814] to-[#0a180b] border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.2)]"
                : "bg-gradient-to-r from-[#2e0909] to-[#180404] border-[#FF3815] shadow-[0_0_40px_rgba(255,56,21,0.25)]"
            }`}
          >
            <div className="flex items-center gap-4">
              <span className="text-4xl">{feedbackData.isSafe ? "🛡️" : "⚠️"}</span>
              <div>
                <div
                  className={`text-xs font-black uppercase tracking-wider ${
                    feedbackData.isSafe ? "text-emerald-400" : "text-[#FF3815]"
                  }`}
                >
                  {feedbackData.isSafe
                    ? "KEPUTUSAN AMAN // SERANGAN RED JOHN DIPATAHKAN"
                    : "PERISAI DARURAT DIAKTIFKAN // JANE MENYELAMATKANMU"}
                </div>
                <div className="text-sm sm:text-base font-black text-white mt-0.5">
                  {feedbackData.isSafe ? "+200 / +250 POIN INTELIJEN" : "-20% / -25% INTEGRITAS"}
                </div>
              </div>
            </div>

            <div className="text-xs text-zinc-400 bg-black/50 px-3 py-1.5 rounded-lg border border-white/10">
              Taktik: <span className="text-white font-bold">{feedbackData.manipulationTactic}</span>
            </div>
          </div>

          {/* User input reflection & Red John's immediate reaction (if text input mode) */}
          {feedbackData.userSaid && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-black/60 border border-white/10 text-xs">
                <span className="text-zinc-500 uppercase tracking-widest text-[10px] block mb-1">
                  YANG KAMU KETIK:
                </span>
                <p className="font-mono text-white text-sm bg-white/5 p-2 rounded border border-white/5">
                  &ldquo;{feedbackData.userSaid}&rdquo;
                </p>
              </div>

              {feedbackData.redJohnReaction && (
                <div className="p-4 rounded-xl bg-red-950/20 border border-[#FF3815]/30 text-xs">
                  <span className="text-[#FF5533] uppercase tracking-widest text-[10px] block mb-1">
                    REAKSI GERAM RED JOHN:
                  </span>
                  <p className="font-sans text-red-200 text-sm italic">
                    &ldquo;{feedbackData.redJohnReaction}&rdquo;
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Story consequence */}
          <div className="p-4 sm:p-5 rounded-2xl bg-black/70 border border-white/10 space-y-1 text-xs sm:text-sm text-zinc-300">
            <span className="text-zinc-500 uppercase tracking-widest text-[10px] block">
              KONSEKUENSI ALUR CERITA:
            </span>
            <p className="font-sans leading-relaxed">{feedbackData.consequence}</p>
          </div>

          {/* Jane Bot's Yellow Shield Psychological Intervention Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#2a1b05] via-[#1a1103] to-[#0c0802] border-2 border-amber-400/60 shadow-[0_0_35px_rgba(251,191,36,0.2)] space-y-4">
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-full bg-amber-400 text-black font-black flex items-center justify-center text-sm shadow-[0_0_20px_rgba(251,191,36,0.8)]">
                JN
              </div>
              <div>
                <div className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-2">
                  <span>JANE BOT // ANALISIS &amp; PEMBELAJARAN</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-400/40">
                    PENDAMPING RESMI
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400">
                  {feedbackData.isSafe
                    ? "Validasi Pertahanan Mandiri"
                    : "Intervensi Perlindungan & Pembongkaran Trik"}
                </div>
              </div>
            </div>

            <p className="font-sans text-sm sm:text-base text-amber-100 leading-relaxed border-l-2 border-amber-400/60 pl-4 py-1">
              &ldquo;{feedbackData.janeIntervention}&rdquo;
            </p>

            {/* Practical takeaway */}
            <div className="pt-3 border-t border-amber-400/20 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1">
                <span className="text-[#FF5533] font-bold block uppercase tracking-wider text-[10px]">
                  📌 TRIK UTAMA RED JOHN:
                </span>
                <p className="text-zinc-300 font-sans">{currentRound.debrief.redJohnTactic}</p>
              </div>

              <div className="space-y-1">
                <span className="text-amber-400 font-bold block uppercase tracking-wider text-[10px]">
                  ✅ LANGKAH AMAN DI DUNIA NYATA:
                </span>
                <p className="text-zinc-300 font-sans">{currentRound.debrief.safeAction}</p>
              </div>
            </div>
          </div>

          {/* Next Button */}
          <div className="pt-2 flex justify-end">
            <button
              type="button"
              onClick={handleNextRound}
              onMouseEnter={playHover}
              className="px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-black text-xs tracking-wider uppercase transition-all duration-200 flex items-center gap-2 cursor-pointer shadow-[0_0_25px_rgba(251,191,36,0.4)] hover:scale-105"
            >
              <span>
                {currentRoundIdx + 1 < RED_JOHN_ROUNDS.length
                  ? "SAYA PAHAM, LANJUT KE BABAK BERIKUTNYA"
                  : "LIHAT EVALUASI INVESTIGASI AKHIR"}
              </span>
              <span className="text-base">&rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 4: VICTORY / MULTIPLE ENGAGING ENDINGS
          ========================================================================= */}
      {gameState === "victory" && (
        <div className="p-6 sm:p-12 space-y-8 text-center max-w-3xl mx-auto">
          {/* Ending Badge based on score & safety */}
          <div className="size-24 rounded-full bg-amber-400/20 border-2 border-amber-400 text-amber-400 text-5xl flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(251,191,36,0.4)] animate-bounce">
            {safeCount >= 8 ? "🏆" : "🛡️"}
          </div>

          <div className="space-y-2">
            <div className="text-xs font-black text-amber-400 tracking-widest uppercase">
              {safeCount >= 8
                ? "ENDING UTAMA // MASTER INVESTIGATOR SIBER"
                : "ENDING BERTAHAN // SURVIVOR TAKTIS"}
            </div>
            <h2 className="text-3xl sm:text-5xl font-black uppercase text-white font-[family-name:var(--font-display)]">
              {safeCount >= 8
                ? "RED JOHN RESMI DIRINGKUS & DILUMPUHKAN!"
                : "KAMU BERHASIL LOLOS DARI CENGKERAMAN RED JOHN!"}
            </h2>
            <p className="text-sm text-zinc-300 font-sans max-w-xl mx-auto leading-relaxed">
              {safeCount >= 8
                ? "Hebat sekali! Berkat ketajaman logikamu dan bimbingan Jane Bot, koordinat server rahasia Red John berhasil dilacak dan diserahkan ke Patroli Siber Mabes Polri. Kamu membongkar semua trik psikologisnya!"
                : "Kamu berhasil bertahan melewati 10 babak penuh ancaman berkat perisai darurat Jane Bot. Seluruh taktik Red John kini tersingkap dan tidak akan pernah bisa mengecohmu lagi."}
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-black/80 border border-white/10 text-left">
            <div>
              <div className="text-zinc-500 text-[11px] uppercase">KEPUTUSAN TEPAT</div>
              <div className="text-2xl font-black text-white mt-1">
                {safeCount} / {RED_JOHN_ROUNDS.length} BABAK
              </div>
            </div>
            <div>
              <div className="text-zinc-500 text-[11px] uppercase">INTEGRITAS DATA SISA</div>
              <div className="text-2xl font-black text-amber-400 mt-1">{hp}%</div>
            </div>
            <div>
              <div className="text-zinc-500 text-[11px] uppercase">TOTAL SKOR INTELIJEN</div>
              <div className="text-2xl font-black text-[#FF3815] mt-1">{score}</div>
            </div>
          </div>

          {/* Jane's Heartfelt Congratulation Message */}
          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#2b1c05] to-[#160f03] border-2 border-amber-400/50 text-left space-y-2">
            <div className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
              <span>🤖 PESAN AKHIR DARI JANE BOT:</span>
            </div>
            <p className="text-xs sm:text-sm text-amber-100 font-sans leading-relaxed">
              &ldquo;Terima kasih sudah berjuang bersamaku! Hari ini kamu membuktikan bahwa teknologi
              tercanggih untuk melawan kejahatan siber bukanlah antivirus mahal, melainkan{" "}
              <strong>ketenangan pikiran, ketelitian memverifikasi data, dan keberanian berkata
              'TIDAK'</strong>. Tetap waspada di dunia maya!&rdquo;
            </p>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={startGame}
              onMouseEnter={playHover}
              className="px-8 py-3.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_30px_rgba(251,191,36,0.4)]"
            >
              MAIN ULANG DARI BABAK I
            </button>
            <Link
              href="/pemindai"
              className="px-8 py-3.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-wider transition-all duration-200"
            >
              UJI PESAN NYATA DI PEMINDAI &rarr;
            </Link>
          </div>
        </div>
      )}

      {/* =========================================================================
          VIEW 5: GAME OVER / DATA BREACH ENDING
          ========================================================================= */}
      {gameState === "game_over" && (
        <div className="p-6 sm:p-12 space-y-8 text-center max-w-2xl mx-auto">
          <div className="size-24 rounded-full bg-red-950/40 border-2 border-[#FF3815] text-[#FF3815] text-5xl flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(255,56,21,0.5)]">
            ⚠️
          </div>

          <div className="space-y-2">
            <div className="text-xs font-black text-[#FF3815] tracking-widest uppercase">
              ENDING ALTERNATIF // PERTAHANAN JEBOL
            </div>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white font-[family-name:var(--font-display)]">
              RED JOHN BERHASIL MEMPERMAINKANMU
            </h2>
            <p className="text-sm text-zinc-300 font-sans">
              Integritas datamu terkuras habis karena beberapa kali terperdaya oleh jebakan urgensi dan
              dokumen palsu. Namun di simulator ini, tidak ada kerugian nyata!
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-gradient-to-r from-[#2b1c05] to-[#120c02] border-2 border-amber-400/40 text-left space-y-2">
            <div className="text-xs font-bold text-amber-400 uppercase">
              🤖 EVALUASI DARI JANE BOT:
            </div>
            <p className="text-xs sm:text-sm text-amber-100 font-sans leading-relaxed">
              &ldquo;Jangan menyerah! Penipu profesional seperti Red John memang dilatih untuk
              mencari celah kelengahan sesaat. Jadikan kekalahan ini sebagai bekal berharga. Ayo coba
              lagi, Jane akan memandumu dari awal sampai kamu menang!&rdquo;
            </p>
          </div>

          <div className="pt-4 flex items-center justify-center gap-4">
            <button
              type="button"
              onClick={startGame}
              onMouseEnter={playHover}
              className="px-9 py-4 rounded-full bg-[#FF3815] hover:bg-[#FF5533] text-black font-black text-xs uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-[0_0_30px_rgba(255,56,21,0.4)] hover:scale-105"
            >
              COBA LATIHAN LAGI BERSAMA JANE &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
