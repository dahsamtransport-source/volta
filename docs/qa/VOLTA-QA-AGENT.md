# VOLTA AI-assisted QA agent

## Operation

- Runnable source: `scripts/volta-qa-agent.mjs`.
- Local model: `qwen2.5:1.5b` on **loopback-only Ollama** at `127.0.0.1:11434` on the owner-controlled Ahmed PC.
- CI automation: `.github/workflows/volta-qa-agent.yml`, read-only on eligible PRs, manual trigger, and weekly Monday 03:15 UTC; uploads `.qa-output` audit artifacts.
- No subscription/API key needed for the local model, but it must be installed and running on the owner PC. GitHub CI runs **deterministic tests without AI** and cannot access local Ollama.
- Commands: `bun run qa:inventory` for source inventory, `bun run qa:agent` for full gates, `bun run qa:agent:local` for full gates plus local AI review.

## Agent facts and limits

The _previous version_ is the recovered Lovable branch `recovery/import-lovable-source`, not ISS Modern. The agent checks preserved route names and primary code boundaries. It is not permitted to claim functional parity from module names alone.
Evidence gates: Vitest unit tests (including fake IndexedDB concurrency), TypeScript, ESLint, Vite/Nitro Worker build, Wrangler **dry-run**, recovered-route presence.
Every untested device/full business path is labeled BLOCKED. Local Qwen advice is advisory and cannot change PASS/FAIL. Local LLM prompts contain module names and test statuses only, not customer records or secrets.

## Safety

**Read-only by default.** The agent cannot post sales, migrate Supabase schema, create users, send messages, change DNS, publish Workers/Android, remove production data, retrieve private signing keys or approve go-live. Tests must use synthetic fixtures.
The real WebView needs `volta.muslly.com`; the current Vercel project is disabled due to outstanding billing, so APK signature verification does not prove website functionality. Do not disable Play Protect.

## Acceptance report

Inspect `.qa-output/VOLTA-QA-REPORT.md` and `.qa-output/volta-qa-agent-report.json` after running the agent. These are locally generated and intentionally ignored by Git.
