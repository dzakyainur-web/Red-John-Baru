import type { Metadata } from "next";
import QuizLeaderboardClient from "@/components/QuizLeaderboardClient";
import SupabaseNavbar from "@/components/SupabaseNavbar";

export const metadata: Metadata = {
  title: "Klasemen Harian Kuis — Red John",
  description:
    "Papan peringkat kuis kriminal otomatis. Poin dihitung per periode dan direset setiap 21:00 WIB.",
};

export default function QuizLeaderboardPage() {
  return (
    <>
      <SupabaseNavbar />
      <QuizLeaderboardClient />
    </>
  );
}
