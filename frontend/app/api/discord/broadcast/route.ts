import { API_BASE } from "@/lib/api";

/**
 * Proxy ke backend `POST /api/discord/broadcast`: enqueue job "post 5 berita acak"
 * yang nanti diambil bot Discord lewat polling outbox.
 *
 * Key bot hanya dibaca di server (DISCORD_BOT_API_KEY, tanpa prefix NEXT_PUBLIC_)
 * dan tidak pernah dikirim ke browser.
 */
export async function POST(request: Request) {
  let guildId = "";
  try {
    const body = (await request.json()) as { guild_id?: unknown };
    guildId = typeof body.guild_id === "string" ? body.guild_id.trim() : "";
  } catch {
    // body bukan JSON -> ditolak di bawah
  }
  if (!/^\d{1,32}$/.test(guildId)) {
    return Response.json(
      { detail: "ID server Discord harus berupa angka." },
      { status: 422 },
    );
  }

  // Kunci bot dikirim hanya bila server memang punya; kosong = mode dev backend
  // (endpoint bot terbuka saat DISCORD_BOT_API_KEY backend kosong).
  const key = process.env.DISCORD_BOT_API_KEY?.trim() ?? "";

  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Authorization: request.headers.get("Authorization") ?? "",
    };
    if (key) headers["X-API-Key"] = key;
    const res = await fetch(`${API_BASE}/api/discord/broadcast`, {
      method: "POST",
      headers,
      body: JSON.stringify({ guild_id: guildId }),
      cache: "no-store",
    });
    if (!res.ok) {
      return new Response(await res.text(), {
        status: res.status,
        headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
      });
    }
    return Response.json(await res.json(), { status: res.status });
  } catch {
    return Response.json(
      { detail: `Backend tidak dapat dihubungi (${API_BASE}).` },
      { status: 502 },
    );
  }
}
