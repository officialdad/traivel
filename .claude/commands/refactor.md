# Code Refactoring Assistant

Refactor $ARGUMENTS in the Traivel codebase following project conventions.

## Task

1. **Understand current code**: Read the files involved and trace the execution path
2. **Identify the refactoring**: What structural improvement is needed?
3. **Check dependencies**: What other files reference this code? (helpers shared between API and MCP)
4. **Apply changes**: Refactor while maintaining the same behavior
5. **Verify types**: Run `npx tsc --noEmit` to catch type errors
6. **Test**: Use `curl` against `npx wrangler dev` to verify API behavior is unchanged

## Project-Specific Considerations

- API handlers and MCP tools share query logic via `src/api/helpers.ts` — changes there affect both
- Worker entry point (`src/index.ts`) does routing — keep it thin
- D1 queries use prepared statements — maintain this pattern during refactoring
- Frontend is vanilla JS with no build step — no import/export, uses script tags
- Pico CSS is classless — avoid adding CSS classes unless necessary
