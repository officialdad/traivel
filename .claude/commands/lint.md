# Lint / Type Check Assistant

Check code quality for $ARGUMENTS in the Traivel project.

## Task

1. **TypeScript checking**: Run `npx tsc --noEmit` to catch type errors in `src/`
2. **Review code patterns**: Check for common issues in the codebase
3. **Fix issues**: Apply fixes while maintaining project conventions

## What to Check

### TypeScript (src/)
- Type errors and missing types
- Unused imports and variables
- Proper D1 query typing
- Correct `Env` interface for Worker bindings

### Vanilla JS (public/js/)
- No TypeScript here — check for runtime errors manually
- Verify API URL paths match backend routes
- Check DOM element ID references exist in HTML

### SQL (migrations/)
- Valid SQLite syntax (not PostgreSQL)
- Foreign key references are correct
- CASCADE delete configuration
