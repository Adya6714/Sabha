# `@sabha/ledger`

Postgres storage for Sabha: Drizzle schema, migrations, and DB client.

## Local setup

```bash
# from repo root
cp .env.example .env
pnpm db:up          # Docker Postgres + pgvector
pnpm db:migrate     # apply SQL migrations + enable vector
pnpm db:seed        # verify empty schema loads
```

`DATABASE_URL` default: `postgresql://sabha:sabha@localhost:5432/sabha`

Early access uses this same schema in two places: Docker locally, Neon in production. Enable the `vector` extension on Neon and set `DATABASE_URL`.
