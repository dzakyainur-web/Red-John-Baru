"use client";

import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

// Halaman /login selalu mengakhiri sesi Supabase yang aktif,
// sehingga tombol "Keluar dari Akun" cukup mengarah ke sini.
export default function SignOutOnMount() {
  useEffect(() => {
    void supabase?.auth.signOut();
  }, []);

  return null;
}
