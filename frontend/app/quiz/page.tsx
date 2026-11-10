import type { Metadata } from "next";
import QuizClient from "@/components/QuizClient";
import SupabaseNavbar from "@/components/SupabaseNavbar";

export const metadata: Metadata = {
  title: "Kuis Kriminal Otomatis — Red John",
  description:
    "Simulasi modus kriminal digital asli Indonesia. Uji apakah kamu bisa mengenali rekayasa sosial, APK palsu, quishing, dan penipuan investasi.",
};

export default function QuizPage() {
  return (
    <>
      <SupabaseNavbar />
      <QuizClient />
    </>
  );
}
