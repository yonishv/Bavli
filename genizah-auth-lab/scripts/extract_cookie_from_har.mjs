import fs from "node:fs";

const HAR = process.env.HAR;
if (!HAR) {
  console.error("Missing HAR env var.");
  console.error('Example: HAR="/path/to/bavli.genizah.org.har" npm run extract-cookie-from-har');
  process.exit(1);
}

const har = JSON.parse(fs.readFileSync(HAR, "utf8"));
const entries = har?.log?.entries || [];

function cookieHeaderForEntry(e) {
  const headers = e?.request?.headers || [];
  const cookie = headers.find((h) => String(h?.name || "").toLowerCase() === "cookie");
  return cookie?.value || "";
}

function isApiOrHome(url) {
  const u = String(url || "");
  return (
    u.includes("genizah.org") &&
    (u.includes("/api/") || u.includes("/Account/") || u.includes("/?") || u.endsWith("/"))
  );
}

let best = "";
for (const e of entries) {
  const url = e?.request?.url || "";
  if (!isApiOrHome(url)) continue;
  const ck = cookieHeaderForEntry(e);
  if (ck && ck.length > best.length) best = ck;
}

if (!best) {
  console.error("No Cookie header found in HAR.");
  process.exit(1);
}

console.log(best);

