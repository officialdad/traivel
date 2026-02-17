# Debug Assistant

Help debug $ARGUMENTS in the Traivel Cloudflare Workers app.

## Task

Diagnose and fix issues in the Workers + D1 + vanilla JS stack:

1. **Identify the layer**: Is the issue in the Worker (TypeScript), D1 queries, MCP server, or frontend (vanilla JS)?
2. **Check logs**: Use `npx wrangler dev` console output or `npx wrangler tail` for production logs
3. **Test isolation**: Use `curl` to test API endpoints independently of the frontend
4. **Inspect D1**: Query the database directly with `npx wrangler d1 execute traivel-db --local --command="SELECT ..."`

## Common Issues

### Worker / API
- D1 binding not available — check `wrangler.toml` has correct `[[d1_databases]]` config
- SQL errors — D1 is SQLite, not PostgreSQL (no `RETURNING *`, use `.run()` then query)
- JSON parsing — `request.json()` throws on non-JSON bodies, wrap in try/catch
- CORS — Worker must set `Access-Control-Allow-*` headers for browser requests

### MCP Server
- Tool not found — check tool registration in `src/mcp/server.ts`
- Shared helpers — MCP tools should reuse `src/api/helpers.ts` query functions

### Frontend (Vanilla JS)
- Hash routing — check `window.location.hash` parsing in `public/js/app.js`
- API calls — check `public/js/api.js` fetch wrapper for correct URL prefix
- DOM updates — vanilla JS needs manual DOM manipulation, check element IDs

### D1 / SQLite
- Foreign key violations — ensure parent records exist before inserting children
- JSON fields — stored as TEXT, must `JSON.stringify()` on write and `JSON.parse()` on read
- CASCADE deletes — configured in schema, verify with test delete
