# MENYA — AI-powered TVET learning platform

MENYA is a full-stack, role-aware learning platform for Rwandan TVET institutions. It combines a calm, mobile-first learning experience for students with dedicated teacher/trainer, reviewer and administrator workplaces — each with its own dashboard, navigation and AI copilot.

## Repository layout

The project is an npm workspace with the client and server fully separated:

```
menya/
  client/                 Vite + React + TypeScript frontend
    public/               manifest, icons, service worker
    src/
      components/         layout, UI primitives, charts, AI patterns
      context/            app preferences and authenticated session
      data/               role-specific navigation and static teaching content
      hooks/              useAIInsights (server-backed AI cards)
      lib/                API client with token refresh and AI helpers
      pages/
        admin/            platform overview, users, courses, settings
        reviewer/         QA dashboard, queue, decision history
        trainer/          dashboard, cohorts, courses, submission oversight
        ...               student learning pages
      styles/             design tokens and component classes
      types.ts            shared domain types
  server/                 Express + MongoDB API
    data/                 assessment catalogue and private answer keys
    middleware/           auth, roles and error handling
    models/               Mongoose schemas
    routes/               auth, users, courses, progress, planner, attempts,
                          assessments, reviews, analytics, ai
    services/ai.ts        role-aware insights and tutoring logic
    index.ts              API app assembly
```

## Run locally

Requirements: Node.js 20+ and MongoDB listening on `mongodb://127.0.0.1:27017` (or set `MONGODB_URI` in `server/.env`).

```bash
npm install
cp server/.env.example server/.env   # then edit secrets if needed
cp client/.env.example client/.env   # optional: override the API proxy target
npm run seed                         # creates demo users and sample data
npm run dev                          # API on :4000, Vite on :5173
```

Open `http://localhost:5173`. Vite proxies `/api` to the Express API, so cookies and auth headers work the same in development. The login page redirects each role to its own home route.

Production build and preview:

```bash
npm run build        # client build + client/server typechecks
npm start            # API only; serve client/dist with a static host
npm run preview      # optional local preview of the built client
```

## Role-specific workplaces

| Role | Home | What they get |
| --- | --- | --- |
| Student | `/dashboard` | Learning workspace, curriculum, resources, assessments, analytics, planner |
| Teacher / trainer | `/trainer` | Cohort dashboard, learner directory, course oversight, submission oversight |
| Reviewer | `/reviewer` | QA dashboard, decision queue, decision history |
| Administrator | `/admin` | Platform overview, users & access, course catalogue, platform settings |

All roles also get `/ai` for the global MENYA AI workspace and `/settings` for personal preferences. Student learning pages are protected and are not exposed to institutional roles. Navigation, page titles, notifications, AI prompts and safe AI actions all change with the signed-in role.

### Demo accounts

All demo accounts use password `Demo1234!`.

| Role | Email | Access |
| --- | --- | --- |
| Student | `student@menya.rw` | Student learning workspace only |
| Trainer | `trainer@menya.rw` | `/trainer/*` workplace |
| Reviewer | `reviewer@menya.rw` | `/reviewer/*` workplace |
| Administrator | `admin@menya.rw` | `/admin/*` workplace |

The login screen has one-click buttons for each demo account. New registrations always receive the student role.

## Authentication and authorization

- Passwords are hashed with bcryptjs; plain passwords are never stored.
- Access tokens are short-lived JWTs kept in memory (15 minutes).
- Rotating refresh tokens live in an httpOnly, SameSite cookie scoped to `/api/auth` (7 days).
- The frontend transparently refreshes expired access tokens and signs the user out when the session is gone.
- `requireAuth` protects all domain routes; `requireRoles` and client route guards enforce role boundaries; ownership checks prevent learners from reading another learner's data.
- Assessment answers are scored on the server against a private answer key — the key is never sent with the questions.
- The API uses Helmet, CORS with credentials, rate limiting on auth and AI routes, Zod input validation and centralised error handling.

### Main endpoints

| Method | Path | Access |
| --- | --- | --- |
| POST | `/api/auth/login`, `/register`, `/refresh`, `/logout` | Public / cookie |
| GET | `/api/auth/me` | Authenticated |
| GET, POST, PATCH, DELETE | `/api/courses` | Read: authenticated; write: trainer/admin |
| GET, PATCH | `/api/progress` | Own data; staff read cohort summaries |
| GET, POST, PATCH, DELETE | `/api/planner` | Own study blocks |
| GET, POST | `/api/assessments`, `/api/attempts` | Authenticated, server-side scoring |
| GET, PATCH | `/api/reviews` | Trainer/reviewer/admin read; reviewer/admin decide |
| GET, PATCH | `/api/users` | Admin; `/api/users/students` for trainer/reviewer |
| GET | `/api/analytics` | Role-scoped dashboard data |
| GET | `/api/ai/insights?context=...` | Authenticated, role/context aware |
| GET | `/api/ai/recommendations` | Student recommendations from live data |
| POST | `/api/ai/tutor` | Authenticated, role-aware chat, English/Kinyarwanda |
| POST | `/api/ai/assist` | Authenticated, global assistant with safe actions |
| POST | `/api/ai/assessments/generate` | Trainer/admin draft practice questions |
| POST | `/api/ai/evaluate` | Authenticated, indicative written-answer feedback |
| GET | `/api/ai/plan?minutes=60&days=5` | Authenticated, deterministic role-scoped plan |
| GET | `/api/ai/status` | Admin, provider/quota/usage snapshot |
| GET | `/api/ai/prompts?language=en\|rw` | Authenticated, starter prompts for the current role |

## AI integration

AI is a server-side service, not a decorative client widget. Google Gemini is the primary provider; the explainable MENYA rule engine is the automatic fallback when no key, quota or network is available.

Add a free key from Google AI Studio to `server/.env`:

```bash
AI_PROVIDER=gemini
AI_API_KEY=your-free-gemini-api-key
AI_MODEL=gemini-3.5-flash-lite
```

The key is read only by the Express server and is never sent to the browser. `AI_TEMPERATURE`, `AI_MAX_OUTPUT_TOKENS`, `AI_TIMEOUT_MS`, `AI_CACHE_TTL_MS`, `AI_DAILY_QUOTA` and `AI_MAX_PROMPT_CHARS` can also be tuned. Restart the API after changing `.env`. `gemini-3.5-flash-lite` is the default because it is reliably available on the free tier; `gemini-3.8-flash` can be used as an override when it is not under heavy demand.

- `GET /api/ai/insights` reads live MongoDB data and returns explanation cards tailored to the role and page context: student lessons, curriculum, resources, assessments, analytics and planner; trainer cohorts, courses and submissions; reviewer queue and history; admin users, courses and settings.
- `POST /api/ai/tutor` and `POST /api/ai/assist` power the global tutor, drawer and AI workspace. They support English and Kinyarwanda, conversation history, simple mode, approved-source citations and role-checked action suggestions.
- `POST /api/ai/assessments/generate` creates draft practice questions grounded in the approved `server/data/curriculum.ts` chunks and the assessment catalogue. It never returns official answer keys.
- `POST /api/ai/evaluate` gives indicative written-answer feedback. The backend computes the indicative score deterministically; trainers and reviewers remain the only sources of official decisions.
- `GET /api/ai/plan` keeps scheduling deterministic and role-scoped; AI may explain a plan but never edits the stored planner.
- `GET /api/ai/status` lets administrators inspect provider, model, configuration, cache entries, per-user quota, token usage, fallbacks and the last sanitised provider error.
- The global `/ai` workspace and the Topbar/Sidebar help icons are available to every signed-in role. Suggested actions are limited to `navigate`, `setTheme` and `notify`; navigation targets are validated against a role-specific allowlist. Gemini cannot write to the database, change permissions or issue grades.
- Responses use structured JSON validated on the server. Requests are rate-limited, cached briefly, capped by a daily per-user quota and monitored. If reliable approved material is unavailable, MENYA says so instead of inventing curriculum facts or references.

## Design system

All visual decisions are driven by CSS custom properties in `client/src/styles/index.css`.

| Token | Light | Dark | Purpose |
| --- | --- | --- | --- |
| Navy | `#142B4A` | light ink | Branding, headings, sidebar |
| Emerald | `#0D9B78` | `#29C69C` | Primary actions, progress, active states |
| Warm amber | `#F2B84B` | `#F6C76A` | Achievements, deadlines, highlights |
| Background | `#F5F7FA` | `#101B2A` | Application canvas |
| Surface | `#FFFFFF` | `#19283B` | Cards and content panels |
| Muted text | `#526174` | `#9DB0C5` | Supporting copy |
| Borders | `#DCE4EC` | `#2A3E56` | Separation and structure |

Reusable primitives live in `client/src/components/ui/Primitives.tsx`. Layout lives in `client/src/components/layout`, charts in `client/src/components/charts`, and AI patterns in `client/src/components/ai`.

### Principles applied

- Purposeful density: every panel supports a decision in the current role.
- Contextual AI: insights explain the data behind them; the tutor follows the current lesson or workplace.
- Accessibility: semantic controls, visible focus rings, ARIA labels, skip link, reduced-motion support, and contrast-aware dark theme.
- Low-end friendly: lazy-loaded pages, CSS-based visuals, and no animation loops except a subtle status pulse.
- Offline ready: web app manifest and service worker cache the app shell and visited assets.

## Demo interactions

- Sign in with a demo account; you land in that role's dashboard with its own navigation and AI copilot.
- Open the `MENYA AI` sidebar tab, the Topbar sparkle button or the help icons to ask, generate practice, check an answer, plan study time or inspect approved sources.
- Switch themes from the top bar; the choice is remembered on the device.
- Students can select lessons, mark them complete, take assessments and manage a planner — all through the API.
- Trainers can browse cohorts and course mastery, and monitor submissions without reviewer decision powers.
- Reviewers can pass artifacts or request changes with criterion-based feedback that persists in MongoDB.
- Administrators can change roles/account status and browse the full course catalogue.
- Every major page includes server-backed AI insight cards; every workplace includes a role-aware AI assistant.

## Verification

```bash
npm run lint        # oxlint across client/src and server
npm run typecheck   # client and server TypeScript checks
npm run build       # production client build + server typecheck
```
