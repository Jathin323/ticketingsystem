# Mini Service Ticket Management System

A small full-stack web app for support staff to create, view, filter, and manage
customer service tickets.

- **Frontend:** React 18 + TypeScript + Vite
- **Backend:** Node.js + Express + TypeScript
- **Database:** SQLite (via `better-sqlite3`) — zero-config, no server to install
- **Validation:** Zod
- **Tests:** Vitest + Supertest

---

## Features

**Core**

- List all tickets in a sortable table (with a card layout on mobile).
- Create a ticket via a validated modal form.
- Filter by status, priority, and customer.
- Search by title or customer name.
- Open a ticket to see full details and its history.
- Change status: Open → In Progress → Resolved → Closed.
- Every ticket shows: ID, customer, title, description, priority, status,
  created date, last-updated date.

**Bonus (implemented)**

- Pagination with page metadata.
- Sorting by created date, updated date, priority, or status.
- Comments on a ticket (a second table with a foreign key — demonstrates a relationship).
- Loading skeletons, error banners with retry, and empty states.
- Optimistic UI for status changes (rolls back on failure).
- Responsive design (table collapses to cards under 720px).
- API tests (12 cases covering CRUD, validation, filtering, and errors).
- TypeScript end to end.
- Dockerfiles + `docker-compose.yml`.
- Idempotent schema migration on boot.

---

## Project structure

```
ticket-system/
├── backend/
│   ├── src/
│   │   ├── app.ts              # Express app factory (exported for tests)
│   │   ├── index.ts            # Server bootstrap
│   │   ├── types.ts            # Domain types & constants
│   │   ├── validation.ts       # Zod schemas (body + query)
│   │   ├── db/
│   │   │   ├── index.ts        # DB connection + migration
│   │   │   └── seed.ts         # Sample data
│   │   ├── middleware/
│   │   │   └── errorHandler.ts # HttpError, 404, central error shaping
│   │   └── routes/
│   │       └── tickets.ts      # All /api/tickets routes + comments
│   └── tests/
│       └── tickets.test.ts     # API tests
├── frontend/
│   └── src/
│       ├── App.tsx             # State, data fetching, orchestration
│       ├── api/client.ts       # Typed fetch client
│       ├── components/         # Toolbar, TicketTable, Pagination,
│       │                       # CreateTicketModal, TicketDetailPanel, Badges
│       ├── types.ts            # API contract types
│       └── utils.ts            # Date formatting helpers
└── docker-compose.yml
```

---

## Getting started (local)

Requires **Node.js 20+**. Use two terminals.

### 1. Backend

```bash
cd backend
npm install
npm run seed      # optional: load 8 sample tickets
npm run dev       # starts on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev       # starts on http://localhost:5173
```

Open **http://localhost:5173**. The Vite dev server proxies `/api` to the
backend, so no CORS or URL config is needed.

---

## Getting started (Docker)

```bash
docker compose up --build
```

- Frontend: **http://localhost:8080**
- Backend API: **http://localhost:4000**

The SQLite file is persisted in a named volume (`ticket-data`). To seed sample
data inside the running backend container:

```bash
docker compose exec backend node dist/db/seed.js
```

> The backend image is a two-stage build: the runtime stage installs only
> production dependencies and copies the compiled `dist/` output, not `src/`
> or dev tools like `tsx`. `npx tsx src/db/seed.ts` won't work in that
> container — use the compiled `dist/db/seed.js` instead (the same file
> `npm run build` produces locally).

---

## Environment variables

**Backend** (`backend/.env`, see `.env.example`)

| Variable  | Default          | Description                     |
| --------- | ---------------- | ------------------------------- |
| `PORT`    | `4000`           | Port the API listens on         |
| `DB_PATH` | `./data.sqlite`  | Path to the SQLite file         |

**Frontend** (`frontend/.env`, see `.env.example`)

| Variable            | Default | Description                              |
| ------------------- | ------- | ---------------------------------------- |
| `VITE_API_BASE_URL` | `/api`  | API base URL (proxied to `:4000` in dev) |

---

## API reference

Base path: `/api`

| Method   | Path                        | Description                          |
| -------- | --------------------------- | ------------------------------------ |
| `GET`    | `/tickets`                  | List tickets (filter/search/sort/page) |
| `GET`    | `/tickets/:id`              | Get one ticket with its comments     |
| `POST`   | `/tickets`                  | Create a ticket                      |
| `PUT`    | `/tickets/:id`              | Update a ticket (partial)            |
| `DELETE` | `/tickets/:id`              | Delete a ticket                      |
| `GET`    | `/tickets/:id/comments`     | List a ticket's comments             |
| `POST`   | `/tickets/:id/comments`     | Add a comment                        |
| `GET`    | `/health`                   | Health check                         |

### List query parameters

| Param          | Type   | Default     | Notes                                                    |
| -------------- | ------ | ----------- | ------------------------------------------------------- |
| `status`       | enum   | —           | `Open` \| `In Progress` \| `Resolved` \| `Closed`       |
| `priority`     | enum   | —           | `Low` \| `Medium` \| `High`                             |
| `customerName` | string | —           | Partial, case-insensitive match                         |
| `search`       | string | —           | Matches title **or** customer name                      |
| `sortBy`       | enum   | `createdAt` | `createdAt` \| `updatedAt` \| `priority` \| `status`    |
| `order`        | enum   | `desc`      | `asc` \| `desc`                                         |
| `page`         | int    | `1`         | 1-based                                                 |
| `pageSize`     | int    | `10`        | Max `100`                                               |

### Example: create a ticket

```bash
curl -X POST http://localhost:4000/api/tickets \
  -H "Content-Type: application/json" \
  -d '{
    "customerName": "Acme Corp",
    "title": "Cannot log in",
    "description": "500 error on valid credentials",
    "priority": "High"
  }'
```

Response `201 Created`:

```json
{
  "id": 1,
  "customerName": "Acme Corp",
  "title": "Cannot log in",
  "description": "500 error on valid credentials",
  "priority": "High",
  "status": "Open",
  "createdAt": "2025-09-10T12:00:00.000Z",
  "updatedAt": "2025-09-10T12:00:00.000Z"
}
```

### Example: list response shape

```json
{
  "data": [ /* Ticket[] */ ],
  "pagination": { "page": 1, "pageSize": 10, "total": 8, "totalPages": 1 }
}
```

### Status codes

| Code  | When                                                        |
| ----- | ---------------------------------------------------------- |
| `200` | Successful read / update                                   |
| `201` | Ticket or comment created                                 |
| `204` | Ticket deleted                                            |
| `400` | Validation failed, or non-numeric `:id`                   |
| `404` | Ticket not found, or unknown route                        |
| `500` | Unexpected server error (logged, not leaked to client)    |

A validation error returns a readable breakdown:

```json
{
  "error": "Validation failed",
  "details": [{ "field": "priority", "message": "priority must be one of: Low, Medium, High" }]
}
```

---

## Data model

```
Ticket
------
id            INTEGER  (PK, auto-increment)
customerName  TEXT     (required, ≤120 chars)
title         TEXT     (required, ≤160 chars)
description   TEXT     (required, ≤5000 chars)
priority      TEXT     (Low | Medium | High)
status        TEXT     (Open | In Progress | Resolved | Closed)
createdAt     TEXT     (ISO 8601)
updatedAt     TEXT     (ISO 8601)

Comment
-------
id         INTEGER  (PK, auto-increment)
ticketId   INTEGER  (FK -> tickets.id, ON DELETE CASCADE)
author     TEXT     (required)
body       TEXT     (required)
createdAt  TEXT     (ISO 8601)
```

`CHECK` constraints on `priority`/`status` and a foreign key on `comments`
enforce integrity at the database level, in addition to Zod validation at the
API boundary.

---

## Testing

```bash
cd backend
npm test
```

Tests run against an in-memory SQLite database (`NODE_ENV=test`), so they are
isolated and leave no files behind. They cover create/read/update/delete,
missing and invalid fields, invalid IDs, filtering, search, pagination, and
comments.

---

## Design notes & decisions

- **SQLite + better-sqlite3** was chosen so the project runs with zero database
  setup — clone, `npm install`, run. `better-sqlite3` is synchronous, which
  keeps route handlers simple and fast for this workload. Swapping to Postgres
  later would only touch `db/index.ts` and the query layer.
- **Validation lives at the API boundary** (Zod) and is mirrored by database
  `CHECK` constraints — the backend never trusts client input.
- **One central error handler** shapes every error response, so routes just
  throw `HttpError` (or let a `ZodError` bubble up) and stay readable.
- **The Express app is a factory** (`createApp`) exported separately from the
  server bootstrap, which is what lets Supertest run it without opening a port.
- **Frontend uses a slide-over detail panel** rather than a separate route so
  the ticket list stays visible while triaging — the common support workflow.
- **Optimistic status updates** make the UI feel instant and roll back if the
  request fails.

## Possible next steps

Given more time: authentication/roles, server-side pagination cursors for very
large datasets, activity/audit log, full-text search, and E2E tests
(Playwright).
