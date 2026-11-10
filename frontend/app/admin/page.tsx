import type { Metadata } from "next";
import AdminDashboardClient from "@/components/admin/AdminDashboardClient";

export const metadata: Metadata = {
  title: "Panel Admin — Red John",
  description: "Triage ancaman, kelola bank soal kuis, dan siaran berita Discord.",
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
