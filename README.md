# CampusHub

Full-stack monorepo containing a Next.js 15 web client and a NestJS 11 API backed by MongoDB and Better Auth.

```
campushub/
├─ frontend/          # Next.js app (UI, React Query, shadcn, OpenAPI client)
├─ backend/           # NestJS API (modules, Mongoose schemas, Better Auth)
├─ docker-compose.yml # Dev stack: mongo + api + web with hot reload
└─ README.md
```

Both services own their own `Dockerfile`, `package.json`, and lint config.

---

## 1. Running with Docker (recommended — zero setup)

**This is the recommended path.** All environment variables are baked into `docker-compose.yml`, so you don't need to create any `.env` files or generate secrets. Just clone and run.

### 1.1 Prerequisites

- Git
- Docker Engine 24+ **or** Docker Desktop 4.30+
- Docker Compose v2 (ships with Docker Desktop; on Linux install `docker-compose-plugin`)
- Free ports on your host: `3000` (web), `4000` (api), `27016` (mongo)

### 1.2 Build and start the stack

From the repo root:

```bash
docker compose up --build
```

That's it. The first build takes a few minutes (npm installs inside both images). Subsequent starts reuse the named volumes `backend_node_modules`, `frontend_node_modules`, and `mongo_data`, so they're fast.

The compose file brings up three services with live reload: `mongo`, `backend`, and `frontend`.

### 1.3 What you get

| Service    | Host URL                       | Container name  | Notes                                   |
|------------|--------------------------------|-----------------|-----------------------------------------|
| Web        | http://localhost:3000          | `campus-web`    | Next.js dev server (hot reload)         |
| API        | http://localhost:4000          | `campus-api`    | NestJS dev server (`start:dev` watch)   |
| API docs   | http://localhost:4000/docs     | —               | Swagger UI                              |
| OpenAPI    | http://localhost:4000/api-json | —               | Raw JSON spec                           |
| Mongo      | mongodb://localhost:27016      | `campus-mongo`  | Host port **27016** (container is 27017) to avoid clashing with a local Mongo |

### 1.4 Built-in environment variables

The following are pre-set in `docker-compose.yml` — no action required. Override them only if you need to (e.g. edit the compose file, or export them in your shell before `docker compose up`).

**Backend:**
- `MONGO_URI=mongodb://mongo:27017/campushub-db` (compose service DNS)
- `CORS_ORIGIN=http://localhost:3000`
- `BETTER_AUTH_SECRET` — dev-only 64-char hex. **Rotate before deploying anywhere non-local.**
- `BETTER_AUTH_URL=http://localhost:4000`
- `ALLOWED_EMAIL_DOMAINS=city.ac.uk`
- `SUPER_USER_EMAIL=you@city.ac.uk` — change this in the compose file to your own email if you want super-user promotion on first sign-up.

**Frontend:**
- `NEXT_PUBLIC_API_URL=http://localhost:4000` (browser-visible)
- `BETTER_AUTH_BASE_URL=http://localhost:4000`
- `API_SPEC_URL=http://campus-api:4000/api-json` (internal compose DNS, for the build-time openapi sync)

### 1.5 Seeding the database

The first time you run against a fresh Mongo volume, seed the reference data with one command:
make sure you are actualy first running the docker compose command otherwise it the command below will have no container to execute on!

```bash
docker compose exec backend npm run seed-all
```

This runs degrees → servers → channels → societies in order. The chain aborts on the first failure, so later seeders never run against partially-populated state.

If you ever need to run one seeder on its own:

```bash
docker compose exec backend npm run degree-seed
docker compose exec backend npm run servers-seed
docker compose exec backend npm run channels-seed
docker compose exec backend npm run societies-seed
```

### 1.6 First login

1. Open http://localhost:3000 → sign up with an email whose domain is in `ALLOWED_EMAIL_DOMAINS` (default: `city.ac.uk`).
2. If that email matches `SUPER_USER_EMAIL`, the account is promoted to super user on first login.
3. You're in.

### 1.7 Common operations

| Task                            | Command                                                              |
|---------------------------------|----------------------------------------------------------------------|
| Start in foreground             | `docker compose up --build`                                          |
| Start detached                  | `docker compose up --build -d`                                       |
| Tail logs                       | `docker compose logs -f backend` (or `frontend`, `mongo`)            |
| Stop                            | `docker compose down`                                                |
| Stop and wipe Mongo data        | `docker compose down -v`                                             |
| Rebuild one service             | `docker compose build backend && docker compose up -d backend`       |
| Shell into the API container    | `docker compose exec backend sh`                                     |
| Run a backend npm script        | `docker compose exec backend npm run degree-seed`                    |

### 1.8 Troubleshooting (Docker)

- **`EADDRINUSE` on 3000/4000/27016** — something else is bound to that port. `lsof -i :4000` on macOS/Linux, `netstat -ano | findstr :4000` on Windows.
- **`MongoNetworkError` / backend can't reach Mongo** — the `MONGO_URI` baked into compose points at the `mongo` service DNS name. If you overrode it, make sure it's `mongodb://mongo:27017/...` (not `localhost`) when running under compose.
- **Frontend hot reload isn't firing** — the compose file already sets `CHOKIDAR_USEPOLLING=true` and `WATCHPACK_POLLING=true`; restart the container if you change deps.
- **OpenAPI types aren't updating** — inside the frontend container run `API_ORIGIN=http://campus-api:4000 npm run openapi:sync`.
- **Permission errors on Linux bind mounts** — run Docker as your user, not root, or fix ownership with `sudo chown -R $USER backend frontend`.

---

## 2. Running without Docker (manual)

Use this path only if you can't (or don't want to) use Docker. It requires installing Node.js and MongoDB yourself and managing `.env` files.

### 2.1 Prerequisites

- Git
- Node.js **20.x** (LTS) — match the `node:20` image used in CI
- npm **10+**
- MongoDB **7.x** — either run it natively, or spin up just Mongo in a one-off container
- Free ports on your host: `3000`, `4000`, `27017`

Verify with:
```bash
node -v    # should print v20.x.x
npm -v     # should print 10.x.x or higher
```

### 2.2 Environment files

In the Docker path these are baked into `docker-compose.yml`. In the manual path you have to create them yourself.

#### `backend/.env`

```env
# MongoDB connection (local install or one-off docker container)
MONGO_URI=mongodb://localhost:27017/campushub-db
MONGO_MAX_POOL=50
MONGO_MIN_POOL=0
MONGO_MAX_IDLE_MS=60000
MONGO_SST_MS=8000
MONGO_SOCKET_MS=45000
MONGO_APP_NAME=CampusHubAPI

# CORS — must match the frontend origin
CORS_ORIGIN=http://localhost:3000

# Better Auth
# Generate with:  openssl rand -hex 32
BETTER_AUTH_SECRET=REPLACE_WITH_A_64_CHAR_HEX_STRING
BETTER_AUTH_URL=http://localhost:4000

# Sign-up gating (comma-separated, lowercase)
ALLOWED_EMAIL_DOMAINS=city.ac.uk

# Email address that will be promoted to "super user" on first login
SUPER_USER_EMAIL=you@city.ac.uk
```

#### `frontend/.env`

```env
# Browser-visible API origin
NEXT_PUBLIC_API_URL=http://localhost:4000
BETTER_AUTH_BASE_URL=http://localhost:4000

# Where `npm run openapi:sync` pulls the spec from
API_SPEC_URL=http://localhost:4000/api-json
```

### 2.3 Terminal 1 — MongoDB

**Option A: native install.** Follow the official installation guide for your OS (`brew install mongodb-community@7` on macOS, `apt install mongodb-org` on Debian/Ubuntu, etc.) and start the service:

```bash
docker compose up --build
```

**Option B: one-off Docker container for Mongo only.** If you don't want to install Mongo natively:

```bash
docker run -d \
  --name campushub-mongo \
  -p 27017:27017 \
  -v campushub-mongo-data:/data/db \
  mongo:7
```

Verify it's listening:

```bash
nc -z localhost 27017 && echo "mongo up"
```

### 2.4 Terminal 2 — Backend (NestJS)

```bash
cd backend
npm ci                # install deps
npm run start:dev     # watch mode, listens on 0.0.0.0:4000
```

You should see:
```
 Mongo connected
[Nest] ... Nest application successfully started
```

Confirm it's up:

```bash
curl http://localhost:4000/api-json | head -c 200
```

### 2.5 Seed the database

In a new terminal (or after stopping/restarting the backend), run every seeder in order with a single command:

```bash
cd backend
npm run seed-all
```

Or run them individually if you need finer control:

```bash
cd backend
npm run degree-seed
npm run servers-seed
npm run channels-seed
npm run societies-seed
```

### 2.6 Terminal 3 — Frontend (Next.js)

```bash
cd frontend
npm ci                                                  # install deps
API_ORIGIN=http://localhost:4000 npm run openapi:sync   # generate src/types/openapi.d.ts from the running backend
npm run dev                                             # Next.js dev server on localhost:3000
```

> You must run `openapi:sync` **after** the backend is up — it pulls the spec from `http://localhost:4000/api-json` and `http://localhost:4000/api/auth/open-api/generate-schema`, merges them, and regenerates `src/types/openapi.d.ts`. Re-run it whenever backend DTOs change.

Then open http://localhost:3000.

### 2.7 Troubleshooting (manual)

- **`MONGO_URI is not set`** — the backend only reads `backend/.env`. If you're using a process manager that doesn't auto-load `.env`, export manually: `export $(grep -v '^#' backend/.env | xargs)`.
- **`MongoNetworkError: connect ECONNREFUSED 127.0.0.1:27017`** — Mongo isn't running or is on a different port. Check `brew services list` / `systemctl status mongod` / `docker ps`.
- **Frontend fails on `openapi:sync`** — backend isn't listening yet, or `API_ORIGIN` is wrong. Curl `http://localhost:4000/api-json` to confirm the spec is served.
- **CORS errors in browser console** — `backend/.env` must have `CORS_ORIGIN=http://localhost:3000`, and the frontend must be on exactly that origin (not `127.0.0.1:3000`).
- **`better-auth` complains about secret** — `BETTER_AUTH_SECRET` must be at least 32 bytes of entropy. Regenerate with `openssl rand -hex 32`.
- **Socket.io connections fail** — the WebSocket gateway honours `CORS_ORIGIN`; same fix as above.

---

## 3. Scripts reference

### Backend (`backend/`)

| Script              | What it does                                          |
|---------------------|-------------------------------------------------------|
| `npm run start:dev` | NestJS in watch mode (port 4000)                      |
| `npm run start`     | NestJS without watch                                  |
| `npm run build`     | Compile TypeScript into `dist/`                       |
| `npm run start:prod`| Run the compiled build (`node dist/main`)             |
| `npm run lint`      | ESLint over `src/` (auto-fix)                         |
| `npm run seed-all`       | Run every seeder in order (degrees → servers → channels → societies). Aborts on first failure. |
| `npm run degree-seed`    | Seed degree + module catalog                     |
| `npm run servers-seed`   | Seed university/module server records           |
| `npm run channels-seed`  | Seed default channels for seeded servers         |
| `npm run societies-seed` | Seed city-wide society servers                   |

### Frontend (`frontend/`)

| Script                 | What it does                                                |
|------------------------|-------------------------------------------------------------|
| `npm run dev`          | Next.js dev server with Turbopack (port 3000)               |
| `npm run build`        | Production build (Turbopack)                                |
| `npm run start`        | Run the production build                                    |
| `npm run lint`         | ESLint over the app                                         |
| `npm run openapi:sync` | Pulls app + auth OpenAPI specs, merges, regenerates `src/types/openapi.d.ts`. Requires a running backend and `API_ORIGIN` env var (defaults to `http://campus-api:4000`). |

---

## 4. Useful URLs when the stack is running

| Resource              | URL                                    |
|-----------------------|----------------------------------------|
| Web app               | http://localhost:3000                  |
| API root              | http://localhost:4000                  |
| Swagger UI            | http://localhost:4000/docs             |
| OpenAPI JSON          | http://localhost:4000/api-json         |
| Better Auth endpoints | http://localhost:4000/api/auth/*       |
| Mongo (Docker path)   | mongodb://localhost:27016              |
| Mongo (manual path)   | mongodb://localhost:27017              |

---

## 5. CI/CD

`.github/workflows/ci.yml` runs lint for both services and builds Docker images (`ghcr.io/<repo>-web`, `ghcr.io/<repo>-api`). Pushes to `main` publish images; PRs build only.
