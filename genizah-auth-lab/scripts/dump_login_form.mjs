import fs from "node:fs";

const BASE_URL = process.env.BASE_URL || "https://bavli.genizah.org";
const outPath = process.env.OUT || "output/login.html";
const READ_LOCAL = process.env.READ_LOCAL === "1";

let html = "";
let statusLabel = "local";

if (READ_LOCAL) {
  html = fs.readFileSync(outPath, "utf8");
} else {
  const url = new URL("/Account/Login", BASE_URL).toString();
  const res = await fetch(url, {
    headers: {
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    },
  });
  statusLabel = String(res.status);
  html = await res.text();
  fs.mkdirSync("output", { recursive: true });
  fs.writeFileSync(outPath, html);
}

console.log("status", statusLabel, "len", html.length, "file", outPath);
console.log("\n--- head snippet ---");
console.log(html.slice(0, 900));

function has(str) {
  return html.toLowerCase().includes(String(str).toLowerCase());
}

const signals = [
  "__requestverificationtoken",
  "csrf",
  "antiforgery",
  "password",
  "username",
  "recaptcha",
  "hcaptcha",
  "cloudflare",
  "turnstile",
  "captcha",
  "sso",
  "oidc",
];
for (const s of signals) console.log("contains", s, has(s));

const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
console.log("\ntitle", titleMatch ? JSON.stringify(titleMatch[1].trim()) : "(none)");

function parseTags(tag) {
  const out = [];
  // NOTE: use a single backslash in the regex string so the final pattern contains \b (word boundary).
  const re = new RegExp(`<${tag}\\b([^>]*)>`, "gi");
  let m;
  while ((m = re.exec(html)) !== null) {
    const attrRegex = /([a-zA-Z_:][\w:.-]*)\s*=\s*["']([^"']*)["']/g;
    const attrs = {};
    let a;
    while ((a = attrRegex.exec(m[1])) !== null) {
      attrs[a[1].toLowerCase()] = a[2];
    }
    out.push(attrs);
  }
  return out;
}

function countTag(tag) {
  const re = new RegExp(`<${tag}\\b`, "gi");
  return (html.match(re) || []).length;
}

const forms = parseTags("form");
console.log("\nforms", forms.length);
for (const f of forms.slice(0, 10)) {
  console.log(JSON.stringify({ id: f.id, name: f.name, method: f.method, action: f.action }, null, 0));
}

const inputs = parseTags("input").map((a) => ({
  name: a.name,
  type: (a.type || "text").toLowerCase(),
  id: a.id,
  value: a.type === "hidden" ? String(a.value || "").slice(0, 80) : undefined,
}));
console.log("\ninputs", inputs.length);
for (const i of inputs.slice(0, 40)) console.log(JSON.stringify(i));

const buttons = parseTags("button").map((a) => ({
  type: (a.type || "submit").toLowerCase(),
  name: a.name,
  id: a.id,
  onclick: a.onclick,
}));
console.log("\nbuttons", buttons.length);
for (const b of buttons.slice(0, 30)) console.log(JSON.stringify(b));

const scriptsWithSrc = parseTags("script").map((a) => a.src).filter(Boolean);
const scriptTagCount = countTag("script");
console.log("\nscript tags", scriptTagCount, "scripts with src", scriptsWithSrc.length);
for (const s of scriptsWithSrc.slice(0, 30)) console.log("src", s);

// Inline script peek (first ~2 blocks)
const inlineScripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map((m) => (m[1] || "").trim())
  .filter(Boolean);
console.log("inline scripts", inlineScripts.length);
for (const s of inlineScripts.slice(0, 2)) {
  console.log("\n--- inline script snippet ---");
  console.log(s.slice(0, 400));
}
