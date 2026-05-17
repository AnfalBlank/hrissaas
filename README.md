# Manggala Attendance System (MAS)

Full-stack PWA HRIS Attendance built on **Next.js 14** with a custom Node server, **Drizzle + Turso** for data, **Socket.IO** for realtime, **Cloudflare R2** for file storage, and **WhatsApp Cloud API** for notifications. UI uses 3D icons (Microsoft Fluent Emoji).

## Stack

**Frontend**
- Next.js 14 App Router, React 18
- TailwindCSS + custom design system
- Recharts, Lucide, TanStack React Query
- Socket.IO client for live feeds
- PWA manifest + service worker

**Backend (Route Handlers + custom Node server)**
- Drizzle ORM + libSQL/Turso
- Jose JWT (HS256) + httpOnly cookie session
- Zod request validation, bcryptjs password hashing
- Edge middleware for route protection
- Socket.IO server (custom `server.js`)
- Cloudflare R2 (S3-compatible) for selfie / leave attachments
- WhatsApp Cloud API for outbound messages

## Getting Started

```bash
npm install
cp .env.example .env.local
# Fill in TURSO_*, JWT_SECRET (required)
# R2_* and WHATSAPP_* are optional (graceful fallback)

npm run db:push       # push schema to Turso
npm run db:seed       # seed demo data
npm run dev           # custom server on :3000
```

Open `http://localhost:3000`.

> The `dev` script runs `node server.js` so Socket.IO works. To run the
> stock Next dev server (no realtime), use `npm run dev:next`.

## Demo Credentials (password: `demo1234`)

| Email | Role |
|---|---|
| `andini@manggala.id` | employee |
| `bayu@manggala.id` | employee |
| `sari@manggala.id` | employee |
| `dimas@manggala.id` | employee |
| `rama@manggala.id` | supervisor |
| `admin@manggala.id` | hr (admin access) |
| `owner@manggala.id` | owner (admin access) |

## Realtime (Socket.IO)

The custom server exposes Socket.IO at `/api/socket`. The client auth
payload (companyId + role) is fetched from `/api/realtime/config`,
which reads the JWT cookie. Each socket joins:

- `company:{companyId}` — receives general company events
- `admin:{companyId}` — admin-only events (live feed)

Events emitted from API routes:

| Event | Trigger | Room |
|---|---|---|
| `attendance:check-in` | `POST /api/attendance/check-in` | `admin:{co}` |
| `attendance:check-out` | `POST /api/attendance/check-out` | `admin:{co}` |
| `leave:applied` | `POST /api/leave/me` | `admin:{co}` |
| `leave:decided` | `PATCH /api/admin/leave` | `admin:{co}` |
| `notification` | any `notify(...)` call | `company:{co}` |
| `chat:message` | `POST /api/chat` | `company:{co}` |

Pages consuming live events:
- `/admin` — dashboard auto-refresh
- `/admin/live` — live map + activity feed
- `/admin/attendance` — table refresh
- `/admin/leave` — refresh on apply/decide
- `/app/notifications` — push refresh
- `/app/chat` — live chat

## Cloudflare R2

When `R2_*` env vars are set, selfie photos uploaded during check-in
go to R2 via S3-compatible API. Without R2 creds, the server falls
back to returning the data URL itself (demo still works).

Endpoints:
- `POST /api/upload` — request a presigned URL for direct browser upload
- `PUT /api/upload` — server-side data URL upload (used by check-in flow)

R2 setup:
```
R2_ACCOUNT_ID=...           # Cloudflare account ID
R2_ACCESS_KEY_ID=...        # R2 API token access key
R2_SECRET_ACCESS_KEY=...    # R2 API token secret
R2_BUCKET=mas-uploads
R2_PUBLIC_BASE_URL=https://cdn.your-domain.com   # optional, otherwise uses presigned GET
```

## WhatsApp Cloud API

When `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set, automatic
WhatsApp messages are sent on:

- Late check-in (to the late employee)
- Leave approved / rejected (to the employee)
- Payroll generated (to all employees)

Without creds, messages are logged to console as `[whatsapp:mock]`.

WhatsApp setup (Meta for Developers):
```
WHATSAPP_TOKEN=EAAG...
WHATSAPP_PHONE_NUMBER_ID=1234567890
WHATSAPP_API_VERSION=v20.0
```

Phone numbers must be in international format. The helper auto-converts
`08xxx` → `628xxx` (Indonesia).

## Scripts

```
npm run dev          # custom Next + Socket.IO server (port 3000)
npm run dev:next     # plain Next dev (no realtime)
npm run build        # production build
npm run start        # NODE_ENV=production node server.js
npm run db:generate  # generate migration SQL from schema
npm run db:push      # push schema directly to Turso
npm run db:studio    # open Drizzle Studio GUI
npm run db:seed      # seed demo data
```

## Project Structure

```
src/
├─ app/
│  ├─ api/                         # Route Handlers
│  │  ├─ auth/                     #   /login, /logout, /me
│  │  ├─ attendance/               #   /check-in (R2 upload + emit + WA), /check-out (emit), /me
│  │  ├─ leave/me                  #   apply (emit) + list quotas
│  │  ├─ payroll/me, /notifications, /announcements, /chat
│  │  ├─ upload                    #   R2 presign + data URL fallback
│  │  ├─ realtime/config           #   client gets socket auth payload
│  │  └─ admin/                    #   dashboard, employees, attendance, leave (notify+emit),
│  │                               #   payroll (notify), shifts, branches, announcements,
│  │                               #   system-status (R2/WA/Socket flags)
│  ├─ app/                         # Employee PWA (mobile-first)
│  ├─ admin/                       # Admin Console
│  ├─ login/, page.tsx (landing)
│  └─ layout.tsx
├─ components/
│  ├─ Icon3D, Providers
│  ├─ admin/Sidebar, TopBar
│  ├─ employee/BottomNav, PageHeader
│  └─ ui/Button, Card, Badge
├─ lib/
│  ├─ utils.ts, api.ts (typed SDK)
│  └─ realtime.ts (useRealtime hook)
├─ middleware.ts                   # auth gating
└─ server/
   ├─ db/{schema,client,seed}.ts
   ├─ auth/{jwt,password,session,constants}.ts
   ├─ api/respond.ts
   ├─ realtime/emitter.ts          # emitToCompany / emitToAdmins
   ├─ notifications/{whatsapp,dispatch}.ts
   ├─ storage/r2.ts                # R2 + base64 fallback
   └─ lib/geo.ts
server.js                          # custom Next + Socket.IO server
```

## API Reference

All responses: `{ ok: true, data }` or `{ ok: false, error }`. Auth via
`mas_session` httpOnly cookie set on login.

### Public
- `POST /api/auth/login` `{ email, password }`
- `POST /api/auth/logout`

### Employee (any auth)
- `GET  /api/auth/me`
- `GET  /api/attendance/me?month=YYYY-MM`
- `POST /api/attendance/check-in` `{ latitude, longitude, method, confidence?, photoUrl?, photoDataUrl? }`
   - GPS distance vs branch geofence (Haversine)
   - calculates `lateMinutes` from shift + grace
   - emits `attendance:check-in`
   - sends WhatsApp + push if late
   - uploads `photoDataUrl` to R2 / fallback
- `POST /api/attendance/check-out` `{ latitude, longitude, method }`
   - calculates `overtimeMinutes`, emits `attendance:check-out`
- `GET  /api/leave/me` — quotas + history
- `POST /api/leave/me` `{ type, fromDate, toDate, reason?, attachmentUrl? }`
   - emits `leave:applied`
- `GET  /api/payroll/me?period=YYYY-MM`
- `GET  /api/notifications` — DB-backed inbox
- `GET  /api/announcements` — CMS feed
- `GET  /api/chat` / `POST /api/chat` `{ text }` — emits `chat:message`
- `POST /api/upload` `{ filename, contentType }` — presigned R2
- `PUT  /api/upload` `{ dataUrl, filename }` — data URL → R2 / fallback
- `GET  /api/realtime/config` — Socket.IO auth payload

### Admin (`hr`, `owner`, `super_admin`, `supervisor` for read)
- `GET  /api/admin/dashboard`
- `GET  /api/admin/system-status` — R2/WA/Socket health
- `GET  /api/admin/employees?q=...` / `POST` create
- `GET  /api/admin/attendance?date=YYYY-MM-DD`
- `GET  /api/admin/leave?status=...`
- `PATCH /api/admin/leave` `{ id, status, note? }` — notifies employee + emits
- `GET  /api/admin/payroll?period=YYYY-MM`
- `POST /api/admin/payroll` `{ period }` — generate from attendance + notify all
- `GET  /api/admin/branches` / `POST` create
- `GET  /api/admin/shifts` / `POST` create
- `GET  /api/admin/announcements` / `POST` create

## Database Schema (13 tables)

`companies`, `branches`, `shifts`, `users`, `employees`, `attendances`,
`leaves`, `leave_quotas`, `payrolls`, `notifications`, `announcements`,
`chats`, `audit_logs`. All multi-tenant — every row scoped to `companyId`.

## Auth & Security

- JWT (HS256), 7-day default expiry, httpOnly cookie
- Edge middleware blocks unauthenticated `/app` and `/admin`
- Role-based access via `requireRole([...])` per endpoint
- bcrypt password hashing, Zod validation
- Tenant isolation enforced at every query

## Deployment

This app uses a custom Node server (`server.js`) so it **cannot deploy
to Vercel** as-is. Recommended for VPS / Docker:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["node", "server.js"]
```

For Vercel, drop `server.js` and use `next start` — Socket.IO would
need to move to a separate service (e.g., Pusher, Ably) or be replaced
by Server-Sent Events.

## License

UNLICENSED — internal demo for Manggala Attendance System PRD.
