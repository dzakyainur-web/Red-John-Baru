import type { Metadata } from "next";
import QuizAdminClient from "@/components/quiz/admin/QuizAdminClient";

export const metadata: Metadata = { title: "Kelola Soal Kuis — Red John" };
export default function QuizAdminPage() { return <QuizAdminClient />; }
