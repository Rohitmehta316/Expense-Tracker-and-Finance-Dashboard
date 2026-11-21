# FinTrack — Personal Finance

FinTrack is a MERN personal-finance application with user-scoped MongoDB data, cookie-based JWT authentication, wallet-aware transactions, budgets, savings goals, dashboard analytics, and reports.

## Implementation plan and status

1. Foundation — separate `frontend/` Vite and `backend/` Express folders, environment template, responsive app shell.
2. API and data — Mongoose models, auth and validation, user-scoped APIs, transaction-driven wallet balances.
3. Finance modules — transactions, income/expenses, wallets, categories, budgets, goals, notifications, analytics, and reports.
4. Client — dashboard, CRUD pages, settings, reports, auth screens, light/dark themes, mobile navigation.
5. Verify and configure — install dependencies, build/test, connect an Atlas database, and run the app.

## Requirements

- Node.js 20 or newer
- MongoDB Atlas database (or local MongoDB replica set; wallet writes use MongoDB transactions)

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and a cryptographically random `JWT_SECRET` of at least 32 characters.
2. Install each app independently by running `npm install` inside `backend/` and `frontend/`.
3. Start the API in one terminal (`cd backend` then `npm run dev`) and the client in another (`cd frontend` then `npm run dev`).
4. Open `http://localhost:5173`. The API listens on port `5000` by default; `/api/health` reports connection status.

To add an isolated sample account with six months of INR income, expenses, wallets, budgets, savings goals, and an alert, run `npm run seed:demo` inside `backend/` after configuring its `.env`. Sign in with `demo@fintrack.example.com` / `FinTrackDemo2026!`. The script refuses to seed an existing production environment or overwrite existing demo finance data.

For a separate frontend deployment, set `frontend/.env.local` with `VITE_API_URL=https://your-api.example/api`. Configure `CLIENT_URL` to the exact frontend origin. In production use HTTPS so the auth cookie is Secure.

## Available scripts

Frontend commands (run inside `frontend/`): `npm run dev`, `npm run build`, `npm run lint`, `npm test`.
Backend commands (run inside `backend/`): `npm run dev`, `npm start`, `npm run seed:demo`, `npm test`.
- `npm run build` — optimized Vite production build
- `npm test` — backend Node tests and frontend Vitest suite
- `npm run lint` — frontend ESLint

## API overview

Auth: `POST /api/auth/register|login|logout`, `GET /api/auth/me`.

Finance: `/api/transactions`, `/api/income`, `/api/expenses`, `/api/wallets`, `/api/categories`, `/api/budgets`, `/api/savings-goals`, `/api/notifications`.

Analytics: `/api/dashboard/summary`, `/api/dashboard/analytics`, `/api/dashboard/recent-transactions`, `/api/reports/monthly|yearly|categories`.

All finance routes require the HttpOnly `fintrack_token` cookie and scope records to the authenticated user. Passwords are bcrypt hashed. Transaction create/edit/delete uses MongoDB sessions to update the transaction and related wallet balances atomically. A wallet's opening funds should be recorded as an income transaction. Transfers require source and destination wallets.

## Notes and known setup limits

- Password recovery endpoints return HTTP 501 until an email delivery provider and signed, expiring reset-token workflow are configured.
- PDF export is not included; reports can be printed from the browser and exported as CSV.
- Recurring payments and scheduled delivery are not modeled yet. Notifications are stored in MongoDB and shown in-app; budget and upcoming-payment alert generation needs a scheduled worker.
- Multiple currencies are retained per wallet. Dashboard totals show each wallet separately and compute summary income/expenses in the user's base currency context; no foreign-exchange conversion is performed.
- MongoDB multi-document transactions require Atlas or a MongoDB replica set; standalone MongoDB deployments do not support them.

## Project structure

```text
frontend/ React/Vite app, pages, components, API client, styles
backend/  Express API, auth middleware, Mongoose models, routes
.env.example
README.md
```
