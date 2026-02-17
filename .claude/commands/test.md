# Test Assistant

Help with testing $ARGUMENTS for the Traivel app.

## Task

Create or run tests for the Cloudflare Workers + D1 application:

1. **Identify what to test**: API endpoints, MCP tools, DB queries, or frontend logic
2. **Choose approach**: curl-based integration tests, Miniflare-based unit tests, or browser testing
3. **Follow existing patterns**: Check for any existing test files first

## Testing Approaches

### API Integration Tests (curl)
Test REST endpoints against `npx wrangler dev`:
```bash
# Create full itinerary
curl -X POST http://localhost:8787/api/v1/itineraries/full -H 'Content-Type: application/json' -d '{...}'

# Get itinerary with nested data
curl http://localhost:8787/api/v1/itineraries/:id
```

### Miniflare Unit Tests
If using Vitest with `@cloudflare/vitest-pool-workers`:
```typescript
import { env } from 'cloudflare:test';
// Test D1 queries directly against local D1 binding
```

### MCP Testing
Connect an MCP client to the `/mcp` endpoint and verify tool discovery and execution.

## Key Test Scenarios

- CRUD operations for itineraries, days, activities
- Bulk create (`/itineraries/full`) with nested data
- Cascade deletes (delete itinerary removes days and activities)
- Invalid input handling (missing required fields, bad IDs)
- ai_status field values and transitions
- reference_links JSON parsing
- SPA hash routing and view rendering
