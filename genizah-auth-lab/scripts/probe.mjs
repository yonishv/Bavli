const BASE_URL = process.env.BASE_URL || "https://bavli.genizah.org";
const COOKIE = process.env.COOKIE || "";

if (!COOKIE) {
  console.error("Missing COOKIE env var.");
  console.error('Example: COOKIE="ASP.NET_SessionId=...; .ASPXAUTH=...; ..." npm run probe');
  process.exit(1);
}

async function fetchJson(path) {
  const url = new URL(path, BASE_URL).toString();
  const res = await fetch(url, {
    headers: {
      Accept: "application/json, text/javascript, */*; q=0.01",
      "X-Requested-With": "XMLHttpRequest",
      Referer: `${BASE_URL}/?lan=heb&isPartial=False&isDoubleLogin=False`,
      Cookie: COOKIE,
    },
  });
  const text = await res.text();
  return { url, status: res.status, text };
}

const endpoints = [
  "/api/SelectionControlAPI/GetDivisions?levelId=1&parentIds%5B0%5D=&inProjectId=&useFtsSession=false",
  "/api/DiffAPI/GetSiglaTable",
  "/api/DiffAPI/GetBlocks?isForDownload=false",
  "/api/DiffAPI/GetContentJoins",
];

for (const path of endpoints) {
  const out = await fetchJson(path);
  console.log("\n===", out.status, out.url);
  console.log(out.text.slice(0, 600));
}

