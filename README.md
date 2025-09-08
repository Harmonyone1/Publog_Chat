# PubLog Chat (Next.js + React)

A sleek, clean chat UI that lets users ask natural‑language questions about your PubLog **gold** tables via your **API Gateway /ask** endpoint (Lambda → Bedrock → Athena).

![screenshot](./public/logo.svg)

## Features
- Simple chat interface (App Router, Next.js 14)
- Calls your existing **POST /ask** endpoint
- Renders answer text, generated SQL, and a small preview table
- One‑file .env config, deployable to **Vercel** in minutes

## Prereqs
- Node.js **18+**
- Your API Gateway endpoint ready (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com/prod/ask`)
- CORS: allow `POST` and your web origin (you currently have `*`)

## Local dev
```bash
cp .env.example .env.local
# edit NEXT_PUBLIC_API_URL
npm i
npm run dev
# open http://localhost:3000
```

## Deploy to Vercel
1. Push this folder to a GitHub repo (e.g. `publog-chat`).
2. In Vercel: **New Project → Import** that repo.
3. Set **Environment Variable**: `NEXT_PUBLIC_API_URL=https://.../prod/ask`.
4. Deploy. That’s it.

## API Contract (what the UI expects)
Your `/ask` must return JSON like:
```json
{
  "answer": "Top NIINs by revenue...",
  "sql": "SELECT ...",
  "columns": ["niin","revenue"],
  "rows": [["000000057","12345.67"], ["000000060","23456.78"]],
  "timing_ms": 812
}
```
On error, return `{ "answer": "", "error": "message" }` or an HTTP 4xx/5xx with `{ "message": "..." }`.

## Customization
- **Branding**: set `NEXT_PUBLIC_APP_NAME` in env.
- **Styling**: edit `app/globals.css`.
- **Headers/Auth**: modify the `fetch` in `app/page.tsx` to add auth tokens.

## Troubleshooting
- 500 from API: check **CloudWatch Logs** for your Lambda.
- CORS errors: make sure API Gateway allows your Vercel domain and `POST`.
- Nothing renders: verify `NEXT_PUBLIC_API_URL` is populated at build time.

---

See also: [DEPLOY.md](./docs/DEPLOY.md) · [API_CONTRACT.md](./docs/API_CONTRACT.md) · [ARCHITECTURE.md](./docs/ARCHITECTURE.md)
