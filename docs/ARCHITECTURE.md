# Architecture (Frontend)

- **Next.js 14 (App Router)** renders a single-page chat UI.
- The browser POSTs questions to `NEXT_PUBLIC_API_URL`.
- Your AWS stack handles: API Gateway → Lambda (NL→SQL) → Athena (via proxy Lambda) → result → JSON.

## Files
- `app/page.tsx`: main chat page, controls state and API calls
- `components/MessageItem.tsx`: message bubble with optional SQL and preview table
- `lib/types.ts`: TypeScript types shared within the UI
- `app/api/health/route.ts`: tiny health endpoint for uptime checks
- `app/globals.css`: styles

## Why direct-to-API from browser?
- You enabled CORS in API Gateway.
- It keeps the UI static, fast to deploy and cache on Vercel.
- If you need auth/gating, add a Next.js route that proxies the request and enforces your auth tokens before hitting API Gateway.
