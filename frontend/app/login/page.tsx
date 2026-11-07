import type { Metadata } from "next";
import Login06 from "@/components/Login06";

export const metadata: Metadata = {
  title: "Masuk — Red John",
  description: "Masuk ke platform intelijen dan keamanan Red John.",
};

export default function LoginPage() {
  return <Login06 initialMode="login" brandName="Red John" />;
}
