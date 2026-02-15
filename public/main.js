const loadForm = document.getElementById("loadForm");
const tractateSelect = document.getElementById("tractateSelect");
const dafSelect = document.getElementById("dafSelect");
const genizahLoginForm = document.getElementById("genizahLoginForm");
const genizahUsernameEl = document.getElementById("genizahUsername");
const genizahPasswordEl = document.getElementById("genizahPassword");
const genizahLoginBtn = document.getElementById("genizahLoginBtn");
const genizahCookieEl = document.getElementById("genizahCookie");
const genizahCookieBtn = document.getElementById("genizahCookieBtn");
const genizahAuthStatusEl = document.getElementById("genizahAuthStatus");
const statusEl = document.getElementById("status");
const dafTitleEl = document.getElementById("dafTitle");
const openSefariaEl = document.getElementById("openSefaria");
const textMetaEl = document.getElementById("textMeta");
const segmentsEl = document.getElementById("segments");

const commentaryCountsEl = document.getElementById("commentaryCounts");
const commentaryListEl = document.getElementById("commentaryList");
const genizahListEl = document.getElementById("genizahList");
const halakhaListEl = document.getElementById("halakhaList");
const tanakhListEl = document.getElementById("tanakhList");
const sageTooltipEl = document.createElement("div");
sageTooltipEl.className = "sage-tooltip-floating";
document.body.appendChild(sageTooltipEl);

let currentRef = "Berakhot.2a";
let lockedSegmentIndex = null;
let segmentCommentaryMap = new Map();
let segmentHalakhaMap = new Map();
let pageTanakhRefs = [];
let pageMeiriRefs = [];
let genizahGroups = [];
let currentSegments = [];
let genizahSegmentToGroup = new Map();
let commentaryCategory = "rt"; // rt | rishonim | acharonim | meiri
let commentaryToken = 0;
let halakhaToken = 0;
let tanakhToken = 0;
const refTextCache = new Map();
const SAGE_INFO = [
  { name: "רבן יוחנן בן זכאי", aliases: ["רבן יוחנן בן זכאי"], generation: "דור א׳ לתנאים", yeshiva: "יבנה" },
  { name: "רבן גמליאל", aliases: ["רבן גמליאל", "רבן גמליאל דיבנה"], generation: "דור ב׳ לתנאים", yeshiva: "יבנה" },
  { name: "רבי אליעזר", aliases: ["רבי אליעזר", "רבי אליעזר בן הורקנוס"], generation: "דור ב׳ לתנאים", yeshiva: "לוד / יבנה" },
  { name: "רבי יהושע", aliases: ["רבי יהושע", "רבי יהושע בן חנניה"], generation: "דור ב׳ לתנאים", yeshiva: "יבנה" },
  { name: "רבי אלעזר בן עזריה", aliases: ["רבי אלעזר בן עזריה"], generation: "דור ג׳ לתנאים", yeshiva: "יבנה" },
  { name: "רבי טרפון", aliases: ["רבי טרפון"], generation: "דור ג׳ לתנאים", yeshiva: "לוד" },
  { name: "רבי עקיבא", aliases: ["רבי עקיבא", "ר\"ע"], generation: "דור ג׳ לתנאים", yeshiva: "בני ברק" },
  { name: "רבי ישמעאל", aliases: ["רבי ישמעאל", "רבי ישמעאל בן אלישע"], generation: "דור ג׳ לתנאים", yeshiva: "דרום" },
  { name: "רבי מאיר", aliases: ["רבי מאיר"], generation: "דור ד׳ לתנאים", yeshiva: "אושא / טבריה" },
  { name: "רבי יהודה", aliases: ["רבי יהודה", "רבי יהודה בר אילעי"], generation: "דור ד׳ לתנאים", yeshiva: "אושא" },
  { name: "רבי יוסי", aliases: ["רבי יוסי", "רבי יוסי בן חלפתא"], generation: "דור ד׳ לתנאים", yeshiva: "ציפורי" },
  { name: "רבי שמעון בר יוחאי", aliases: ["רבי שמעון בר יוחאי", "רשב\"י", "רבי שמעון"], generation: "דור ד׳ לתנאים", yeshiva: "גליל / מירון" },
  { name: "רבי נחמיה", aliases: ["רבי נחמיה"], generation: "דור ד׳ לתנאים", yeshiva: "אושא" },
  { name: "רבי אלעזר בן שמוע", aliases: ["רבי אלעזר בן שמוע"], generation: "דור ד׳ לתנאים", yeshiva: "לוד" },
  { name: "רבי יהודה הנשיא", aliases: ["רבי יהודה הנשיא", "רבינו הקדוש"], generation: "דור ה׳ לתנאים", yeshiva: "ציפורי / בית שערים" },
  { name: "רבי יצחק", aliases: ["רבי יצחק"], generation: "אמורא (שם משותף למספר חכמים)", yeshiva: "ארץ ישראל / בבל (תלוי בהקשר)" },
  { name: "רבי לוי בר חמא", aliases: ["רבי לוי בר חמא"], generation: "דור ב׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי יוחנן", aliases: ["רבי יוחנן", "רבי יוחנן בר נפחא"], generation: "דור ב׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  {
    name: "רבי שמעון בן לקיש",
    aliases: ["רבי שמעון בן לקיש", "ריש לקיש", "בן לקיש", "בר לקיש"],
    generation: "דור ב׳ לאמוראי ארץ ישראל",
    yeshiva: "טבריה"
  },
  { name: "רבי אלעזר", aliases: ["רבי אלעזר", "רבי אלעזר בן פדת"], generation: "דור ב׳-ג׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי אבהו", aliases: ["רבי אבהו"], generation: "דור ג׳ לאמוראי ארץ ישראל", yeshiva: "קיסריה" },
  { name: "רבי אמי", aliases: ["רבי אמי"], generation: "דור ג׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי אסי", aliases: ["רבי אסי"], generation: "דור ג׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי חנינא", aliases: ["רבי חנינא"], generation: "דור ג׳ לאמוראי ארץ ישראל", yeshiva: "ציפורי / טבריה" },
  { name: "רבי זירא", aliases: ["רבי זירא", "רבי זעירא"], generation: "דור ג׳-ד׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי ירמיה", aliases: ["רבי ירמיה"], generation: "דור ד׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי יצחק נפחא", aliases: ["רבי יצחק נפחא", "רבי יצחק"], generation: "דור ב׳-ג׳ לאמוראי ארץ ישראל", yeshiva: "טבריה / קיסריה" },
  { name: "רבי חייא בר אבא", aliases: ["רבי חייא בר אבא"], generation: "דור ב׳-ג׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי שמואל בר נחמני", aliases: ["רבי שמואל בר נחמני"], generation: "דור ג׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי תנחום", aliases: ["רבי תנחום"], generation: "דור ג׳-ד׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי מנא", aliases: ["רבי מנא"], generation: "דור ד׳ לאמוראי ארץ ישראל", yeshiva: "טבריה" },
  { name: "רבי אחא ברבי חנינא", aliases: ["רבי אחא ברבי חנינא", "רבי אחא בר חנינא"], generation: "דור ג׳ לאמוראי ארץ ישראל", yeshiva: "טבריה / קיסריה" },
  { name: "רבי אחא", aliases: ["רבי אחא", "רבי אחא בר יעקב"], generation: "דור ד׳-ה׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב", aliases: ["רב", "רב אבא אריכא"], generation: "דור א׳ לאמוראי בבל", yeshiva: "סורא" },
  { name: "שמואל", aliases: ["שמואל", "מר שמואל"], generation: "דור א׳ לאמוראי בבל", yeshiva: "נהרדעא" },
  { name: "רב כהנא", aliases: ["רב כהנא"], generation: "דור ב׳-ג׳ לאמוראי בבל", yeshiva: "סורא / פומבדיתא" },
  { name: "רב שמואל בר יהודה", aliases: ["רב שמואל בר יהודה"], generation: "דור ג׳ לאמוראי בבל", yeshiva: "נהרדעא" },
  { name: "רב יהודה", aliases: ["רב יהודה", "רב יהודה אמר שמואל", "רב יהודה בר יחזקאל"], generation: "דור ב׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב הונא", aliases: ["רב הונא"], generation: "דור ב׳ לאמוראי בבל", yeshiva: "סורא" },
  { name: "רב הונא בריה דרב יהושע", aliases: ["רב הונא בריה דרב יהושע"], generation: "דור ה׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב חסדא", aliases: ["רב חסדא"], generation: "דור ב׳-ג׳ לאמוראי בבל", yeshiva: "סורא" },
  { name: "רב ששת", aliases: ["רב ששת"], generation: "דור ג׳ לאמוראי בבל", yeshiva: "נהרדעא / פומבדיתא" },
  { name: "רב נחמן בר יצחק", aliases: ["רב נחמן בר יצחק"], generation: "דור ד׳-ה׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב חמא בר גוריא", aliases: ["רב חמא בר גוריא"], generation: "דור ג׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב דימי מנהרדעא", aliases: ["רב דימי מנהרדעא", "רב דימי"], generation: "דור ד׳ לאמוראי בבל", yeshiva: "נהרדעא" },
  { name: "רבין", aliases: ["רבין"], generation: "דור ד׳-ה׳ לאמוראי בבל", yeshiva: "בבל / ארץ ישראל" },
  { name: "רבה", aliases: ["רבה", "רבה בר נחמני"], generation: "דור ד׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב יוסף", aliases: ["רב יוסף"], generation: "דור ג׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב נחמן", aliases: ["רב נחמן", "רב נחמן בר יעקב"], generation: "דור ב׳-ג׳ לאמוראי בבל", yeshiva: "נהרדעא" },
  { name: "רבה בר בר חנה", aliases: ["רבה בר בר חנה"], generation: "דור ג׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רמי בר חמא", aliases: ["רמי בר חמא"], generation: "דור ג׳-ד׳ לאמוראי בבל", yeshiva: "מחוזא" },
  { name: "אביי", aliases: ["אביי"], generation: "דור ד׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רבא", aliases: ["רבא"], generation: "דור ד׳ לאמוראי בבל", yeshiva: "מחוזא" },
  { name: "רב נחמן בר יצחק", aliases: ["רב נחמן בר יצחק"], generation: "דור ד׳-ה׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב פפא", aliases: ["רב פפא"], generation: "דור ה׳ לאמוראי בבל", yeshiva: "נרש" },
  { name: "רב אחא בר יעקב", aliases: ["רב אחא בר יעקב"], generation: "דור ד׳-ה׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב גידל", aliases: ["רב גידל"], generation: "דור ג׳-ד׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב שמן בר אבא", aliases: ["רב שמן בר אבא"], generation: "דור ג׳-ד׳ לאמוראי בבל", yeshiva: "פומבדיתא" },
  { name: "רב הונא בר יהודה", aliases: ["רב הונא בר יהודה"], generation: "דור ה׳ לאמוראי בבל", yeshiva: "מחוזא" },
  { name: "רב אשי", aliases: ["רב אשי"], generation: "דור ו׳ לאמוראי בבל", yeshiva: "סורא" },
  { name: "רבינא", aliases: ["רבינא", "רבינא ורב אשי"], generation: "דור ו׳-ז׳ לאמוראי בבל", yeshiva: "סורא" },
  { name: "מר זוטרא", aliases: ["מר זוטרא"], generation: "דור ו׳-ז׳ לאמוראי בבל", yeshiva: "מחוזא / סורא" },
];

const TRACTATE_MAX_DAF = {
  Berakhot: 64,
  Shabbat: 157,
  Eruvin: 105,
  Pesachim: 121,
  Yoma: 88,
  Sukkah: 56,
  Beitzah: 40,
  Rosh_Hashanah: 35,
  Taanit: 31,
  Megillah: 32,
  Moed_Katan: 29,
  Chagigah: 27,
  Yevamot: 122,
  Ketubot: 112,
  Nedarim: 91,
  Nazir: 66,
  Sotah: 49,
  Gittin: 90,
  Kiddushin: 82,
  Bava_Kamma: 119,
  Bava_Metzia: 119,
  Bava_Batra: 176,
  Sanhedrin: 113,
  Makkot: 24,
  Shevuot: 49,
  Avodah_Zarah: 76,
  Horayot: 14,
  Zevachim: 120,
  Menachot: 110,
  Chullin: 142,
  Bekhorot: 61,
  Arakhin: 34,
  Temurah: 34,
  Keritot: 28,
  Meilah: 22,
  Kinnim: 3,
  Tamid: 10,
  Middot: 4,
  Niddah: 73,
};

function setStatus(message) {
  statusEl.textContent = message;
}

function setGenizahAuthStatus(message, connected = false) {
  genizahAuthStatusEl.textContent = message;
  genizahAuthStatusEl.classList.toggle("connected", connected);
}

function normalizeRef(rawRef) {
  return String(rawRef || "").trim().replace(/\s+/g, "_");
}

function getArray(payload, keys) {
  for (const key of keys) {
    if (Array.isArray(payload?.[key])) return payload[key];
    if (Array.isArray(payload?.data?.[key])) return payload.data[key];
  }
  return [];
}

function canonicalRef(rawRef) {
  return String(rawRef || "")
    .toLowerCase()
    .replace(/[_\.]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function refMatchesBaseDaf(ref, baseRef) {
  // Ensure the linked source is actually on this daf/amud.
  // Example: baseRef="Berakhot.2a" => canonical "berakhot 2a"
  // Reject: "Meiri on Berakhot 14" when base is "Berakhot 2a".
  const base = canonicalRef(baseRef);
  const src = canonicalRef(ref);
  if (!base || !src) return false;
  return src.includes(base);
}

function isMeiriRef(ref) {
  return canonicalRef(ref).startsWith("meiri on ");
}

function safeHtml(text) {
  return String(text || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function decodeHtmlEntities(text) {
  const value = String(text || "");
  if (!value.includes("&")) return value;
  const textarea = document.createElement("textarea");
  textarea.innerHTML = value;
  return textarea.value;
}

function normalizeDisplayText(text) {
  return String(text || "")
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ")
    .replace(/[\u200B-\u200F\u202A-\u202E\u2060-\u206F\uFEFF]/g, "")
    .replace(/\uFFFD/g, "")
    .replace(/\u00A0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeRegExp(text) {
  return String(text || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function segmentIndexFromRef(ref, baseRef) {
  // Extract the segment index from a source ref when it is explicit, e.g.:
  // "Rashi on Berakhot 2a:3" -> 3 (for baseRef "Berakhot.2a")
  const src = canonicalRef(ref);
  const base = canonicalRef(baseRef);
  if (!src || !base) return null;
  const re = new RegExp(`${escapeRegExp(base)}:(\\d+)`, "i");
  const m = src.match(re);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function buildHebrewFlexiblePattern(text) {
  const HEBREW_LETTER = /[\u05D0-\u05EA]/;
  const MARKS = "[\\u0591-\\u05C7]*";
  let pattern = "";

  for (const ch of String(text || "")) {
    if (HEBREW_LETTER.test(ch)) {
      pattern += `${escapeRegExp(ch)}${MARKS}`;
    } else if (/\s/.test(ch)) {
      pattern += "\\s+";
    } else {
      pattern += escapeRegExp(ch);
    }
  }

  return pattern;
}

function generateAliasVariants(alias) {
  const base = String(alias || "").trim();
  if (!base) return [];
  const variants = new Set([base]);

  if (base.includes(" בן ")) variants.add(base.replace(/ בן /g, " בר "));
  if (base.includes(" בר ")) variants.add(base.replace(/ בר /g, " בן "));
  if (base.startsWith("רבי ")) {
    variants.add(base.replace(/^רבי\s+/, "ר' "));
    variants.add(base.replace(/^רבי\s+/, "ר׳ "));
  }
  if (base.startsWith("רב ")) {
    variants.add(base.replace(/^רב\s+/, "ר' "));
    variants.add(base.replace(/^רב\s+/, "ר׳ "));
  }

  return [...variants];
}

function isHebrewLetterOrMark(ch) {
  return /[\u05D0-\u05EA\u0591-\u05C7]/.test(ch || "");
}

function stripFormatting(text) {
  return normalizeDisplayText(
    decodeHtmlEntities(String(text || ""))
    .replace(/<[^>]*>/g, " ")
  );
}

function normalizeHebrewForMatch(text) {
  return String(text || "")
    .replace(/[\u0591-\u05C7]/g, "")
    .replace(/[^\u05D0-\u05EA\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function hebrewTokens(text, maxTokens = 32) {
  const tokens = normalizeHebrewForMatch(text).split(" ").filter(Boolean);
  return tokens.slice(0, maxTokens);
}

function enrichSageMentionsHtml(text) {
  const input = String(text || "");
  if (!input) return "";

  const sagePatterns = [];
  for (const sage of SAGE_INFO) {
    const variants = Array.isArray(sage.aliases) && sage.aliases.length ? sage.aliases : [sage.name];
    for (const variant of variants) {
      for (const v of generateAliasVariants(variant)) {
        sagePatterns.push({ sage, variant: v });
      }
    }
  }
  sagePatterns.sort((a, b) => b.variant.length - a.variant.length);

  const candidates = [];

  for (const entry of sagePatterns) {
    const regex = new RegExp(buildHebrewFlexiblePattern(entry.variant), "gu");
    let m;
    while ((m = regex.exec(input)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;
      const prev = start > 0 ? input[start - 1] : "";
      const next = end < input.length ? input[end] : "";

      // Prevent partial-name matches like "רב" inside "רבי ...".
      if (isHebrewLetterOrMark(prev) || isHebrewLetterOrMark(next)) {
        continue;
      }

      candidates.push({
        start,
        end,
        sage: entry.sage,
      });
    }
  }

  candidates.sort((a, b) => (a.start - b.start) || (b.end - a.end));
  const picks = [];
  let cursor = 0;
  for (const c of candidates) {
    if (c.start < cursor) continue;
    picks.push(c);
    cursor = c.end;
  }

  if (!picks.length) return safeHtml(input);

  let html = "";
  let i = 0;
  for (const p of picks) {
    html += safeHtml(input.slice(i, p.start));
    const tip = `${p.sage.name} | ${p.sage.generation} | ישיבה: ${p.sage.yeshiva}`;
    html += `<span class="sage-mention" title="${safeHtml(tip)}" data-sage-tip="${safeHtml(tip)}">${safeHtml(input.slice(p.start, p.end))}</span>`;
    i = p.end;
  }
  html += safeHtml(input.slice(i));
  return html;
}

function showSageTooltip(text, clientX, clientY) {
  if (!text) return;
  sageTooltipEl.textContent = text;
  sageTooltipEl.style.display = "block";
  positionSageTooltip(clientX, clientY);
}

function hideSageTooltip() {
  sageTooltipEl.style.display = "none";
}

function positionSageTooltip(clientX, clientY) {
  if (sageTooltipEl.style.display === "none") return;

  const margin = 12;
  const rect = sageTooltipEl.getBoundingClientRect();
  let left = clientX + margin;
  let top = clientY - rect.height - margin;

  if (left + rect.width > window.innerWidth - margin) {
    left = window.innerWidth - rect.width - margin;
  }
  if (left < margin) left = margin;

  if (top < margin) {
    top = clientY + margin;
  }
  if (top + rect.height > window.innerHeight - margin) {
    top = window.innerHeight - rect.height - margin;
  }

  sageTooltipEl.style.left = `${left}px`;
  sageTooltipEl.style.top = `${top}px`;
}

function truncateText(text, maxLen = 240) {
  if (!text) return "";
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

function shouldIgnoreText(text) {
  return stripFormatting(text) === "אין טקסט זמין";
}

function normalizeGenizahText(text) {
  let value = decodeHtmlEntities(String(text || ""));
  value = value
    .replace(/@[A-Z]/g, "")
    .replace(/E\[[^\]]*\]/g, " ")
    .replace(/B\[\[([^\]]*)\]\]/g, "$1")
    .replace(/G\[([^\]]*)\]/g, "$1")
    .replace(/M<([^>]*)>/g, "$1")
    .replace(/D\(([^)]*)\)/g, "$1")
    .replace(/T\(\(([^)]*)\)\)\{([^}]*)\}/g, "$2")
    .replace(/\{([^}]*)\}/g, "$1")
    .replace(/I\?([^?]{1,20})\?/g, "$1")
    .replace(/J\?([^?]{1,20})\?/g, "$1")
    // Strip Genizah control tokens like "P+נ\"א", "PBובא+", "PGאורו+" that leak into display.
    .replace(/\bP\+[^\s]{1,30}/g, " ")
    .replace(/\bP[BG][^\s+]{1,40}\+/g, " ")
    .replace(/\bP[BG]\+/g, " ")
    .replace(/\bG[IJ]?\+?/g, " ")
    .replace(/[A-Za-z]+/g, " ")
    .replace(/\+/g, " ")
    // Some payloads include single-letter control markers (e.g. "D", ":N") that shouldn't be displayed.
    .replace(/:([A-Z])\b/g, "")
    .replace(/\b[A-Z]\b/g, "")
    .replace(/\s*\|\s*/g, " ")
    .replace(/[()[\]{}]/g, " ")
    .replace(/\.+/g, " ");
  return stripFormatting(value);
}

function isMostlyPlaceholderText(text) {
  const clean = String(text || "").trim();
  if (!clean) return true;
  const hebrewLetters = (clean.match(/[\u05D0-\u05EA]/g) || []).length;
  return hebrewLetters < 10;
}

function isSteinsaltzRef(ref) {
  const raw = String(ref || "");
  const normalized = canonicalRef(ref);
  return normalized.includes("steinsaltz") || raw.includes("שטיינזלץ");
}

function commentaryPriority(ref) {
  const n = canonicalRef(ref);
  // Prefer Rashi, then Tosafot, then the rest.
  // Keep this strict: only actual "Rashi on ..." and "Tosafot on ...".
  // Do NOT include "Piskei Tosafot" or "Tosafot Yom Tov" in the Tosafot bucket.
  if (n.startsWith("rashi on ")) return 0;
  if (n.startsWith("tosafot on ")) return 1;
  return 2;
}

function isStrictRashiRef(ref) {
  return canonicalRef(ref).startsWith("rashi on ");
}

function isStrictTosafotRef(ref) {
  return canonicalRef(ref).startsWith("tosafot on ");
}

function commentaryCategoryOfRef(ref) {
  const n = canonicalRef(ref);
  if (isStrictRashiRef(ref) || isStrictTosafotRef(ref)) return "rt";

  if (n.startsWith("meiri on ")) return "meiri";

  // Rishonim (11th–15th c.) – name-based heuristic for Sefaria refs.
  const rishonimStarts = [
    "rif on ",
    "rosh on ",
    "rabbeinu chananel on ",
    "ramban on ",
    "rashba on ",
    "ritva on ",
    "ran on ",
    "meiri on ",
    "tosafot rid on ",
    "mordechai on ",
    "nimmukei yosef on ",
    "piskei tosafot on ",
    "or zarua on ",
  ];
  if (rishonimStarts.some((p) => n.startsWith(p))) return "rishonim";

  // Acharonim (16th c. and later)
  const acharonimStarts = [
    "maharsha on ",
    "maharam on ",
    "maharam shif on ",
    "pnei yehoshua on ",
    "korban netanel on ",
    "hidushei agadot on ",
    "hidushei halakhot on ",
    "chiddushei chatam sofer on ",
    "ben yehoyada on ",
    "gilyonei hashas on ",
  ];
  if (acharonimStarts.some((p) => n.startsWith(p))) return "acharonim";

  // Default bucket for unknowns.
  return "acharonim";
}

function filterCommentaryRefsByCategory(segmentRefs, category, meiriRefs) {
  if (category === "meiri") return Array.isArray(meiriRefs) ? meiriRefs : [];
  if (!Array.isArray(segmentRefs) || !segmentRefs.length) return [];
  return segmentRefs.filter((r) => commentaryCategoryOfRef(r) === category);
}

function renderCommentaryCategoryChips(segmentRefs, meiriRefs) {
  const counts = { rt: 0, rishonim: 0, acharonim: 0, meiri: 0 };
  for (const ref of segmentRefs || []) {
    const cat = commentaryCategoryOfRef(ref);
    if (cat in counts) counts[cat] += 1;
  }
  counts.meiri = Array.isArray(meiriRefs) ? meiriRefs.length : 0;

  // Auto-fallback if the currently selected category has no refs for this sentence.
  if (counts[commentaryCategory] === 0) {
    if (counts.rt) commentaryCategory = "rt";
    else if (counts.rishonim) commentaryCategory = "rishonim";
    else if (counts.acharonim) commentaryCategory = "acharonim";
    else if (counts.meiri) commentaryCategory = "meiri";
  }

  const chips = [
    { id: "rt", label: `רש״י ותוספות`, count: counts.rt },
    { id: "rishonim", label: `ראשונים`, count: counts.rishonim },
    { id: "acharonim", label: `אחרונים`, count: counts.acharonim },
    { id: "meiri", label: `מאירי`, count: counts.meiri },
  ];

  commentaryCountsEl.innerHTML = "";
  for (const c of chips) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = `chip chip-filter${commentaryCategory === c.id ? " active" : ""}`;
    btn.dataset.cat = c.id;
    btn.textContent = `${c.label} (${c.count})`;
    btn.disabled = c.count === 0;
    btn.addEventListener("click", () => {
      commentaryCategory = c.id;
      void renderPanelsForSegment(lockedSegmentIndex || null, Boolean(lockedSegmentIndex));
    });
    commentaryCountsEl.appendChild(btn);
  }
}

function sortCommentaryRefs(refs) {
  return [...refs].sort((a, b) => {
    const pa = commentaryPriority(a);
    const pb = commentaryPriority(b);
    if (pa !== pb) return pa - pb;
    return canonicalRef(a).localeCompare(canonicalRef(b));
  });
}

function isRashiRef(ref) {
  return isStrictRashiRef(ref);
}

function rashiGroupKey(ref) {
  const normalized = String(ref || "").trim();
  const match = normalized.match(/^(Rashi on .+?:\d+)(?::\d+)?$/i);
  if (!match) return normalized;
  return match[1];
}

function rashiOrderNumber(ref) {
  const match = String(ref || "").match(/:(\d+)\s*$/);
  return match ? Number(match[1]) : 0;
}

function buildCommentaryItems(refs) {
  const tosafotSingles = [];
  const otherSingles = [];
  const rashiGroups = new Map();

  for (const ref of sortCommentaryRefs(refs)) {
    if (isRashiRef(ref)) {
      const key = rashiGroupKey(ref);
      if (!rashiGroups.has(key)) rashiGroups.set(key, []);
      rashiGroups.get(key).push(ref);
    } else if (commentaryPriority(ref) === 1) {
      tosafotSingles.push({ kind: "single", refs: [ref] });
    } else {
      otherSingles.push({ kind: "single", refs: [ref] });
    }
  }

  const rashiItems = [];
  for (const [key, groupRefs] of rashiGroups.entries()) {
    const ordered = [...new Set(groupRefs)].sort((a, b) => rashiOrderNumber(a) - rashiOrderNumber(b));
    rashiItems.push({ kind: "rashi-group", key, refs: ordered });
  }

  // Strict ordering: Rashi -> Tosafot -> other commentaries.
  return [...rashiItems, ...tosafotSingles, ...otherSingles];
}

function flattenTextLeaves(value, out = []) {
  if (Array.isArray(value)) {
    for (const v of value) flattenTextLeaves(v, out);
    return out;
  }
  if (typeof value === "string" && value.trim()) out.push(value);
  return out;
}

function formatDiburHamatchilHtml(text) {
  const clean = stripFormatting(text);
  if (!clean) return "";

  const delimiters = [" - ", " — ", ": "];
  let splitAt = -1;
  let used = "";
  for (const d of delimiters) {
    const idx = clean.indexOf(d);
    if (idx !== -1 && (splitAt === -1 || idx < splitAt)) {
      splitAt = idx;
      used = d;
    }
  }

  if (splitAt <= 0 || splitAt > 90) {
    return safeHtml(clean);
  }

  const dh = clean.slice(0, splitAt).trim();
  const rest = clean.slice(splitAt + used.length).trim();
  if (!dh || !rest) return safeHtml(clean);
  if (dh.split(/\s+/).length > 8) return safeHtml(clean);

  return `<strong>${safeHtml(dh)}</strong> ${safeHtml(rest)}`;
}

function pickHebrewLines(textPayload) {
  const candidates = [
    textPayload?.he,
    textPayload?.heText,
    textPayload?.he_text,
  ];
  if (Array.isArray(textPayload?.versions)) {
    for (const version of textPayload.versions) {
      candidates.push(version?.he, version?.heText);
    }
  }

  let best = [];
  for (const candidate of candidates) {
    const flat = flattenTextLeaves(candidate, []).map(stripFormatting).filter(Boolean);
    if (flat.length > best.length) best = flat;
  }
  return best;
}

function extractSegments(textPayload) {
  const lines = pickHebrewLines(textPayload);
  return lines.map((line, idx) => ({ index: idx + 1, he: line }));
}

function displayTractateName(tractate) {
  const names = {
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
  return names[tractate] || tractate.replace(/_/g, " ");
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

function parseRefParts(rawRef) {
  const normalized = normalizeRef(rawRef).replace(/:/g, ".");
  const match = normalized.match(/^([A-Za-z_]+)[.\s_]+(\d+[ab])$/i);
  if (!match) return null;
  return { tractate: match[1], daf: match[2].toLowerCase() };
}

function buildRef() {
  return `${tractateSelect.value}.${dafSelect.value}`;
}

function populateTractateOptions() {
  tractateSelect.innerHTML = "";
  for (const tractate of Object.keys(TRACTATE_MAX_DAF)) {
    const option = document.createElement("option");
    option.value = tractate;
    option.textContent = displayTractateName(tractate);
    tractateSelect.appendChild(option);
  }
}

function populateDafOptions(tractate, selected = "2a") {
  const max = TRACTATE_MAX_DAF[tractate] || 176;
  dafSelect.innerHTML = "";
  for (let daf = 2; daf <= max; daf += 1) {
    for (const side of ["a", "b"]) {
      const value = `${daf}${side}`;
      const option = document.createElement("option");
      option.value = value;
      const amud = side === "a" ? "א" : "ב";
      option.textContent = `דף ${toHebrewNumber(daf)} עמוד ${amud}`;
      dafSelect.appendChild(option);
    }
  }
  const exists = [...dafSelect.options].some((o) => o.value === selected);
  dafSelect.value = exists ? selected : "2a";
}

function extractLinkRefs(linkItem) {
  const refs = [];
  if (Array.isArray(linkItem?.refs)) refs.push(...linkItem.refs);
  if (typeof linkItem?.ref === "string") refs.push(linkItem.ref);
  if (typeof linkItem?.anchorRef === "string") refs.push(linkItem.anchorRef);
  if (typeof linkItem?.sourceRef === "string") refs.push(linkItem.sourceRef);
  if (typeof linkItem?.sourceHeRef === "string") refs.push(linkItem.sourceHeRef);
  if (Array.isArray(linkItem?.anchorRefExpanded)) refs.push(...linkItem.anchorRefExpanded);
  if (Array.isArray(linkItem?.sourceRefExpanded)) refs.push(...linkItem.sourceRefExpanded);
  return [...new Set(refs.filter(Boolean))];
}

function extractAnchorRefs(linkItem, baseRef) {
  const refs = [];
  if (typeof linkItem?.anchorRef === "string") refs.push(linkItem.anchorRef);
  if (Array.isArray(linkItem?.anchorRefExpanded)) refs.push(...linkItem.anchorRefExpanded);

  const base = canonicalRef(baseRef);
  for (const ref of extractLinkRefs(linkItem)) {
    if (canonicalRef(ref).startsWith(base)) refs.push(ref);
  }
  return [...new Set(refs.filter(Boolean))];
}

function extractSourceRefs(linkItem, baseRef) {
  const explicit = [];
  if (typeof linkItem?.sourceRef === "string") explicit.push(linkItem.sourceRef);
  if (Array.isArray(linkItem?.sourceRefExpanded)) explicit.push(...linkItem.sourceRefExpanded);
  if (explicit.length) return [...new Set(explicit.filter(Boolean))];

  const anchors = new Set(extractAnchorRefs(linkItem, baseRef).map(canonicalRef));
  return extractLinkRefs(linkItem).filter((ref) => !anchors.has(canonicalRef(ref)));
}

function extractOtherRef(linkItem, baseRef) {
  const sourceRefs = extractSourceRefs(linkItem, baseRef);
  return sourceRefs[0] || null;
}

function segmentPrefix(baseRef, idx) {
  return canonicalRef(`${baseRef}:${idx}`);
}

function isCommentaryLink(linkItem, sourceRef) {
  const candidates = [linkItem?.category, linkItem?.linkType, linkItem?.type]
    .map((x) => String(x || "").toLowerCase());
  const categoryIsCommentary = candidates.some((x) => x.includes("commentary") || x.includes("מפרש"));
  if (!categoryIsCommentary) return false;
  if (!sourceRef) return false;
  if (isSteinsaltzRef(sourceRef)) return false;
  return true;
}

function isMishnehTorahRef(ref) {
  const raw = String(ref || "");
  const normalized = canonicalRef(ref);
  return (
    normalized.includes("mishneh torah") ||
    raw.includes("משנה תורה") ||
    raw.includes("רמב\"ם") ||
    raw.includes("רמב״ם")
  );
}

function isHalakhahLink(linkItem) {
  const candidates = [linkItem?.category, linkItem?.linkType, linkItem?.type]
    .map((x) => String(x || "").toLowerCase());
  return candidates.some((x) =>
    x.includes("halakh") ||
    x.includes("halacha") ||
    x.includes("הלכה") ||
    x.includes("הלכות")
  );
}

function isTanakhLink(linkItem, sourceRef) {
  const candidates = [linkItem?.category, linkItem?.linkType, linkItem?.type]
    .map((x) => String(x || "").toLowerCase());
  if (candidates.some((x) => x.includes("tanakh") || x.includes("bible") || x.includes("תנ"))) {
    return true;
  }
  const normalized = canonicalRef(sourceRef);
  return ["genesis", "exodus", "leviticus", "numbers", "deuteronomy"].some((b) => normalized.startsWith(b));
}

function buildReferenceMaps(baseRef, links, segmentCount) {
  const commentarySets = new Map();
  const halakhaSets = new Map();
  for (let i = 1; i <= segmentCount; i += 1) {
    commentarySets.set(i, new Set());
    halakhaSets.set(i, new Set());
  }

  const tanakhSet = new Set();
  const meiriSet = new Set();

  for (const link of links) {
    const sourceRef = extractOtherRef(link, baseRef);
    if (!sourceRef) continue;

    if (isTanakhLink(link, sourceRef)) tanakhSet.add(sourceRef);

    const anchors = extractAnchorRefs(link, baseRef);
    let segmentIdx = null;

    // Prefer explicit segment indexes in the source ref itself when available.
    const parsedFromSource = segmentIndexFromRef(sourceRef, baseRef);
    if (parsedFromSource && parsedFromSource <= segmentCount) {
      segmentIdx = parsedFromSource;
    } else {
      // Otherwise infer from anchor refs. If multiple anchors match, prefer the most specific (highest index).
      const matches = [];
      for (let i = 1; i <= segmentCount; i += 1) {
        const prefix = segmentPrefix(baseRef, i);
        if (anchors.some((r) => canonicalRef(r).startsWith(prefix))) {
          matches.push(i);
        }
      }
      if (matches.length) segmentIdx = Math.max(...matches);
    }

    if (!segmentIdx) continue;

    if (isCommentaryLink(link, sourceRef)) {
      if (!refMatchesBaseDaf(sourceRef, baseRef)) continue;

      // Meiri often spans multiple segments; show it in a dedicated tab at daf-level.
      if (isMeiriRef(sourceRef)) {
        meiriSet.add(sourceRef);
        continue;
      }

      commentarySets.get(segmentIdx).add(sourceRef);
    }

    // "Ein Mishpat": use Sefaria's halakhic links (not only Rambam).
    if (isHalakhahLink(link) || isMishnehTorahRef(sourceRef)) {
      halakhaSets.get(segmentIdx).add(sourceRef);
    }
  }

  const commentaryMap = new Map();
  const halakhaMap = new Map();
  for (let i = 1; i <= segmentCount; i += 1) {
    commentaryMap.set(i, [...commentarySets.get(i)]);
    halakhaMap.set(i, [...halakhaSets.get(i)]);
  }

  return { commentaryMap, halakhaMap, tanakhRefs: [...tanakhSet], meiriRefs: [...meiriSet] };
}

async function fetchJson(url) {
  const res = await fetch(url);
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.error || "הבקשה נכשלה");
  }
  return payload;
}

async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body || {}),
  });
  const payload = await res.json();
  if (!res.ok) {
    throw new Error(payload?.details || payload?.error || "הבקשה נכשלה");
  }
  return payload;
}

function buildGenizahGroups(payload) {
  const data = Array.isArray(payload?.blocks?.Data) ? payload.blocks.Data : [];
  const codexes = Array.isArray(payload?.blocks?.ListCodexes) ? payload.blocks.ListCodexes : [];
  const codexMap = new Map(codexes.map((c) => [
    c.CodexId,
    {
      codexName: c.CodexName || c.CodexFullName || `כתב יד ${c.CodexId}`,
      orderNo: Number.isFinite(Number(c.orderNo)) ? Number(c.orderNo) : Number.MAX_SAFE_INTEGER,
    },
  ]));
  const VILNA_CODEX_ID = 30000;

  const byGroup = new Map();
  for (const row of data) {
    const groupId = row?.LogicalUnitGroupID;
    if (!groupId) continue;
    const text = normalizeGenizahText(row?.LogicalUnitText || "");
    if (!text || shouldIgnoreText(text) || isMostlyPlaceholderText(text)) continue;

    const order = Number(row?.LogicalUnitOrderInCodex);
    if (!byGroup.has(groupId)) {
      byGroup.set(groupId, {
        groupId,
        // We map group->sentence by the Vilna "line" order when available.
        // Using min order across all witnesses is wrong because different witnesses have unrelated order scales.
        vilnaOrder: Number.MAX_SAFE_INTEGER,
        fallbackOrder: Number.isFinite(order) ? order : Number.MAX_SAFE_INTEGER,
        variantsByCodex: new Map(),
      });
    }
    const g = byGroup.get(groupId);
    if (Number.isFinite(order) && order < g.fallbackOrder) g.fallbackOrder = order;

    const codexMeta = codexMap.get(row?.CodexId) || {
      codexName: `כתב יד ${row?.CodexId || "לא ידוע"}`,
      orderNo: Number.MAX_SAFE_INTEGER,
    };

    const isVilna = row?.CodexId === VILNA_CODEX_ID || String(codexMeta.codexName || "").includes("וילנא");
    if (isVilna && Number.isFinite(order) && order < g.vilnaOrder) {
      g.vilnaOrder = order;
    }

    const current = g.variantsByCodex.get(row?.CodexId);
    const candidate = {
      codexId: row?.CodexId,
      codexName: codexMeta.codexName,
      orderNo: codexMeta.orderNo,
      text,
    };
    if (!current || candidate.text.length > current.text.length) {
      g.variantsByCodex.set(row?.CodexId, candidate);
    }
  }

  const groups = [...byGroup.values()]
    .map((g) => {
      const variants = [...g.variantsByCodex.values()]
        .sort((a, b) => {
          const aVilna = String(a.codexName).includes("וילנא") ? 0 : 1;
          const bVilna = String(b.codexName).includes("וילנא") ? 0 : 1;
          if (aVilna !== bVilna) return aVilna - bVilna;
          if (a.orderNo !== b.orderNo) return a.orderNo - b.orderNo;
          return a.codexName.localeCompare(b.codexName, "he");
        });
      const baseVariant = variants.find((v) => String(v.codexName).includes("וילנא")) || variants[0] || null;
      const baseText = baseVariant?.text || "";
      const baseTokenSet = new Set(hebrewTokens(baseText, 80));
      const mappingOrder = Number.isFinite(g.vilnaOrder) && g.vilnaOrder !== Number.MAX_SAFE_INTEGER
        ? g.vilnaOrder
        : g.fallbackOrder;
      return { groupId: g.groupId, mappingOrder, variants, baseText, baseTokenSet };
    })
    .filter((g) => g.variants.length > 1)
    .sort((a, b) => (a.mappingOrder - b.mappingOrder));

  return groups;
}

function pickGenizahGroupForSegment(segmentIndex) {
  if (!segmentIndex || !genizahGroups.length) return null;
  const cached = genizahSegmentToGroup.get(segmentIndex);
  if (cached) return cached;

  // Prefer semantic matching between the selected Sefaria segment text and Genizah Vilna/base logical units.
  const seg = currentSegments.find((s) => s.index === segmentIndex);
  const segTokens = hebrewTokens(seg?.he || "", 18);
  let best = null;
  let bestScore = -1;

  if (segTokens.length >= 4) {
    for (const g of genizahGroups) {
      let score = 0;
      for (let i = 0; i < segTokens.length; i += 1) {
        const tok = segTokens[i];
        if (!tok) continue;
        if (g.baseTokenSet?.has(tok)) {
          score += (segTokens.length - i); // weight early tokens more
        }
      }
      // Mild bias for earlier mappingOrder proximity (stabilizes ties).
      score += 0.0001 * Math.max(0, 1000000 - Math.abs((segmentIndex - 1) - (g.mappingOrder || 0)));

      if (score > bestScore) {
        bestScore = score;
        best = g;
      }
    }
  }

  // Fallback: stable positional mapping.
  if (!best) {
    const idx = Math.max(0, Math.min(genizahGroups.length - 1, segmentIndex - 1));
    best = genizahGroups[idx];
  }

  genizahSegmentToGroup.set(segmentIndex, best);
  return best;
}

function tokenizeWords(text) {
  return String(text || "").trim().split(/\s+/).filter(Boolean);
}

function normalizeHebToken(token) {
  return normalizeHebrewForMatch(token);
}

function alignWitnessTextToSegment(witnessText, segmentTokens) {
  const tokens = tokenizeWords(witnessText);
  if (!tokens.length) return "";
  if (!Array.isArray(segmentTokens) || segmentTokens.length === 0) return tokens.join(" ");

  // Try matching a short phrase from the segment start (4..1 tokens).
  const normTokens = tokens.map(normalizeHebToken);
  const seg = segmentTokens.map((t) => normalizeHebToken(t)).filter(Boolean);
  if (!seg.length) return tokens.join(" ");

  for (let phraseLen = Math.min(4, seg.length); phraseLen >= 1; phraseLen -= 1) {
    const head = seg.slice(0, phraseLen);
    for (let i = 0; i <= normTokens.length - phraseLen; i += 1) {
      let ok = true;
      for (let j = 0; j < phraseLen; j += 1) {
        if (normTokens[i + j] !== head[j]) {
          ok = false;
          break;
        }
      }
      if (ok) {
        return tokens.slice(i).join(" ");
      }
    }
  }

  // Fallback: try the very first token only.
  const anchor = seg[0];
  const idx = normTokens.indexOf(anchor);
  if (idx >= 0) return tokens.slice(idx).join(" ");

  return tokens.join(" ");
}

function buildLcsMatchMask(baseTokens, otherTokens) {
  const m = baseTokens.length;
  const n = otherTokens.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (baseTokens[i - 1] === otherTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  const mask = Array(n).fill(false);
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (baseTokens[i - 1] === otherTokens[j - 1]) {
      mask[j - 1] = true;
      i -= 1;
      j -= 1;
      continue;
    }
    if (dp[i - 1][j] >= dp[i][j - 1]) i -= 1;
    else j -= 1;
  }
  return mask;
}

function renderWitnessDiffHtml(baseText, witnessText, isBase) {
  const baseTokens = tokenizeWords(baseText);
  const witnessTokens = tokenizeWords(witnessText);
  if (!witnessTokens.length) return "";
  if (isBase) return witnessTokens.map((t) => safeHtml(t)).join(" ");

  const keepMask = buildLcsMatchMask(baseTokens, witnessTokens);
  return witnessTokens
    .map((token, idx) => {
      const inner = safeHtml(token);
      return keepMask[idx] ? inner : `<span class="genizah-diff-word">${inner}</span>`;
    })
    .join(" ");
}

function renderGenizahForSegment(segmentIndex) {
  if (!segmentIndex) {
    genizahListEl.textContent = "רחף מעל משפט בגמרא כדי לראות חילופי נוסח.";
    return;
  }
  if (!genizahGroups.length) {
    genizahListEl.textContent = "לא נטענו נתוני הכי גרסינן. התחבר למערכת בחלק העליון.";
    return;
  }

  const group = pickGenizahGroupForSegment(segmentIndex);
  if (!group) {
    genizahListEl.textContent = "לא נמצאה קבוצת נוסח מתאימה למשפט זה.";
    return;
  }

  const baseVariant = group.variants.find((v) => String(v.codexName).includes("וילנא")) || group.variants[0];
  const baseText = baseVariant?.text || "";
  const seg = currentSegments.find((s) => s.index === segmentIndex);
  const segTokens = hebrewTokens(seg?.he || "", 8);
  const alignedBaseText = alignWitnessTextToSegment(baseText, segTokens);

  genizahListEl.innerHTML = "";
  const wrap = document.createElement("div");
  wrap.className = "genizah-compare";

  for (const v of group.variants.slice(0, 12)) {
    const card = document.createElement("article");
    card.className = `ref-card genizah-witness${v === baseVariant ? " is-base" : ""}`;
    const alignedWitnessText = alignWitnessTextToSegment(v.text, segTokens);
    const diffHtml = renderWitnessDiffHtml(alignedBaseText, alignedWitnessText, v === baseVariant);
    card.innerHTML = `
      <p class="ref-title">${safeHtml(v.codexName)}</p>
      <p class="ref-text">${diffHtml}</p>
    `;
    wrap.appendChild(card);
  }
  genizahListEl.appendChild(wrap);
}

async function loadGenizahForRef(ref) {
  const parts = parseRefParts(ref);
  if (!parts) {
    genizahGroups = [];
    genizahSegmentToGroup = new Map();
    genizahListEl.textContent = "לא ניתן למפות את הדף לחילופי נוסח.";
    return;
  }

  try {
    const payload = await fetchJson(`/api/genizah/blocks/by-ref?tractate=${encodeURIComponent(parts.tractate)}&daf=${encodeURIComponent(parts.daf)}`);
    genizahGroups = buildGenizahGroups(payload);
    genizahSegmentToGroup = new Map();
    renderGenizahForSegment(lockedSegmentIndex || null);
  } catch (error) {
    genizahGroups = [];
    genizahSegmentToGroup = new Map();
    genizahListEl.textContent = `טעינת הכי גרסינן נכשלה: ${error.message}`;
  }
}

async function refreshGenizahAuthStatus() {
  try {
    const payload = await fetchJson("/api/genizah/auth-status");
    if (payload?.authenticated) {
      const sourceMap = {
        runtime_session: "מחובר (Session)",
        env_cookie: "מחובר (Cookie מהשרת)",
      };
      setGenizahAuthStatus(sourceMap[payload.source] || "מחובר", true);
    } else {
      setGenizahAuthStatus("לא מחובר", false);
    }
  } catch {
    setGenizahAuthStatus("מצב התחברות לא זמין", false);
  }
}

async function getReferenceText(ref) {
  if (refTextCache.has(ref)) return refTextCache.get(ref);

  try {
    const payload = await fetchJson(`/api/text/${encodeURIComponent(ref)}`);
    const lines = pickHebrewLines(payload);
    const full = lines.join(" ").trim() || "אין טקסט זמין";
    const displayRef = stripFormatting(payload?.heRef || payload?.ref || ref) || ref;
    const item = { ref, displayRef, full, snippet: truncateText(full, 260) };
    refTextCache.set(ref, item);
    return item;
  } catch {
    const fallback = { ref, displayRef: ref, full: "אין טקסט זמין", snippet: "אין טקסט זמין" };
    refTextCache.set(ref, fallback);
    return fallback;
  }
}

function renderFluentText(baseRef, segments) {
  segmentsEl.innerHTML = "";
  if (!segments.length) {
    segmentsEl.innerHTML = "<p>לא נמצאו מקטעים בדף זה.</p>";
    return;
  }

  const wrapper = document.createElement("div");
  wrapper.className = "fluent-text";

  for (const seg of segments) {
    const span = document.createElement("span");
    span.className = "sentence";
    span.dataset.segment = String(seg.index);
    span.title = `${baseRef}:${seg.index}`;
    span.innerHTML = `${enrichSageMentionsHtml(seg.he)} `;
    wrapper.appendChild(span);
  }

  segmentsEl.appendChild(wrapper);
}

function highlightLockedSentence() {
  segmentsEl.querySelectorAll(".sentence").forEach((el) => el.classList.remove("locked"));
  if (!lockedSegmentIndex) return;
  const locked = segmentsEl.querySelector(`.sentence[data-segment="${lockedSegmentIndex}"]`);
  if (locked) locked.classList.add("locked");
}

async function renderRefCards(container, refs, tokenType) {
  const token = tokenType === "commentary" ? ++commentaryToken : ++halakhaToken;
  container.innerHTML = "";

  if (!refs.length) {
    container.textContent = tokenType === "commentary"
      ? "לא נמצאו מפרשים למשפט זה."
      : "לא נמצאו הפניות בעין משפט למשפט זה.";
    return;
  }

  const sourceRefs = refs.slice(0, 20);
  const items = tokenType === "commentary"
    ? buildCommentaryItems(sourceRefs)
    : sourceRefs.map((ref) => ({ kind: "single", refs: [ref] }));

  const textsByItem = await Promise.all(
    items.map(async (item) => {
      const parts = await Promise.all(item.refs.map((ref) => getReferenceText(ref)));
      return { item, parts };
    })
  );

  const current = tokenType === "commentary" ? commentaryToken : halakhaToken;
  if (token !== current) return;

  const visible = textsByItem.filter(({ parts }) => parts.some((p) => !shouldIgnoreText(p.full)));
  if (!visible.length) {
    container.textContent = "לא נמצא טקסט זמין להפניות אלו.";
    return;
  }

  for (const { item, parts } of visible) {
    const goodParts = parts.filter((p) => !shouldIgnoreText(p.full));
    if (!goodParts.length) continue;

    const card = document.createElement("article");
    card.className = "ref-card";

    if (item.kind === "rashi-group" && tokenType === "commentary") {
      const main = goodParts[0];
      card.dataset.ref = main.ref;
      const piecesHtml = goodParts
        .map((p) => `<p class="ref-text rashi-piece">${formatDiburHamatchilHtml(p.full)}</p>`)
        .join("");
      card.innerHTML = `
        <p class="ref-title">${safeHtml(main.displayRef || main.ref)}</p>
        ${piecesHtml}
      `;
    } else {
      const main = goodParts[0];
      card.dataset.ref = main.ref;
      card.innerHTML = `
        <p class="ref-title">${safeHtml(main.displayRef || main.ref)}</p>
        <p class="ref-text">${safeHtml(main.full)}</p>
      `;
    }

    container.appendChild(card);
  }
}

async function renderTanakhPanel(refs) {
  const token = ++tanakhToken;
  tanakhListEl.innerHTML = "";

  if (!refs.length) {
    tanakhListEl.textContent = "לא נמצאו פסוקי תנ״ך מצוטטים בדף זה.";
    return;
  }

  const texts = await Promise.all(refs.slice(0, 24).map((ref) => getReferenceText(ref)));
  if (token !== tanakhToken) return;

  const visible = texts.filter((t) => !shouldIgnoreText(t.full));
  if (!visible.length) {
    tanakhListEl.textContent = "לא נמצאו פסוקים עם טקסט זמין.";
    return;
  }

  for (const t of visible) {
    const card = document.createElement("article");
    card.className = "ref-card";
    card.innerHTML = `
      <p class="ref-title">${safeHtml(t.displayRef || t.ref)}</p>
      <p class="ref-text">${safeHtml(t.full)}</p>
    `;
    tanakhListEl.appendChild(card);
  }
}

async function renderPanelsForSegment(segmentIndex, pinned = false) {
  if (!segmentIndex) {
    commentaryListEl.textContent = "רחף מעל משפט בגמרא כדי לראות פירושים.";
    halakhaListEl.textContent = "רחף מעל משפט בגמרא כדי לראות הלכה רלוונטית.";
    commentaryCountsEl.innerHTML = "";
    renderGenizahForSegment(null);
    return;
  }

  const commentaryRefs = sortCommentaryRefs(segmentCommentaryMap.get(segmentIndex) || []);
  const halakhaRefs = segmentHalakhaMap.get(segmentIndex) || [];
  renderCommentaryCategoryChips(commentaryRefs, pageMeiriRefs);
  const filteredCommentaryRefs = filterCommentaryRefsByCategory(commentaryRefs, commentaryCategory, pageMeiriRefs);

  await Promise.all([
    renderRefCards(commentaryListEl, filteredCommentaryRefs, "commentary"),
    renderRefCards(halakhaListEl, halakhaRefs, "halakha"),
  ]);
  renderGenizahForSegment(segmentIndex);
}

async function loadRef(rawRef) {
  const ref = normalizeRef(rawRef);
  if (!ref) return;

  setStatus(`טוען ${ref}...`);
  currentRef = ref;
  openSefariaEl.href = `https://www.sefaria.org/${encodeURIComponent(ref)}`;

  const [textPayload, linksPayload] = await Promise.all([
    fetchJson(`/api/text/${encodeURIComponent(ref)}`),
    fetchJson(`/api/links/${encodeURIComponent(ref)}`),
  ]);

  const segments = extractSegments(textPayload);
  currentSegments = segments;
  const links = Array.isArray(linksPayload) ? linksPayload : getArray(linksPayload, ["links"]);

  const maps = buildReferenceMaps(ref, links, segments.length);
  segmentCommentaryMap = maps.commentaryMap;
  segmentHalakhaMap = maps.halakhaMap;
  pageTanakhRefs = maps.tanakhRefs;
  pageMeiriRefs = maps.meiriRefs || [];

  lockedSegmentIndex = null;
  genizahSegmentToGroup = new Map();
  highlightLockedSentence();

  dafTitleEl.textContent = textPayload?.ref || ref;
  textMetaEl.textContent = `${segments.length} מקטעים, ${links.length} קישורים ישירים, מקור: API של ספריא`;

  renderFluentText(ref, segments);
  await renderPanelsForSegment(null, false);
  await renderTanakhPanel(pageTanakhRefs);
  await loadGenizahForRef(ref);

  const parts = parseRefParts(ref);
  if (parts && parts.tractate in TRACTATE_MAX_DAF) {
    if (tractateSelect.value !== parts.tractate) {
      tractateSelect.value = parts.tractate;
      populateDafOptions(parts.tractate, parts.daf);
    } else {
      dafSelect.value = parts.daf;
    }
  }

  setStatus("");
}

tractateSelect.addEventListener("change", () => {
  populateDafOptions(tractateSelect.value, "2a");
  void loadRef(buildRef()).catch((error) => {
    setStatus(`הטעינה נכשלה: ${error.message}`);
  });
});

dafSelect.addEventListener("change", () => {
  void loadRef(buildRef()).catch((error) => {
    setStatus(`הטעינה נכשלה: ${error.message}`);
  });
});

segmentsEl.addEventListener("mouseover", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const mention = target.closest(".sage-mention");
  if (mention instanceof HTMLElement) {
    const tip = mention.dataset.sageTip || mention.getAttribute("title") || "";
    if (tip) {
      showSageTooltip(tip, event.clientX, event.clientY);
    }
  }
  const sentenceEl = target.closest(".sentence");
  if (!(sentenceEl instanceof HTMLElement)) return;
  if (lockedSegmentIndex) return;
  const segmentIndex = Number(sentenceEl.dataset.segment);
  if (!Number.isFinite(segmentIndex)) return;
  void renderPanelsForSegment(segmentIndex, false);
});

segmentsEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const sentenceEl = target.closest(".sentence");
  if (!(sentenceEl instanceof HTMLElement)) return;
  const segmentIndex = Number(sentenceEl.dataset.segment);
  if (!Number.isFinite(segmentIndex)) return;
  // Toggle lock: click again to unlock (since we removed the "clear" button).
  lockedSegmentIndex = lockedSegmentIndex === segmentIndex ? null : segmentIndex;
  highlightLockedSentence();
  void renderPanelsForSegment(lockedSegmentIndex || segmentIndex, Boolean(lockedSegmentIndex));
});

segmentsEl.addEventListener("mousemove", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const mention = target.closest(".sage-mention");
  if (!(mention instanceof HTMLElement)) {
    hideSageTooltip();
    return;
  }
  const tip = mention.dataset.sageTip || mention.getAttribute("title") || "";
  if (!tip) return;
  if (sageTooltipEl.style.display === "none") {
    showSageTooltip(tip, event.clientX, event.clientY);
  } else {
    positionSageTooltip(event.clientX, event.clientY);
  }
});

segmentsEl.addEventListener("mouseout", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  if (target.closest(".sage-mention")) {
    hideSageTooltip();
  }
});

genizahLoginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = String(genizahUsernameEl.value || "").trim();
  const password = String(genizahPasswordEl.value || "");
  if (!username || !password) {
    setGenizahAuthStatus("יש למלא משתמש וסיסמה", false);
    return;
  }

  const originalBtn = genizahLoginBtn.textContent;
  genizahLoginBtn.disabled = true;
  genizahLoginBtn.textContent = "מתחבר...";

  void postJson("/api/genizah/login", { username, password })
    .then(async () => {
      genizahPasswordEl.value = "";
      setGenizahAuthStatus("מחובר (Session)", true);
      await loadGenizahForRef(currentRef);
      renderGenizahForSegment(lockedSegmentIndex || null);
    })
    .catch((error) => {
      setGenizahAuthStatus(`התחברות נכשלה: ${error.message}`, false);
    })
    .finally(() => {
      genizahLoginBtn.disabled = false;
      genizahLoginBtn.textContent = originalBtn;
    });
});

genizahCookieBtn.addEventListener("click", () => {
  const cookie = String(genizahCookieEl.value || "").trim();
  if (!cookie) {
    setGenizahAuthStatus("Paste a cookie value first", false);
    return;
  }

  const originalBtn = genizahCookieBtn.textContent;
  genizahCookieBtn.disabled = true;
  genizahCookieBtn.textContent = "בודק...";

  void postJson("/api/genizah/set-cookie", { cookie })
    .then(async () => {
      setGenizahAuthStatus("מחובר (Session)", true);
      await loadGenizahForRef(currentRef);
      renderGenizahForSegment(lockedSegmentIndex || null);
    })
    .catch((error) => {
      setGenizahAuthStatus(`Cookie rejected: ${error.message}`, false);
    })
    .finally(() => {
      genizahCookieBtn.disabled = false;
      genizahCookieBtn.textContent = originalBtn;
    });
});

populateTractateOptions();
tractateSelect.value = "Berakhot";
populateDafOptions("Berakhot", "2a");
void refreshGenizahAuthStatus();

loadRef(currentRef).catch((error) => {
  setStatus(`טעינה ראשונית נכשלה: ${error.message}`);
});
