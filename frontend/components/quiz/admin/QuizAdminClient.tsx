"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import QuestionForm, { emptyQuestion } from "@/components/quiz/admin/QuestionForm";
import { archiveQuizQuestion, createQuizQuestion, listAdminQuestions, updateQuizQuestion, type GameRound } from "@/lib/quiz";
import { supabase } from "@/lib/supabase";

export default function QuizAdminClient() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [token, setToken] = useState("");
  const [questions, setQuestions] = useState<GameRound[]>([]);
  const [editing, setEditing] = useState<GameRound | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (accessToken: string) => {
    setLoading(true); setError("");
    try { setQuestions(await listAdminQuestions(accessToken)); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal memuat soal."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    if (!supabase) { setError("Konfigurasi NEXT_PUBLIC_SUPABASE_URL dan NEXT_PUBLIC_SUPABASE_ANON_KEY belum diisi."); return; }
    supabase.auth.getSession().then(({ data }) => { if (data.session) setToken(data.session.access_token); });
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setToken(session?.access_token ?? ""));
    return () => data.subscription.unsubscribe();
  }, []);
  useEffect(() => { if (token) void load(token); }, [token, load]);

  async function login(e: React.FormEvent) {
    e.preventDefault(); if (!supabase) return;
    setLoading(true); setError("");
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password });
      if (authError) setError("Email atau password tidak valid.");
    } catch { setError("Supabase tidak dapat dihubungi. Periksa konfigurasi dan koneksi."); }
    finally { setLoading(false); }
  }
  async function save(draft: GameRound) {
    const { id: _id, created_at: _createdAt, updated_at: _updatedAt, input_prompt: _inputPrompt, input_placeholder: _inputPlaceholder, ...payload } = draft;
    void [_id, _createdAt, _updatedAt, _inputPrompt, _inputPlaceholder];
    if (editing?.id) await updateQuizQuestion(editing.id, payload, token);
    else await createQuizQuestion(payload, token);
    setEditing(null); await load(token);
  }
  async function archive(question: GameRound) {
    if (!confirm(`Arsipkan “${question.title}”? Soal tidak akan tampil untuk pemain.`)) return;
    setError("");
    try { await archiveQuizQuestion(question.id, token); await load(token); }
    catch (err) { setError(err instanceof Error ? err.message : "Gagal mengarsipkan."); }
  }
  return <main className="min-h-screen bg-[#0c0d0d] px-4 py-10 text-white"><div className="mx-auto max-w-5xl">
    <Link href="/quiz" className="text-sm text-white/60 hover:text-white">← Kembali ke kuis</Link>
    <div className="mt-5 flex flex-wrap items-center justify-between gap-4"><div><h1 className="text-3xl font-bold">Kelola Bank Soal</h1><p className="mt-1 text-sm text-white/60">Pilihan ganda, benar/salah, dan jawaban teks.</p></div>{token && <button onClick={() => void supabase?.auth.signOut()} className="rounded-lg border border-white/15 px-3 py-2 text-sm">Keluar</button>}</div>
    {!token ? <form onSubmit={login} className="mx-auto mt-12 max-w-md space-y-4 rounded-2xl border border-white/15 bg-white/[0.03] p-6"><h2 className="text-lg font-semibold">Login admin Supabase</h2>{error && <p role="alert" className="text-sm text-red-300">{error}</p>}<input type="email" required placeholder="Email admin" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 p-3 text-sm" /><input type="password" required placeholder="Password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full rounded-lg border border-white/15 bg-black/30 p-3 text-sm" /><button disabled={loading || !supabase} className="w-full rounded-lg bg-white p-3 text-sm font-semibold text-black disabled:opacity-50">{loading ? "Memproses…" : "Masuk"}</button></form> : <>
      {error && <div role="alert" className="mt-5 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">{error}</div>}
      <div className="mt-6 flex justify-end"><button onClick={() => setEditing(emptyQuestion(Math.max(0, ...questions.map((q) => q.round_number)) + 1))} className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-black">+ Tambah soal</button></div>
      {loading ? <p className="mt-8 text-white/60">Memuat…</p> : <div className="mt-4 overflow-hidden rounded-xl border border-white/10">{questions.map((q) => <article key={q.id} className="flex flex-wrap items-center gap-3 border-b border-white/10 p-4 last:border-0">
        <span className="font-mono text-sm text-white/50">#{q.round_number}</span><div className="min-w-0 flex-1"><h2 className="font-semibold">{q.title}</h2><p className="text-xs text-white/50">{{ multiple_choice: "Pilihan ganda", binary: "Benar/salah", text_input: "Teks" }[q.kind]} · {q.is_active ? "Aktif" : "Arsip"}</p></div>
        <button onClick={() => setEditing(q)} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs">Edit</button><button disabled={!q.is_active} onClick={() => void archive(q)} className="rounded-lg border border-red-400/30 px-3 py-1.5 text-xs text-red-300 disabled:opacity-30">Arsip</button>
      </article>)}{questions.length === 0 && <p className="p-6 text-sm text-white/50">Belum ada soal.</p>}</div>}
    </>}
    {editing && <QuestionForm initial={editing} onCancel={() => setEditing(null)} onSave={save} />}
  </div></main>;
}
