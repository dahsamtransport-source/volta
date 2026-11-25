---
name: volta-field-sales-qa
description: Review VOLTA Arabic field sales, offline replay, mobile usability and safe release readiness.
---

# volta-field-sales-qa

Verified existing scripts: qa:inventory, qa:agent, qa:agent:local, test, lint, build and cf:dry-run. Inspect QA agent implementation and env before running; start with bun run qa:inventory if safe, then isolated tests, lint and build using lockfile-compatible package manager. Validate route/customer coverage, units, price snapshots, idempotent offline sync, Arabic RTL and mobile input. Use Supabase read-only schema checks against an authorized test instance; never reset field_sales. Playwright is a candidate, not confirmed installed. Cloudflare dry-run only after inspection. Android/Expo deferred until packaging architecture confirmed. Figma for design only with approved redacted fixtures.

## Execution contract
Read repo instructions and existing skills first. Prefer tools already installed; external plugins are candidates until connected and approved. Keep implementation and independent QA separate. Record exact commands, results, commit SHA, blockers and rollback. No production deploy, live writes or secret transfer. Source reference: https://github.com/openai/plugins. This is an original repo-specific skill, not a copy or proof of upstream plugin installation.
