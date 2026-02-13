import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const port = process.env.PORT || 3000;
const SEFARIA_BASE = "https://www.sefaria.org";
const GENIZAH_BASE = "https://bavli.genizah.org";
const GENIZAH_LOGIN_BASES = [GENIZAH_BASE, "https://fjms.genizah.org"];
let genizahSessionCookie = "";
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

function parseInputs(html) {
  const out = [];
  const inputRegex = /<input\b([^>]*)>/gi;
  const attrRegex = /([a-zA-Z_:][\w:.-]*)\s*=\s*["']([^"']*)["']/g;
  let m;

  while ((m = inputRegex.exec(String(html || ""))) !== null) {
    const attrs = {};
    let a;
    while ((a = attrRegex.exec(m[1])) !== null) {
      attrs[a[1].toLowerCase()] = a[2];
    }
    out.push({
      name: attrs.name || "",
      type: (attrs.type || "text").toLowerCase(),
      value: attrs.value || "",
    });
  }
  return out;
}

function parseLoginFormAction(html) {
  const formRegex = /<form\b([^>]*)>/gi;
  const attrRegex = /([a-zA-Z_:][\w:.-]*)\s*=\s*["']([^"']*)["']/g;
  let m;
  let fallbackAction = null;

  while ((m = formRegex.exec(String(html || ""))) !== null) {
    const attrs = {};
    let a;
    while ((a = attrRegex.exec(m[1])) !== null) {
      attrs[a[1].toLowerCase()] = a[2];
    }
    if (!fallbackAction && attrs.action) fallbackAction = attrs.action;
    const idName = `${attrs.id || ""} ${attrs.name || ""}`.toLowerCase();
    if (idName.includes("login")) return attrs.action || null;
  }
  return fallbackAction;
}

function findFieldCandidates(inputs, kind) {
  const out = [];
  const userRegex = /(user|email|login|identifier|name)/i;
  const passRegex = /(pass|pwd)/i;
  for (const input of inputs) {
    const name = String(input.name || "");
    if (!name) continue;
    const t = String(input.type || "").toLowerCase();
    if (kind === "user") {
      if (t === "text" || t === "email" || userRegex.test(name)) out.push(name);
    } else if (kind === "password") {
      if (t === "password" || passRegex.test(name)) out.push(name);
    }
  }
  return [...new Set(out)];
}

async function attemptLoginOnBase(baseUrl, jar, username, password) {
  const loginUrl = `${baseUrl}/Account/Login`;
  const pageResponse = await followRedirectsWithJar(jar, loginUrl);
  const html = await pageResponse.text();
  const inputs = parseInputs(html);

  const formAction = parseLoginFormAction(html) || "/Account/Login";
  const postUrl = new URL(formAction, baseUrl).toString();

  const form = new URLSearchParams();
  for (const input of inputs) {
    if (!input.name || input.type !== "hidden") continue;
    form.set(input.name, input.value || "");
  }

  const userFields = findFieldCandidates(inputs, "user");
  const passFields = findFieldCandidates(inputs, "password");
  for (const field of userFields) form.set(field, username);
  for (const field of passFields) form.set(field, password);
  if (!userFields.length) {
    for (const f of ["UserName", "Username", "Email", "Login", "userName", "username", "email"]) {
      form.set(f, username);
    }
  }
  if (!passFields.length) {
    for (const f of ["Password", "password", "Passwd"]) {
      form.set(f, password);
    }
  }
  if (!form.has("RememberMe")) form.set("RememberMe", "false");
  if (!form.has("rememberMe")) form.set("rememberMe", "false");

  const loginResponse = await fetchWithJar(jar, postUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: getOrigin(postUrl),
      Referer: loginUrl,
    },
    body: form.toString(),
  });
  if (loginResponse.status >= 300 && loginResponse.status < 400) {
    const location = loginResponse.headers.get("location");
    if (location) {
      await followRedirectsWithJar(jar, new URL(location, postUrl).toString());
    }
  }
  return {
    baseUrl,
    status: loginResponse.status,
    cookies: [...jar.keys()],
  };
}

async function loginToGenizah(username, password) {
  const diagnostics = [];
  let winningJar = null;
  let winningMeta = null;

  for (const baseUrl of GENIZAH_LOGIN_BASES) {
    const jar = new Map();
    try {
      const meta = await attemptLoginOnBase(baseUrl, jar, username, password);
      const probeResponse = await fetchWithJar(
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

      if (probeResponse.ok) {
        winningJar = jar;
        winningMeta = meta;
        break;
      }

      const details = await probeResponse.text();
      diagnostics.push(
        `${baseUrl}: probe ${probeResponse.status}, cookies=${meta.cookies.join(",")}, body=${String(details || "").slice(0, 120)}`
      );
    } catch (error) {
      diagnostics.push(`${baseUrl}: ${error.message}`);
    }
  }

  if (!winningJar) {
    throw new Error(`Login probe failed on all known domains. ${diagnostics.join(" | ")}`);
  }

  const cookieHeader = cookieHeaderFromJar(winningJar);
  if (!cookieHeader) {
    throw new Error(`No session cookie received from successful probe loginBase=${winningMeta?.baseUrl || "unknown"}`);
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

app.get("/api/genizah/auth-status", (_req, res) => {
  res.json({
    authenticated: Boolean(genizahSessionCookie || process.env.GENIZAH_COOKIE),
    source: genizahSessionCookie ? "runtime_session" : process.env.GENIZAH_COOKIE ? "env_cookie" : "none",
  });
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
