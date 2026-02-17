# Cloudflare Platform Assistant

Help with Cloudflare development for $ARGUMENTS.

## Task

Assist with Cloudflare Workers, D1, and related platform features for the Traivel project.

## Reference Material

This project has detailed Cloudflare reference docs at `.opencode/skills/cloudflare/references/`. Before answering, read the relevant reference files:

### For this project (Workers + D1):
- **Workers**: `.opencode/skills/cloudflare/references/workers/` (README, configuration, api, patterns, gotchas)
- **D1**: `.opencode/skills/cloudflare/references/d1/` (README, configuration, api, patterns, gotchas)
- **Wrangler**: `.opencode/skills/cloudflare/references/wrangler/` (CLI commands, config)
- **Static Assets**: `.opencode/skills/cloudflare/references/static-assets/` (serving public/ files)
- **Bindings**: `.opencode/skills/cloudflare/references/bindings/` (env bindings)

### Other products (if needed):
- **KV**: `.opencode/skills/cloudflare/references/kv/` — key-value store
- **R2**: `.opencode/skills/cloudflare/references/r2/` — object storage
- **Queues**: `.opencode/skills/cloudflare/references/queues/` — message queues
- **Durable Objects**: `.opencode/skills/cloudflare/references/durable-objects/` — stateful coordination
- **Workers AI**: `.opencode/skills/cloudflare/references/workers-ai/` — inference
- **Vectorize**: `.opencode/skills/cloudflare/references/vectorize/` — vector DB
- **Agents SDK**: `.opencode/skills/cloudflare/references/agents-sdk/` — AI agents
- **Pages**: `.opencode/skills/cloudflare/references/pages/` — full-stack web apps
- **Tunnel**: `.opencode/skills/cloudflare/references/tunnel/` — expose local services

See `.opencode/skills/cloudflare/SKILL.md` for the full product index and decision trees.

## Process

1. Identify which Cloudflare product(s) are relevant to the request
2. Read the corresponding reference files from `.opencode/skills/cloudflare/references/`
3. Apply the guidance to the Traivel project's specific setup (Workers + D1 + vanilla JS SPA)
4. Ensure solutions match wrangler.toml configuration and existing code patterns

## Project Context

- Runtime: Cloudflare Workers (module worker pattern)
- Database: D1 (SQLite) with `traivel-db` binding
- Frontend: Static assets served from `public/`
- Dev: `npx wrangler dev`, Deploy: `npx wrangler deploy`
- Config: `wrangler.toml`
