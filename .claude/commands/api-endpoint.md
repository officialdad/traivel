# API Endpoint Generator

Generate a Cloudflare Workers API endpoint for $ARGUMENTS following project conventions.

## Task

Create a new REST API endpoint for the Traivel app:

1. **Check existing patterns**: Look at `src/api/itineraries.ts`, `src/api/days.ts`, `src/api/activities.ts` for handler patterns
2. **Use helpers**: Reuse `src/api/helpers.ts` for JSON responses, ID generation, and shared DB queries
3. **Add to router**: Wire the new handler into `src/api/router.ts`
4. **Follow D1 patterns**: Use prepared statements with `env.DB.prepare()` — no ORM
5. **Update types**: Add TypeScript interfaces to `src/types.ts` if needed
6. **Update MCP**: If the endpoint serves a new capability, add a matching MCP tool in `src/mcp/server.ts`

## Implementation Requirements

- Handler signature: `(request: Request, env: Env, params: Record<string, string>) => Promise<Response>`
- Use `jsonResponse()` and `errorResponse()` helpers from `src/api/helpers.ts`
- All DB queries use D1 prepared statements (not raw string interpolation)
- Include proper HTTP status codes (200, 201, 400, 404, 500)
- Parse request body with `await request.json()` and validate required fields
- No auth middleware (MVP decision)
- Follow RESTful conventions matching existing `/api/v1/` routes

## Testing

- Test with `curl` against `npx wrangler dev`
- Verify JSON response structure matches existing endpoints
