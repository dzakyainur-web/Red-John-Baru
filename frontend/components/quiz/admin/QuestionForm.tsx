"use client";

import { useState } from "react";
import type { GameChoice, GameRound, QuizFeedback } from "@/lib/quiz";

const field = "w-full rounded-lg border border-white/15 bg-black/30 px-3 py-2 text-sm text-white placeholder:text-white/30 focus:border-white/40 focus:outline-none";
const label = "block space-y-1 text-xs font-semibold text-white/70";
export const emptyFeedback = (safe: boolean): QuizFeedback => ({
  is_safe: safe, keywords: [], digits_min: null, digits_max: null,
  red_john_reaction: "", consequence: "", jane_intervention: "", manipulation_tactic: "",
});
const emptyChoice = (safe = false): GameChoice => ({
  id: `choice-${crypto.randomUUID().replaceAll("-", "").slice(0, 12)}`, text: "", is_safe: safe, consequence: "",
  jane_intervention: "", manipulation_tactic: "",
});
export function emptyQuestion(number: number): GameRound {
  return { id: "", round_number: number, chapter_title: "", title: "", kind: "multiple_choice",
    threat_type: "", story_context: "", red_john_message: "", red_john_note: null,
    red_john_taunt: null, jane_clue: "", choices: [emptyChoice(true), emptyChoice()],
    text_config: null, debrief: { summary: "", safe_action: "", red_john_tactic: "" }, is_active: true };
}

export default function QuestionForm({ initial, onSave, onCancel }: {
  initial: GameRound; onSave: (value: GameRound) => Promise<void>; onCancel: () => void;
}) {
  const [draft, setDraft] = useState(initial);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const set = (patch: Partial<GameRound>) => setDraft((old) => ({ ...old, ...patch }));
  const setChoice = (index: number, patch: Partial<GameChoice>) => set({ choices: draft.choices?.map((c, i) => i === index ? { ...c, ...patch } : c) });
  const setRule = (index: number, patch: Partial<QuizFeedback>) => set({ text_config: draft.text_config ? {
    ...draft.text_config, rules: draft.text_config.rules.map((r, i) => i === index ? { ...r, ...patch } : r),
  } : null });
  function changeKind(kind: GameRound["kind"]) {
    if (kind === draft.kind) return;
    if (kind === "text_input") set({ kind, choices: null, text_config: { prompt: "", placeholder: "", rules: [emptyFeedback(true)], default: emptyFeedback(false) } });
    else set({ kind, text_config: null, choices: [emptyChoice(true), emptyChoice()] });
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    try { await onSave(draft); } catch (err) { setError(err instanceof Error ? err.message : "Gagal menyimpan."); } finally { setSaving(false); }
  }
  return <form onSubmit={submit} className="fixed inset-0 z-50 overflow-y-auto bg-black/80 p-4 sm:p-8">
    <div className="mx-auto max-w-3xl space-y-5 rounded-2xl border border-white/15 bg-[#111] p-5 text-white">
      <div className="flex items-center justify-between"><h2 className="text-xl font-bold">{initial.id ? "Edit soal" : "Tambah soal"}</h2><button type="button" onClick={onCancel} aria-label="Tutup" className="text-2xl">×</button></div>
      {error && <p role="alert" className="rounded-lg bg-red-500/10 p-3 text-sm text-red-300">{error}</p>}
      <div className="grid gap-3 sm:grid-cols-3">
        <label className={label}>Nomor<input className={field} type="number" min={1} required value={draft.round_number} onChange={(e) => set({ round_number: Number(e.target.value) })} /></label>
        <label className={label}>Tipe<select className={field} value={draft.kind} onChange={(e) => changeKind(e.target.value as GameRound["kind"])}><option value="multiple_choice">Pilihan ganda</option><option value="binary">Benar / salah</option><option value="text_input">Jawaban teks</option></select></label>
        <label className={label}>Status<select className={field} value={String(draft.is_active)} onChange={(e) => set({ is_active: e.target.value === "true" })}><option value="true">Aktif</option><option value="false">Arsip</option></select></label>
      </div>
      {(["chapter_title:Bab", "title:Judul soal", "threat_type:Kategori ancaman", "story_context:Konteks cerita", "red_john_message:Pesan Red John", "red_john_taunt:Ejekan (opsional)", "jane_clue:Petunjuk Jane"] as const).map((item) => {
        const [key, title] = item.split(":"); const value = draft[key as keyof GameRound] as string | null;
        return <label className={label} key={key}>{title}<textarea className={field} rows={key === "title" || key === "chapter_title" ? 1 : 3} required={key !== "red_john_taunt"} value={value ?? ""} onChange={(e) => set({ [key]: e.target.value })} /></label>;
      })}
      {draft.kind !== "text_input" && <section className="space-y-3"><h3 className="font-semibold">Pilihan jawaban <span className="text-xs font-normal text-white/50">(pilih satu jawaban aman)</span></h3>
        {draft.choices?.map((choice, i) => <div className="space-y-2 rounded-xl border border-white/10 p-3" key={choice.id}>
          <div className="flex gap-3"><input className={field} required placeholder={`Pilihan ${i + 1}`} value={choice.text} onChange={(e) => setChoice(i, { text: e.target.value })} /><label className="flex items-center gap-2 text-xs whitespace-nowrap"><input type="radio" name="safe" checked={choice.is_safe} onChange={() => set({ choices: draft.choices?.map((c, j) => ({ ...c, is_safe: i === j })) })} />Aman</label>{draft.kind === "multiple_choice" && (draft.choices?.length ?? 0) > 2 && <button type="button" className="text-red-300" onClick={() => set({ choices: draft.choices?.filter((_, j) => j !== i) })}>Hapus</button>}</div>
          {(["consequence:Konsekuensi", "jane_intervention:Intervensi Jane", "manipulation_tactic:Taktik manipulasi"] as const).map((item) => { const [key, title] = item.split(":"); return <label className={label} key={key}>{title}<textarea required className={field} rows={2} value={String(choice[key as keyof GameChoice] ?? "")} onChange={(e) => setChoice(i, { [key]: e.target.value })} /></label>; })}
        </div>)}
        {draft.kind === "multiple_choice" && (draft.choices?.length ?? 0) < 5 && <button type="button" className="rounded-lg border border-white/20 px-3 py-2 text-sm" onClick={() => set({ choices: [...(draft.choices ?? []), emptyChoice()] })}>+ Tambah pilihan</button>}
      </section>}
      {draft.kind === "text_input" && draft.text_config && <section className="space-y-3"><h3 className="font-semibold">Penilaian jawaban teks</h3>
        <label className={label}>Prompt<input required className={field} value={draft.text_config.prompt} onChange={(e) => set({ text_config: { ...draft.text_config!, prompt: e.target.value } })} /></label>
        <label className={label}>Placeholder<input className={field} value={draft.text_config.placeholder} onChange={(e) => set({ text_config: { ...draft.text_config!, placeholder: e.target.value } })} /></label>
        <p className="text-xs text-white/50">Aturan diperiksa berurutan. Semua kata kunci pada satu aturan harus muncul; isi kata kunci dengan koma. Rentang angka bersifat opsional.</p>
        {draft.text_config.rules.map((rule, i) => <div className="space-y-2 rounded-xl border border-white/10 p-3" key={i}>
          <RuleFields rule={rule} onChange={(patch) => setRule(i, patch)} />
          <label className={label}>Kata kunci<input className={field} value={rule.keywords.join(", ")} onChange={(e) => setRule(i, { keywords: e.target.value.split(",").map((v) => v.trim()).filter(Boolean) })} /></label>
          <div className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rule.digits_min !== null} onChange={(e) => setRule(i, { digits_min: e.target.checked ? 4 : null, digits_max: e.target.checked ? 8 : null })} />Harus ada angka 4–8 digit</div>
          {draft.text_config!.rules.length > 1 && <button type="button" className="text-sm text-red-300" onClick={() => set({ text_config: { ...draft.text_config!, rules: draft.text_config!.rules.filter((_, j) => j !== i) } })}>Hapus aturan</button>}
        </div>)}
        <button type="button" className="rounded-lg border border-white/20 px-3 py-2 text-sm" onClick={() => set({ text_config: { ...draft.text_config!, rules: [...draft.text_config!.rules, emptyFeedback(true)] } })}>+ Tambah aturan</button>
        <h4 className="text-sm font-semibold">Feedback bawaan (tidak ada aturan cocok)</h4>
        <RuleFields rule={draft.text_config.default} onChange={(patch) => set({ text_config: { ...draft.text_config!, default: { ...draft.text_config!.default, ...patch } } })} />
      </section>}
      <section className="space-y-3"><h3 className="font-semibold">Debrief</h3>{(["summary:Ringkasan", "safe_action:Tindakan aman", "red_john_tactic:Taktik Red John"] as const).map((item) => { const [key, title] = item.split(":"); return <label className={label} key={key}>{title}<textarea required rows={2} className={field} value={draft.debrief[key as keyof GameRound["debrief"]]} onChange={(e) => set({ debrief: { ...draft.debrief, [key]: e.target.value } })} /></label>; })}</section>
      <div className="sticky bottom-0 flex justify-end gap-3 bg-[#111] py-3"><button type="button" onClick={onCancel} className="rounded-lg border border-white/20 px-4 py-2 text-sm">Batal</button><button disabled={saving} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50">{saving ? "Menyimpan…" : "Simpan soal"}</button></div>
    </div>
  </form>;
}

function RuleFields({ rule, onChange }: { rule: QuizFeedback; onChange: (patch: Partial<QuizFeedback>) => void }) {
  return <><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={rule.is_safe} onChange={(e) => onChange({ is_safe: e.target.checked })} />Jawaban aman</label>
    {(["red_john_reaction:Reaksi Red John", "consequence:Konsekuensi", "jane_intervention:Intervensi Jane", "manipulation_tactic:Taktik manipulasi"] as const).map((item) => { const [key, title] = item.split(":"); return <label className={label} key={key}>{title}<textarea required={key !== "red_john_reaction"} rows={2} className={field} value={String(rule[key as keyof QuizFeedback] ?? "")} onChange={(e) => onChange({ [key]: e.target.value })} /></label>; })}</>;
}
