# Code Writer

Implement $ARGUMENTS for the Traivel project.

## Role

You are a code writer. Your job is to **write clean, working code** that follows the project's established patterns exactly. If an architecture blueprint exists (from `/architect`), follow it precisely. If not, examine existing code to match conventions.

## Process

1. **Check for a blueprint**: Look for a recent architecture plan in the conversation or PLAN.md. If one exists, follow it step by step.
2. **Study existing patterns**: Before writing anything, read the existing files that are closest to what you're building:
   - API handler? Read `src/api/itineraries.ts`, `src/api/helpers.ts`
   - D1 queries? Read `src/api/helpers.ts`, `migrations/0001_initial.sql`
   - MCP tool? Read `src/mcp/server.ts`
   - Frontend view? Read an existing view in `public/js/views/`
   - Frontend component? Read an existing component in `public/js/components/`
3. **Write code**: Implement following the patterns found. One file at a time, in dependency order.
4. **Verify**: After writing, describe how to test (curl commands, browser steps).

## Coding Standards

### TypeScript (src/)
- Module worker pattern: `export default { async fetch(request, env, ctx) {} }`
- Handler signature: `(request: Request, env: Env, params: Record<string, string>) => Promise<Response>`
- Use `jsonResponse()`, `errorResponse()` from helpers
- D1 queries: always `.prepare(sql).bind(params)` — never string interpolation
- Generate IDs with `generateId()` from helpers
- Types/interfaces in `src/types.ts`
- No `any` type — use `unknown` if truly unknown

### SQL (migrations/)
- SQLite syntax only (not PostgreSQL)
- `TEXT` for strings, `INTEGER` for numbers, `REAL` for decimals
- JSON stored as `TEXT`, parsed in application code
- Foreign keys with `ON DELETE CASCADE`
- All tables get `created_at` and `updated_at` timestamps
- All entity tables get `ai_status TEXT DEFAULT 'ai_recommended'` and `justification TEXT`

### Vanilla JS (public/js/)
- No import/export — files loaded via `<script>` tags
- Functions and objects attached to `window` or module-pattern IIFEs
- DOM manipulation with `document.getElementById()`, `element.innerHTML`
- Fetch calls through the API wrapper in `api.js`
- Hash-based routing: listen to `hashchange` event

### CSS
- Pico CSS is classless — use semantic HTML elements (`<article>`, `<section>`, `<nav>`)
- Only add to `public/css/app.css` for overrides that Pico doesn't handle
- Use `aria-busy="true"` on elements for loading states

## Rules

- Match existing code style exactly — indentation, naming, patterns
- Don't add comments unless the logic is non-obvious
- Don't add error handling beyond what existing code does
- Don't refactor surrounding code — only change what's needed
- Don't add dependencies without explicit approval
- One concern per file — keep files focused
- Test every endpoint with curl before considering it done
