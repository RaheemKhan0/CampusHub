# CampusHub-Back-End
Campus Hub Backend – Powered by NestJS + TypeScript, this API supports the Campus Hub platform with user auth, marketplace, events, Q&A, and AI features. Built on MongoDB Atlas with Vector Search, Socket.IO for realtime chat, and BullMQ for jobs. Secure, scalable, and deployed via GitHub Actions + Railway/Render.

See [Repository Guidelines](AGENTS.md) for contributor instructions, coding standards, and release expectations.

## Running Seed Scripts
1. Attach to the backend container shell:
   ```bash
   docker exec -it campus-api /bin/bash
   ```
   (If you renamed the service, replace `campus-api` with that container name. The frontend container is typically `campus-web`.)

2. Ensure environment variables are available inside the container (`MONGO_URI`, pool settings, etc.).

3. Run the TypeScript seeds directly using npm scripts:
   ```bash
   npm run servers-seed
   npm run channels-seed
   ```
   Or, if you prefer to run the compiled output:
   ```bash
   npm run build
   node dist/database/script/seed.js
   ```

`servers-seed` upserts the predefined server list from `src/database/script/seed-server-var.ts`, and `channels-seed` creates the default channel set for every `unimodules` server. Both scripts are idempotent, so you can rerun them safely.
