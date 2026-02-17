# Database Operations

Set up D1 database operations for $ARGUMENTS following project conventions.

## Task

Create or modify Cloudflare D1 (SQLite) database operations:

1. **Check existing schema**: Review `migrations/0001_initial.sql` for current tables and relationships
2. **Examine helpers**: Look at `src/api/helpers.ts` for shared query patterns
3. **Follow D1 API**: Use `env.DB.prepare().bind().run()` / `.first()` / `.all()` patterns
4. **Create migration**: If schema changes needed, create a new migration file in `migrations/`
5. **Update types**: Add/modify TypeScript interfaces in `src/types.ts`

## D1-Specific Patterns

- **Prepared statements**: Always use `.prepare(sql).bind(params)` — never string interpolation
- **Results**: `.all()` returns `{ results: T[] }`, `.first()` returns `T | null`, `.run()` for mutations
- **JSON fields**: Store as TEXT, parse with `JSON.parse()` on read (e.g., `reference_links`)
- **Foreign keys**: Enforced with `PRAGMA foreign_keys = ON` — cascade deletes configured
- **IDs**: Generated via `generateId()` helper — not auto-increment

## Migration Format

```sql
-- migrations/NNNN_description.sql
CREATE TABLE IF NOT EXISTS ...
```

Apply locally: `npx wrangler d1 execute traivel-db --local --file=migrations/NNNN_description.sql`
Apply production: `npx wrangler d1 execute traivel-db --file=migrations/NNNN_description.sql`

## Existing Tables

- `itineraries` — main entity with destination context fields
- `days` — belongs to itinerary, has day_number and theme
- `activities` — belongs to day, has time_slot, cost, category, reference_links (JSON)

All have `ai_status` (`ai_recommended` | `finalized` | `modified`) and `justification` fields.
