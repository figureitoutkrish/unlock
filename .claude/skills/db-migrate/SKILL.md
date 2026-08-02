---
name: db-migrate
description: Generate and apply a Drizzle ORM migration. Use when the schema has changed and the database needs to be updated.
disable-model-invocation: true
---

Follow this sequence — never skip steps or hand-edit migration files:

1. **Confirm schema changes are saved** — read `src/db/schema.ts` and summarize what changed.
2. **Generate the migration**:
   ```bash
   npx drizzle-kit generate
   ```
   A new `.sql` file will appear in `drizzle/`. Show it to the user and ask them to review it before proceeding.
3. **Apply the migration**:
   ```bash
   npx drizzle-kit migrate
   ```
   Requires `DATABASE_URL` to be set in `.env.local`.
4. **Confirm** — run `npx drizzle-kit studio` or ask the user to verify the table shape matches the schema.

If the user wants to skip migration files and push directly (dev only, destructive in prod):
```bash
npx drizzle-kit push
```
Warn them this is a dev shortcut and cannot be rolled back.
