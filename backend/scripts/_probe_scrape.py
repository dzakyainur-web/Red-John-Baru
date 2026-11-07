"""Probe: cari container artikel yang stabil di halaman tag. Buang setelah config final."""
from playwright.sync_api import sync_playwright

UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36"

TARGETS = [
    ("detik", "https://www.detik.com/tag/penipuan-online"),
    ("liputan6", "https://www.liputan6.com/tag/penipuan"),
    ("tempo", "https://www.tempo.co/tag/penipuan"),
    ("suara", "https://www.suara.com/tag/penipuan-online"),
]

JS = """() => {
  // Kelompokkan anchor artikel berdasarkan "pola path" supaya kelihatan mana yang list berita.
  const out = {};
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.href;
    if (!/^https?:/.test(href)) continue;
    const text = (a.textContent || '').trim().replace(/\\s+/g, ' ');
    if (text.length < 25) continue;
    const cls = (typeof a.className === 'string' && a.className) || '(none)';
    const parent = a.parentElement;
    const pchain = [];
    let cur = parent;
    for (let i = 0; i < 3 && cur; i++) {
      pchain.push(cur.tagName.toLowerCase() + ((typeof cur.className === 'string' && cur.className) ? '.' + cur.className.trim().split(/\\s+/).slice(0,2).join('.') : ''));
      cur = cur.parentElement;
    }
    const key = cls + ' < ' + pchain.join(' < ');
    (out[key] = out[key] || {n: 0, sample: text.slice(0,70), href: href.slice(0,80)}).n++;
  }
  return Object.entries(out).sort((a,b) => b[1].n - a[1].n).slice(0, 10)
    .map(([k,v]) => ({key:k, n:v.n, sample:v.sample, href:v.href}));
}"""


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page(user_agent=UA, locale="id-ID")
        for name, url in TARGETS:
            try:
                page.goto(url, timeout=35000, wait_until="domcontentloaded")
                page.wait_for_timeout(2500)
                print(f"=== {name} {url}")
                for row in page.evaluate(JS):
                    print(f"  n={row['n']:<3} {row['key'][:110]}")
                    print(f"        sample={row['sample'][:70]}")
                    print(f"        href={row['href'][:80]}")
            except Exception as exc:
                print(f"=== {name} FAIL {type(exc).__name__}: {str(exc)[:110]}")
        browser.close()


if __name__ == "__main__":
    main()
