import type { Metadata } from "next";
import QuizClient from "@/components/QuizClient";

export const metadata: Metadata = {
  title: "Kuis Kriminal Otomatis — Red John",
  description:
    "10 simulasi modus kriminal digital asli Indonesia. Uji apakah kamu bisa mengenali rekayasa sosial, APK palsu, quishing, dan penipuan investasi.",
};

export default function QuizPage() {
  return <QuizClient />;
}
