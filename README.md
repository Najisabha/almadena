# Almadena Academy

Reference website: [almadena.vercel.app](https://almadena.vercel.app/).

## Stack

- Frontend: React + TypeScript + Vite + Tailwind + shadcn/ui
- Backend: Express + PostgreSQL + JWT

## Architecture

### Frontend

- `src/features/auth`: session-aware auth provider and route guards.
- `src/features/admin`: admin role access service.
- `src/features/siteSettings`: typed navbar config schema/defaults/service/hooks.
- `src/components`: reusable UI and domain components.
- `src/pages`: route-level page composition.

### Backend

- `backend/src/config`: env validation and runtime config.
- `backend/src/modules/auth`: authentication endpoints.
- `backend/src/modules/table`: table CRUD endpoints with column allowlists.
- `backend/src/app.js`: express app composition.
- `backend/src/server.js`: server bootstrap only.

## Run Locally

### 1) Frontend

```sh
npm i
# copy .env.example to .env and update values
npm run dev
```

### 2) Backend

```sh
cd backend
npm i
# copy .env.example to .env and update values
npm run db:init
npm run dev
```

## Backend Env Contract

- `DATABASE_URL`: postgres connection string
- `JWT_SECRET`: at least 24 characters
- `CLIENT_ORIGIN`: frontend URL allowed by CORS
- `PORT`: backend port (default `4000`)

## Tests

Run backend smoke tests:

```sh
cd backend
npm test
```

## Parity Tracking

- Use `docs/parity-checklist.md` to track page/component/behavior parity against production.

## Navbar Signals From Admin

- `Admin -> Site Settings` now controls navbar menu links, inquiry links, and notification badge behavior.
- Config is persisted as `site_settings.setting_key = navbar_config`.
- Frontend navigation renders from this config with defaults fallback if stored JSON is invalid.
