# Genizah Auth Lab

Small sandbox project to explore authentication and API access for:

- `https://bavli.genizah.org/`
- `https://fjms.genizah.org/`

Goal: figure out whether session cookies can be obtained programmatically, and which endpoints require which cookies.

## Safety

- Do not commit credentials.
- Use environment variables or a local `.env` you keep out of git.

## Scripts

### 1) Probe API with a cookie you already have

```bash
COOKIE="ASP.NET_SessionId=...; .ASPXAUTH=...; ..." npm run probe
```

### 2) Extract cookie value from a HAR file

```bash
HAR="/absolute/path/to/bavli.genizah.org.har" npm run extract-cookie-from-har
```

### 3) Dump the login form (to see hidden tokens/field names)

```bash
BASE_URL="https://bavli.genizah.org" npm run dump-login-form
```

If you already have a saved `output/login.html` and want to re-run the analysis without hitting the network:

```bash
READ_LOCAL=1 npm run dump-login-form
```

### 3b) Download referenced login assets (JS/CSS)

This helps when the login page is JS-driven (SSO, challenges) and important details live in scripts like `SSOConfig.js`.

```bash
BASE_URL="https://bavli.genizah.org" npm run fetch-login-assets
```

### 4) Playwright login (best chance if login is JS/challenge based)

Install Playwright (optional):

```bash
npm i
```

Then run:

```bash
BASE_URL="https://bavli.genizah.org" GENIZAH_USERNAME="..." GENIZAH_PASSWORD="..." npm run pw-login
```

This prints a `Cookie:` header value you can paste into the main app or use with `npm run probe`.

If login requires a CAPTCHA/challenge, switch to headed mode by setting:

```bash
HEADED=1
```

### 5) SSO JSONP flow (no browser, best-effort)

The portal JS uses a JSONP call to `https://SSO.genizah.org/login/GetLoginUIT` to obtain a `UIT`,
then redirects the target site to `/Account/SSOSignIn?lang=...&UIT=...` to set cookies.

This script attempts to replicate that flow and then probes Bavli API endpoints:

```bash
BASE_URL="https://bavli.genizah.org" GENIZAH_USERNAME="..." GENIZAH_PASSWORD="..." npm run sso-flow
```

If your shell sets `LANG` (e.g. `C.UTF-8`), do **not** use it for the UI language. Instead:

```bash
UI_LANG=heb
```

It prints `BAVLI_COOKIE_HEADER=...` which you can paste into the main app, or use with `npm run probe`.
