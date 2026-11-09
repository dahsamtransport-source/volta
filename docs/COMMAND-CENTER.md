# VOLTA Command Center

## Scope

This change adds a separate dark, RTL operations dashboard at `/command-center`. The existing overview route, shared application shell, authentication provider, database schema, PWA manifest, and service worker remain intact.

## Data currently connected

The page uses the existing Supabase client, the existing `AccessGate`, and Supabase RLS. It reads count-only metrics from these existing tables:

- `establishments`: registered establishments.
- `representatives`: registered representatives (not a claim that they are currently online).
- `visits`: visits in the last seven days, using `visited_at`.
- `sales`: sales records in the current month, using `sold_at`.
- `opportunities`: registered opportunities.
- `products`: registered catalog products.
- `visits.follow_up_at`: overdue follow-ups.

Counts use exact count queries. The activity feed only displays timestamps for the latest visit rows and deliberately avoids exposing extra personal fields.

The chart is explicitly labelled as a sample of up to 500 recent visit rows and 500 sale rows in the seven-day window. KPI counts above it use exact database counts and are not derived from that sample.

## Deliberate non-fabrication states

- **Map:** no team pins, routes, or geospatial claims are shown until a Mapbox token and verified GPS coordinates are available from the database/device flow.
- **Oil inventory:** the page shows the catalog product count, but does not display liters or depletion percentages because the inspected client schema does not establish a verified stock quantity and unit field.
- **Three.js:** an explicit mount point is provided in the bottle illustration; Three.js is not added to the dependency graph until a production bundle and device performance check are planned.
- **Brand assets:** official VOLTA/YPC image files must be supplied or selected from the approved public assets before replacing the existing icon/parent-company placement.

## Existing controls reused

- Supabase session state and role claims from the existing session provider.
- Existing `AccessGate` and database RLS (the UI is not a security boundary).
- Existing AppShell navigation, search, responsive mobile navigation, offline indicator, and sync center.
- Existing root-level PWA manifest and Service Worker. This feature does not install a second Service Worker or modify cache rules.

## Tests and verification

Run from the repository root:

```sh
bun install --frozen-lockfile
bun run test
bun run build
bun run lint
```

A focused unit test covers seven-day chart aggregation. CI must pass on the pull request before merge. A successful build/test run does not replace device acceptance, backend contract checks, RLS review, or production load testing.

## Remaining production acceptance items

1. Confirm the real GPS source, coordinate privacy/retention policy, Mapbox token ownership, and map access restrictions.
2. Confirm the stock quantity field, unit conversion rules, lot/batch handling, and the authoritative source for liters before showing inventory depletion.
3. Supply approved VOLTA and YPC logos.
4. Decide whether Three.js adds measurable operational value; verify lazy loading, memory, and frame rate on low-end Android devices before enabling it.
5. Run authenticated acceptance tests for each role, offline/reconnect scenarios, sync conflict handling, and real-device responsive checks.
6. Verify production CSP, headers, secrets, monitoring, backups, and database policies in the actual hosting environment.

**Status:** UI route and verified count-based data integration are proposed in this branch. Production acceptance remains pending the items above and successful CI.
