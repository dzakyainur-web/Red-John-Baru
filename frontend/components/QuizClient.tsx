"use client";

// Kuis Kriminal Otomatis — Redesigned with Kobra Systems Question Card & Resident Difficulty Slider

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { listQuizQuestions, submitQuizAnswer, type GameRound } from "@/lib/quiz";
import { useSound } from "./SoundManager";
import QuestionCard from "./QuestionCard";
import ResidentSlider from "./ResidentSlider";

type Phase = "intro" | "ask" | "feedback" | "result";

type Answer = {
  roundId: string;
  title: string;
  tactic: string;
  correct: boolean;
  picked: string;
  consequence?: string;
  intervention?: string;
  pointsEarned?: number;
};


export interface DifficultyInfo {
  level: number;
  tierName: string;
  label: string;
  badgeClass: string;
  textClass: string;
  dotColor: string;
  timeLimit: number | null; // in seconds, null = unlimited
  multiplier: number;
  janeClueMode: "always" | "collapsible" | "locked" | "blocked";
  description: string;
  residentActivity: string;
}

export function getDifficultyInfo(level: number): DifficultyInfo {
  const v = Math.min(100, Math.max(1, Math.round(level)));
  if (v <= 25) {
    return {
      level: v,
      tierName: "Santai (Kadet)",
      label: "Mode Santai",
      badgeClass: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
      textClass: "text-emerald-400",
      dotColor: "bg-emerald-400",
      timeLimit: null,
      multiplier: 1.0,
      janeClueMode: "always",
      description:
        "Waktu berpikir santai tanpa batas. Petunjuk forensik Patrick Jane otomatis terbuka untuk memandu investigasimu.",
      residentActivity:
        v <= 12
          ? "Penghuni kamar sedang tidur lelap di bawah selimut hangat."
          : "Penghuni kamar duduk santai membaca buku dengan headphone.",
    };
  }
  if (v <= 50) {
    return {
      level: v,
      tierName: "Standar (Penyelidik)",
      label: "Mode Standar",
      badgeClass: "border-sky-500/30 bg-sky-500/10 text-sky-400",
      textClass: "text-sky-400",
      dotColor: "bg-sky-400",
      timeLimit: 45,
      multiplier: 1.5,
      janeClueMode: "collapsible",
      description:
        "Batas waktu 45 detik per kasus. Petunjuk Patrick Jane dapat dibuka saat kamu butuh konfirmasi tambahan.",
      residentActivity:
        "Penghuni kamar mendengarkan musik sambil mengetuk kaki mengikuti irama.",
    };
  }
  if (v <= 75) {
    return {
      level: v,
      tierName: "Menantang (Detektif Elit)",
      label: "Mode Menantang",
      badgeClass: "border-amber-500/30 bg-amber-500/10 text-amber-400",
      textClass: "text-amber-400",
      dotColor: "bg-amber-400",
      timeLimit: 25,
      multiplier: 2.2,
      janeClueMode: "locked",
      description:
        "Batas waktu ketat 25 detik! Red John melancarkan taktik intimidasi aktif. Petunjuk Jane terkunci dengan penalti -15 poin jika dibuka.",
      residentActivity:
        "Penghuni kamar berdiri berdansa di atas karpet dan lampu disko mulai menyala.",
    };
  }
  return {
    level: v,
    tierName: "Ekstrem (Red John Menggila)",
    label: "Mode Ekstrem",
    badgeClass: "border-red-500/40 bg-red-500/15 text-red-400",
    textClass: "text-red-400",
    dotColor: "bg-red-400",
    timeLimit: 15,
    multiplier: 3.5,
    janeClueMode: "blocked",
    description:
      "Batas waktu kilat 15 detik! Sinyal Patrick Jane diblokir total oleh Red John. Kamar berguncang dan manipulasi psikologis maksimal!",
    residentActivity:
      "Pesta liar! Kamar berguncang keras, speaker memompa kencang, dan tetangga menggedor dinding!",
  };
}

function verdict(correct: number, difficultyLevel: number, total: number) {
  const isHighDiff = difficultyLevel >= 76;
  if (correct === total) {
    return {
      label: isHighDiff
        ? "Legenda Forensik — Penakluk Red John Tingkat Dewa"
        : "Sempurna — Agen Forensik Senior",
      note: isHighDiff
        ? `Luar biasa! Di tingkat kesulitan ekstrem (${difficultyLevel}/100), seluruh ${total} skenario manipulasi psikologis berhasil kamu patahkan tanpa cela.`
        : `Luar biasa! Seluruh ${total} skenario manipulasi psikologis dan rekayasa sosial berhasil kamu tangkal tanpa celah.`,
      color: "text-white",
      badge: "border-white/20 bg-white/[0.06] text-white",
    };
  }
  if (correct >= 8) {
    return {
      label: isHighDiff
        ? "Penyelidik Elit Siber — Refleks Kilat"
        : "Nyaris Sempurna — Kewaspadaan Tinggi",
      note: "Refleks keamananmu sangat tajam. Hanya sedikit modus canggih yang sempat mengecoh. Pelajari trik yang terlewat.",
      color: "text-white",
      badge: "border-white/20 bg-white/[0.06] text-white",
    };
  }
  if (correct >= 5) {
    return {
      label: "Cukup Waspada — Perlu Penguatan",
      note: "Setengah modus berhasil kamu hindari, namun beberapa jebakan darurat dan malware masih berhasil masuk ke celah kelengahan.",
      color: "text-amber-400",
      badge: "border-amber-400/30 bg-amber-400/10 text-amber-300",
    };
  }
  return {
    label: "Perlu Latihan — Rentan Eksploitasi",
    note: "Mayoritas skenario berhasil memperdayamu. Ini adalah sinyal penting untuk memperkuat pemahaman sebelum menghadapi serangan di dunia nyata.",
    color: "text-red-400",
    badge: "border-red-500/30 bg-red-500/10 text-red-400",
  };
}

/** Fisher-Yates: n soal acak tanpa pengulangan. */
function pickRounds(pool: GameRound[], n: number): GameRound[] {
  const out = [...pool];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out.slice(0, n);
}

export default function QuizClient() {
  const ROUNDS_PER_GAME = 10;
  const [allRounds, setAllRounds] = useState<GameRound[]>([]);
  const [rounds, setRounds] = useState<GameRound[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);
  const TOTAL = rounds.length;
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    listQuizQuestions().then((data) => {
      if (!cancelled) { setAllRounds(data); setLoadError(null); }
    }).catch((error: Error) => {
      if (!cancelled) { setLoadError(error.message); setAllRounds([]); }
    }).finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [reloadKey]);
  const [phase, setPhase] = useState<Phase>("intro");
  const [index, setIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<number>(72);
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [pickedText, setPickedText] = useState<string>("");
  const [pickedSafe, setPickedSafe] = useState(false);
  const [lastDebrief, setLastDebrief] = useState<{
    consequence?: string;
    intervention?: string;
    pointsEarned?: number;
  }>({});
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [showJaneClue, setShowJaneClue] = useState<boolean>(false);
  const [cluePenaltyRounds, setCluePenaltyRounds] = useState<string[]>([]);
  const { playClick, playSuccess, playAlert } = useSound();

  const diffInfo = useMemo(() => getDifficultyInfo(difficulty), [difficulty]);
  const round: GameRound = rounds[index];

  const correctCount = useMemo(
    () => answers.filter((a) => a.correct).length,
    [answers]
  );

  const totalScore = useMemo(
    () => answers.reduce((sum, a) => sum + (a.pointsEarned ?? 0), 0),
    [answers]
  );

  const maxPossibleScore = useMemo(
    () => Math.round(TOTAL * 100 * diffInfo.multiplier),
    [TOTAL, diffInfo.multiplier]
  );

  const handleTimeout = useCallback(() => {
    if (!round) return;
    playAlert();
    const timeoutText = "[Waktu Habis — Terlalu Lama Ragu]";
    setPickedText(timeoutText);
    setPickedSafe(false);
    setLastDebrief({
      consequence:
        "Waktu berpikirmu habis! Di dunia nyata, penipu memanfaatkan kepanikan dan keraguan korban untuk segera mengeksekusi aksi penipuan.",
      intervention:
        "Kecepatan dan ketelitian adalah kunci menangkal rekayasa sosial. Red John memanfaatkan jeda waktumu untuk melancarkan serangan.",
      pointsEarned: 0,
    });

    setAnswers((prev) => [
      ...prev.filter((a) => a.roundId !== round.id),
      {
        roundId: round.id,
        title: round.title,
        tactic: round.debrief.red_john_tactic,
        correct: false,
        picked: timeoutText,
        consequence: "Waktu berpikir habis sebelum keputusan diambil.",
        intervention: "Latih refleks cepat mengenali bendera merah (red flags).",
        pointsEarned: 0,
      },
    ]);
    setPhase("feedback");
  }, [playAlert, round]);

  // Timer countdown hook during 'ask' phase
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (phase !== "ask" || diffInfo.timeLimit === null) {
      setTimeLeft(null);
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(diffInfo.timeLimit);
    setShowJaneClue(diffInfo.janeClueMode === "always");

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, index, diffInfo.timeLimit, diffInfo.janeClueMode, handleTimeout]);

  // Tingkat kesulitan hanya mengatur timer/skor; soal diacak lintas bab (Dasar–Lanjutan).
  const planned = Math.min(ROUNDS_PER_GAME, allRounds.length);

  function start() {
    playClick();
    setRounds(pickRounds(allRounds, ROUNDS_PER_GAME));
    setPhase("ask");
    setIndex(0);
    setSelectedChoiceId(null);
    setInput("");
    setAnswers([]);
    setCluePenaltyRounds([]);
    setShowJaneClue(diffInfo.janeClueMode === "always");
  }

  function handleSelectChoice(choiceId: string) {
    playClick();
    setSelectedChoiceId(choiceId);
  }

  function calculateRoundPoints(isSafe: boolean, roundId: string): number {
    if (!isSafe) return 0;
    const basePoints = Math.round(100 * diffInfo.multiplier);
    const hasPenalty = cluePenaltyRounds.includes(roundId);
    return Math.max(0, basePoints - (hasPenalty ? 15 : 0));
  }

  async function handleContinueFromAsk() {
    if (timerRef.current) clearInterval(timerRef.current);
    if (submitting || !round) return;
    setLoadError(null);
    const text = input.trim();
    if (round.kind === "text_input" ? !text : !selectedChoiceId) return;
    setSubmitting(true);
    try {
      const evaluation = await submitQuizAnswer(round.id,
        round.kind === "text_input" ? { text } : { choice_id: selectedChoiceId! });
      if (evaluation.is_safe) playSuccess(); else playAlert();
      const points = calculateRoundPoints(evaluation.is_safe, round.id);
      setPickedText(evaluation.user_said);
      setPickedSafe(evaluation.is_safe);
      setLastDebrief({ consequence: evaluation.consequence,
        intervention: evaluation.jane_intervention, pointsEarned: points });
      setAnswers((prev) => [...prev.filter((a) => a.roundId !== round.id), {
        roundId: round.id, title: round.title, tactic: round.debrief.red_john_tactic,
        correct: evaluation.is_safe, picked: evaluation.user_said,
        consequence: evaluation.consequence, intervention: evaluation.jane_intervention,
        pointsEarned: points,
      }]);
      setPhase("feedback");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Jawaban gagal dinilai.");
    } finally { setSubmitting(false); }
  }

  function handleSkip() {
    if (timerRef.current) clearInterval(timerRef.current);
    playClick();
    const skippedText = "[Dilewati tanpa jawaban]";
    setPickedText(skippedText);
    setPickedSafe(false);
    setLastDebrief({
      consequence: "Kamu melewatkan kasus ini tanpa mengambil keputusan tegas.",
      intervention:
        "Dalam investigasi siber nyata, keraguan atau penundaan bisa dimanfaatkan penipu untuk mengeksekusi aksi lanjutan.",
      pointsEarned: 0,
    });

    setAnswers((prev) => [
      ...prev.filter((a) => a.roundId !== round.id),
      {
        roundId: round.id,
        title: round.title,
        tactic: round.debrief.red_john_tactic,
        correct: false,
        picked: skippedText,
        pointsEarned: 0,
      },
    ]);
    setPhase("feedback");
  }

  function handlePrevious() {
    playClick();
    if (phase === "feedback") {
      setPhase("ask");
      return;
    }

    if (index > 0) {
      setIndex((i) => i - 1);
      setSelectedChoiceId(null);
      setInput("");
      setPhase("ask");
    }
  }

  function nextRound() {
    playClick();
    setSelectedChoiceId(null);
    setInput("");
    if (index + 1 >= TOTAL) {
      setPhase("result");
      return;
    }
    setIndex((i) => i + 1);
    setPhase("ask");
  }

  function handleUnlockClue() {
    playClick();
    setShowJaneClue(true);
    if (diffInfo.janeClueMode === "locked" && !cluePenaltyRounds.includes(round.id)) {
      setCluePenaltyRounds((prev) => [...prev, round.id]);
    }
  }

  const cardOptions = useMemo(() => {
    if (!round?.choices) return undefined;
    return round.choices.map((c, i) => ({
      id: c.id,
      text: c.text,
      badge: String.fromCharCode(65 + i),
    }));
  }, [round]);

  const canContinueAsk =
    round?.kind === "text_input"
      ? input.trim().length > 0
      : Boolean(selectedChoiceId);

  return (
    <div className="relative flex min-h-[calc(100vh-16rem)] w-full items-center justify-center bg-[#0c0d0d] px-3 py-6 font-sans sm:px-4 sm:py-10">
      {/* Ambient background glow */}
      <div
        className="pointer-events-none absolute -top-10 left-1/2 h-[420px] w-[500px] -translate-x-1/2 rounded-full bg-white/[0.03] blur-[90px]"
        aria-hidden="true"
      />

      {/* ─── 1. INTRO PHASE ────────────────────────────────────── */}
      {phase === "intro" && (
        <QuestionCard
          className="max-w-[640px]"
          headerTitle="Simulasi Investigasi"
          step={0}
          totalSteps={planned}
          title={`Kuis Kriminal Otomatis · ${planned} soal`}
          description="Uji naluri detektifmu menghadapi simulasi serangan rekayasa sosial, malware APK, quishing, dan pemerasan digital asli Indonesia."
          canPrevious={false}
          onContinue={allRounds.length > 0 ? start : undefined}
          canContinue={allRounds.length > 0 && !submitting && !loading}
          continueLabel={loading ? "Memuat soal…" : `Mulai Kuis (Lvl ${difficulty})`}
          shortcuts={["↵"]}
        >
          <div className="space-y-4">
            {loadError && <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{loadError} <button onClick={() => setReloadKey((v) => v + 1)} className="underline">Coba lagi</button></p>}
            {/* TODO(logika): ambil 10 soal harian hasil AI dari berita penipuan terbaru
                (digenerate lewat tombol di /admin). Saat ini tombolnya belum terhubung. */}
            <Link
              href="/quiz/berita-hari-ini"
              className="group flex w-full items-center justify-between gap-3 rounded-2xl border border-amber-400/20 bg-gradient-to-r from-amber-500/[0.08] to-transparent px-4 py-3 text-left transition-all hover:border-amber-400/40 hover:from-amber-500/[0.14] active:scale-[0.99]"
            >
              <span className="min-w-0">
                <span className="block text-[13px] font-semibold text-amber-200">
                  Soal Berita Penipuan Hari Ini
                </span>
                <span className="mt-0.5 block truncate text-[12px] text-[#8a8a8a]">
                  10 soal baru dari berita penipuan terbaru, disusun oleh AI
                </span>
              </span>
              <span className="shrink-0 rounded-lg bg-amber-400 px-3 py-1.5 text-[12px] font-bold text-black transition-colors group-hover:bg-amber-300">
                Kerjakan →
              </span>
            </Link>
            {!loadError && allRounds.length === 0 && <p className="text-sm text-white/60">{loading ? "Memuat soal…" : "Belum ada soal aktif. Tambahkan melalui halaman admin."}</p>}
            {/* ─── Difficulty Slider Resident Card ─── */}
            <div className="rounded-2xl border border-white/[0.08] bg-[#0d0e0d] p-4 sm:p-5 shadow-inner">
              {/* Slider Header */}
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-[#777]">
                    <span className="size-1.5 rounded-full bg-white" />
                    Tingkat Kesulitan Soal
                  </div>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-bold tracking-tight text-white tabular-nums sm:text-3xl">
                      Level {difficulty}
                    </span>
                    <span className="text-[13px] text-[#666]">/ 100</span>
                  </div>
                </div>

                {/* Tier Badge */}
                <div
                  className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold transition-all ${diffInfo.badgeClass}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${diffInfo.dotColor} animate-pulse`}
                  />
                  <span>{diffInfo.tierName}</span>
                  <span className="opacity-60">·</span>
                  <span>{diffInfo.multiplier}x Poin</span>
                </div>
              </div>

              {/* Pixel Art Apartment Slider Container */}
              <div className="my-2 overflow-hidden rounded-2xl border border-white/10 bg-black/40 p-2 shadow-2xl backdrop-blur-sm sm:p-3">
                <ResidentSlider
                  value={difficulty}
                  onChange={setDifficulty}
                  min={1}
                  max={100}
                />
              </div>

              {/* Resident activity description */}
              <div className="mt-2.5 flex items-center gap-2 text-[12px] text-[#888]">
                <span className="shrink-0 text-white/50">💬</span>
                <span className="italic text-[#999]">
                  {diffInfo.residentActivity}
                </span>
              </div>

              {/* Quick Preset Buttons */}
              <div className="mt-3.5 flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#666] mr-1">
                  Preset Cepat:
                </span>
                {[
                  { val: 10, label: "Santai", mult: "1.0x" },
                  { val: 40, label: "Standar", mult: "1.5x" },
                  { val: 72, label: "Menantang", mult: "2.2x" },
                  { val: 95, label: "Ekstrem", mult: "3.5x" },
                ].map((p) => {
                  const isActive = difficulty === p.val;
                  return (
                    <button
                      key={p.val}
                      type="button"
                      onClick={() => setDifficulty(p.val)}
                      className={`cursor-pointer rounded-lg px-2.5 py-1 text-[12px] font-medium transition-all ${
                        isActive
                          ? "border border-white/30 bg-white/15 text-white shadow-sm"
                          : "border border-white/5 bg-white/[0.03] text-[#A0A0A0] hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      <span className="font-semibold">{p.val}</span> {p.label}{" "}
                      <span className="text-[10px] opacity-70">({p.mult})</span>
                    </button>
                  );
                })}
              </div>

              {/* Difficulty Parameters Table */}
              <div className="mt-3.5 grid grid-cols-3 gap-2 text-center text-[12px]">
                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 sm:p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#666]">
                    Batas Waktu
                  </div>
                  <div className="mt-1 font-bold text-white">
                    {diffInfo.timeLimit ? `${diffInfo.timeLimit} Detik` : "Santai"}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 sm:p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#666]">
                    Petunjuk Jane
                  </div>
                  <div className="mt-1 font-bold text-white">
                    {diffInfo.janeClueMode === "always" && "Otomatis Aktif"}
                    {diffInfo.janeClueMode === "collapsible" && "Bisa Dibuka"}
                    {diffInfo.janeClueMode === "locked" && "Terkunci (-15p)"}
                    {diffInfo.janeClueMode === "blocked" && "Diblokir 🚫"}
                  </div>
                </div>

                <div className="rounded-xl border border-white/[0.04] bg-white/[0.02] p-2 sm:p-2.5">
                  <div className="text-[10px] uppercase tracking-wider text-[#666]">
                    Multiplier Skor
                  </div>
                  <div className="mt-1 font-bold text-white">
                    {diffInfo.multiplier}x Bonus
                  </div>
                </div>
              </div>
            </div>

            {/* Target Rounds Overview */}
            <div className="space-y-2 pt-1">
              <p className="text-[12px] font-semibold uppercase tracking-wider text-[#666]">
                Daftar Kasus Investigasi · {planned} dipilih acak dari {allRounds.length} (semua bab)
              </p>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {allRounds.slice(0, 6).map((r) => (
                  <div
                    key={r.id}
                    className="flex items-center gap-2 truncate rounded-lg border border-white/[0.03] bg-white/[0.015] px-2.5 py-1.5 text-[13px] text-[#A0A0A0]"
                  >
                    <span className="font-[family-name:var(--font-supa-mono)] text-[11px] text-[#666]">
                      {String(r.round_number).padStart(2, "0")}
                    </span>
                    <span className="truncate">{r.title}</span>
                  </div>
                ))}
              </div>
              {allRounds.length > 6 && <p className="pt-0.5 text-center text-[12px] text-[#555]">
                + {allRounds.length - 6} skenario pembongkaran modus rekayasa sosial lanjutan
              </p>}
            </div>
          </div>
        </QuestionCard>
      )}

      {/* ─── 2. ASK PHASE ──────────────────────────────────────── */}
      {phase === "ask" && (
        <QuestionCard
          className="max-w-[620px]"
          headerTitle={`Kasus ${index + 1} · Lvl ${difficulty}`}
          headerIcon={
            <div className="flex items-center gap-1 font-[family-name:var(--font-supa-mono)] text-[11px] font-bold text-white">
              <span className={`size-1.5 rounded-full ${diffInfo.dotColor}`} />
              <span>{index + 1}</span>
            </div>
          }
          step={index + 1}
          totalSteps={TOTAL}
          title={round.title}
          description={round.story_context}
          contextBox={
            <div className="space-y-2.5">
              {/* Dynamic Difficulty & Timer Banner */}
              <div className="flex items-center justify-between rounded-lg border border-white/[0.06] bg-black/40 px-3 py-2 text-[12px]">
                <div className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 text-[11px] font-semibold ${diffInfo.badgeClass}`}
                  >
                    Lvl {difficulty} · {diffInfo.tierName}
                  </span>
                  <span className="hidden text-[#666] sm:inline">
                    {diffInfo.multiplier}x Skor
                  </span>
                </div>

                {/* Countdown Timer */}
                {timeLeft !== null ? (
                  <div
                    className={`flex items-center gap-1.5 font-[family-name:var(--font-supa-mono)] font-bold tabular-nums ${
                      timeLeft <= 5
                        ? "text-red-400 animate-pulse"
                        : timeLeft <= 10
                        ? "text-amber-400"
                        : "text-white"
                    }`}
                  >
                    <span>⏱️</span>
                    <span>{timeLeft}s</span>
                    <span className="text-[11px] text-[#666]">tersisa</span>
                  </div>
                ) : (
                  <span className="text-[11px] text-[#777]">
                    ⏱️ Waktu Bebas
                  </span>
                )}
              </div>

              {/* Message Box */}
              <div className="rounded-xl border border-white/[0.08] bg-[#0d0e0d] p-4">
                <div className="mb-2 flex items-center justify-between text-[11px] font-[family-name:var(--font-supa-mono)] uppercase tracking-wider">
                  <span className="flex items-center gap-2 text-white">
                    <span className="size-1.5 rounded-full bg-white animate-pulse" />
                    Pesan Masuk · {round.threat_type}
                  </span>
                  <span className="text-[#555]">{round.chapter_title}</span>
                </div>
                <p className="whitespace-pre-line font-[family-name:var(--font-supa-mono)] text-[13.5px] leading-relaxed text-[#EDEDED]">
                  {round.red_john_message}
                </p>

                {/* Red John Psychological Taunt (High Difficulty) */}
                {difficulty >= 50 && round.red_john_taunt && (
                  <div className="mt-3 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-[12.5px] text-red-200">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                      <span className="size-1.5 rounded-full bg-red-500 animate-ping" />
                      Intimidasi Red John:
                    </div>
                    <p className="mt-0.5 italic text-red-200/90 font-serif">
                      &ldquo;{round.red_john_taunt}&rdquo;
                    </p>
                  </div>
                )}
              </div>

              {/* Patrick Jane Clue Section */}
              {diffInfo.janeClueMode === "always" && (
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/15 p-3 text-[12.5px] text-emerald-200">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    <span>💡 Petunjuk Patrick Jane (Aktif)</span>
                  </div>
                  <p className="mt-1 leading-relaxed text-emerald-100/90">
                    {round.jane_clue}
                  </p>
                </div>
              )}

              {(diffInfo.janeClueMode === "collapsible" ||
                diffInfo.janeClueMode === "locked") && (
                <div>
                  {!showJaneClue ? (
                    <button
                      type="button"
                      onClick={handleUnlockClue}
                      className="flex w-full items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2 text-[12px] text-[#A0A0A0] transition-colors hover:bg-white/[0.06] hover:text-white cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <span>💡</span>
                        <span>
                          {diffInfo.janeClueMode === "locked"
                            ? "Buka Analisis Patrick Jane (-15 Poin Penalti)"
                            : "Buka Petunjuk Patrick Jane"}
                        </span>
                      </span>
                      <span className="text-[11px] text-[#666]">Klik untuk buka</span>
                    </button>
                  ) : (
                    <div className="rounded-lg border border-amber-500/25 bg-amber-950/20 p-3 text-[12.5px] text-amber-200">
                      <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-amber-400">
                        <span>💡 Analisis Patrick Jane:</span>
                        {diffInfo.janeClueMode === "locked" && (
                          <span className="text-amber-400/80 font-normal">
                            Penalti -15 poin diterapkan
                          </span>
                        )}
                      </div>
                      <p className="mt-1 leading-relaxed text-amber-100/90">
                        {round.jane_clue}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {diffInfo.janeClueMode === "blocked" && (
                <div className="rounded-lg border border-red-500/20 bg-red-950/10 px-3 py-2 text-[12px] text-red-400/90 flex items-center gap-2">
                  <span>🚫</span>
                  <span>
                    Sinyal Patrick Jane Diblokir (Mode Ekstrem: Kamu sendirian melawan Red John!)
                  </span>
                </div>
              )}
            </div>
          }
          options={cardOptions}
          selectedId={selectedChoiceId}
          onSelect={handleSelectChoice}
          canPrevious={index > 0}
          onPrevious={handlePrevious}
          previousLabel="Kembali"
          onSkip={handleSkip}
          skipLabel="Lewati"
          onContinue={handleContinueFromAsk}
          canContinue={canContinueAsk && !submitting}
          continueLabel={submitting ? "Menilai…" : "Putuskan Jawaban"}
          shortcuts={["⌘", "↵"]}
        >
          {loadError && <p role="alert" className="mb-3 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{loadError}</p>}
          {round.kind === "text_input" && (
            <div className="space-y-3">
              <label
                htmlFor="quiz-input"
                className="block text-[12px] font-semibold uppercase tracking-wider text-[#A0A0A0]"
              >
                {round.input_prompt ?? "Ketik balasan keputusanmu:"}
              </label>
              <input
                id="quiz-input"
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  round.input_placeholder ?? "Ketik tindakan atau respons..."
                }
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-[15px] text-white placeholder:text-[#555] transition-all focus:border-white/30 focus:outline-none focus:ring-1 focus:ring-white/20"
                autoFocus
              />
              <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[13px] text-[#A0A0A0]">
                <span className="text-[11px] uppercase tracking-wider text-[#666]">
                  Opsi Cepat:
                </span>
                {[
                  "Tolak & lapor polisi",
                  "Blokir nomor pengirim",
                  "Minta verifikasi ID resmi",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    onClick={() => setInput(suggestion)}
                    className="cursor-pointer rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[12px] text-[#D4D4D4] transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
        </QuestionCard>
      )}

      {/* ─── 3. FEEDBACK / DEBRIEF PHASE ───────────────────────── */}
      {phase === "feedback" && (
        <QuestionCard
          className="max-w-[620px]"
          headerTitle={`Evaluasi Kasus ${index + 1}/${TOTAL}`}
          headerIcon={
            pickedSafe ? (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-emerald-400"
              >
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : (
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-red-400"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            )
          }
          step={index + 1}
          totalSteps={TOTAL}
          title={round.title}
          description="Evaluasi keputusan investigasi dan dekonstruksi taktik pelaku."
          canPrevious={true}
          onPrevious={handlePrevious}
          previousLabel="Lihat Soal"
          onSkip={undefined}
          onContinue={nextRound}
          canContinue={true}
          continueLabel={
            index + 1 >= TOTAL ? "Lihat Rapor Akhir" : "Kasus Berikutnya"
          }
          shortcuts={["⌘", "↵"]}
        >
          <div className="space-y-4">
            {/* Status Alert Badge with Points */}
            <div
              className={`flex items-start justify-between gap-3 rounded-xl border p-3.5 ${
                pickedSafe
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
                  : "border-red-500/30 bg-red-500/10 text-red-400"
              }`}
            >
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full text-[13px] font-bold ${
                    pickedSafe
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-red-500/20 text-red-400"
                  }`}
                >
                  {pickedSafe ? "✓" : "✕"}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold uppercase tracking-wider">
                    {pickedSafe
                      ? "Keputusan Tepat & Aman"
                      : "Kamu Terkena Jebakan Manipulasi"}
                  </div>
                  <div className="mt-1 text-[13px] leading-snug text-[#D4D4D4]">
                    <span className="text-[#666]">Pilihanmu:</span> &ldquo;
                    {pickedText}&rdquo;
                  </div>
                </div>
              </div>

              {/* Points Pill */}
              <div className="shrink-0 text-right">
                <div className="text-base font-bold tabular-nums">
                  {lastDebrief.pointsEarned !== undefined
                    ? `+${lastDebrief.pointsEarned} Poin`
                    : "+0 Poin"}
                </div>
                <div className="text-[10px] uppercase text-[#777]">
                  Lvl {difficulty} ({diffInfo.multiplier}x)
                </div>
              </div>
            </div>

            {/* Consequence & Jane Clue */}
            {lastDebrief.consequence && (
              <div className="rounded-xl border border-white/[0.06] bg-[#0d0e0d] p-3.5 text-[13px] text-[#D4D4D4]">
                <div className="font-semibold text-white">Dampak Keputusan:</div>
                <p className="mt-1 leading-relaxed text-[#A0A0A0]">
                  {lastDebrief.consequence}
                </p>
                {lastDebrief.intervention && (
                  <div className="mt-2.5 border-t border-white/[0.06] pt-2 text-[#D4D4D4]">
                    <span className="font-semibold text-white">
                      💡 Analisis Forensik:
                    </span>{" "}
                    <span className="text-[#A0A0A0]">
                      {lastDebrief.intervention}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Debrief Tactical Columns */}
            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
              <div className="rounded-xl border border-white/[0.06] bg-[#0d0e0d] p-3 text-[13px]">
                <div className="font-[family-name:var(--font-supa-mono)] text-[11px] font-bold uppercase tracking-wider text-red-400">
                  Trik Pelaku
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[#A0A0A0]">
                  {round.debrief.red_john_tactic}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#0d0e0d] p-3 text-[13px]">
                <div className="font-[family-name:var(--font-supa-mono)] text-[11px] font-bold uppercase tracking-wider text-white">
                  Langkah Aman
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-[#A0A0A0]">
                  {round.debrief.safe_action}
                </p>
              </div>
            </div>
          </div>
        </QuestionCard>
      )}

      {/* ─── 4. RESULT PHASE ───────────────────────────────────── */}
      {phase === "result" && (
        <QuestionCard
          className="max-w-[620px]"
          headerTitle="Rapor Forensik Investigasi"
          step={TOTAL}
          totalSteps={TOTAL}
          title={verdict(correctCount, difficulty, TOTAL).label}
          description={verdict(correctCount, difficulty, TOTAL).note}
          canPrevious={false}
          footerLeft={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={start}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-[13px] font-medium text-[#D4D4D4] transition-all hover:border-white/20 hover:bg-white/[0.08] active:scale-[0.98]"
              >
                Ulangi (Lvl {difficulty})
              </button>
              <button
                type="button"
                onClick={() => setPhase("intro")}
                className="cursor-pointer rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 text-[13px] font-medium text-[#A0A0A0] transition-all hover:bg-white/[0.08] hover:text-white"
              >
                Ganti Level Kesulitan
              </button>
            </div>
          }
          footerRight={
            <Link
              href="/pemindai"
              className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-[13px] font-semibold text-black transition-all hover:bg-[#EDEDED] active:scale-[0.98]"
            >
              <span>Periksa Pesan Nyata</span>
              <span className="flex items-center gap-0.5 rounded bg-black/15 px-1.5 py-0.5 font-[family-name:var(--font-supa-mono)] text-[11px] font-bold leading-none text-black/70">
                <span>↵</span>
              </span>
            </Link>
          }
        >
          <div className="space-y-4">
            {/* Big Score Header with Difficulty Multiplier */}
            <div className="grid grid-cols-1 gap-3 rounded-xl border border-white/[0.08] bg-[#0d0e0d] p-4 sm:grid-cols-2">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-[#666]">
                  Total Skor Akhir
                </div>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
                    {totalScore}
                  </span>
                  <span className="text-[13px] text-[#666]">
                    / {maxPossibleScore} Poin
                  </span>
                </div>
                <div className="mt-1 text-[12px] text-[#888]">
                  {correctCount} dari {TOTAL} Kasus Terpecahkan
                </div>
              </div>

              <div className="flex flex-col justify-center sm:items-end">
                <div
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold ${diffInfo.badgeClass}`}
                >
                  <span
                    className={`size-1.5 rounded-full ${diffInfo.dotColor}`}
                  />
                  <span>Level {difficulty}/100</span>
                  <span className="opacity-60">·</span>
                  <span>{diffInfo.multiplier}x Bonus</span>
                </div>
                <div className="mt-1.5 text-[12px] text-[#666]">
                  {diffInfo.tierName}
                </div>
              </div>
            </div>

            {/* Breakdown of 10 rounds */}
            <div className="space-y-2">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-[#666]">
                Rincian Evaluasi Tiap Kasus
              </div>
              <div className="max-h-[260px] space-y-1.5 overflow-y-auto pr-1">
                {answers.map((a, i) => (
                  <div
                    key={a.roundId}
                    className="flex items-center justify-between gap-3 rounded-lg border border-white/[0.04] bg-white/[0.015] px-3 py-2 text-[13px]"
                  >
                    <div className="flex min-w-0 items-center gap-2.5">
                      <span className="font-[family-name:var(--font-supa-mono)] text-[11px] text-[#555]">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span
                        className={`flex size-4 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${
                          a.correct
                            ? "bg-emerald-500/20 text-emerald-400"
                            : "bg-red-500/20 text-red-400"
                        }`}
                      >
                        {a.correct ? "✓" : "✕"}
                      </span>
                      <span className="truncate text-[#D4D4D4]">{a.title}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="font-[family-name:var(--font-supa-mono)] text-[12px] font-semibold text-white/80 tabular-nums">
                        +{a.pointsEarned ?? 0}
                      </span>
                      <span
                        className={`text-[11px] ${
                          a.correct ? "text-emerald-400" : "text-red-400"
                        }`}
                      >
                        {a.correct ? "Aman" : "Jebakan"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </QuestionCard>
      )}
    </div>
  );
}
