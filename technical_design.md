# Kanban Board – Technical Design Document

---

## 1. Purpose & Scope

A lightweight web‑based Kanban board that **anyone** can create and share by URL—no login required.  Boards persist indefinitely and refresh to sync state (no realtime collaboration in MVP).

---

## 2. Functional Requirements

| ID   | Description                                                                                      |
| ---- | ------------------------------------------------------------------------------------------------ |
| FR‑1 | User can create a new board with default columns or custom title.                                |
| FR‑2 | Board is accessible at `https://<host>/board/{id}` where **id** is an unguessable 128‑bit token. |
| FR‑3 | Board state (columns, cards, order) persists in server DB.                                       |
| FR‑4 | Any visitor with the URL can view & edit the board.                                              |
| FR‑5 | Board updates are saved via REST API; the page reflects changes on reload.                       |
| FR‑6 | Application loads quickly on desktop & mobile (Core Web Vitals green).                           |

---

## 3. Non‑Functional Requirements

* **Performance:** First load < 1 s on broadband (<200 KB JS gzip).
* **Availability:** 99.5 % per month (single‑region deploy acceptable).
* **Security:** Rate‑limit board creation; secure headers; OWASP Top‑10 guardrails.
* **Maintainability:** Strict TypeScript, modular code, automated tests & CI.
* **Scalability:** Able to migrate from SQLite → Postgres with minimal code changes.

---

## 4. Technology Stack

| Layer         | Choice                                    | Rationale                                        |
| ------------- | ----------------------------------------- | ------------------------------------------------ |
| Front‑end     | React 18 + Vite + TypeScript              | Familiar ecosystem, fast HMR.                    |
| Styling       | Tailwind CSS                              | Utility‑first → rapid UI, minimal CSS debt.      |
| State Mgmt    | Zustand                                   | 1 KB, no boilerplate; ideal for board store.     |
| Drag‑and‑Drop | Dnd‑Kit                                   | Accessible, keyboard‑friendly.                   |
| Back‑end      | Fastify (TypeScript)                      | Faster than Express, built‑in schema validation. |
| DB            | SQLite (file) via Prisma ORM              | Zero‑config dev; can swap to Postgres later.     |
| ID generator  | `nanoid` (size = 21)                      | 128‑bit entropy, URL‑safe.                       |
| Testing       | Vitest, React Testing Library, Playwright | Unified Jest‑style API, fast runs.               |
| Lint/Format   | ESLint (typescript‑eslint), Prettier      | Consistent code style.                           |
| CI/CD         | GitHub Actions → Railway/Render deploy    | Free tier friendly, Docker support.              |

---

## 5. High‑Level Architecture

```
Client (React + Vite)
   │  HTTPS
   ▼
Fastify API  ──► Prisma Client ──► SQLite file (kanban.db)
```

*Each board* is a row in **Board** table; columns & cards cascade via relations.

---

## 6. Data Model (Prisma Schema)

```prisma
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

generator client { provider = "prisma-client-js" }

model Board  { id String @id @default(nanoid()) title String createdAt DateTime @default(now()) columns Column[] }
model Column { id String @id @default(nanoid()) title String order Int boardId String board Board @relation(fields:[boardId], references:[id]) cards Card[] }
model Card   { id String @id @default(nanoid()) content String order Int columnId String column Column @relation(fields:[columnId], references:[id]) }
```

---

## 7. API Design (v1)

| Method | Path                                          | Body                 | Response        | Notes                                                                      |
| ------ | --------------------------------------------- | -------------------- | --------------- | -------------------------------------------------------------------------- |
| POST   | `/boards`                                     | `{ title?: string }` | `{ id }`        | Creates board with optional custom title; default columns Todo/Doing/Done. |
| GET    | `/boards/{id}`                                | –                    | Full board JSON | 404 if not found.                                                          |
| PUT    | `/boards/{id}`                                | Entire board object  | 204 No Content  | Overwrite board state after drag‑drop/edit.                                |
| PATCH  | `/boards/{id}/columns/{colId}/cards/{cardId}` | Partial card         | 204             | Optional fine‑grained update (phase 2).                                    |

### Validation & Error Shape

```json
{ "error": "Resource not found" }
```

Fastify Zod schema validation rejects bad payloads with 400.

### Demo Simplifications

For this demo app, we prioritize simplicity over production robustness:
* **Conflict Resolution:** Last write wins (no optimistic locking).
* **Error Handling:** Basic error messages; simple retry on failure.
* **Mobile DnD:** Use dnd-kit defaults (no custom touch interactions).
* **Rate Limiting:** Simple per-IP limits (no sophisticated detection).

---

## 8. Front‑end Implementation

* **Routing:** React Router with lazy‑loaded `<BoardPage>`.
* **State:** `useBoardStore` (Zustand) holds columns/cards; persists in memory.
* **Data Fetch:** `api.ts` wrapper (Fetch API + Zod decode).
* **Drag‑drop:** Dnd‑Kit's `SortableContext` per column.
* **Save Strategy:** Debounced `PUT /boards/{id}` 400 ms after any change.
* **Styling:** Tailwind components; dark‑mode via `class="dark"` toggled by OS.

---

## 9. Back‑end Implementation

* **Entry:** `src/index.ts` → load env, build Fastify, register routes.
* **Plugins:**

  * `@fastify/sensible` (error handling helpers).
  * `@fastify/rate-limit` (e.g., 30 creates / min / IP).
  * `@fastify/helmet` (security headers).
* **Services Layer:** `services/board.ts` wraps Prisma queries for testability.
* **Migrations:** `prisma migrate dev` locally, `prisma migrate deploy` in CI.
* **Logging:** Pino prettifier in dev; JSON in prod.

---

## 10. Quality & Engineering Practices

### 10.1 TypeScript

* `strict: true`, `exactOptionalPropertyTypes: true`, `noUncheckedIndexedAccess: true`.
* Front‑end & API share tsconfig base in `packages/config`.

### 10.2 Linting & Formatting

* **ESLint** with plugins: `@typescript-eslint`, `react`, `jsx-a11y`, `import`.
* **Prettier** via `eslint-config-prettier` (last in extends list).
* Run `pnpm lint` in CI; fail build on warnings.

### 10.3 Tests

| Layer            | Tool                     | Command          |
| ---------------- | ------------------------ | ---------------- |
| Unit & component | Vitest + RTL             | `pnpm test:unit` |
| API integration  | Vitest + Fastify .inject | `pnpm test:api`  |
| E2E              | Playwright               | `pnpm test:e2e`  |
| Type‑check       | `tsc --noEmit`           | `pnpm typecheck` |

Coverage via Vitest V8; global threshold 80 %.

### 10.4 Pre‑commit

* **Husky + lint‑staged** → run ESLint & Prettier on staged files.

### 10.5 CI/CD (GitHub Actions)

```yaml
steps:
  - uses: actions/checkout@v4
  - uses: pnpm/action-setup@v3
  - run: pnpm install --frozen-lockfile
  - run: pnpm lint && pnpm test:unit && pnpm test:api && pnpm typecheck
  - run: pnpm build  # vite & tsup
  - run: npx playwright install --with-deps
  - run: pnpm start & pnpx wait-on http://localhost:3000 && pnpm test:e2e
  - run: docker build -t kanban-app .
  - run: docker push registry/kanban:sha-$GITHUB_SHA
```

Railway/Render auto‑deploys on Docker push.

---

## 11. Security & Privacy

* No PII collected; board content may contain user text—store encrypted at rest when moving to Postgres.
* Enforce HTTPS; HSTS header.
* Mitigate XSS via React escaping, CSP header (`script-src 'self'`).
* CSRF not a concern (no cookies, REST with JSON body).

---

## 12. Deployment & Operations

| Aspect         | Approach                                                        |
| -------------- | --------------------------------------------------------------- |
| **Container**  | Multi‑stage Dockerfile (node:lts‑alpine).                      |
| **Env vars**   | `DATABASE_URL` (sqlite path or postgres URL), `PORT`.           |
| **Logs**       | Stdout → Railway logging dashboard.                             |
| **Monitoring** | UptimeRobot ping; Sentry (optional) for front‑/back‑end errors. |
| **Backups**    | Railway pg_export or periodic SQLite file copy (cron).         |

### Dockerization & Fly.io Deployment

**Dockerfile (multi‑stage)**

```dockerfile
# Stage 1 – build front‑end
FROM node:lts-alpine AS builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY apps/web ./apps/web
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter web build

# Stage 2 – build API + prune dev deps
FROM node:lts-alpine AS api-builder
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY prisma ./prisma
COPY apps/api ./apps/api
COPY packages ./packages
RUN corepack enable && pnpm install --frozen-lockfile
RUN pnpm --filter api build && pnpm prisma generate

# Stage 3 – runtime image
FROM node:lts-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=api-builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/web/dist ./apps/web/dist
COPY --from=api-builder /app/node_modules ./node_modules
COPY prisma ./prisma
COPY fly.toml ./fly.toml
EXPOSE 8080
CMD ["node", "apps/api/dist/index.js"]
```

*Notes*

1. **Single container** serves both API (Fastify) and static front‑end assets from `apps/web/dist`.
2. Uses Alpine image (\~80 MB final). Adjust memory/CPU in Fly.io plan accordingly.

**fly.toml (minimal)**

```toml
app = "kanban-board"
primary_region = "cdg" # Paris, change as needed

[build]
  dockerfile = "docker/Dockerfile"

[env]
  PORT = "8080"
  DATABASE_URL = "file:/data/kanban.db"

[mounts]
  source = "data"
  destination = "/data"
```

* Mounts persistent volume (`data`) for SQLite file so boards survive restarts.

**Deploy steps**

```bash
flyctl launch --dockerfile docker/Dockerfile --no-deploy  # generate fly.toml
flyctl volumes create data --size 1 --region cdg          # 1 GB volume
flyctl deploy                                             # build & release
```

**Rollback:** `flyctl releases list` → `flyctl releases deploy <version>`

CI can push via `flyctl deploy --remote-build` after tests pass.

---

## 13. Future Enhancements

* Realtime sync (Socket.io) – broadcast board patch ops.
* Read‑only share links (`/r/{id}/{token}`).
* Board templates & duplication.
* PWA offline support.
* Auth layer (email/password or magic link) keeping anonymous flow.

---

## 14. References

* Fastify docs → [https://fastify.dev](https://fastify.dev)
* Prisma docs → [https://www.prisma.io/docs](https://www.prisma.io/docs)
* Vitest → [https://vitest.dev](https://vitest.dev)
* Playwright → [https://playwright.dev](https://playwright.dev)
* Dnd‑Kit → [https://dndkit.com](https://dndkit.com)

---

**Document version:** 1.0 • July 1 2025

---

## Appendix – Project Structure (Monorepo)

```text
kanban-app/
├─ apps/
│  ├─ web/            # React + Vite (front‑end)
│  │   ├─ src/        # components, hooks, pages
│  │   ├─ public/     # static assets
│  │   └─ __tests__/  # component tests (Vitest + RTL)
│  └─ api/            # Fastify server
│      ├─ src/
│      │   ├─ routes/       # REST endpoints
│      │   ├─ services/     # Prisma‑powered business logic
│      │   ├─ plugins/      # Fastify plugins (rate‑limit, helmet…)
│      │   └─ index.ts      # bootstrap entry
│      └─ tests/            # API integration tests
├─ prisma/
│  ├─ schema.prisma
│  └─ seed.ts               # optional local seed data
├─ packages/
│  ├─ config/               # shared tsconfig / eslint presets
│  └─ types/                # shared domain types (if not using tRPC)
├─ docker/
│  └─ Dockerfile            # multi‑stage build
├─ .github/workflows/ci.yml # GitHub Actions pipeline
├─ .husky/                  # commit hooks
├─ pnpm-workspace.yaml      # monorepo definitions
├─ tsconfig.base.json       # strict TS settings shared across apps
└─ README.md
```

*Rationale*: a **pnpm** workspace keeps front‑ and back‑end side‑by‑side while allowing shared lint and type configs. Each app is totally independent, so the developer can `cd apps/web && pnpm dev` or `cd apps/api && pnpm dev` without extra tooling.

