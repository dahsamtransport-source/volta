# Claude Red — defensive skills for VOLTA
This directory provides a curated *defensive* Agent Skills integration, not the SnailSploit/Claude-Red offensive toolchain. Upstream reference pinned to `6196ba7464662de34e8744d359f175d1a7bca530`; consult `POLICY.md` before any skill.

## Review and CI state
- This branch is for PR review only; do not deploy or merge automatically.
- Existing PR #9 (`chore/quality-gates-20261114`) already proposes non-mutating Prettier, CI on main, strict TypeScript and Android main PR trigger. Do not duplicate or claim those changes merged.
- `src/lib/config.ts` checks only browser publishable/anon key shape. The `sb_publishable_` prefix alone cannot cryptographically bind a key to a Supabase project. Verify deployment backend identity separately.
- Staging acceptance: representatives A/B isolated, visit queue owner-bound, duplicate replay rejected by server, sales manager-only, no production test data or API calls.
- Flutter-Signup-UI-SKILL.md not installed: this repository uses React/TanStack rather than a demonstrated Flutter app.

Review: `git diff main...HEAD`, run `bun install --frozen-lockfile && bun run test && bun run build` in CI/isolated checkout. No production claim until actual run evidence.
