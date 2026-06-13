# AGENTS.md

## Project Overview

TierLog — AI-powered thesis supervision platform. Go backend + React Native (Expo) frontend.

## Architecture

- **Backend**: Go (Gin + GORM), single `main.go` entrypoint
- **Frontend**: `tierlog_web/` — Expo Router v6, React Native Web, NativeWind (Tailwind)
- **Database**: MySQL 8.0, schema in `struct_go.sql`
- **Module name**: `testing_go` (not tierlog — legacy naming)

## Key Commands

### Backend
```bash
go run main.go          # starts at :8080
go mod tidy             # after changing imports
```

### Frontend
```bash
cd tierlog_web
npm install
npm run dev             # Expo web dev server (typically :8081)
npm run lint            # eslint
```

**Note**: On Windows, use `npm.cmd` if `npm` is not on PATH.

## Environment

Backend needs `.env` in project root (copy from `.env.example`):
- `DB_*` — MySQL connection (defaults: root@127.0.0.1:3306/struct_go)
- `JWT_SECRET` — signing key
- `GEMINI_API_KEY`, `GROQ_API_KEY` — AI features

Frontend needs `.env` in `tierlog_web/`:
- `EXPO_PUBLIC_API_URL` — backend URL (default: `http://127.0.0.1:8080`)

## Gotchas

1. **GORM AutoMigrate runs on startup** (`koneksi/koneksi.go`). Dev convenience, not production-safe. Schema changes applied automatically.
2. **Storage directories** created automatically in `main.go` init. Contents gitignored.
3. **File upload limit**: 20MB multipart, 32MB request body.
4. **CORS**: hardcoded allowlist (localhost:8081, 19006, 5173, 3000). Add new ports in `main.go:corsMiddleware()`.
5. **WebSocket**: `/ws?token=<jwt>`, room-based pub/sub. See `realtime/hub.go`.
6. **AI providers**: multi-gateway (Gemini, NVIDIA NIM, Claude, OpenAI). Keys stored encrypted per-user in `users` table.
7. **Legacy API** at `/api/*` still active alongside V2 endpoints. Don't remove without checking frontend calls.
8. **No Go tests exist** in this repo. Only one frontend test file at `tierlog_web/__tests__/components.test.tsx`.
9. **No CI/CD** — no GitHub Actions, Makefile, or Docker config.

## Directory Layout

| Path | Purpose |
|------|---------|
| `main.go` | Entry point, route registration, middleware |
| `controller/` | HTTP handlers (business logic) |
| `models/` | GORM structs (all in `models.go`) |
| `koneksi/` | DB connection + AutoMigrate |
| `middleware/` | JWT auth guard |
| `auth/` | Password hashing, JWT tokens |
| `realtime/` | WebSocket hub |
| `utils/` | DOCX parser |
| `storage/` | Uploaded files (gitignored) |
| `tierlog_web/` | Expo frontend |
| `tierlog_web/app/` | Expo Router pages |
| `tierlog_web/src/` | Components, hooks, lib, providers |

## API Pattern

- V2 endpoints: `/consultations/*`, `/dashboard/*`, `/lecturer/*`, `/settings/*`
- Legacy: `/api/*` (still used)
- Auth: `/auth/register`, `/auth/login`, `/auth/refresh`
- Protected routes use `middleware.AuthRequired()` + `controller.CurrentUser(c)` to get user
- User roles: `student` or `lecturer` (enum in DB)

## Frontend Conventions

- Path alias: `@/*` maps to `./*` (from `tsconfig.json`)
- Styling: NativeWind classes (Tailwind syntax in JSX)
- State: Zustand stores
- API client: `src/lib/config.ts` exports `API_URL` and `WS_URL`
- Dark theme with custom `tierlog-*` color palette (see `tailwind.config.js`)
