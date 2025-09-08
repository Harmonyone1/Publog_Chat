# Deploy Guide (Vercel)

## 1) Fork or upload the code
- Put this project in a GitHub repo.

## 2) Create Vercel project
- In Vercel dashboard: **New Project → Import GitHub Repo**

## 3) Configure Env Vars
- Add `NEXT_PUBLIC_API_URL` with your API Gateway route: `https://<api_id>.execute-api.<region>.amazonaws.com/prod/ask`
- Optional: `NEXT_PUBLIC_APP_NAME` to set a custom app title.

## 4) Build & Deploy
- Click **Deploy**. Vercel will run `npm i && npm run build && npm start` (for preview).
- Visit your new URL and chat.

## 5) Add a custom domain (optional)
- In Vercel → Settings → Domains → Add your domain, follow DNS instructions.

## 6) Protect with Auth (optional)
- The simplest: enable Vercel **Password Protection** for the project.
- For SSO / JWT: add a small Next.js Route Handler that checks a cookie or header before proxying to `/ask`.
