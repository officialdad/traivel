# Route Creator

Create routes for $ARGUMENTS following project conventions.

## Task

Create or modify routes in the Traivel app:

1. **Check router**: Examine `src/api/router.ts` for existing route matching patterns
2. **Check entry point**: Review `src/index.ts` for top-level routing (API vs MCP vs static)
3. **Follow conventions**: Match existing URL patterns under `/api/v1/`
4. **Add handler**: Create handler functions in the appropriate `src/api/*.ts` file
5. **Wire up**: Register the route in the router

## Routing Architecture

- **Entry point** (`src/index.ts`): Routes by URL prefix — `/api/` to REST, `/mcp` to MCP server, everything else to static assets
- **API router** (`src/api/router.ts`): Pattern-matches URL paths to handler functions
- **No framework**: This is a Cloudflare Worker — routing is manual pattern matching on `request.url`

## Route Conventions

- RESTful: `GET /api/v1/resources` (list), `POST /api/v1/resources` (create)
- Resource: `GET/PUT/DELETE /api/v1/resources/:id`
- Nested: `GET/POST /api/v1/parents/:pid/children`
- Bulk: `POST /api/v1/resources/full` (create with nested children)

## Frontend Routes

Hash-based SPA routing in `public/js/app.js`:
- `#/` or `#/itineraries` — list view
- `#/itineraries/:id` — detail view
- `#/itineraries/new` — create form
- `#/itineraries/:id/edit` — edit form
- Similar patterns for days and activities
