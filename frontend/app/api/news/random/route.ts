import { API_BASE } from "@/lib/api";

/**
 * Proxy ke backend `GET /api/news/random`. Parameter dibatasi ulang di sini
 * supaya nilai aneh dari klien tidak diteruskan mentah-mentah.
 */
export async function GET(request: Request) {
  const raw = Number(new URL(request.url).searchParams.get("limit") ?? "5");
  const limit = Number.isInteger(raw) ? Math.min(Math.max(raw, 1), 20) : 5;

  try {
    const res = await fetch(`${API_BASE}/api/news/random?limit=${limit}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      // Teruskan payload error backend apa adanya supaya pesan di panel jelas.
      return new Response(await res.text(), {
        status: res.status,
        headers: { "Content-Type": res.headers.get("Content-Type") ?? "application/json" },
      });
    }
    return Response.json(await res.json());
  } catch {
    return Response.json(
      { detail: `Backend tidak dapat dihubungi (${API_BASE}).` },
      { status: 502 },
    );
  }
}
