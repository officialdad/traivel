# Traivel - Travel Itinerary Web App

## Context
Build a mobile-friendly, headless-first travel itinerary app. AI generates itineraries via REST API or MCP, users view/edit them in a browser. Deployed on Cloudflare Workers + D1.

## Decisions
- **No auth** (MVP)
- **Cloudflare D1** (SQLite) for storage
- **Vanilla JS SPA** with Pico CSS (no framework)
- **MCP server in same Worker** as REST API
- **Single destination** per itinerary, **day-based** organization
- **Detailed activities**: time slot, cost, category, reference links, AI status

## Database Schema (`migrations/0001_initial.sql`)

3 tables with cascade deletes:
- **itineraries**: title, destination_country, origin_country/city, start/end_date, duration_days, pax, place_of_stay, currency, language, culture_notes, religion_notes, weather_notes, ai_status, justification
- **days**: itinerary_id, day_number, date, theme, ai_status, justification
- **activities**: day_id, name, description, time_slot, estimated_cost, category (enum), sort_order, notes, reference_links (JSON array of {url, title}), ai_status, justification

All entities have `ai_status` field: `ai_recommended` | `finalized` | `modified` with optional `justification`.

## Project Structure

```
traivel/
  package.json, wrangler.toml, tsconfig.json
  migrations/0001_initial.sql
  src/
    index.ts           -- Worker entry: routes to API, MCP, or static assets
    types.ts           -- Shared TS interfaces
    api/
      router.ts        -- REST route matching
      itineraries.ts   -- Itinerary CRUD handlers
      days.ts          -- Day CRUD handlers
      activities.ts    -- Activity CRUD handlers
      helpers.ts       -- JSON responses, ID generation, shared DB queries
    mcp/
      server.ts        -- MCP server with 12 tools
  public/
    index.html         -- SPA shell (Pico CSS CDN)
    css/app.css        -- Minimal custom styles
    js/
      app.js           -- Hash-based SPA router
      api.js           -- Fetch wrapper for /api/v1
      views/           -- itinerary-list, itinerary-view, itinerary-form, day-form, activity-form
      components/      -- nav, status-badge, link-editor
```

## REST API (`/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/itineraries` | List / Create |
| GET/PUT/DELETE | `/itineraries/:id` | Get (with nested days+activities) / Update / Delete |
| POST | `/itineraries/full` | Bulk create (itinerary + days + activities in one call) |
| GET/POST | `/itineraries/:iid/days` | List / Create days |
| GET/PUT/DELETE | `/days/:id` | Get (with activities) / Update / Delete |
| GET/POST | `/days/:did/activities` | List / Create activities |
| GET/PUT/DELETE | `/activities/:id` | Get / Update / Delete |

## MCP Tools (12 total)
`list_itineraries`, `get_itinerary`, `create_full_itinerary`, `update_itinerary`, `delete_itinerary`, `add_day`, `update_day`, `delete_day`, `add_activity`, `update_activity`, `delete_activity`, `finalize_all`

Shares DB query logic with REST handlers via helpers module.

## SPA Views
- **Itinerary List**: cards with title, country, dates, pax, AI status badge
- **Itinerary View**: metadata + destination context + expandable day sections with activity cards; inline AI status badges; edit/add buttons
- **Forms**: Pico-styled forms with dynamic reference link editor, ai_status dropdown + justification textarea

Hash-based routing (`#/itineraries/:id`, etc.) - no server config needed.

## Implementation Order

**Phase 1 - Foundation**: package.json, wrangler.toml, tsconfig.json, D1 migration, types, helpers, entry point skeleton. Verify with `wrangler dev`.

**Phase 2 - REST API**: itinerary CRUD + bulk create, day CRUD, activity CRUD, router wiring. Test with curl.

**Phase 3 - MCP Server**: tool definitions reusing Phase 2 query helpers. Test with MCP client.

**Phase 4 - SPA Frontend**: HTML shell, app.css, API client, SPA router, components, all 5 views.

**Phase 5 - Polish**: loading states (`aria-busy`), delete confirmations, error display, deploy.

## Verification
1. `wrangler dev` - local dev server starts
2. `curl POST /api/v1/itineraries/full` with sample data - creates full itinerary
3. `curl GET /api/v1/itineraries/:id` - returns nested structure
4. Open browser to localhost - SPA loads, lists itineraries, can view/edit
5. Connect MCP client to `/mcp` endpoint - tools are discoverable and functional
6. `wrangler deploy` - deploys to production
