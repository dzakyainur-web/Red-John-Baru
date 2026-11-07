import type { Metadata } from "next";
import Login06 from "@/components/Login06";

export const metadata: Metadata = {
  title: "Daftar Akun — Red John",
  description: "Daftar ke platform intelijen dan keamanan Red John.",
};

export default function RegisterPage() {
  return <Login06 initialMode="register" brandName="Red John" />;
}
