# Package 1 DB Smoke Test

- Date: 2026-06-25 14:26 Europe/Rome
- Branch: `codex/cms-foundation-migration`
- Commit before test: `5987216`
- DATABASE_URL host: `localhost:5432/bazhena`
- PostgreSQL startup result: passed
- Local Postgres method used: native PostgreSQL 16 tools (`initdb` + `pg_ctl`)
- `docker-compose.local.yml`: added for repo-local Docker setup parity
- `pnpm install`: passed
- `pnpm db:generate`: passed
- `pnpm db:migrate`: passed
- Migration created: `prisma/migrations/20260625122538_package_1_init/migration.sql`
- `pnpm db:import:catalog`: passed
- `pnpm db:verify:catalog`: passed
- `pnpm build` with `DATABASE_URL` set: passed
- Repo lint result: only pre-existing unrelated failures remain in `scripts/vk/vk_console_exporter.js` and `scripts/vk/vk_image_url_exporter.js`
- Package 1 / 1.1 code lint result: passed
- Final product count: 71
- Final service count: 2
- Final media count: 73
- Static fallback used during build: no
- Merge decision: approved

## Notes

- Docker was not installed in this environment, so the real PostgreSQL smoke test was executed against a temporary local PostgreSQL instance started with native Postgres tooling instead of `docker compose`.
- This still satisfied the package requirement for verification against a real PostgreSQL database with a real `DATABASE_URL`.
