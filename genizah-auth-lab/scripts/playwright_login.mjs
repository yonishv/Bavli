const BASE_URL = process.env.BASE_URL || "https://bavli.genizah.org";
const USERNAME = process.env.GENIZAH_USERNAME || "";
const PASSWORD = process.env.GENIZAH_PASSWORD || "";
const HEADED = process.env.HEADED === "1";

if (!USERNAME || !PASSWORD) {
  console.error("Missing GENIZAH_USERNAME / GENIZAH_PASSWORD env vars.");
  process.exit(1);
}

let chromium;
try {
  ({ chromium } = await import("playwright"));
} catch (e) {
  console.error("Playwright is not installed. Run: npm i");
  process.exit(1);
}

const browser = await chromium.launch({ headless: !HEADED });
const context = await browser.newContext();
const page = await context.newPage();

await page.goto(new URL("/Account/Login", BASE_URL).toString(), { waitUntil: "domcontentloaded" });

// Best-effort selectors; may need adjustment depending on the form.
const userSelectors = [
  "#txtUserName",
  'input[id="txtUserName"]',
  'input[name="UserName"]',
  'input[name="Username"]',
  'input[type="email"]',
  'input[type="text"]',
];
const passSelectors = ["#txtPassword", 'input[id="txtPassword"]', 'input[name="Password"]', 'input[type="password"]'];

let userFilled = false;
for (const sel of userSelectors) {
  const el = await page.$(sel);
  if (el) {
    await el.fill(USERNAME);
    userFilled = true;
    break;
  }
}
if (!userFilled) throw new Error("Could not find a username input on the login page.");

let passFilled = false;
for (const sel of passSelectors) {
  const el = await page.$(sel);
  if (el) {
    await el.fill(PASSWORD);
    passFilled = true;
    break;
  }
}
if (!passFilled) throw new Error("Could not find a password input on the login page.");

// Try submitting.
const navWait = page.waitForNavigation({ waitUntil: "domcontentloaded", timeout: 15000 });
const clicked = await page.$("#loginBtn");
if (clicked) {
  await page.click("#loginBtn");
} else {
  await page.keyboard.press("Enter");
}
await Promise.allSettled([navWait]);

// Probe an API endpoint to verify the session.
const probeUrl = new URL(
  "/api/SelectionControlAPI/GetDivisions?levelId=1&parentIds%5B0%5D=&inProjectId=&useFtsSession=false",
  "https://bavli.genizah.org"
).toString();
const probe = await context.request.get(probeUrl, {
  headers: {
    Accept: "application/json, text/javascript, */*; q=0.01",
    "X-Requested-With": "XMLHttpRequest"
  }
});

const status = probe.status();
const body = await probe.text();
console.error("probe", status, body.slice(0, 200));

const cookies = await context.cookies("https://bavli.genizah.org");
const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
console.log(cookieHeader);

await browser.close();
