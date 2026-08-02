# Berletek – Úszásoktatás Bérleti Rendszer

MVP: Bun + React + SQLite, VPS-en fut.

## Funkciók

### Auth
- PocketID auth provider (csak auth, redirect)
- JWT session token
- Login/logout flow

### Úszók kezelése
- Úszók CRUD (név, email, telefon)
- Bérletek (típus, hátralévő alkalmak)
- Bérleti levonás historia

### Edzések
- Oktató nyit egy edzést
- Pipálja a jelenlévőket
- Lezáráskor automatikusan levon 1 alkalmat az ott levőknek

## Adatmodell

```
trainers
  - id, pocketid_sub, name, email, created_at

swimmers
  - id, trainer_id, name, email, phone, created_at

packages
  - id, trainer_id, name, session_count, created_at

swimmer_packages
  - id, swimmer_id, package_id, remaining_sessions, purchased_at

sessions
  - id, trainer_id, name, scheduled_at, status, created_at

session_attendance
  - id, session_id, swimmer_id, attended, deducted_at
```

## Tech Stack

- **Backend**: Bun (Bun.serve + routing)
- **Database**: SQLite + Drizzle ORM
- **Frontend**: React 19 + Mantine 7 + Bun build
- **Auth**: PocketID (OAuth2 provider)
- **Deployment**: VPS (binary compiled)

## Projekt Struktúra

```
berletek/
├── backend/
│   ├── index.ts              # Bun.serve() entry point
│   ├── db.ts                 # SQLite + Drizzle setup
│   ├── auth.ts               # PocketID OAuth2 + JWT
│   ├── middleware.ts         # Auth middleware
│   └── routes/
│       ├── auth.ts           # /api/auth/login, /callback, logout
│       ├── swimmers.ts       # /api/swimmers/*
│       ├── packages.ts       # /api/packages/*
│       └── sessions.ts       # /api/sessions/*
├── frontend/
│   ├── index.tsx             # React entry (bundled by Bun)
│   ├── App.tsx
│   ├── pages/
│   ├── components/           # Mantine-based UI
│   ├── hooks/
│   └── index.css
├── public/
│   └── index.html            # HTML shell
├── drizzle.config.ts
├── bunfig.toml               # Bun config (bundler settings)
├── bun.lock
└── package.json
```

## E2E Type-Safety

**Shared Types (Option 1):**
- Backend types: `backend/schema.ts`
- Frontend imports: `import type { Swimmer } from "../backend/schema"`
- API responses trustworthy → type-safe without runtime validation
- Backend + Frontend kódváltáskor a típusok automatikusan szinkronban vannak

```typescript
// Frontend
import type { Swimmer, Session } from "../backend/schema";

const swimmers = await fetch("/api/swimmers", {
  headers: { Authorization: `Bearer ${token}` },
}).then(r => r.json() as Promise<Swimmer[]>);
```

---

## PocketID Setup

**OAuth2 Credentials:**
- Client ID: `6ede304e-2e84-4ee6-b462-5e6230fa4c45`
- Client Secret: `dFLKygkpbYJBvOp3TzvSpvaRbJcuEwHd`
- Auth Server: `https://auth.nicoprt.xyz`

**OAuth2 Flow:**
1. Frontend: User clicks "Login with PocketID"
2. Redirect to: `https://auth.nicoprt.xyz/oauth2/authorize?client_id=...&redirect_uri=...`
3. PocketID redirects back: `http://localhost:3000/api/auth/callback?code=XXX`
4. Backend exchanges code → access token → user info
5. Backend upserts trainer, creates JWT
6. Redirect to frontend with token in URL: `/?token=...`

---

## Setup & Development

**Setup:**
```bash
bun install
```

**Development:**
```bash
bun --hot backend/index.ts
# Open http://localhost:3000
```

**Production:**
```bash
bun build --compile backend/index.ts --outfile berletek
./berletek
```

**VPS deployment (berlet.gig.nicoprt.xyz):**
1. Copy `berletek` binary + `.env`
2. Create `.env`:
   ```
   PORT=3000
   POCKETID_CLIENT_ID=6ede304e-2e84-4ee6-b462-5e6230fa4c45
   POCKETID_CLIENT_SECRET=dFLKygkpbYJBvOp3TzvSpvaRbJcuEwHd
   POCKETID_REDIRECT_URI=https://berlet.gig.nicoprt.xyz/api/auth/callback
   JWT_SECRET=<strong-secret>
   ```
3. Systemd: `ExecStart=/path/to/berletek`
