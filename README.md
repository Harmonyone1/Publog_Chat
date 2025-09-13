# Orcha Insights

Business-friendly analytics/chat application built with Next.js 14, TypeScript and Tailwind CSS. Users ask natural-language questions about your data and receive charts, tables and KPIs — SQL stays server-side.

## Features
- Dark dashboard layout with sidebar navigation (Chat, Insights, Datasets, Settings, Support)
- Chat workspace calling your existing **POST /ask** endpoint
- Client adapter renders KPI, bar chart (Recharts) and table views
- Stub profile endpoint at `/api/me`
 - Results toolbar: Show/Copy SQL, Download CSV
 - Save results (per-browser) via `/api/saved` cookie storage; Saved page lists entries

## Prereqs
- Node.js **18+**
- API Gateway base URL (e.g. `https://abc123.execute-api.us-east-1.amazonaws.com/prod`)

## Local dev
```bash
cp .env.example .env.local
# edit NEXT_PUBLIC_API_URL
npm i
npm run dev
```
Open <http://localhost:3000>.

## Deploy to Vercel
1. Push this folder to a GitHub repo.
2. In Vercel: **New Project â†’ Import** that repo.
3. Set env var `NEXT_PUBLIC_API_URL` to your API Gateway base URL (no trailing `/ask`).
   - Default stage (current setup): `https://qpbhjn080e.execute-api.us-east-1.amazonaws.com`
   - Explicit stage example: `https://YOUR_API_ID.execute-api.us-east-1.amazonaws.com/prod`
4. Deploy.

## API Contract
Frontend calls `POST ${NEXT_PUBLIC_API_URL}/ask`:
```json
{"question":"Top 10 NIINs by revenue in 2022","userContext":{},"resultFormat":"semantic-v1"}
```
Response with views:
```json
{"answer":"In 2022...","views":[{"type":"kpi","title":"Total","value":123}],"raw":{"columns":[],"rows":[]}}
```
If only `{columns,rows}` are returned the client synthesizes basic KPI, bar chart and table.

## Customization
- Branding: set `NEXT_PUBLIC_APP_NAME`
- Styling: edit Tailwind config / `app/globals.css`

## Troubleshooting
- 500 from API: check Lambda logs
- CORS errors: ensure API Gateway allows your domain and `POST`
  - Current allowed origins: `https://publog-chat-6lxsbl196-davids-projects-e5e2fe81.vercel.app`, `http://localhost:3000`
 - If Saved items donâ€™t persist across browsers, remember they are cookie-based per device.

---

See also: [DEPLOY.md](./docs/DEPLOY.md) Â· [API_CONTRACT.md](./docs/API_CONTRACT.md) Â· [ARCHITECTURE.md](./docs/ARCHITECTURE.md)

