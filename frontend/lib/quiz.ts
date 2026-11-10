import { API_BASE } from "./api";

export type ChoiceKind = "multiple_choice" | "binary" | "text_input";
export type GameChoice = {
  id: string; text: string; is_safe?: boolean; consequence?: string;
  jane_intervention?: string; manipulation_tactic?: string;
};
export type QuizFeedback = {
  is_safe: boolean; keywords: string[]; digits_min: number | null;
  digits_max: number | null; red_john_reaction: string; consequence: string;
  jane_intervention: string; manipulation_tactic: string;
};
export type GameRound = {
  id: string; round_number: number; chapter_title: string; title: string;
  kind: ChoiceKind; threat_type: string; story_context: string;
  red_john_message: string; red_john_note: string | null;
  red_john_taunt: string | null; jane_clue: string; choices: GameChoice[] | null;
  text_config: { prompt: string; placeholder: string; rules: QuizFeedback[]; default: QuizFeedback } | null;
  input_prompt?: string | null; input_placeholder?: string | null;
  debrief: { summary: string; safe_action: string; red_john_tactic: string };
  is_active: boolean; created_at?: string; updated_at?: string;
};
export type AnswerResult = {
  is_safe: boolean; user_said: string; red_john_reaction: string;
  consequence: string; jane_intervention: string; manipulation_tactic: string;
  points_base: number;
};

export async function request<T>(path: string, init?: RequestInit, token?: string): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      ...init,
      headers: {
        ...(init?.body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    throw new Error(`Backend tidak dapat dihubungi (${API_BASE}${path}).`);
  }
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    let detail = body;
    try { detail = JSON.parse(body).detail ?? body; } catch { /* respons bukan JSON */ }
    throw new Error(typeof detail === "string" ? detail : "Permintaan tidak valid.");
  }
  return res.json() as Promise<T>;
}

export const listQuizQuestions = () => request<GameRound[]>("/api/quiz/questions");
export const listAdminQuestions = (token: string) =>
  request<GameRound[]>("/api/quiz/admin/questions", undefined, token);
export const createQuizQuestion = (input: Partial<GameRound>, token: string) =>
  request<GameRound>("/api/quiz/admin/questions", { method: "POST", body: JSON.stringify(input) }, token);
export const updateQuizQuestion = (id: string, input: Partial<GameRound>, token: string) =>
  request<GameRound>(`/api/quiz/admin/questions/${id}`, { method: "PATCH", body: JSON.stringify(input) }, token);
export const archiveQuizQuestion = (id: string, token: string) =>
  request<GameRound>(`/api/quiz/admin/questions/${id}`, { method: "DELETE" }, token);
export const submitQuizAnswer = (id: string, answer: { choice_id?: string; text?: string }) =>
  request<AnswerResult>(`/api/quiz/questions/${id}/answer`, { method: "POST", body: JSON.stringify(answer) });
