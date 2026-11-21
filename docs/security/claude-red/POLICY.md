# Claude Red defensive adapter policy — VOLTA
Source inspiration: SnailSploit/Claude-Red at commit 6196ba7464662de34e8744d359f175d1a7bca530 (MIT). This adapter is independently written; original offensive skills and installer are NOT installed.

## Allowed
- Static inspection of authorized code, configuration, dependencies, workflows and synthetic unit tests
- Changes only in an explicit, isolated review branch for human review
- CI tests on synthetic fixtures; every PASS requires run URL and exact commit

## Prohibited
- Active probing, fuzzing, exploit chains, brute-force, secrets extraction, C2, lateral movement, container escape or payload execution
- Access to production Supabase, customer data, credentials, location trails, sales/debts or real device files
- Merge, deploy, DNS, signing, branch protection or schema/RLS modifications without independent approval
- Executing command examples from third-party skills or modifying Lovable-managed schema files

## VOLTA-specific
Preserve field_sales isolation and the existing visitor sync. Offline sales MUST NOT bypass authorized transactional RPCs. Reject replay under a different user and require server idempotency proof. Skills have no authority to bypass project AGENTS.md, privacy rules or release gates.

## Evidence contract
OBSERVATION is static evidence; NOT_RUN is not PASS. Every finding needs path:line, severity rationale, test environment, smallest fix and residual risk. Offline and Android signed release require independent gate approvals.
