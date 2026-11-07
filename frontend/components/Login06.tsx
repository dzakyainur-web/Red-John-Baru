"use client";

import React, { useState } from "react";
import Link from "next/link";
import RainbowRing from "./RainbowRing";

interface Login06Props {
  initialMode?: "login" | "register";
  brandName?: string;
  onSuccess?: (data: Record<string, string>) => void;
}

export default function Login06({
  initialMode = "login",
  brandName = "Red John",
}: Login06Props) {
  const [mode, setMode] = useState<"login" | "register">(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);

  // Form states
  const [fullName, setFullName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [demoNotice, setDemoNotice] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setDemoNotice(null);

    setTimeout(() => {
      setLoading(false);
      setDemoNotice(
        mode === "login"
          ? "Demo UI: Berhasil mensimulasikan proses masuk!"
          : "Demo UI: Berhasil mensimulasikan pendaftaran akun baru!"
      );
    }, 700);
  };

  const handleSocialClick = (provider: string) => {
    setDemoNotice(`Demo UI: Tombol "${provider}" diklik (backend belum terhubung).`);
    setTimeout(() => {
      setDemoNotice(null);
    }, 3500);
  };

  return (
    <div className="relative min-h-screen w-full bg-[#08090D] text-white flex flex-col justify-between items-center overflow-x-hidden selection:bg-[#FF3815] selection:text-white font-[family-name:var(--font-jetbrains-mono)]">
      {/* Background radial gradient tone */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(120, 119, 198, 0.15), transparent 80%)",
        }}
      />

      {/* Top Bar Navigation */}
      <header className="w-full max-w-6xl mx-auto px-6 pt-6 flex items-center justify-between z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white transition-colors py-1.5 px-3 rounded-full bg-white/[0.04] border border-white/10 hover:border-white/20 backdrop-blur-md"
        >
          <svg
            className="size-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
          </svg>
          <span>Kembali ke Beranda</span>
        </Link>

        {/* Quick Mode Toggle Pill */}
        <div className="flex items-center gap-1 p-1 bg-[#12141A] border border-zinc-800 rounded-full text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setDemoNotice(null);
            }}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              mode === "login"
                ? "bg-white text-black shadow-sm font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Masuk
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("register");
              setDemoNotice(null);
            }}
            className={`px-3.5 py-1.5 rounded-full font-medium transition-all ${
              mode === "register"
                ? "bg-white text-black shadow-sm font-semibold"
                : "text-zinc-400 hover:text-white"
            }`}
          >
            Daftar
          </button>
        </div>
      </header>

      {/* Main Authentication Centerpiece */}
      <main className="w-full max-w-4xl mx-auto px-6 py-10 sm:py-14 z-10 flex-1 flex flex-col justify-center">
        {/* Interactive Demo Toast Notice */}
        {demoNotice && (
          <div className="mb-6 mx-auto w-full max-w-md bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 px-4 py-2.5 rounded-lg text-xs flex items-center justify-between backdrop-blur-md animate-fade-in">
            <span>{demoNotice}</span>
            <button
              type="button"
              onClick={() => setDemoNotice(null)}
              className="text-emerald-400 hover:text-white text-base leading-none font-bold ml-2 cursor-pointer"
            >
              &times;
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-14 relative items-center">
          {/* Vertical Middle Divider (Desktop only) */}
          <div
            aria-hidden="true"
            className="hidden md:block absolute left-1/2 top-2 bottom-2 w-px bg-zinc-800/80 -translate-x-1/2"
          />

          {/* ======================================================== */}
          {/* LEFT COLUMN: Brand Logo, Heading, Credential Inputs      */}
          {/* ======================================================== */}
          <div className="flex flex-col justify-center">
            {/* Logo Badge (Red John in signature Login 06 circular badge style) */}
            <div className="mb-6 flex items-center">
              <Link href="/" className="inline-flex items-center select-none cursor-pointer group">
                {/* White circular pill badge with "Red" */}
                <span className="flex items-center justify-center h-8 px-3 rounded-full bg-white text-black font-bold text-xs tracking-tight shadow-sm group-hover:bg-zinc-200 transition-colors">
                  Red
                </span>
                <span className="text-white font-bold text-base tracking-tight ml-1.5 group-hover:text-zinc-200 transition-colors">
                  John.
                </span>
              </Link>
            </div>

            {/* Heading */}
            <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-white mb-6">
              {mode === "login" ? "Masuk." : "Daftar."}
            </h1>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name field (Register mode only) */}
              {mode === "register" && (
                <div>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Nama lengkap*"
                    className="w-full h-11 px-3.5 rounded-lg bg-[#0E1015]/90 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                </div>
              )}

              {/* Username or email */}
              <div>
                <input
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="Nama pengguna atau email*"
                  className="w-full h-11 px-3.5 rounded-lg bg-[#0E1015]/90 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
              </div>

              {/* Password field with Show/Hide toggle */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi Anda*"
                  className="w-full h-11 pl-3.5 pr-10 rounded-lg bg-[#0E1015]/90 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                >
                  {showPassword ? (
                    /* Eye Slash Icon */
                    <svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                      />
                    </svg>
                  ) : (
                    /* Eye Icon */
                    <svg
                      className="size-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                      />
                    </svg>
                  )}
                </button>
              </div>

              {/* Confirm Password (Register mode only) */}
              {mode === "register" && (
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Konfirmasi kata sandi Anda*"
                    className="w-full h-11 pl-3.5 pr-10 rounded-lg bg-[#0E1015]/90 border border-zinc-800 text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={
                      showConfirmPassword ? "Sembunyikan konfirmasi kata sandi" : "Tampilkan konfirmasi kata sandi"
                    }
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition-colors p-1 cursor-pointer"
                  >
                    {showConfirmPassword ? (
                      <svg
                        className="size-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
                        />
                      </svg>
                    ) : (
                      <svg
                        className="size-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="1.75"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              )}

              {/* Auxiliary Row (Checkbox + Forgot Password) */}
              <div className="flex items-center justify-between text-xs pt-1 select-none">
                {mode === "login" ? (
                  <>
                    <label className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="size-4 rounded border-zinc-700 bg-[#0E1015] text-black focus:ring-1 focus:ring-zinc-400 cursor-pointer accent-white"
                      />
                      <span>Ingat perangkat ini</span>
                    </label>

                    <button
                      type="button"
                      onClick={() =>
                        setDemoNotice("Demo UI: Fitur atur ulang kata sandi dapat dihubungkan ke backend.")
                      }
                      className="text-zinc-300 hover:text-white font-medium transition-colors cursor-pointer"
                    >
                      Lupa Kata Sandi?
                    </button>
                  </>
                ) : (
                  <label className="flex items-center gap-2 text-zinc-400 hover:text-zinc-300 cursor-pointer">
                    <input
                      type="checkbox"
                      required
                      checked={agreedTerms}
                      onChange={(e) => setAgreedTerms(e.target.checked)}
                      className="size-4 rounded border-zinc-700 bg-[#0E1015] text-black focus:ring-1 focus:ring-zinc-400 cursor-pointer accent-white"
                    />
                    <span>Saya menyetujui syarat & ketentuan</span>
                  </label>
                )}
              </div>

              {/* Primary Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full h-11 rounded-lg bg-white hover:bg-zinc-200 text-black font-semibold text-sm transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99] disabled:opacity-70"
                >
                  {loading ? (
                    <svg
                      className="animate-spin size-4 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8H4z"
                      />
                    </svg>
                  ) : mode === "login" ? (
                    "Masuk"
                  ) : (
                    "Buat Akun"
                  )}
                </button>
              </div>

              {/* Switch View Link */}
              <div className="text-center text-xs text-zinc-400 pt-1">
                {mode === "login" ? (
                  <span>
                    Belum punya akun?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setDemoNotice(null);
                      }}
                      className="text-white font-medium hover:underline cursor-pointer"
                    >
                      Buat akun
                    </button>
                  </span>
                ) : (
                  <span>
                    Sudah punya akun?{" "}
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setDemoNotice(null);
                      }}
                      className="text-white font-medium hover:underline cursor-pointer"
                    >
                      Masuk
                    </button>
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* ======================================================== */}
          {/* RIGHT COLUMN: Social Authentication & Terms Disclaimer    */}
          {/* ======================================================== */}
          <div className="flex flex-col justify-center">
            {/* Social Buttons Stack */}
            <div className="space-y-3">
              {/* Google Button */}
              <button
                type="button"
                onClick={() => handleSocialClick("Google")}
                className="w-full h-11 px-4 rounded-lg bg-[#0E1015]/90 border border-zinc-800 hover:border-zinc-700 hover:bg-[#14161F] text-zinc-200 hover:text-white text-sm font-normal transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Official Google G Icon */}
                <svg className="size-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.87c2.26-2.09 3.675-5.17 3.675-9.15z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.87-3.05c-1.08.72-2.45 1.16-4.06 1.16-3.13 0-5.78-2.11-6.73-4.96H1.28v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.27 14.24c-.25-.72-.39-1.49-.39-2.24s.14-1.52.39-2.24V6.61H1.28A11.96 11.96 0 0 0 0 12c0 1.92.45 3.74 1.28 5.39l3.99-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.28 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.73-4.96z"
                  />
                </svg>
                <span>
                  {mode === "login" ? "Masuk dengan Google" : "Daftar dengan Google"}
                </span>
              </button>

              {/* Twitter / X Button */}
              <button
                type="button"
                onClick={() => handleSocialClick("Twitter / X")}
                className="w-full h-11 px-4 rounded-lg bg-[#0E1015]/90 border border-zinc-800 hover:border-zinc-700 hover:bg-[#14161F] text-zinc-200 hover:text-white text-sm font-normal transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Official X Logo */}
                <svg className="size-4 shrink-0 fill-current" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
                <span>
                  {mode === "login" ? "Masuk dengan Twitter" : "Daftar dengan Twitter"}
                </span>
              </button>

              {/* Facebook Button */}
              <button
                type="button"
                onClick={() => handleSocialClick("Facebook")}
                className="w-full h-11 px-4 rounded-lg bg-[#0E1015]/90 border border-zinc-800 hover:border-zinc-700 hover:bg-[#14161F] text-zinc-200 hover:text-white text-sm font-normal transition-all flex items-center justify-center gap-3 cursor-pointer group"
              >
                {/* Official Facebook Logo */}
                <svg className="size-4 shrink-0 fill-[#1877F2]" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
                <span>
                  {mode === "login" ? "Masuk dengan Facebook" : "Daftar dengan Facebook"}
                </span>
              </button>
            </div>

            {/* Legal Disclaimer */}
            <p className="text-xs text-zinc-400 text-center leading-relaxed mt-6 md:mt-8">
              Dengan {mode === "login" ? "masuk" : "mendaftar"}, Anda menyetujui{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setDemoNotice("Demo UI: Halaman Ketentuan Layanan.");
                }}
                className="underline underline-offset-4 text-zinc-300 hover:text-white transition-colors"
              >
                Ketentuan Layanan
              </a>{" "}
              dan{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setDemoNotice("Demo UI: Halaman Kebijakan Privasi.");
                }}
                className="underline underline-offset-4 text-zinc-300 hover:text-white transition-colors"
              >
                Kebijakan Privasi
              </a>{" "}
              kami.
            </p>
          </div>
        </div>
      </main>

      {/* ======================================================== */}
      {/* BOTTOM ARTWORK: Iconic 3D Glowing Rainbow Arch            */}
      {/* ======================================================== */}
      <RainbowRing />
    </div>
  );
}
