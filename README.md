<h1 align="center">SilkFlow</h1>
<h2 align="center">水墨 · Redefine EPUB reader</h2>

<p align="center">A local-first, cross-platform EPUB reader with a black-and-white ink-wash theme, SilkPortal SSO, and self-hosted cloud sync on Vercel.</p>

<p align="center"><img src="apps/website/public/screenshots/01.webp"/></p>

---

## Features

- **Grid layout** — read multiple books side by side
- **Search in book**, image preview, custom typography
- **Highlight & annotation** with definitions
- **Ink-wash (水墨) theme** — monochrome Material-3 palette + subtle rice-paper texture
- **Local-first** — book data lives in the browser (IndexedDB), works offline
- **Self-hosted cloud sync** — your own rows in **Vercel Postgres**, epub bodies & covers in **Vercel Blob** (no third-party file provider like Dropbox)
- **Sign in with SilkPortal** — OAuth2 / OpenID Connect SSO ([auth.qaqan.cn](https://auth.qaqan.cn))
- **Share / download** books by link, **data export** to a `silkflow_backup_YYYYMMDD.zip`

## Architecture

| App / package       | Stack                                         | Role                               |
| ------------------- | --------------------------------------------- | ---------------------------------- |
| `apps/reader`       | Next.js 15 (App Router), React 18, TypeScript | The reader (the product)           |
| `apps/website`      | Next.js 12 (Pages Router)                     | Marketing site                     |
| `pages/`            | Static HTML/CSS                               | GitHub Pages landing page          |
| `packages/epubjs`   | vendored epub.js fork                         | Reader engine (consumed as source) |
| `packages/tailwind` | Tailwind plugin                               | Material-3 design tokens           |
| `packages/internal` | TS utils                                      | Shared helpers                     |

### Reader data flow

```
Browser (IndexedDB / Dexie)  ──local-first──  Reader UI (recoil + valtio)
        │                                            ▲
        │ pull on login / download on open           │
        ▼                                            │
Vercel Postgres (books/settings rows)  ◀──  Server Actions  ◀── useSync (cfi/annotations/…)
        │
        ▼
Vercel Blob (epub + cover objects)  ◀──  /api/upload (streaming)
```

- **Auth** — Auth.js v5 (`src/auth.ts`), JWT session in httpOnly cookies; all routes protected by `src/middleware.ts`.
- **Sync model** — Last-Write-Wins by `updated_at`; pure-private (every row scoped to `user_id`).

## Development

### Prerequisites

- [Node.js](https://nodejs.org) >= 18.18
- [pnpm](https://pnpm.io/installation) (10.x)
- [Git](https://git-scm.com/downloads)

### Clone & install

```bash
git clone https://github.com/Soieknife/silkflow.git
cd silkflow
pnpm i
```

### Configure the reader

Copy `apps/reader/.env.local.example` → `apps/reader/.env.local` and fill in:

| Variable                                            | Purpose                                           |
| --------------------------------------------------- | ------------------------------------------------- |
| `SILKPORTAL_CLIENT_ID` / `SILKPORTAL_CLIENT_SECRET` | Register an app at <https://auth.qaqan.cn/apps>   |
| `AUTH_SECRET`                                       | `openssl rand -base64 32`                         |
| `AUTH_TRUST_HOST`                                   | `true`                                            |
| `NEXTAUTH_URL`                                      | `http://localhost:7127`                           |
| `POSTGRES_URL`                                      | Connection string from your Vercel Postgres store |
| `BLOB_READ_WRITE_TOKEN`                             | Token from your Vercel Blob store                 |

### Create the database schema

With `POSTGRES_URL` set, push the Drizzle schema:

```bash
pnpm --filter @silkflow/reader db:push
```

### Run

```bash
pnpm dev          # reader → http://localhost:7127, website → http://localhost:7117
pnpm build        # build all workspaces
pnpm lint
```

## Self-hosting (Docker)

After [configuring env](#configure-the-reader) and [running the migration](#create-the-database-schema):

```sh
docker compose up -d
# or
docker build -t silkflow .
docker run -p 3000:3000 --env-file apps/reader/.env.local silkflow
```

## Deploy to Vercel

1. Import the repo; set the root to `apps/reader` (or deploy the monorepo and pick the reader).
2. Add the [environment variables](#configure-the-reader) in the Vercel dashboard.
3. Provision **Vercel Postgres** and **Vercel Blob** stores; paste their connection strings/tokens.
4. Run `pnpm --filter @silkflow/reader db:push` once (locally or in a build step) to create tables.

## Notes & caveats

- **SilkPortal PKCE** — the provider is configured with `client_secret` + `state`. If SilkPortal _requires_ PKCE, set `checks: ['pkce', 'state']` in `apps/reader/src/auth.ts` (Auth.js handles the verifier automatically).
- **Cloud-sync conflict** — private, single-user, last-write-wins; simultaneous reads on two devices may overwrite progress. (Versioned/CRDT sync is a future enhancement.)
- **Website** — the marketing site still runs on the legacy Next 12 stack; its App-Router migration is tracked separately.

## Credits

- [Epub.js](https://github.com/futurepress/epub.js/) · [React](https://github.com/facebook/react) · [Next.js](https://nextjs.org/) · [TypeScript](https://www.typescriptlang.org) · [Vercel](https://vercel.com) · [Turborepo](https://turbo.build/repo) · [Auth.js](https://authjs.dev) · [Drizzle ORM](https://orm.drizzle.team)
