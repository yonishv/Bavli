import fs from "node:fs";
import path from "node:path";

const BASE_URL = process.env.BASE_URL || "https://bavli.genizah.org";
const OUT_DIR = process.env.OUT_DIR || "output/assets";
const ALT_ORIGINS = (process.env.ALT_ORIGINS || "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

fs.mkdirSync(OUT_DIR, { recursive: true });

function safeName(p) {
  return p.replace(/[^\w.\-\/]/g, "_");
}

function outRelPathFromUrl(u) {
  const parsed = new URL(u);
  let p = parsed.pathname.replace(/^\//, "") || "index";
  if (p.endsWith("/")) p += "index";
  return safeName(path.join(parsed.host, p));
}

function normalizeMaybeBrokenUrl(u) {
  // The login page uses document.write with dynamic cache-busters, so sometimes we capture `...?v=`
  // without the computed value. Strip empty `v=` so it doesn't 404 on some servers.
  try {
    const url = new URL(u);
    if (url.search === "?v=") url.search = "";
    return url.toString();
  } catch {
    return u;
  }
}

function looksLikeAspNet404(text) {
  const t = String(text || "");
  return (
    t.includes("404 - File or directory not found") ||
    /<h2>\s*404\s*-/.test(t) ||
    /Server Error/i.test(t)
  );
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      Accept: "*/*",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  const text = await res.text();
  const contentType = res.headers.get("content-type") || "";
  return { status: res.status, text, headers: res.headers, contentType };
}

const loginUrl = new URL("/Account/Login", BASE_URL).toString();
const { status, text: html } = await fetchText(loginUrl);
console.log("login", status, "len", html.length);

// Default alternate origin: the UI is branded "Friedberg Jewish Manuscript Society" and sometimes assets
// live on the main fjms portal domain even when the app is served on bavli.genizah.org.
const defaultAlt = [];
if (new URL(BASE_URL).host === "bavli.genizah.org") defaultAlt.push("https://fjms.genizah.org");
const origins = [BASE_URL, ...defaultAlt, ...ALT_ORIGINS];

// Collect src hrefs directly in HTML.
const urls = new Set();
for (const m of html.matchAll(/<script\b[^>]*src=["']([^"']+)["'][^>]*>/gi)) {
  for (const origin of origins) {
    urls.add(new URL(m[1], loginUrl).toString());
    urls.add(new URL(m[1], origin).toString());
  }
}
for (const m of html.matchAll(/<link\b[^>]*href=["']([^"']+)["'][^>]*>/gi)) {
  for (const origin of origins) {
    urls.add(new URL(m[1], loginUrl).toString());
    urls.add(new URL(m[1], origin).toString());
  }
}

// Collect document.write loaded assets.
for (const m of html.matchAll(/document\.write\(\s*'[^']*(?:src|href)=["']([^"']+)["'][^']*'\s*\)/gi)) {
  for (const origin of origins) {
    urls.add(new URL(m[1], loginUrl).toString());
    urls.add(new URL(m[1], origin).toString());
  }
}

// Heuristics for dynamic strings (we may capture `...PortalIndex.css?v=` but not the computed value).
for (const guess of ["SSOConfig.js", "CSS/PortalIndex.css", "CSS/FJMSToolbar.css", "CSS/ToolBarStyleSheet.css"]) {
  if (html.includes(guess)) {
    for (const origin of origins) {
      urls.add(new URL(guess, origin).toString());
      urls.add(new URL(guess, loginUrl).toString());
    }
  }
}

console.log("found asset urls", urls.size);

for (const u of [...urls]) {
  const candidates = [];
  const normalized = normalizeMaybeBrokenUrl(u);
  candidates.push(normalized);
  try {
    const parsed = new URL(normalized);
    // Many assets appear to live at the site root, but relative URLs from `/Account/Login` resolve under `/Account/...`.
    // Try stripping that prefix as a fallback.
    if (parsed.pathname.startsWith("/Account/")) {
      const stripped = new URL(parsed.toString());
      stripped.pathname = stripped.pathname.replace(/^\/Account\//, "/");
      candidates.push(stripped.toString());
    }
  } catch {
    // ignore
  }

  try {
    let fetched = null;
    let finalUrl = null;
    for (const c of candidates) {
      const r = await fetchText(c);
      if (r.status !== 404 && !looksLikeAspNet404(r.text)) {
        fetched = r;
        finalUrl = c;
        break;
      }
      // If all we get are 404s, keep the first one so we still persist something for inspection.
      if (!fetched) {
        fetched = r;
        finalUrl = c;
      }
    }

    const rel = outRelPathFromUrl(finalUrl || u);
    const outPath = path.join(OUT_DIR, rel);
    fs.mkdirSync(path.dirname(outPath), { recursive: true });
    fs.writeFileSync(outPath, fetched.text);
    console.log("saved", fetched.status, fetched.contentType || "-", finalUrl || u, "->", outPath);
  } catch (e) {
    console.log("failed", u, String(e?.message || e));
  }
}

console.log("\nNext: search downloaded assets for endpoints/tokens:");
console.log(`  rg -n \"SSO|auth|token|cookie|Login|Account|\\.ASPXAUTH\" ${OUT_DIR}`);
