# Talmud Page Enhanced Viewer

A local web app for context-rich daf learning using Sefaria public APIs.

## Features
- Load any daf reference (`Berakhot.2a`, `Shabbat.31a`, etc.)
- Display Hebrew + English segment text
- Show direct link graph grouped by category/type
- Show related references/topics/sheets
- Click any linked reference to preview it inline

## Tech
- Node.js + Express (light API proxy)
- Vanilla JS frontend
- Sefaria endpoints used:
  - `/api/v3/texts/{tref}`
  - `/api/links/{tref}`
  - `/api/related/{tref}`

## Run
```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Notes
- This app uses public Sefaria APIs and does not require Sefaria authentication for these endpoints.
- API payload shapes may vary by text; the client includes flexible parsing for common variants.
