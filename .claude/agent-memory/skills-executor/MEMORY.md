# Agent Memory - Skills Executor

## Project: Traivel

### Key File Locations
- API handlers: `/home/debian/repo/traivel/src/api/` (itineraries.ts, days.ts, activities.ts, router.ts, helpers.ts)
- Types: `/home/debian/repo/traivel/src/types.ts`
- Worker entry: `/home/debian/repo/traivel/src/index.ts`
- Migrations: `/home/debian/repo/traivel/migrations/`
- Frontend: `/home/debian/repo/traivel/public/`

### Patterns
- API handlers take `D1Database` directly (not full `Env`), except `handleApiRequest` in router.ts which takes `Env`
- All CRUD handlers follow: check exists -> parse body -> validate -> execute -> return result
- `createFullItinerary` uses `db.batch()` for transactional bulk inserts
- Router uses custom `matchRoute()` function with `:param` pattern matching
- CORS handled via OPTIONS in router
- Error catching in router distinguishes "Invalid JSON body" (400) from other errors (500)
