import type { Metadata } from "next";
import Login06 from "@/components/Login06";
import SignOutOnMount from "@/components/SignOutOnMount";

export const metadata: Metadata = {
  title: "Masuk — Red John",
  description: "Masuk ke platform intelijen dan keamanan Red John.",
};

export default function LoginPage() {
  return (
    <>
      <SignOutOnMount />
      <Login06 initialMode="login" brandName="Red John" />
    </>
  );
}
