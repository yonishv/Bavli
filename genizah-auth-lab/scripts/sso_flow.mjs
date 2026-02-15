// Attempt to authenticate via the FJMS/Genizah SSO JSONP flow (no browser),
// then exchange the resulting UIT for site cookies via /Account/SSOSignIn,
// and finally probe a few Bavli API endpoints.
//
// Usage:
//   BASE_URL="https://bavli.genizah.org" GENIZAH_USERNAME="..." GENIZAH_PASSWORD="..." node scripts/sso_flow.mjs
//
// Notes:
// - This script does NOT store credentials anywhere; it only uses env vars for the current process.
// - If the provider adds bot protection / additional verification, this may stop working.

const BASE_URL = process.env.BASE_URL || "https://bavli.genizah.org";
const USERNAME = process.env.GENIZAH_USERNAME || "";
const PASSWORD = process.env.GENIZAH_PASSWORD || "";
// NOTE: do NOT read process.env.LANG (often "C.UTF-8" on macOS shells).
const UI_LANG = process.env.UI_LANG || process.env.GENIZAH_LANG || "heb";
const SCREEN_WIDTH = process.env.SCREEN_WIDTH || "1200";
const DEBUG = process.env.DEBUG === "1";

if (!USERNAME || !PASSWORD) {
  console.error("Missing GENIZAH_USERNAME / GENIZAH_PASSWORD env vars.");
  process.exit(1);
}

function parseJsonp(body, cbName) {
  const b = String(body || "").trim();
  // Typical: cbName({...});
  const prefix = `${cbName}(`;
  if (b.startsWith(prefix) && b.endsWith(");")) {
    const inner = b.slice(prefix.length, -2).trim();
    try {
      return JSON.parse(inner);
    } catch {
      // Sometimes servers return JS object literals; fall back to safe eval in an empty context.
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${inner});`)();
    }
  }

  // Fallback: take the first {...} block.
  const start = b.indexOf("{");
  const end = b.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end > start) {
    const inner = b.slice(start, end + 1);
    try {
      return JSON.parse(inner);
    } catch {
      // eslint-disable-next-line no-new-func
      return Function(`"use strict"; return (${inner});`)();
    }
  }
  throw new Error("Could not parse JSONP/JSON response.");
}

function getSetCookies(res) {
  // Node's fetch (undici) provides getSetCookie() in modern versions.
  const h = res.headers;
  if (typeof h.getSetCookie === "function") return h.getSetCookie();
  const single = h.get("set-cookie");
  return single ? [single] : [];
}

function parseSetCookie(sc) {
  const parts = String(sc || "").split(";").map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return null;
  const [nv, ...attrs] = parts;
  const eq = nv.indexOf("=");
  if (eq <= 0) return null;
  const name = nv.slice(0, eq).trim();
  const value = nv.slice(eq + 1).trim();
  const out = { name, value, domain: null, path: null };
  for (const a of attrs) {
    const i = a.indexOf("=");
    const k = (i === -1 ? a : a.slice(0, i)).trim().toLowerCase();
    const v = i === -1 ? "" : a.slice(i + 1).trim();
    if (k === "domain") out.domain = v.replace(/^\./, "").toLowerCase();
    if (k === "path") out.path = v;
  }
  return out;
}

function domainMatches(requestHost, cookieDomain) {
  if (!cookieDomain) return false;
  const h = requestHost.toLowerCase();
  const d = cookieDomain.toLowerCase();
  return h === d || h.endsWith("." + d);
}

function addSetCookies(cookieStore, setCookies, { defaultDomain } = {}) {
  for (const sc of setCookies || []) {
    const c = parseSetCookie(sc);
    if (!c?.name) continue;
    const domain = (c.domain || defaultDomain || "").replace(/^\./, "").toLowerCase();
    if (!domain) continue;
    cookieStore.set(`${domain}|${c.name}`, { domain, name: c.name, value: c.value, path: c.path || "/" });
  }
}

function cookieHeaderForHost(cookieStore, host) {
  const pairs = [];
  for (const c of cookieStore.values()) {
    if (domainMatches(host, c.domain)) pairs.push(`${c.name}=${c.value}`);
  }
  return pairs.join("; ");
}

async function fetchWithCookies(url, { method = "GET", headers = {}, cookieStore, maxRedirects = 10 } = {}) {
  let current = new URL(url);
  for (let i = 0; i <= maxRedirects; i++) {
    const cookie = cookieHeaderForHost(cookieStore, current.host);
    const res = await fetch(current.toString(), {
      method,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        Accept: "*/*",
        ...(cookie ? { Cookie: cookie } : {}),
        ...headers,
      },
      redirect: "manual",
    });

    const setCookies = getSetCookies(res);
    addSetCookies(cookieStore, setCookies, { defaultDomain: current.host });
    if (DEBUG && setCookies.length) {
      console.log("set-cookie@", current.host, "count=", setCookies.length);
      for (const sc of setCookies.slice(0, 5)) console.log("  ", String(sc).slice(0, 140));
    }
    const text = await res.text();

    const loc = res.headers.get("location");
    if (loc && res.status >= 300 && res.status < 400) {
      if (DEBUG) console.log("redirect", res.status, current.toString(), "->", new URL(loc, current).toString());
      current = new URL(loc, current);
      continue;
    }

    return { res, text, finalUrl: current.toString(), cookieStore };
  }
  throw new Error(`Too many redirects for ${url}`);
}

async function main() {
  const cookieStore = new Map();

  async function fetchEnums() {
    const cb = "__cb" + Math.random().toString(16).slice(2);
    const enumsUrl = new URL("https://SSO.genizah.org/General/GetEnums");
    enumsUrl.searchParams.set("callback", cb);
    const r = await fetch(enumsUrl.toString(), {
      headers: {
        Accept: "application/javascript, text/javascript, */*; q=0.01",
        Referer: "https://fjms.genizah.org/",
      },
    });
    const body = await r.text();
    const parsed = parseJsonp(body, cb);

    // In their portal code they append `result` into a <script> tag, so it's likely JS source as a string.
    if (typeof parsed === "string") {
      try {
        // eslint-disable-next-line no-new-func
        const Enums = Function(`"use strict"; ${parsed}; return (typeof Enums !== "undefined") ? Enums : null;`)();
        return Enums;
      } catch (e) {
        if (DEBUG) console.log("GetEnums eval failed:", String(e?.message || e));
        return null;
      }
    }

    // Sometimes JSONP endpoints return the object directly.
    if (parsed && typeof parsed === "object") {
      if (parsed.Enums) return parsed.Enums;
      if (parsed.loginStatus) return parsed;
    }
    return null;
  }

  // 1) Get a UIT from the SSO service via JSONP.
  const cb = "__cb" + Math.random().toString(16).slice(2);
  const ssoUrl = new URL("https://SSO.genizah.org/login/GetLoginUIT");
  ssoUrl.searchParams.set("screenWidth", String(SCREEN_WIDTH));
  ssoUrl.searchParams.set("username", USERNAME);
  ssoUrl.searchParams.set("password", PASSWORD);
  ssoUrl.searchParams.set("callback", cb);

  const ssoRes = await fetch(ssoUrl.toString(), {
    headers: {
      Accept: "application/javascript, text/javascript, */*; q=0.01",
      Referer: "https://fjms.genizah.org/",
    },
  });
  const ssoBody = await ssoRes.text();
  const ssoObj = parseJsonp(ssoBody, cb);

  const UIT = ssoObj?.UIT || ssoObj?.uit || "";
  const Status = ssoObj?.Status ?? ssoObj?.status;

  let statusName = null;
  try {
    const Enums = await fetchEnums();
    const loginStatus = Enums?.loginStatus || Enums?.LoginStatus;
    if (loginStatus && typeof loginStatus === "object") {
      const entries = Object.entries(loginStatus)
        .filter(([, v]) => typeof v === "number" || typeof v === "string")
        .map(([k, v]) => [k, Number(v)]);
      const inv = new Map(entries.map(([k, v]) => [v, k]));
      statusName = inv.get(Number(Status)) || null;
      if (DEBUG) {
        const known = [...inv.entries()].sort((a, b) => a[0] - b[0]).slice(0, 50);
        console.log(
          "loginStatus map:",
          known.map(([v, k]) => `${v}=${k}`).join(", ")
        );
      }
    }
  } catch (e) {
    if (DEBUG) console.log("GetEnums failed:", String(e?.message || e));
  }

  console.log(
    "SSO GetLoginUIT status=",
    ssoRes.status,
    "SSOUIT.Status=",
    Status,
    statusName ? `(${statusName})` : "",
    "UIT?",
    Boolean(UIT),
    `UIT=${String(UIT).slice(0, 12)}...`
  );
  if (!UIT) {
    console.log("SSO response (first 300 chars):", ssoBody.slice(0, 300));
    throw new Error("No UIT returned from SSO.");
  }

  // 2) Exchange UIT for site cookies on the target site.
  const signIn = new URL("/Account/SSOSignIn", BASE_URL);
  signIn.searchParams.set("lang", UI_LANG);
  signIn.searchParams.set("UIT", String(UIT));
  if (DEBUG) console.log("SSOSignIn url=", signIn.toString());

  const signInOut = await fetchWithCookies(signIn.toString(), {
    cookieStore,
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      Referer: "https://fjms.genizah.org/",
    },
  });
  console.log("SSOSignIn final=", signInOut.finalUrl, "httpStatus=", signInOut.res.status);

  // 3) Probe a few Bavli endpoints with the cookies we got.
  const bavliHost = new URL(BASE_URL).host;
  const cookieHeader = cookieHeaderForHost(cookieStore, bavliHost);
  console.log("BAVLI_COOKIE_HEADER=", cookieHeader);
  if (DEBUG) {
    console.log("cookieStore domains:", [...new Set([...cookieStore.values()].map((c) => c.domain))].sort().join(", "));
    console.log("cookieStore names:", [...new Set([...cookieStore.values()].map((c) => c.name))].sort().join(", "));
  }

  const endpoints = [
    "/api/SelectionControlAPI/GetDivisions?levelId=1&parentIds%5B0%5D=&inProjectId=&useFtsSession=false",
    "/api/DiffAPI/GetSiglaTable",
    "/api/DiffAPI/GetBlocks?isForDownload=false",
    "/api/DiffAPI/GetContentJoins",
  ];

  for (const p of endpoints) {
    const u = new URL(p, BASE_URL).toString();
    const r = await fetch(u, {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: `${BASE_URL}/?lan=${UI_LANG}&isPartial=False&isDoubleLogin=False`,
        Cookie: cookieHeader,
      },
    });
    const t = await r.text();
    console.log("\n===", r.status, u);
    console.log(t.slice(0, 600));
  }
}

main().catch((e) => {
  console.error("ERROR:", e?.message || e);
  process.exit(1);
});
