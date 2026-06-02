# VoiceScript — Court Reporting Workflow Manager

A full-stack application for managing court reporting jobs, reporter and editor assignments, transcription workflows, and payment tracking. Built for a take-home assessment with an emphasis on clean architecture, responsive UI, and comprehensive feature set.

**Live repo:** [github.com/rayhanyovi/court-reporting](https://github.com/rayhanyovi/court-reporting)

---

## ✨ Key Features

### Job Lifecycle Management
- **5-state workflow:** NEW → ASSIGNED → TRANSCRIBED → REVIEWED → COMPLETED
- Status-driven UI with semantic color coding (gray / blue / purple / amber / green)
- Real-time state validation and guard clauses
- Activity timeline tracking all state transitions

### Smart Reporter Matching
- Ranked suggestion system based on availability and location
- **Available** reporters rank above **Busy** ones
- **Same-city bonus** for physical jobs — reporters in matching cities float to top
- "Best match" tab design highlights top candidates
- Integration with city-based job location

### Payment Calculation
- **Reporter:** `duration_minutes × 2000 IDR/min` (paid upon assignment)
- **Editor:** Flat fee per job (default 50k–75k IDR)
- Real-time payout aggregation in dashboard
- Payment breakdown per job with audit trail

### Dashboard & Analytics
- **4 KPIs:** Total Jobs, In Progress, Completion %, Total Payout
- **Job status breakdown bar chart** (NEW, ASSIGNED, TRANSCRIBED, REVIEWED, COMPLETED)
- **Donut chart** by location (Physical / Remote / Available reporters)
- **Top earners** tables (reporters & editors)
- All metrics auto-refresh on mutations

### Workflow Board
- **5-column Kanban:** one per status
- **Job cards** with duration, location, reporter/editor avatars, and payout
- **Search + filter** by case name, location (All / Physical / Remote)
- Click to open detailed drawer

### Job Details Drawer
- **Status badge + metadata** (location, duration, created, review status)
- **Team section** with assigned reporter/editor, avatars, payouts
- **Payment breakdown** (reporter rate, editor fee, total)
- **Activity timeline** with icons and timestamps for all job events
- **Reporter picker** with ranked suggestions + availability/same-city badges
- **Editor picker** with flat-fee display

### Staff Management
- **Reporters view:** Table with city, availability, job count, earnings
- **Editors view:** Table with flat fee/job, job count, earnings
- Create new reporters (name + city) and editors (name + flat fee)

### Design & UX
- **Hand-written CSS design system** (no framework)
- **Blue steel primary color** (#2B6CB0) from VoiceScript logo
- **Semantic status palette** — each state has solid/soft/text variants
- **Responsive layout:** sidebar collapses to bottom nav at 760px
- **Skeleton loaders** for all async states
- **Aria-live toast system** for feedback
- **Keyboard-accessible modals** (Escape to close)
- **IDR currency formatting** with compact notation (e.g., "Rp 450rb")

---

## 🛠 Tech Stack

### Backend
- **Framework:** Express.js + TypeScript (ESM)
- **Database:** SQLite with WAL mode (better-sqlite3)
- **Validation:** Zod
- **Testing:** Vitest + Supertest (20 tests, all passing)
- **Features:** Audit trail, stats aggregation, error envelope, logging

### Frontend
- **Framework:** React 18 + TypeScript (Vite)
- **Routing:** Hash-based (no Next.js)
- **Styling:** Vanilla CSS with design tokens
- **Icons:** Custom SVG icon library (24 icons)
- **HTTP Client:** Typed fetch with error handling

### Deployment
- Zero database setup — SQLite file auto-created on first run
- Environment variables optional (defaults to localhost)
- Single command to start both servers

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 8+

### Installation & Run

**Two terminals required.** Start the backend first, then the frontend.

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd backend
npm install
npm run dev
```

```bash
# Terminal 2 — Frontend (http://localhost:5174)
cd frontend
npm install
npm run dev
```

Open the printed frontend URL (e.g., `http://localhost:5174`). The Vite dev server proxies `/api/*` to the backend on port 4000 automatically.

### Demo Data

The database is **auto-seeded** on first run with:
- **6 reporters:** 3 in Jakarta, 2 in Bandung, 1 in Surabaya (mix of available/busy)
- **3 editors:** Flat fees 50k–75k IDR
- **9 sample jobs:** across all 5 statuses (NEW, ASSIGNED, TRANSCRIBED, REVIEWED, COMPLETED) with realistic assignments and payouts

**To reset:** Delete `backend/data.sqlite` and restart the server.

---

## 📸 Screenshots

To see the app in action, start both servers and navigate to `http://localhost:5174`. Below are visual guides and screenshots of key views:

### 1. Dashboard
**Main analytics view** with 4 KPIs, job status breakdown, location distribution, and top earners.

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│ VoiceScript                           Dashboard  [New Job]   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Total Jobs  11          In Progress  7                     │
│  16h 47m recorded        4 completed                        │
│                                                              │
│  Completion  36%         Total Payout  Rp 1.3M             │
│  4 of 11 delivered       Rp 1.700.000 projected            │
│                                                              │
│  Jobs by status:                    View board →            │
│  ████ New (4)                                               │
│  Assigned (0)                                               │
│  ███ Transcribed (3)                                        │
│  Reviewed (0)                                               │
│  ████ Completed (4)                                         │
│                                                              │
│  By location:              Top reporters:                   │
│   ◐ 11 jobs               Maya Putri — 450k earned        │
│   [Physical] [Remote]     Reza Firmansyah — 435k earned   │
│   [Available reporters]                                     │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Key elements:**
- 4 KPI cards (Total Jobs, In Progress, Completion %, Total Payout)
- Status bar chart (color-coded per state)
- Location donut chart with legend
- Top earners tables

---

### 2. Workflow Board
**Kanban-style job management** with 5-column status flow, search, and location filter.

**Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│ Workflow Board                           [All] [Physical] [Remote] │
│ Track every case from intake through completion              │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  NEW (4)           ASSIGNED (0)    TRANSCRIBED (3)          │
│  ┌─────────────┐   No jobs        ┌─────────────┐          │
│  │ Test Case   │                  │ Pertiwi v.  │          │
│  │ 45 min Jakarta                 │ Dharma      │          │
│  │ Unassigned  │                  │ 75 min Remote          │
│  │ Rp 0        │                  │ With editor │          │
│  └─────────────┘                  │ Rp 150.000  │          │
│  │ Remote      │                  └─────────────┘          │
│  │ Examination │                  │ Labor       │          │
│  │ 1h Remote                       │ Tribunal    │          │
│  │ Unassigned                      │ 60 min Bandung        │
│  │ Rp 0        │                  │ Awaiting editor        │
│  └─────────────┘                  │ Rp 120.000  │          │
│  │ Wibowo...   │                  └─────────────┘          │
│  │ 2h 30m Jakarta                                           │
│  │ Unassigned                                               │
│  │ Rp 0        │                                           │
│  └─────────────┘                                           │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Features:**
- 5 columns: NEW, ASSIGNED, TRANSCRIBED, REVIEWED, COMPLETED
- Job cards show: case name, duration, location, reporter/editor (avatar), payout
- Search bar (filter by case name)
- Location filter: All / Physical / Remote
- Click any card to open details drawer

---

### 3. Job Details Drawer
**Slide-out panel** showing full job metadata, team assignments, payment breakdown, and activity timeline.

**Layout:**
```
┌────────────────────────────────────────────────┐
│ Test Case — Demo Verification            [×]   │
├────────────────────────────────────────────────┤
│ ● New  Job #11 · created 23m ago              │
│                                                │
│ Location    Duration                          │
│ Jakarta     45 min                            │
│ Created     Review                            │
│ 02 Jun 09:03  —                              │
│                                                │
│ TEAM                                           │
│ ┌─────────────────────────────────────────┐  │
│ │ 🎤  No reporter                         │  │
│ │     Assign to start the workflow        │  │
│ └─────────────────────────────────────────┘  │
│ ┌─────────────────────────────────────────┐  │
│ │ ✏️  No editor                            │  │
│ │     Assigned after transcription        │  │
│ └─────────────────────────────────────────┘  │
│                                                │
│ PAYMENT BREAKDOWN                              │
│ 🎤  Reporter              —                   │
│ ✏️  Editor flat fee      —                    │
│ 💳  Total payout        Rp 0                  │
│                                                │
│ ACTIVITY                                       │
│ ⊕ Job created                                 │
│   Job created (physical, 45 min)             │
│   02 Jun 09:03                               │
│                                                │
├────────────────────────────────────────────────┤
│ [Assign reporter] Pick a reporter...         │
└────────────────────────────────────────────────┘
```

---

### 4. Reporter Picker
**Smart ranking system** with "Best match" highlight, same-city badges, and availability indicators.

**Layout:**
```
CHOOSE A REPORTER
Ranked for Jakarta — same-city & available first.

┌─────────────────────────────────────────────┐
│ [Best match]                                │ ← Green tab
│ 🔵 Reza Firmansyah                       →  │
│    Jakarta · ✓ Available                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🟠 Budi Santoso                          →  │
│    Jakarta · [Same city] · ✗ Busy          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🟠 Dewi Lestari                          →  │
│    Jakarta · [Same city] · ✗ Busy          │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🔵 Andi Pratama                          →  │
│    Surabaya · ✓ Available                   │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🔵 Maya Putri                            →  │
│    Bandung · ✓ Available                    │
└─────────────────────────────────────────────┘

┌─────────────────────────────────────────────┐
│ 🟠 Sari Wijaya                           →  │
│    Bandung · ✗ Busy                        │
└─────────────────────────────────────────────┘

[Cancel]
```

**Features:**
- Ranked by: availability (✓ Available > ✗ Busy) + location (same city first)
- Green "Best match" tab for top candidate
- Blue "Same city" badges for Jakarta reporters
- Status badges: green (Available) / orange (Busy)
- Arrow on right (justify-content: space-between)

---

### 5. Reporters Table
Staff management view with city, availability, job count, and lifetime earnings.

```
┌────────────────────────────────────────────────────┐
│ Reporter         City      Availability  Jobs   Earned   │
├────────────────────────────────────────────────────┤
│ 🔵 Maya Putri    Bandung   ✓ Available   5 (3)  Rp 450rb │
│ 🟠 Reza F.       Jakarta   ✓ Available   5 (1)  Rp 435rb │
│ 🟠 Budi Santoso  Jakarta   ✗ Busy        4      Rp 390rb │
│ 🟠 Dewi Lestari  Jakarta   ✗ Busy        3 (1)  Rp 255rb │
│ 🔵 Andi Pratama  Surabaya  ✓ Available   2      Rp 165rb │
│ 🔵 Sari Wijaya   Bandung   ✗ Busy        1      Rp 120rb │
└────────────────────────────────────────────────────┘
```

Sorted by **earned (descending)**, shows job count + active count, availability status.

---

### 6. Editors Table
Similar staff view for editors with flat-fee rate.

```
┌────────────────────────────────────────────────────┐
│ Editor             Flat fee/job   Jobs   Earned    │
├────────────────────────────────────────────────────┤
│ 🟣 Tono Marlito   Rp 75.000      2 (1)  Rp 150rb  │
│ 🔵 Rina Hapsari   Rp 50.000      1      Rp 50rb   │
│ 🟡 Citra Dewanti  Rp 60.000      1      Rp 60rb   │
└────────────────────────────────────────────────────┘
```

Sorted by **earned (descending)**.

---

---

## 🎬 Live Demo Screenshots

**Dashboard Analytics**
- 4 KPI cards: Total Jobs (11), In Progress (7), Completion (36%), Total Payout (Rp 1.3M)
- Jobs by status bar chart with semantic colors
- By location donut chart (Physical 8, Remote 3, Available reporters 3)
- Top reporters & editors earnings tables

**Workflow Board**
- 5-column Kanban: NEW (4) → ASSIGNED → TRANSCRIBED (3) → REVIEWED → COMPLETED
- Job cards with duration, location, reporter/editor, payout
- Search + filter (All / Physical / Remote)
- Click to open job details

**Job Details Drawer**
- Status badge, location, duration, created date, review status
- Team section (reporter + editor)
- Payment breakdown (reporter rate × minutes, editor flat fee, total)
- Activity timeline with all state transitions
- Assign reporter/editor with smart ranking

**Reporter Picker**
- Ranked by availability (Available > Busy) + location (same city first)
- "Best match" green tab for top candidate
- "Same city" blue badges + "Available"/"Busy" status badges
- 6 reporters from Jakarta, Bandung, Surabaya

**Reporters Table**
- Name, City, Availability (green Available / orange Busy)
- Job count + active count, Lifetime earnings
- Sorted by earnings descending (Maya Putri: Rp 450k, Reza: Rp 360k, etc.)

**Editors Table**
- Name, Flat fee/job, Job count, Lifetime earnings
- Sorted by earnings descending (Tono: Rp 75k/job, Rina: Rp 50k/job, etc.)

---

## 📡 REST API

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Health check |
| `GET` | `/api/jobs` | List all jobs (with reporter, editor, payment) |
| `GET` | `/api/jobs/:id` | Get one job details |
| `POST` | `/api/jobs` | Create a job |
| `GET` | `/api/jobs/:id/reporter-suggestions` | Ranked reporters for assignment |
| `POST` | `/api/jobs/:id/assign-reporter` | Assign reporter to job |
| `POST` | `/api/jobs/:id/assign-editor` | Assign editor to job |
| `PATCH` | `/api/jobs/:id/status` | Update job status (validated) |
| `GET` | `/api/reporters` | List reporters |
| `POST` | `/api/reporters` | Create reporter |
| `GET` | `/api/editors` | List editors |
| `POST` | `/api/editors` | Create editor |
| `GET` | `/api/stats` | Dashboard analytics |

### Example: Create Job & Walk Workflow

```bash
# Create a physical job in Jakarta
curl -X POST http://localhost:4000/api/jobs \
  -H 'Content-Type: application/json' \
  -d '{
    "case_name": "State v. Hartono",
    "duration_minutes": 90,
    "location": "physical",
    "city": "Jakarta"
  }'
# Returns: { "id": 1, "status": "NEW", ... }

# Get reporter suggestions for this job
curl http://localhost:4000/api/jobs/1/reporter-suggestions
# Returns ranked reporters (available + same-city first)

# Assign top reporter
curl -X POST http://localhost:4000/api/jobs/1/assign-reporter \
  -H 'Content-Type: application/json' \
  -d '{"reporter_id": 6}'
# Reporter marked busy, reporter_payout calculated

# Mark transcribed
curl -X PATCH http://localhost:4000/api/jobs/1/status \
  -H 'Content-Type: application/json' \
  -d '{"status": "TRANSCRIBED"}'

# Assign editor
curl -X POST http://localhost:4000/api/jobs/1/assign-editor \
  -H 'Content-Type: application/json' \
  -d '{"editor_id": 1}'

# Mark reviewed
curl -X PATCH http://localhost:4000/api/jobs/1/status \
  -H 'Content-Type: application/json' \
  -d '{"status": "REVIEWED"}'

# Complete (reporter freed, payout locked)
curl -X PATCH http://localhost:4000/api/jobs/1/status \
  -H 'Content-Type: application/json' \
  -d '{"status": "COMPLETED"}'

# Check stats
curl http://localhost:4000/api/stats
```

### Error Responses

Invalid operations return `4xx` with a descriptive error envelope:

```json
{
  "error": {
    "message": "Cannot assign editor before TRANSCRIBED status",
    "details": "status is ASSIGNED"
  }
}
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend
npm run test
```

All 20 tests pass (workflow, payment calculation, validation).

### Frontend Build

```bash
cd frontend
npm run build
```

Production bundle: 184 kB JS / 18 kB CSS (gzipped: 56 kB / 4.4 kB)

---

## 📁 Project Structure

```
voicescript-test/
├── backend/
│   ├── src/
│   │   ├── index.ts           Express setup + route wiring
│   │   ├── db.ts              SQLite schema + seed data
│   │   ├── types.ts           Domain types (Job, Reporter, Editor, etc.)
│   │   ├── payment.ts         Payment calculation logic
│   │   ├── workflow.ts        Status transition rules
│   │   ├── repo.ts            Data access + job assembly + ranking
│   │   ├── errors.ts          Error envelope + handling
│   │   ├── routes/
│   │   │   ├── jobs.ts        Job CRUD + assignment + status
│   │   │   └── people.ts      Reporter & editor CRUD
│   │   └── __tests__/          Vitest suites
│   ├── package.json           Dependencies
│   └── vitest.config.ts       Test config
├── frontend/
│   ├── src/
│   │   ├── App.tsx            Root shell + nav + routing
│   │   ├── api.ts             Typed fetch client
│   │   ├── data.tsx           React Context for global state
│   │   ├── toast.tsx          Toast notification system
│   │   ├── useHashRoute.ts    Hash-based routing hook
│   │   ├── ui.tsx             Shared UI components
│   │   ├── format.ts          Utilities (IDR format, dates, etc.)
│   │   ├── types.ts           TypeScript interfaces
│   │   ├── styles.css         Design system + component styles
│   │   ├── components/
│   │   │   ├── icons.tsx      24 custom SVG icons
│   │   │   ├── CreateJobModal.tsx
│   │   │   ├── CreatePersonModal.tsx
│   │   │   └── JobDrawer.tsx   Job details + reporter/editor picker
│   │   └── views/
│   │       ├── Dashboard.tsx   Analytics + KPIs
│   │       ├── Board.tsx       Kanban workflow
│   │       ├── Reporters.tsx   Staff table
│   │       └── Editors.tsx     Staff table
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── .gitignore
└── README.md
```

---

## 🎯 Design Decisions

### Database: SQLite
- **Zero setup:** File-based, auto-created
- **WAL mode:** Enables concurrent reads & writes
- **Foreign keys enabled:** Referential integrity
- **Suitable for scope:** Not expecting production scale

### Frontend: Vanilla CSS
- **Full control:** No Tailwind lock-in
- **Design tokens:** Centralized color, spacing, shadows
- **Responsive:** Mobile-first, breakpoints at 760px / 1080px
- **Accessible:** WCAG AA contrast (4.5:1), keyboard nav, aria-live

### Audit Trail
- Every job event logged (`job_events` table)
- Rendered as activity timeline in drawer
- Timestamps, event type, message, optional details

### Reporter Ranking
- **Algorithm:** `score = availability_bonus + location_bonus`
- Available: +2, Busy: 0
- Same city (physical only): +4, Different city: 0
- Returns plain Reporter[] (no score exposed to frontend)

### Payment Model
- Reporter: Per-minute (calculated on assignment, locked at completion)
- Editor: Flat fee (added when editor assigned, no refund if job changes)
- Both aggregated in stats for top earners

---

## 🔍 Key Implementation Details

### State Management
- **React Context** (DataProvider) holds jobs, reporters, editors, stats, loading, error
- **Mutations** auto-refresh all data via `Promise.all()`
- No Redux/Zustand — Context sufficient for this scope

### Form Handling
- Uncontrolled inputs with React events
- Zod validation on submit (frontend mirrors backend rules)
- Error states inline with field
- Loading buttons disable on submit

### Error Handling
- All API errors caught, displayed as toasts
- Error envelope standardized: `{ error: { message, details? } }`
- Validation fails fast with descriptive messages

### Accessibility
- **Skeleton loaders** for async states
- **Aria-live region** for toast announcements
- **Focus trap** in modals (Escape to close)
- **Keyboard navigation** in all pickers
- **Color + icon** for status (not color-only)
- **44×44px+ touch targets**

---

## 📝 Notes

- **Data persistence:** Deleted jobs do not persist (soft-delete not implemented)
- **Port conflicts:** If 5174 is taken, Vite picks the next available; proxy still works
- **CORS:** Not configured — frontend and backend on same machine
- **Environment:** Customize `backend/src/index.ts` to change ports

---

## ✅ Verification Checklist

- [x] TypeScript: `tsc --noEmit` (clean)
- [x] Build: `npm run build` (dist produced)
- [x] Tests: `npm run test` (20/20 passing)
- [x] E2E: Dashboard, Board, Drawers, Pickers render correctly
- [x] API: All endpoints tested and working
- [x] UX: Responsive (1280px desktop, 375px mobile), accessible

---

## 👤 Author

**Rayhan Yovi** — [yovihan@gmail.com](mailto:yovihan@gmail.com)

---

## 📄 License

This project is part of a take-home assessment. All code authored by Rayhan Yovi.
