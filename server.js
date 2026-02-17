import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;
const SEFARIA_BASE = "https://www.sefaria.org";
const GENIZAH_BASE = "https://bavli.genizah.org";
let genizahSessionCookie = "";
let genizahLastEnvLoginAttemptAt = 0;
let genizahLastAuthCheckAt = 0;
let genizahLastAuthOk = false;
let genizahLastAuthDetails = "";
const TRACTATE_HEB = {
  Berakhot: "ברכות",
  Shabbat: "שבת",
  Eruvin: "עירובין",
  Pesachim: "פסחים",
  Yoma: "יומא",
  Sukkah: "סוכה",
  Beitzah: "ביצה",
  Rosh_Hashanah: "ראש השנה",
  Taanit: "תענית",
  Megillah: "מגילה",
  Moed_Katan: "מועד קטן",
  Chagigah: "חגיגה",
  Yevamot: "יבמות",
  Ketubot: "כתובות",
  Nedarim: "נדרים",
  Nazir: "נזיר",
  Sotah: "סוטה",
  Gittin: "גיטין",
  Kiddushin: "קידושין",
  Bava_Kamma: "בבא קמא",
  Bava_Metzia: "בבא מציעא",
  Bava_Batra: "בבא בתרא",
  Sanhedrin: "סנהדרין",
  Makkot: "מכות",
  Shevuot: "שבועות",
  Avodah_Zarah: "עבודה זרה",
  Horayot: "הוריות",
  Zevachim: "זבחים",
  Menachot: "מנחות",
  Chullin: "חולין",
  Bekhorot: "בכורות",
  Arakhin: "ערכין",
  Temurah: "תמורה",
  Keritot: "כריתות",
  Meilah: "מעילה",
  Kinnim: "קינים",
  Tamid: "תמיד",
  Middot: "מידות",
  Niddah: "נידה",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json({ limit: "32kb" }));

function normalizeRef(rawRef) {
  return String(rawRef || "")
    .trim()
    .replace(/\s+/g, "_");
}

async function fetchSefariaJson(url) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/json",
      "User-Agent": "talmud-enhanced-viewer/1.0",
    },
  });

  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`Sefaria API ${response.status}: ${message}`);
  }

  return body;
}

function extractDafYomiRefFromCalendars(payload) {
  const items = Array.isArray(payload)
    ? payload
    : payload?.calendar_items || payload?.items || payload?.calendar || [];
  const itemList = Array.isArray(items) ? items : [];

  const asText = (value) => String(value || "").trim();
  const normalizeText = (value) => asText(value).toLowerCase();
  const isKnownTractate = (name) => Boolean(TRACTATE_HEB[String(name || "")]);

  const parseEnglishRef = (value) => {
    const text = asText(value);
    if (!text) return "";
    // "Berakhot 2a" => "Berakhot.2a", "Bava Metzia 12" => "Bava_Metzia.12a"
    const m = text.match(/^([A-Za-z][A-Za-z' -]+)\s+(\d+)([ab])?$/i);
    if (!m) return "";
    const tractate = m[1].replace(/'/g, "").trim().replace(/\s+/g, "_");
    const dafNum = String(m[2] || "");
    const amud = String(m[3] || "a").toLowerCase();
    return `${tractate}.${dafNum}${amud}`;
  };

  const normalizeRefCandidate = (value) => {
    const text = asText(value);
    if (!text) return "";
    const m = text.match(/^([A-Za-z_]+)\.(\d+)([ab])?$/i);
    if (!m) return "";
    const tractate = m[1];
    if (!isKnownTractate(tractate)) return "";
    const dafNum = String(m[2] || "");
    const amud = String(m[3] || "a").toLowerCase();
    return `${tractate}.${dafNum}${amud}`;
  };

  const normalizeMaybeRef = (value) => {
    const text = asText(value);
    if (!text) return "";
    // Already a normalized ref-like value.
    {
      const ready = normalizeRefCandidate(text);
      if (ready) return ready;
    }

    // URL with ref in path or query.
    try {
      const u = new URL(text, "https://www.sefaria.org");
      const pathMatch = decodeURIComponent(u.pathname).match(/\/([A-Za-z_]+\.\d+[ab]?)(?:[/?#]|$)/i);
      if (pathMatch) {
        const parsed = normalizeRefCandidate(pathMatch[1]);
        if (parsed) return parsed;
      }
      const qRef = asText(u.searchParams.get("p") || u.searchParams.get("ref"));
      {
        const parsed = normalizeRefCandidate(qRef);
        if (parsed) return parsed;
      }
    } catch {
      // Not a URL, continue below.
    }

    // Sometimes URL-like text is just "Berakhot.2a"
    {
      const parsed = normalizeRefCandidate(text.replace(/^\/+/, ""));
      if (parsed) return parsed;
    }

    // English display value.
    return normalizeRefCandidate(parseEnglishRef(text));
  };

  const isDafYomiItem = (item) => {
    const en = [
      item?.title?.en,
      item?.title?.english,
      item?.title_en,
      item?.title,
      item?.name?.en,
      item?.name,
      item?.category,
      item?.key,
      item?.description?.en,
    ]
      .map((v) => asText(v).toLowerCase())
      .join(" | ");
    const he = [item?.title?.he, item?.title_he, item?.name?.he, item?.description?.he]
      .map((v) => asText(v).toLowerCase())
      .join(" | ");
    return (
      en.includes("daf yomi") ||
      en.includes("daily talmud") ||
      he.includes("דף יומי") ||
      he.includes("הדף היומי")
    );
  };

  const extractRef = (item) => {
    const candidates = [
      item?.ref,
      item?.heRef,
      item?.sefaria_ref,
      item?.url,
      item?.displayValue?.en,
      item?.displayValue,
      item?.value?.en,
      item?.value,
    ];
    for (const candidate of candidates) {
      const ref = normalizeMaybeRef(candidate);
      if (ref) return ref;
    }
    return "";
  };

  // Primary path: explicit Daf Yomi item.
  for (const item of itemList) {
    if (!isDafYomiItem(item)) continue;
    const ref = extractRef(item);
    if (ref) return ref;
  }

  // Fallback path: score all items and choose strongest likely Daf-Yomi candidate.
  const scoreItem = (item, ref) => {
    const blob = [
      item?.title?.en,
      item?.title?.he,
      item?.title,
      item?.name?.en,
      item?.name?.he,
      item?.name,
      item?.category,
      item?.description?.en,
      item?.description?.he,
      item?.displayValue?.en,
      item?.displayValue?.he,
      item?.displayValue,
      item?.value?.en,
      item?.value?.he,
      item?.value,
    ]
      .map(normalizeText)
      .join(" | ");

    let score = 0;
    if (blob.includes("daf yomi") || blob.includes("daily talmud")) score += 6;
    if (blob.includes("דף יומי") || blob.includes("הדף היומי")) score += 6;
    if (blob.includes("talmud") || blob.includes("תלמוד") || blob.includes("בבלי")) score += 2;
    if (ref) score += 3;
    return score;
  };

  let bestRef = "";
  let bestScore = -1;
  for (const item of itemList) {
    const ref = extractRef(item);
    if (!ref) continue;
    const score = scoreItem(item, ref);
    if (score > bestScore) {
      bestScore = score;
      bestRef = ref;
    }
  }
  if (bestRef) return bestRef;

  // Last-resort path: scan raw payload for any tractate.daf pattern and pick first valid.
  const raw = typeof payload === "string" ? payload : JSON.stringify(payload || {});
  const matches = raw.match(/[A-Za-z_]+\.\d+[ab]?/g) || [];
  for (const candidate of matches) {
    const ref = normalizeRefCandidate(candidate);
    if (ref) return ref;
  }
  return "";
}

async function fetchGenizah(pathname, { method = "GET" } = {}) {
  const url = `${GENIZAH_BASE}${pathname}`;
  const headers = {
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest",
    Referer: "https://bavli.genizah.org/?lan=heb&isPartial=False&isDoubleLogin=False",
  };

  const activeCookie = genizahSessionCookie || process.env.GENIZAH_COOKIE || "";
  if (activeCookie) {
    headers.Cookie = activeCookie;
  }

  const response = await fetch(url, { method, headers });
  const contentType = response.headers.get("content-type") || "";
  const body = contentType.includes("application/json")
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const message = typeof body === "string" ? body : JSON.stringify(body);
    throw new Error(`Genizah API ${response.status}: ${message}`);
  }

  return body;
}

async function fetchGenizahRaw(pathname, { method = "GET", extraHeaders = {} } = {}) {
  const url = `${GENIZAH_BASE}${pathname}`;
  const headers = {
    Accept: "*/*",
    "X-Requested-With": "XMLHttpRequest",
    Referer: "https://bavli.genizah.org/?lan=heb&isPartial=False&isDoubleLogin=False",
    ...extraHeaders,
  };

  const activeCookie = genizahSessionCookie || process.env.GENIZAH_COOKIE || "";
  if (activeCookie) headers.Cookie = activeCookie;

  return fetch(url, { method, headers });
}

function extractSetCookies(headers) {
  if (typeof headers?.getSetCookie === "function") return headers.getSetCookie();
  const raw = headers?.get?.("set-cookie");
  return raw ? [raw] : [];
}

function mergeCookies(jar, setCookieValues) {
  for (const line of setCookieValues || []) {
    const firstPart = String(line || "").split(";")[0] || "";
    const eq = firstPart.indexOf("=");
    if (eq <= 0) continue;
    const name = firstPart.slice(0, eq).trim();
    const value = firstPart.slice(eq + 1).trim();
    if (!name) continue;
    jar.set(name, value);
  }
}

function cookieHeaderFromJar(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join("; ");
}

function browserHeaders(extra = {}) {
  return {
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "he-IL,he;q=0.9,en-US;q=0.8,en;q=0.7",
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    ...extra,
  };
}

function getOrigin(url) {
  return new URL(url).origin;
}

async function fetchWithJar(jar, url, options = {}) {
  const headers = {
    ...browserHeaders(),
    ...(options.headers || {}),
  };
  const cookie = cookieHeaderFromJar(jar);
  if (cookie) headers.Cookie = cookie;

  const response = await fetch(url, {
    ...options,
    headers,
    redirect: "manual",
  });
  mergeCookies(jar, extractSetCookies(response.headers));
  return response;
}

async function followRedirectsWithJar(jar, startUrl, maxHops = 6) {
  let url = startUrl;
  let last = null;
  for (let i = 0; i < maxHops; i += 1) {
    last = await fetchWithJar(jar, url);
    if (last.status < 300 || last.status >= 400) return last;
    const location = last.headers.get("location");
    if (!location) return last;
    url = new URL(location, url).toString();
  }
  return last;
}

function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function parseJsonp(body, cbName) {
  const b = String(body || "");
  const re = new RegExp(`${escapeRegExp(cbName)}\\s*\\(\\s*([\\s\\S]*?)\\s*\\)\\s*;?`);
  const m = b.match(re);
  if (!m) throw new Error("Could not parse JSONP response (callback not found)");
  const inner = (m[1] || "").trim();
  if (!inner) throw new Error("Could not parse JSONP response (empty payload)");
  try {
    return JSON.parse(inner);
  } catch (e) {
    throw new Error(`Could not parse JSONP response (invalid JSON): ${e.message}`);
  }
}

function isZeroGuid(guid) {
  return String(guid || "").trim() === "00000000-0000-0000-0000-000000000000";
}

async function ssoGetLoginUIT(username, password, screenWidth = 1200) {
  const cb = `__cb${Math.random().toString(16).slice(2)}`;
  const url = new URL("https://SSO.genizah.org/login/GetLoginUIT");
  url.searchParams.set("screenWidth", String(screenWidth));
  url.searchParams.set("username", username);
  url.searchParams.set("password", password);
  url.searchParams.set("callback", cb);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/javascript, text/javascript, */*; q=0.01",
      Referer: "https://fjms.genizah.org/",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  const contentType = response.headers.get("content-type") || "";
  const body = await response.text();
  if (!response.ok) {
    throw new Error(`SSO GetLoginUIT failed: ${response.status} (${contentType}) ${body.slice(0, 140)}`);
  }

  let obj;
  try {
    obj = parseJsonp(body, cb);
  } catch (e) {
    throw new Error(`SSO GetLoginUIT parse failed: ${e.message}. (${contentType}) ${body.slice(0, 140)}`);
  }
  const UIT = obj?.UIT || obj?.uit || "";
  const Status = obj?.Status ?? obj?.status;
  return { UIT, Status };
}

async function loginToGenizah(username, password) {
  // The real login flow is handled via the Genizah SSO service:
  // 1) JSONP: https://SSO.genizah.org/login/GetLoginUIT?username=...&password=...
  // 2) Redirect: https://bavli.genizah.org/Account/SSOSignIn?lang=heb&UIT=...
  // This results in `.ASPXAUTH` (and other cookies) on bavli.genizah.org, which are required for API access.
  const { UIT, Status } = await ssoGetLoginUIT(username, password);
  if (Number(Status) !== 0 || !UIT || isZeroGuid(UIT)) {
    throw new Error(`SSO login failed: Status=${String(Status)} UIT=${UIT ? String(UIT).slice(0, 8) + "…" : "(none)"}`);
  }

  const jar = new Map();
  const signIn = new URL("/Account/SSOSignIn", GENIZAH_BASE);
  signIn.searchParams.set("lang", "heb");
  signIn.searchParams.set("UIT", String(UIT));

  await followRedirectsWithJar(jar, signIn.toString(), 10);

  // Verify the session by probing a JSON endpoint.
  const probe = await fetchWithJar(
    jar,
    `${GENIZAH_BASE}/api/SelectionControlAPI/GetDivisions?levelId=1&parentIds%5B0%5D=&inProjectId=&useFtsSession=false`,
    {
      headers: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://bavli.genizah.org/?lan=heb&isPartial=False&isDoubleLogin=False",
      },
    }
  );
  if (!probe.ok) {
    const details = await probe.text();
    throw new Error(`Genizah probe failed after SSO: ${probe.status}: ${String(details || "").slice(0, 160)}`);
  }

  const cookieHeader = cookieHeaderFromJar(jar);
  if (!cookieHeader || !cookieHeader.includes(".ASPXAUTH=")) {
    // Without .ASPXAUTH you will keep getting 403 on API calls.
    throw new Error(`Genizah login did not yield auth cookies (cookies=${[...jar.keys()].join(",")})`);
  }
  genizahSessionCookie = cookieHeader;
}

function toHebrewNumber(num) {
  const ones = ["", "א", "ב", "ג", "ד", "ה", "ו", "ז", "ח", "ט"];
  const tens = ["", "י", "כ", "ל", "מ", "נ", "ס", "ע", "פ", "צ"];
  const hundreds = ["", "ק", "ר", "ש", "ת"];
  let n = Number(num) || 0;
  if (n <= 0) return "";

  let out = "";
  while (n >= 400) {
    out += "ת";
    n -= 400;
  }
  if (n >= 100) {
    const h = Math.floor(n / 100);
    out += hundreds[h];
    n %= 100;
  }
  if (n === 15) return `${out}טו`;
  if (n === 16) return `${out}טז`;
  if (n >= 10) {
    const t = Math.floor(n / 10);
    out += tens[t];
    n %= 10;
  }
  if (n > 0) out += ones[n];
  return out;
}

async function getDivisions(levelId, parentId) {
  const path = `/api/SelectionControlAPI/GetDivisions?levelId=${levelId}&parentIds%5B%5D=${encodeURIComponent(String(parentId))}&inProjectId=&useFtsSession=false`;
  return fetchGenizah(path);
}

async function saveSelectedDivision(divisionId) {
  return fetchGenizah(`/api/SelectionControlAPI/SaveSelectedDivision?value=${encodeURIComponent(String(divisionId))}`, { method: "POST" });
}

function findDivisionByDesc(divisions, expectedDesc) {
  const target = String(expectedDesc || "").trim();
  return divisions.find((d) => String(d?.Desc || "").trim() === target);
}

function extractGuid(value) {
  const text = typeof value === "string" ? value : JSON.stringify(value || "");
  const m = text.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
  return m ? m[0] : "";
}

function normalizeQuickViewUrl(filePath, fileName) {
  const p = String(filePath || "").replace(/\\\\/g, "/").replace(/\\+/g, "/");
  const n = String(fileName || "").trim();
  if (!p || !n) return "";
  if (/^https?:\/\//i.test(p)) {
    const base = p.endsWith("/") ? p : `${p}/`;
    return `${base}${encodeURIComponent(n)}_%23Q.jpg`;
  }
  return "";
}

app.get("/api/text/:ref", async (req, res) => {
  try {
    const ref = normalizeRef(req.params.ref);
    if (!ref) return res.status(400).json({ error: "Missing ref" });

    // Classic endpoint returns a stable "text"/"he" shape for page rendering.
    const url = new URL(`${SEFARIA_BASE}/api/texts/${encodeURIComponent(ref)}`);
    url.searchParams.set("context", "0");
    url.searchParams.set("commentary", "0");
    url.searchParams.set("pad", "0");

    const payload = await fetchSefariaJson(url.toString());
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch text", details: error.message });
  }
});

app.get("/api/links/:ref", async (req, res) => {
  try {
    const ref = normalizeRef(req.params.ref);
    if (!ref) return res.status(400).json({ error: "Missing ref" });

    const url = `${SEFARIA_BASE}/api/links/${encodeURIComponent(ref)}?with_text=0`;
    const payload = await fetchSefariaJson(url);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch links", details: error.message });
  }
});

app.get("/api/related/:ref", async (req, res) => {
  try {
    const ref = normalizeRef(req.params.ref);
    if (!ref) return res.status(400).json({ error: "Missing ref" });

    const url = `${SEFARIA_BASE}/api/related/${encodeURIComponent(ref)}`;
    const payload = await fetchSefariaJson(url);
    res.json(payload);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch related", details: error.message });
  }
});

app.get("/api/daf-yomi", async (_req, res) => {
  try {
    const payload = await fetchSefariaJson(`${SEFARIA_BASE}/api/calendars`);
    const ref = normalizeRef(extractDafYomiRefFromCalendars(payload));
    if (!ref) {
      return res.status(404).json({ error: "לא נמצא דף יומי בנתוני לוח ספריא" });
    }
    return res.json({ ref });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch Daf Yomi", details: error.message });
  }
});

app.get("/api/genizah/sigla", async (_req, res) => {
  try {
    const payload = await fetchGenizah("/api/DiffAPI/GetSiglaTable");
    res.json(payload);
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Genizah sigla table",
      details: error.message,
    });
  }
});

app.get("/api/genizah/blocks", async (req, res) => {
  try {
    const { divisionId } = req.query;
    if (divisionId) {
      await fetchGenizah(
        `/api/SelectionControlAPI/SaveSelectedDivision?value=${encodeURIComponent(String(divisionId))}`,
        { method: "POST" }
      );
    }

    const [blocks, joins] = await Promise.all([
      fetchGenizah("/api/DiffAPI/GetBlocks?isForDownload=false"),
      fetchGenizah("/api/DiffAPI/GetContentJoins"),
    ]);

    res.json({
      blocks,
      joins,
      usedDivisionId: divisionId || null,
      hasCookie: Boolean(genizahSessionCookie || process.env.GENIZAH_COOKIE),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to fetch Genizah blocks",
      details: error.message,
    });
  }
});

app.get("/api/genizah/blocks/by-ref", async (req, res) => {
  try {
    const tractate = String(req.query.tractate || "").trim();
    const daf = String(req.query.daf || "").trim().toLowerCase();
    const dafMatch = daf.match(/^(\d+)([ab])$/);
    if (!tractate || !dafMatch) {
      return res.status(400).json({ error: "tractate and daf (e.g. 2a) are required." });
    }

    const hebTractate = TRACTATE_HEB[tractate] || tractate;
    const dafNum = Number(dafMatch[1]);
    const amud = dafMatch[2] === "a" ? 'ע"א' : 'ע"ב';
    const hebDaf = toHebrewNumber(dafNum);

    const level1 = await fetchGenizah("/api/SelectionControlAPI/GetDivisions?levelId=1&parentIds%5B0%5D=&inProjectId=&useFtsSession=false");
    const tractateRow = findDivisionByDesc(level1, hebTractate);
    if (!tractateRow) {
      return res.status(404).json({ error: `Tractate not found in Genizah divisions: ${hebTractate}` });
    }
    await saveSelectedDivision(tractateRow.Id);

    const level2 = await getDivisions(2, tractateRow.Id);
    const dafRow = findDivisionByDesc(level2, hebDaf);
    if (!dafRow) {
      return res.status(404).json({ error: `Daf not found in Genizah divisions: ${hebDaf}` });
    }
    await saveSelectedDivision(dafRow.Id);

    const level3 = await getDivisions(3, dafRow.Id);
    const amudRow = findDivisionByDesc(level3, amud);
    if (!amudRow) {
      return res.status(404).json({ error: `Amud not found in Genizah divisions: ${amud}` });
    }
    await saveSelectedDivision(amudRow.Id);

    const [blocks, joins] = await Promise.all([
      fetchGenizah("/api/DiffAPI/GetBlocks?isForDownload=false"),
      fetchGenizah("/api/DiffAPI/GetContentJoins"),
    ]);

    res.json({
      blocks,
      joins,
      resolved: {
        tractateId: tractateRow.Id,
        dafId: dafRow.Id,
        amudId: amudRow.Id,
        tractate: hebTractate,
        daf: hebDaf,
        amud,
      },
      hasCookie: Boolean(genizahSessionCookie || process.env.GENIZAH_COOKIE),
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to resolve and fetch Genizah blocks by ref",
      details: error.message,
    });
  }
});

app.get("/api/genizah/image/by-logical-unit", async (req, res) => {
  try {
    const logicalUnitId = Number(req.query.logicalUnitId);
    const codexId = Number(req.query.codexId);
    if (!Number.isFinite(logicalUnitId) || logicalUnitId <= 0) {
      return res.status(400).json({ error: "logicalUnitId is required." });
    }

    const filesPayload = await fetchGenizah(
      `/api/DiffAPI/GetFilesByLogicalUnitId?idsJsonStr=${encodeURIComponent(`[${logicalUnitId}]`)}`
    );
    const files = Array.isArray(filesPayload?.FilesData)
      ? filesPayload.FilesData
      : Array.isArray(filesPayload?.data?.FilesData)
        ? filesPayload.data.FilesData
        : [];
    if (!files.length) return res.status(404).json({ error: "No image files found for this logical unit." });

    let selected = null;
    if (Number.isFinite(codexId) && codexId > 0) {
      selected = files.find((f) => Number(f?.CodexId) === codexId) || null;
    }
    if (!selected) selected = files[0];

    const imageFileDetailsId = selected?.ImageFileDetailsId;
    const quickViewUrl = normalizeQuickViewUrl(selected?.FilePath, selected?.FileName);

    if (imageFileDetailsId) {
      const guidPayload = await fetchGenizah(`/api/FileByIDAPI/GetGuidByFile?ImageFileDetailsId=${encodeURIComponent(String(imageFileDetailsId))}`);
      const guidNumber = extractGuid(guidPayload);
      if (guidNumber) {
        const imgResponse = await fetchGenizahRaw(
          `/api/FileByIDAPI/GetFilePathByGuid?guidNumber=${encodeURIComponent(guidNumber)}&TypeOfImage=RegularImage&delayFinalProc=true`
        );
        if (imgResponse.ok) {
          const contentType = imgResponse.headers.get("content-type") || "image/png";
          const bytes = Buffer.from(await imgResponse.arrayBuffer());
          res.setHeader("Content-Type", contentType);
          res.setHeader("Cache-Control", "private, max-age=300");
          return res.status(200).send(bytes);
        }
      }
    }

    if (quickViewUrl) {
      const quickResponse = await fetch(quickViewUrl, {
        headers: {
          Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
          Referer: "https://bavli.genizah.org/ResultPages/Difference",
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
        },
      });
      if (quickResponse.ok) {
        const contentType = quickResponse.headers.get("content-type") || "image/jpeg";
        const bytes = Buffer.from(await quickResponse.arrayBuffer());
        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=300");
        return res.status(200).send(bytes);
      }
    }

    return res.status(404).json({ error: "Could not resolve manuscript image for this logical unit." });
  } catch (error) {
    return res.status(500).json({ error: "Failed to fetch Genizah manuscript image", details: error.message });
  }
});

app.get("/api/genizah/auth-status", (_req, res) => {
  const activeCookie = genizahSessionCookie || process.env.GENIZAH_COOKIE || "";
  const source = genizahSessionCookie ? "runtime_session" : process.env.GENIZAH_COOKIE ? "env_cookie" : "none";

  // Avoid hammering the upstream on repeated UI refreshes.
  const now = Date.now();
  const cacheTtlMs = 5000;
  if (!activeCookie) {
    genizahLastAuthOk = false;
    genizahLastAuthDetails = "";
    genizahLastAuthCheckAt = now;
    return res.json({
      authenticated: false,
      source,
      hasEnvCreds: Boolean(process.env.GENIZAH_USERNAME && process.env.GENIZAH_PASSWORD),
      details: "",
    });
  }

  if (now - genizahLastAuthCheckAt < cacheTtlMs) {
    return res.json({
      authenticated: genizahLastAuthOk,
      source: genizahLastAuthOk ? source : "none",
      hasEnvCreds: Boolean(process.env.GENIZAH_USERNAME && process.env.GENIZAH_PASSWORD),
      details: genizahLastAuthOk ? "" : genizahLastAuthDetails,
    });
  }

  genizahLastAuthCheckAt = now;
  fetchGenizah("/api/SelectionControlAPI/GetDivisions?levelId=1&parentIds%5B0%5D=&inProjectId=&useFtsSession=false")
    .then(() => {
      genizahLastAuthOk = true;
      genizahLastAuthDetails = "";
      res.json({
        authenticated: true,
        source,
        hasEnvCreds: Boolean(process.env.GENIZAH_USERNAME && process.env.GENIZAH_PASSWORD),
        details: "",
      });
    })
    .catch((error) => {
      genizahLastAuthOk = false;
      genizahLastAuthDetails = error?.message || "Auth check failed";
      // If our runtime cookie is bad, clear it so the UI can re-login.
      if (source === "runtime_session") genizahSessionCookie = "";
      res.json({
        authenticated: false,
        source: "none",
        hasEnvCreds: Boolean(process.env.GENIZAH_USERNAME && process.env.GENIZAH_PASSWORD),
        details: genizahLastAuthDetails,
      });
    });
});

app.post("/api/genizah/login/env", async (_req, res) => {
  try {
    const username = String(process.env.GENIZAH_USERNAME || "").trim();
    const password = String(process.env.GENIZAH_PASSWORD || "");
    if (!username || !password) {
      return res.status(400).json({ error: "GENIZAH_USERNAME and GENIZAH_PASSWORD must be set on the server." });
    }

    const now = Date.now();
    if (now - genizahLastEnvLoginAttemptAt < 10_000) {
      return res.status(429).json({ error: "Please wait a few seconds before retrying." });
    }
    genizahLastEnvLoginAttemptAt = now;

    await loginToGenizah(username, password);
    res.json({
      ok: true,
      authenticated: true,
      source: "runtime_session",
      message: "Genizah env login succeeded.",
    });
  } catch (error) {
    genizahSessionCookie = "";
    res.status(401).json({
      error: "Genizah env login failed",
      details: error.message,
    });
  }
});

app.post("/api/genizah/login", async (req, res) => {
  try {
    const username = String(req.body?.username || "").trim();
    const password = String(req.body?.password || "");
    if (!username || !password) {
      return res.status(400).json({ error: "username and password are required." });
    }

    await loginToGenizah(username, password);
    res.json({
      ok: true,
      authenticated: true,
      source: "runtime_session",
      message: "Genizah login succeeded.",
    });
  } catch (error) {
    genizahSessionCookie = "";
    res.status(401).json({
      error: "Genizah login failed",
      details: error.message,
    });
  }
});

app.post("/api/genizah/set-cookie", async (req, res) => {
  try {
    const cookie = String(req.body?.cookie || "").trim();
    if (!cookie) {
      return res.status(400).json({ error: "cookie is required." });
    }

    const prev = genizahSessionCookie;
    genizahSessionCookie = cookie;
    try {
      await fetchGenizah("/api/SelectionControlAPI/GetDivisions?levelId=1&parentIds%5B0%5D=&inProjectId=&useFtsSession=false");
    } catch (error) {
      genizahSessionCookie = prev;
      return res.status(401).json({
        error: "Invalid or expired cookie",
        details: error.message,
      });
    }

    res.json({
      ok: true,
      authenticated: true,
      source: "runtime_session",
      message: "Genizah cookie accepted.",
    });
  } catch (error) {
    res.status(500).json({
      error: "Failed to set Genizah cookie",
      details: error.message,
    });
  }
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.listen(port, () => {
  console.log(`היישום פעיל בכתובת http://localhost:${port}`);
});
