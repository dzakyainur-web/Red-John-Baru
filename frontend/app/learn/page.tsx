"use client";

import { useState } from "react";
import { SCENARIOS, type Choice, type Scenario } from "@/lib/scenarios";
import { PageHead, SourceNote } from "@/components/ui";

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
    if (stepIndex + 1 >= scenario.steps.length) {
      onDone(picks);
      return;
    }
    setStepIndex((i) => i + 1);
  }

  return (
    <div className="space-y-4">
      {step.kind === "message" ? (
        <div className="space-y-3">
          <div className="flex justify-start">
            <div className="max-w-[85%] border border-rule bg-surface px-4 py-3 text-sm">
              <p className="data">{step.from}</p>
              <p className="mt-1.5">{step.text}</p>
            </div>
          </div>
          <button onClick={next} className="btn btn-sm">
            Lanjut
          </button>
        </div>
      ) : lastChoice == null ? (
        <div className="space-y-2">
          <p className="text-sm font-medium">Apa respons kamu?</p>
          <div className="divide-y divide-rule border-y border-rule">
            {step.options.map((o) => (
              <button
                key={o.id}
                onClick={() => choose(o)}
                className="block w-full px-3 py-3 text-left text-sm transition-colors hover:bg-raised"
              >
                {o.text}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rise space-y-3 border border-rule bg-surface p-4 text-sm">
          <p className="flex items-center gap-2 font-semibold">
            <span aria-hidden="true" className={`size-2.5 rounded-full ${lastChoice.safe ? "bg-safe" : "bg-alert"}`} />
            {lastChoice.safe ? "Aman" : "Berbahaya"}
          </p>
          <p>
            <strong className="font-semibold">Akibatnya.</strong> {lastChoice.consequence}
          </p>
          <p className="text-muted">
            <strong className="font-semibold text-ink">Kenapa.</strong> {lastChoice.explain}
          </p>
          <button onClick={next} className="btn btn-primary btn-sm">
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

  function pickScenario(id: string) {
    setActiveId(id);
    setPicks(null);
    setReviewing(false);
  }

  if (scenario && picks) {
    return (
      <div className="space-y-6">
        <div className="rule-accent" />
        <p className="data">{scenario.title}</p>
        <h1 className="page-title">
          {safeCount} dari {picks.length} keputusan aman
        </h1>
        <p className="lead text-sm">{scenario.debrief}</p>

        {reviewing ? (
          <ul className="border-t border-rule">
            {picks.map((p, i) => (
              <li key={i} className="flex gap-3 border-b border-rule py-2.5 text-sm">
                <span aria-hidden="true" className={`mt-1.5 size-2 shrink-0 rounded-full ${p.safe ? "bg-safe" : "bg-alert"}`} />
                <span className={p.safe ? "" : "text-alert-ink"}>{p.text}</span>
              </li>
            ))}
          </ul>
        ) : (
          <button onClick={() => setReviewing(true)} className="btn btn-sm">
            Lihat semua pilihanmu
          </button>
        )}

        <div className="flex flex-wrap gap-2">
          <button onClick={reset} className="btn btn-primary">
            Coba skenario lain
          </button>
          <button onClick={() => pickScenario(scenario.id)} className="btn">
            Ulangi skenario ini
          </button>
        </div>
      </div>
    );
  }

  if (scenario) {
    return (
      <div className="space-y-6">
        <button onClick={reset} className="text-sm text-alert-ink underline decoration-alert-line underline-offset-4 hover:decoration-alert">
          Kembali ke daftar skenario
        </button>
        <PageHead title={scenario.title} lead={scenario.intro} aside={<span className="data">tingkat {DIFF_LABEL[scenario.difficulty]}</span>} />
        <ChatPlayer scenario={scenario} onDone={setPicks} />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHead
        title="Belajar kenali scam"
        lead="Baca percakapannya, pilih responsmu, lihat akibatnya. Semua skenario fiktif — tidak ada backend yang dipanggil, latihan berjalan di browser."
      />

      <ul className="border-t border-rule">
        {SCENARIOS.map((s) => (
          <li key={s.id}>
            <button
              onClick={() => pickScenario(s.id)}
              className="flex w-full flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-rule px-1 py-4 text-left transition-colors hover:bg-raised"
            >
              <span className="max-w-[52ch]">
                <span className="block font-semibold">{s.title}</span>
                <span className="mt-0.5 block text-sm text-muted">{s.intro}</span>
              </span>
              <span className="data">tingkat {DIFF_LABEL[s.difficulty]}</span>
            </button>
          </li>
        ))}
      </ul>

      <SourceNote>
        Skenario ditulis tim sebagai bahan latihan, bukan rekaman percakapan nyata.
      </SourceNote>
    </div>
  );
}
