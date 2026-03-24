# Repository Guidelines

## Project Structure & Module Organization
CampusHub backend runs on NestJS with bootstrap logic in `src/main.ts`. Feature code lives under `src/modules`, where each folder bundles controller, service, DTO, and provider files (`feature/*.module.ts`, `*.controller.ts`, `*.service.ts`). Shared middleware belongs in `src/middleware`, database schemas and connection helpers in `src/database`, and reusable guards or decorators in `src/lib`. Unit specs (`*.spec.ts`) sit alongside source files, end-to-end suites live under `test/`, and build artifacts are emitted to `dist/` (do not edit generated files).

## Build, Test, and Development Commands
- `npm install` — install dependencies after cloning or pulling new packages.
- `npm run start:dev` — start a hot-reload Nest server; reads configuration from your `.env` file.
- `npm run build` — compile TypeScript into `dist/` for production deployments.
- `npm run start:prod` — run the compiled bundle from `dist/main.js`.
- `docker compose -f docker-compose.dev.yml up` — bring up local services that the API expects.

## Coding Style & Naming Conventions
We rely on TypeScript, ESLint, and Prettier. Keep the default Prettier formatting (2-space indent, single quotes, semicolons). Run `npm run format` to reformat and `npm run lint` to catch style issues. Name classes and Nest providers in PascalCase (`ServerService`), use camelCase for variables and functions, and suffix DTO or schema files with `.dto.ts` or `.schema.ts`.

## Testing Guidelines
Jest drives testing. Place unit specs next to implementations as `*.spec.ts`. Put API end-to-end tests under `test/` and mirror the route structure. Run `npm run test` before sharing code, `npm run test:watch` while iterating, and `npm run test:cov` to generate coverage in `coverage/`. New endpoints should ship with either a unit spec or e2e coverage.

## Environment Configuration
Store secrets in `.env.local` (never commit values). Required variables for development:
- `MONGO_MAX_POOL`
- `MONGO_MIN_POOL`
- `MONGO_MAX_IDLE_MS`
- `MONGO_SST_MS`
- `MONGO_SOCKET_MS`
- `MONGO_APP_NAME`
- `MONGO_URI`
- `CORS_ORIGIN`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `ALLOWED_EMAIL_DOMAINS`
- `SUPER_USER_EMAIL`
Seed data scripts are planned; until they exist, create records manually or document any temporary setup steps in your PR.

## Commit & Pull Request Guidelines
Prefer imperative commit messages and keep subjects under ~72 characters; referencing a task key (e.g., `CHB-5 Fix auth guard`) is helpful if you follow an issue tracker. If you fork this repo or collaborate via PR, include a short change summary, link related issues, list validation commands (tests, lint), and mention any new env variables. Request review from another contributor when available and wait for automated checks to pass before merging.
