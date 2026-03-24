# CampusHub

Full-stack monorepo containing the Next.js web app and NestJS API that powers CampusHub. This repo now serves as the top-level workspace; individual services live in dedicated `frontend/` and `backend/` folders while CI, Docker, and shared configuration stay at the root.

## Directory layout

```
campushub/
├─ frontend/      # Next.js 15 app (UI, hooks, shadcn components, OpenAPI client)
├─ backend/       # NestJS 11 API (modules, Mongo models, Better Auth integration)
├─ docker-compose.dev.yml
└─ README.md
```

Each service contains its own `Dockerfile`, `package.json`, lint config, and `.env`.

## Local development

### Requirements

- Node.js 20+
- npm 10+
- MongoDB 7 (or Docker)

### Install dependencies

```bash
cd frontend && npm ci
cd backend && npm ci
```

### Environment variables

`frontend/.env`

```
NEXT_PUBLIC_API_URL=http://localhost:4000
BETTER_AUTH_BASE_URL=http://localhost:4000
API_SPEC_URL=http://campus-api:4000/api-json
```

`backend/.env` (example)

```
PORT=4000
MONGODB_URI=mongodb://localhost:27017/campushub
BETTER_AUTH_SECRET=change-me
```

### Run with Docker Compose

The dev compose file spins up Mongo, the Nest API, and Next.js dev server with hot reloading:

```bash
docker compose -f docker-compose.dev.yml up --build
```

Mongo is exposed on `localhost:27016`, API on `localhost:4000`, and web on `localhost:3000`.

### Run manually

```bash
# API
cd backend
npm run start:dev

# Web
cd frontend
npm run dev
```

## CI/CD

`.github/workflows/ci.yml` runs linting for both services and builds Docker images (`ghcr.io/<repo>-web` and `ghcr.io/<repo>-api`). Pushes to `main` trigger image publishing; PRs build only.

## Useful scripts

| Location  | Command               | Purpose                               |
|-----------|-----------------------|---------------------------------------|
| frontend  | `npm run dev`         | Next.js dev server                    |
| frontend  | `npm run lint`        | ESLint with project config            |
| backend   | `npm run start:dev`   | NestJS dev server with watch mode     |
| backend   | `npm run lint`        | ESLint for the API                    |
| backend   | `npm run build`       | Compile API into `dist/`              |

## Notes

- The OpenAPI client in the frontend is generated via `entrypoint.sh` using `API_SPEC_URL`.
- Degree slug filtering relies on Mongo collections; ensure seed scripts in `backend/src/database/scripts/` have been executed before testing.
- When adding new services or tooling, keep them isolated under their respective folders so CI and Docker targets stay simple.
