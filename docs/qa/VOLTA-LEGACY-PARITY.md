# VOLTA baseline recovered from the previous Lovable version

Verified baseline source: `dahsamtransport-source/volta`, Git branch `recovery/import-lovable-source`, source file `src/app/modules.ts`.
This is **VOLTA**, not the independent ISS Modern / pharmacy legacy ERP. Do not import ISS patient, insurance, finance, HR, or prescription data.

## Old version module inventory (directly from the recovered source)

| Path             | Arabic previous label | Coverage required                         |
| ---------------- | --------------------- | ----------------------------------------- |
| /                | نظرة عامة             | Dashboard and field KPIs                  |
| /establishments  | المنشآت               | Field customer/establishment management   |
| /visits          | الزيارات              | Representative visits, consent and GPS    |
| /opportunities   | الفرص                 | Field opportunities pipeline              |
| /quotes          | عروض الأسعار          | Authoritative prices and quote items      |
| /sales           | المبيعات              | Manager-authorized quote-to-sale workflow |
| /districts       | المديريات             | Lahj districts                            |
| /representatives | المندوبون             | Representative assignment and scopes      |
| /products        | المنتجات              | Oil/lubricant product catalog             |
| /reports         | التقارير              | Field sales reports                       |
| /sync            | مركز المزامنة         | Offline queue and reconciliation          |
| /audit           | سجل التدقيق           | Sensitive changes and traceability        |
| /admin           | المستخدمون والأدوار   | Admin-only permission management          |
| /setup           | الإعداد والاتصال      | Configuration and connection diagnostics  |

The QA agent parses route keys from the recovered version and the current `src/app/modules.ts`. A **matching route is not evidence that business actions work**.

## Real behavioral acceptance (not established by the baseline alone)

- Authenticate as admin, supervisor and representative; assert RLS denies unauthorized reads and writes.
- Representative can visit only authorized establishments; GPS consent must be explicit.
- Offline visit saves reliably in IndexedDB and synchronizes only for the same authenticated user.
- Attempt simultaneous duplicate visit from separate queue instances: only one entry persists.
- Reconnect/airplane-mode/process-restart runs, including 12-hour offline retention, are device E2E tests, not simulated unit tests.
- Quotes/sales must honor the existing manager-authorized database RPC. Never insert fake sales in production.
- Field reports must match verified source transactions; check currency/decimal handling.
- Android Release signed with stable owner-held key, no debug certificate, Play Protect and actual device GPS verified.
- Cloudflare staging must pass TLS, app shell, assets, Supabase public client config, auth callback and offline smoke tests **before** DNS migration.

## Data/permissions boundaries

Keep Supabase project `dymxnmpaaobxoaowksoc`, schema `field_sales`. No schema recreation, no cross-project data import, and no credentials/PII in LLM prompts or repository.
Any user-provided former data exports must be separately inspected and reconciled before import; recovered source code is not a database snapshot.
