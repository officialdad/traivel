# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Project Overview

Traivel is a mobile-friendly, headless-first travel itinerary web app. AI generates itineraries via REST API or MCP, users view/edit them in a browser. Deployed on **Cloudflare Workers + D1** (SQLite).

## Key Decisions

- **No auth** (MVP)
- **Cloudflare D1** (SQLite) for storage
- **Vanilla JS SPA** with Pico CSS (no framework — no React/Vue/Angular)
- **MCP server in same Worker** as REST API
- **Single destination** per itinerary, **day-based** organization
- **Hash-based routing** (`#/itineraries/:id`) — no server config needed

## Development Commands

### Primary Commands
- `npx wrangler dev` — Start local development server (with D1 binding)
- `npx wrangler deploy` — Deploy to Cloudflare Workers production
- `npx wrangler d1 execute traivel-db --local --file=migrations/0001_initial.sql` — Run D1 migration locally
- `npx wrangler d1 execute traivel-db --file=migrations/0001_initial.sql` — Run D1 migration in production

### Package Management
- `npm install` — Install dependencies
- `npm ci` — Install dependencies for CI/CD

### Code Quality
- `npx tsc --noEmit` — TypeScript type checking
- `npx wrangler types` — Generate Cloudflare Workers types

## Technology Stack

- **Cloudflare Workers** — Runtime (not Node.js)
- **Cloudflare D1** — SQLite database
- **Wrangler** — CLI for dev, deploy, and D1 management
- **TypeScript** — Backend (Workers)
- **Vanilla JavaScript** — Frontend SPA
- **Pico CSS** — Classless CSS framework (CDN)
- **MCP SDK** — Model Context Protocol server

## Project Structure

```
traivel/
  package.json, wrangler.toml, tsconfig.json
  migrations/
    0001_initial.sql       -- D1 schema (itineraries, days, activities)
  src/
    index.ts               -- Worker entry: routes to API, MCP, or static
    types.ts               -- Shared TypeScript interfaces
    api/
      router.ts            -- REST route matching
      itineraries.ts       -- Itinerary CRUD handlers
      days.ts              -- Day CRUD handlers
      activities.ts        -- Activity CRUD handlers
      helpers.ts           -- JSON responses, ID gen, shared DB queries
    mcp/
      server.ts            -- MCP server with 12 tools
  public/
    index.html             -- SPA shell (Pico CSS CDN)
    css/app.css            -- Minimal custom styles
    js/
      app.js               -- Hash-based SPA router
      api.js               -- Fetch wrapper for /api/v1
      views/               -- itinerary-list, itinerary-view, itinerary-form, day-form, activity-form
      components/          -- nav, status-badge, link-editor
```

## Database Schema

3 tables with cascade deletes in D1 (SQLite):
- **itineraries**: title, destination/origin info, dates, pax, stay, currency, culture/religion/weather notes, ai_status, justification
- **days**: itinerary_id (FK), day_number, date, theme, ai_status, justification
- **activities**: day_id (FK), name, description, time_slot, estimated_cost, category enum, sort_order, notes, reference_links (JSON), ai_status, justification

`ai_status` values: `ai_recommended` | `finalized` | `modified`

## REST API (`/api/v1`)

| Method | Path | Description |
|--------|------|-------------|
| GET/POST | `/itineraries` | List / Create |
| GET/PUT/DELETE | `/itineraries/:id` | CRUD with nested days+activities |
| POST | `/itineraries/full` | Bulk create (itinerary + days + activities) |
| GET/POST | `/itineraries/:iid/days` | List / Create days |
| GET/PUT/DELETE | `/days/:id` | CRUD with activities |
| GET/POST | `/days/:did/activities` | List / Create activities |
| GET/PUT/DELETE | `/activities/:id` | CRUD |

## MCP Tools (12)

`list_itineraries`, `get_itinerary`, `create_full_itinerary`, `update_itinerary`, `delete_itinerary`, `add_day`, `update_day`, `delete_day`, `add_activity`, `update_activity`, `delete_activity`, `finalize_all`

## Naming Conventions

- **TypeScript files**: kebab-case (`itineraries.ts`, `router.ts`)
- **Interfaces**: PascalCase (`Itinerary`, `Day`, `Activity`)
- **Functions**: camelCase (`getItinerary`, `createDay`)
- **Constants**: UPPER_SNAKE_CASE (`API_PREFIX`)
- **Frontend JS**: camelCase files (`app.js`, `api.js`)

## Important Patterns

- Worker entry (`src/index.ts`) routes requests to API, MCP, or static asset serving
- API handlers receive `D1Database` binding from Worker env
- MCP server reuses the same DB query helpers as REST handlers
- All IDs are generated (not auto-increment) — use helper function
- Frontend uses hash-based routing with vanilla JS — no build step for public/
- Pico CSS provides base styling; `app.css` only adds minimal overrides

## Verification Checklist

1. `npx wrangler dev` — local dev server starts
2. `curl POST /api/v1/itineraries/full` — creates full itinerary
3. `curl GET /api/v1/itineraries/:id` — returns nested structure
4. Open browser to localhost — SPA loads and works
5. Connect MCP client to `/mcp` endpoint — tools work
6. `npx wrangler deploy` — deploys to production
