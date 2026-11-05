"use client";

import { useState } from "react";
import { SCENARIOS, type Choice, type Scenario } from "@/lib/scenarios";

const DIFF_LABEL: Record<Scenario["difficulty"], string> = {
  easy: "mudah",
  medium: "sedang",
  hard: "sulit",
};

type PickRecord = { choiceId: string; safe: boolean; text: string };

function ChatPlayer({ scenario, onDone }: { scenario: Scenario; onDone: (picks: PickRecord[]) => void }) {
  const [stepIndex, setStepIndex] = useState(0);
  const [picks, setPicks] = useState<PickRecord[]>([]);
  const [lastChoice, setLastChoice] = useState<Choice | null>(null);

  const step = scenario.steps[stepIndex];

  function choose(c: Choice) {
    setLastChoice(c);
    setPicks((p) => [...p, { choiceId: c.id, safe: c.safe, text: c.text }]);
  }

  function next() {
    setLastChoice(null);
    setStepIndex((i) => i + 1);
  }

  if (stepIndex >= scenario.steps.length) {
    onDone(picks);
    return null;
  }

  return (
    <div className="space-y-4">
      {step.kind === "message" ? (
        <div className="flex justify-start">
          <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-zinc-200 px-4 py-2.5 text-sm dark:bg-zinc-800">
            <p className="text-xs font-semibold text-zinc-500">{step.from}</p>
            <p className="mt-1">{step.text}</p>
          </div>
        </div>
      ) : lastChoice == null ? (
        <div className="space-y-2 pl-4">
          <p className="text-sm font-medium">Apa respons kamu?</p>
          {step.options.map((o) => (
            <button
              key={o.id}
              onClick={() => choose(o)}
              className="w-full rounded-lg border border-zinc-300 p-3 text-left text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {o.text}
            </button>
          ))}
        </div>
      ) : (
        <div className={`space-y-3 rounded-lg border p-3 text-sm ${lastChoice.safe ? "border-green-400 bg-green-50 dark:bg-green-950" : "border-red-400 bg-red-50 dark:bg-red-950"}`}>
          <p className="font-semibold">{lastChoice.safe ? "✅ Aman" : "⚠️ Berbahaya"}</p>
          <p><strong>Akibatnya:</strong> {lastChoice.consequence}</p>
          <p className="text-zinc-700 dark:text-zinc-300"><strong>Kenapa:</strong> {lastChoice.explain}</p>
          <button
            onClick={next}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {stepIndex + 1 < scenario.steps.length ? "Lanjut" : "Lihat hasil"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function LearnPage() {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [picks, setPicks] = useState<PickRecord[] | null>(null);
  const [reviewing, setReviewing] = useState(false);

  const scenario = SCENARIOS.find((s) => s.id === activeId) ?? null;
  const safeCount = picks?.filter((p) => p.safe).length ?? 0;

  function reset() {
    setActiveId(null);
    setPicks(null);
    setReviewing(false);
  }

  if (scenario && picks) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">{scenario.title}</h1>
        <div className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-lg font-semibold">
            Keputusan aman: {safeCount}/{picks.length}
          </p>
          <p className="mt-2 text-sm"><strong>Yang seharusnya diperhatikan:</strong> {scenario.debrief}</p>
          {reviewing ? (
            <ul className="mt-4 space-y-2 text-sm">
              {picks.map((p, i) => (
                <li key={i} className={p.safe ? "text-green-700 dark:text-green-400" : "text-red-700 dark:text-red-400"}>
                  {p.safe ? "✅" : "⚠️"} {p.text}
                </li>
              ))}
            </ul>
          ) : (
            <button onClick={() => setReviewing(true)} className="mt-3 rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700">
              Review pilihan bahaya
            </button>
          )}
        </div>
        <button onClick={reset} className="rounded-lg bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900">
          Coba skenario lain
        </button>
      </div>
    );
  }

  if (scenario) {
    return (
      <div className="space-y-6">
        <button onClick={reset} className="text-sm text-zinc-500 hover:underline">← Kembali ke daftar</button>
        <div>
          <h1 className="text-2xl font-bold">{scenario.title}</h1>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{scenario.intro}</p>
        </div>
        <ChatPlayer scenario={scenario} onDone={setPicks} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Belajar Kenali Scam</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Baca percakapan, pilih respons kamu, dan lihat akibatnya. Semua skenario fiktif.
        </p>
      </div>
      <ul className="space-y-3">
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => { setActiveId(s.id); setPicks(null); }}
              className="w-full rounded-xl border border-zinc-200 p-4 text-left hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-900"
            >
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{s.intro}</p>
              <p className="mt-2 text-xs text-zinc-500">Tingkat: {DIFF_LABEL[s.difficulty]}</p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
