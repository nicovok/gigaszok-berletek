# Berletek — Swimming Lesson Pass Tracker

A lightweight pass management system for swimming instructors. Track student passes, record sessions, and automatically notify parents by email.

## Screenshots

**Pass list**
![Pass list](docs/screenshot-lista.png)

**Pass detail (instructor view)**
![Pass detail](docs/screenshot-berlet-detail.png)

**Parent view (public, accessible via QR code)**
![Parent view](docs/screenshot-szuloi-nezet.png)

## Features

- **Pass management** — child and parent details, remaining session balance
- **Session recording** — deduct one session from each selected pass in one click
- **Top-up / manual deduction** — balance adjustments with a full audit trail
- **Usage ledger** — every transaction is logged and reversible
- **QR code / parent link** — parents can view their child's pass status without logging in
- **Email notifications** — automatic emails on pass creation, top-up, and session deduction
- **External API** — create passes from external systems via API key
- **PocketID auth** — OAuth2 login via [PocketID](https://github.com/pocket-id/pocket-id)

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | [Bun](https://bun.sh) |
| Backend | `Bun.serve` + manual routing |
| Database | SQLite (`bun:sqlite`) |
| Frontend | React 19 + [Mantine 7](https://mantine.dev) |
| Auth | PocketID (OAuth2 + JWT) |
| Email | Nodemailer (SMTP) |
| Deployment | VPS, single self-contained binary |

## Project Structure

```
berletek/
├── backend/
│   ├── index.ts          # Bun.serve entry point
│   ├── db.ts             # SQLite schema + indexes
│   ├── schema.ts         # Shared TypeScript types
│   ├── auth.ts           # PocketID OAuth2 + JWT
│   ├── middleware.ts     # Auth middleware
│   ├── email.ts          # Email templates and sending
│   ├── config.ts         # Environment variables
│   ├── pass-ops.ts       # Shared pass creation helper
│   ├── queries/
│   │   └── ledger.ts     # Usage ledger query
│   └── routes/
│       ├── auth.ts       # /api/auth/*
│       ├── passes.ts     # /api/passes/*
│       ├── sessions.ts   # /api/sessions, /api/usage-log
│       └── external.ts   # /api/external/* (API key)
└── frontend/
    ├── index.tsx         # React entry point
    ├── modules/
    │   ├── root.tsx              # Auth flow + routing
    │   ├── dashboard.tsx         # App shell
    │   ├── passes.tsx            # Pass list
    │   ├── pass-detail-modal.tsx # Pass detail modal
    │   ├── alkalom-modal.tsx     # Session recording modal
    │   └── public-pass.tsx       # Parent view (no auth)
    ├── components/
    │   ├── pass-ticket.tsx       # Ticket card UI
    │   └── ledger-row.tsx        # Ledger entry row
    └── hooks/
        ├── api-client.ts         # Fetch wrapper with auth header
        ├── use-passes.ts         # Pass list hook
        └── use-pass-detail.ts    # Pass detail hook
```

## Development

### Prerequisites

- [Bun](https://bun.sh) ≥ 1.0
- A running [PocketID](https://github.com/pocket-id/pocket-id) instance (auth)
- An SMTP server (email)

### Install

```bash
git clone https://github.com/nicovok/gigaszok-berletek.git
cd gigaszok-berletek
bun install
```

### Environment variables

Create a `.env` file:

```env
# Required
JWT_SECRET=<strong-secret>
POCKETID_CLIENT_ID=<client-id>
POCKETID_CLIENT_SECRET=<client-secret>
POCKETID_REDIRECT_URI=http://localhost:3000/api/auth/callback

# SMTP
SMTP_HOST=<host>
SMTP_PORT=2525
SMTP_USR=<username>
SMTP_PASS=<password>

# Optional
PORT=3000
BASE_URL=http://localhost:3000
EMAIL_FROM=no-reply@example.com
EXTERNAL_API_KEY=<key-for-external-integrations>
DB_PATH=berletek.db
```

### Run

```bash
bun run dev
# → http://localhost:3000
```

## Build & Deployment

### Single binary build

```bash
bun run build
# → ./berletek  (no Node.js or runtime dependency needed)
```

Pre-built binaries for Linux, macOS, and Windows are attached to every [GitHub Release](https://github.com/nicovok/gigaszok-berletek/releases).

### VPS deployment

1. Copy the binary to the server:
   ```bash
   scp berletek user@vps:/opt/berletek/
   ```

2. Create a `.env` file on the server (set `BASE_URL` to your production URL).

3. Create a systemd service at `/etc/systemd/system/berletek.service`:
   ```ini
   [Unit]
   Description=Berletek
   After=network.target

   [Service]
   WorkingDirectory=/opt/berletek
   EnvironmentFile=/opt/berletek/.env
   ExecStart=/opt/berletek/berletek
   Restart=always
   RestartSec=5

   [Install]
   WantedBy=multi-user.target
   ```

4. Start:
   ```bash
   systemctl enable berletek
   systemctl start berletek
   ```

## API Reference

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/auth/login` | Get OAuth2 login URL |
| GET | `/api/auth/callback` | OAuth2 redirect callback |
| GET | `/api/auth/verify` | Verify JWT token |
| GET | `/api/auth/logout` | Log out |

### Passes _(JWT required)_
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/passes` | List all passes |
| POST | `/api/passes` | Create a pass |
| PUT | `/api/passes/:id` | Update a pass |
| DELETE | `/api/passes/:id` | Delete a pass |
| GET | `/api/passes/:id/usage` | Usage ledger |
| POST | `/api/passes/:id/topup` | Top up `{ sessions }` |
| POST | `/api/passes/:id/deduct` | Manual deduction `{ sessions, note? }` |
| GET | `/api/pass-view/:token` | Parent view (no auth) |

### Sessions _(JWT required)_
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/sessions` | Record a session `{ name, pass_ids[] }` |
| GET | `/api/usage-log` | Recent session log |

### External API _(API key required)_
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/external/passes` | Create a pass via API key |

**Example:**
```bash
curl -X POST https://berlet.gig.nicoprt.xyz/api/external/passes \
  -H "X-API-Key: <EXTERNAL_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "child_name": "John Smith",
    "child_birth_date": "2015-03-12",
    "parent_name": "Jane Smith",
    "parent_email": "jane@example.com",
    "parent_phone": "+36301234567",
    "remaining_sessions": 10
  }'
```

## Data Model

```
passes                  — passes (child + parent info + session balance)
pass_topups             — top-up events
pass_manual_deductions  — manual deductions with optional note
sessions                — recorded training sessions
session_attendance      — which pass was deducted for which session
trainers                — authenticated instructors
```

TypeScript types live in `backend/schema.ts` and are imported directly by the frontend — no runtime validation needed.

## License

[MIT](LICENSE)
