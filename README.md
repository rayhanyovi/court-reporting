# Court Reporting Workflow Manager

A simplified workflow system for managing court-reporting transcription jobs:
assign reporters and editors, track job status through its lifecycle, and
calculate payouts.

## Stack

- **Backend:** Node.js + TypeScript, Express, SQLite (`better-sqlite3`), Zod for validation
- **Frontend:** React + TypeScript (Vite)

SQLite was chosen so the project runs with zero database setup — the DB file
(`backend/data.sqlite`) is created and seeded automatically on first start.

## Getting started

Two terminals. Backend first (the frontend proxies API calls to it).

```bash
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm install
npm run dev

# Terminal 2 — frontend (http://localhost:5174)
cd frontend
npm install
npm run dev
```

Open the printed frontend URL. The Vite dev server proxies `/api/*` to the
backend on port 4000, so no extra configuration is needed.

The database is seeded with 4 reporters and 2 editors on first run.

## Domain model

**Job** `case_name`, `duration_minutes`, `location` (`physical` | `remote`),
`city` (required for physical), `status`, assigned reporter/editor, `review_status`.

**Reporter** `name`, `city`, `availability` (`available` | `busy`).

**Editor** `name`, `flat_fee` (IDR).

### Job lifecycle

```
NEW ──assign reporter──▶ ASSIGNED ──mark transcribed──▶ TRANSCRIBED
    ──assign editor──▶ (review) ──mark reviewed──▶ REVIEWED ──complete──▶ COMPLETED
```

Transitions are validated server-side. Guards enforce ordering, e.g. you
cannot mark a job `TRANSCRIBED` without a reporter, or `REVIEWED` without an
editor. Assigning a reporter marks them `busy`; completing the job frees them.

### Reporter assignment logic

`GET /api/jobs/:id/reporter-suggestions` returns reporters ranked for the job:

- `available` reporters rank above `busy` ones.
- For **physical** jobs, reporters in the **same city** as the job rank highest.
- **Remote** jobs can use any reporter (no city preference).

The dashboard pre-selects the top suggestion (labelled "best match").

### Payment

- Reporter: `duration_minutes × 2000 IDR/min` (paid once a reporter is assigned).
- Editor: flat fee per job (per-editor, default 50 000 IDR; seeded editors are 50 000 and 75 000).
- `total_payout = reporter_payout + editor_payout`.

Payment is computed on read and returned with every job.

## REST API

| Method | Path | Description |
| --- | --- | --- |
| `GET` | `/api/health` | Health check |
| `GET` | `/api/jobs` | List jobs (with reporter, editor, payment) |
| `GET` | `/api/jobs/:id` | Get one job |
| `POST` | `/api/jobs` | Create a job |
| `GET` | `/api/jobs/:id/reporter-suggestions` | Ranked reporters for assignment |
| `POST` | `/api/jobs/:id/assign-reporter` | `{ reporter_id }` — only while `NEW` |
| `POST` | `/api/jobs/:id/assign-editor` | `{ editor_id }` — only while `TRANSCRIBED` |
| `PATCH` | `/api/jobs/:id/status` | `{ status }` — validated transition |
| `GET` | `/api/reporters` · `POST` | List / create reporters |
| `GET` | `/api/editors` · `POST` | List / create editors |

### Example

```bash
# Create a physical job in Jakarta
curl -X POST localhost:4000/api/jobs -H 'Content-Type: application/json' \
  -d '{"case_name":"State v. Doe","duration_minutes":90,"location":"physical","city":"Jakarta"}'

# Assign best-matched reporter, then walk the workflow
curl localhost:4000/api/jobs/1/reporter-suggestions
curl -X POST localhost:4000/api/jobs/1/assign-reporter -H 'Content-Type: application/json' -d '{"reporter_id":1}'
curl -X PATCH localhost:4000/api/jobs/1/status -H 'Content-Type: application/json' -d '{"status":"TRANSCRIBED"}'
curl -X POST localhost:4000/api/jobs/1/assign-editor -H 'Content-Type: application/json' -d '{"editor_id":1}'
curl -X PATCH localhost:4000/api/jobs/1/status -H 'Content-Type: application/json' -d '{"status":"REVIEWED"}'
curl -X PATCH localhost:4000/api/jobs/1/status -H 'Content-Type: application/json' -d '{"status":"COMPLETED"}'
```

Invalid operations return `4xx` with a descriptive `error` (e.g. assigning an
editor before transcription → `409`, physical job without a city → `400`).

## Project structure

```
backend/
  src/
    index.ts        Express app + route wiring
    db.ts           SQLite schema + seed data
    types.ts        Shared domain types / enums
    payment.ts      Payment calculation
    workflow.ts     Allowed status transitions
    repo.ts         Queries + job assembly + reporter ranking
    routes/
      jobs.ts       Jobs, assignment, status, suggestions
      people.ts     Reporters + editors
frontend/
  src/
    App.tsx         Dashboard (stats, list, create)
    api.ts          Typed fetch client
    components/
      CreateJobForm.tsx
      JobCard.tsx   Per-job status, assignments, payment, actions
```

## Notes / trade-offs

- Reset the seed by deleting `backend/data.sqlite` and restarting.
- If port 5174 is taken Vite will pick another and print it; the API proxy still works.
- Build for production with `npm run build` in each package.
