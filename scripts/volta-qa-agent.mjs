#!/usr/bin/env node
/**
 * VOLTA QA orchestrator. No production database writes or deploy actions.
 * Reads the recovered Lovable source as the legacy parity baseline.
 * Optional LOCAL Ollama analysis is non-authoritative; verified tests own the gates.
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";

const root = resolve(import.meta.dirname, "..");
const runFull = !process.argv.includes("--inventory-only");
const runAi = process.argv.includes("--local-ai") && !process.env.CI;
const reportDir = resolve(root, ".qa-output");
mkdirSync(reportDir, { recursive: true });
const checks = [];
const blocked = [];
const started = new Date().toISOString();
const run = (cmd, args, timeout = 600000) =>
  spawnSync(cmd, args, {
    cwd: root,
    encoding: "utf8",
    timeout,
    maxBuffer: 12 * 1024 * 1024,
    shell: false,
  });
const status = (id, state, evidence) => {
  checks.push({ id, state, evidence: String(evidence).slice(0, 1600) });
  process.stdout.write(id + ": " + state + "\n");
};
const command = (id, cmd, args, timeout) => {
  const out = run(cmd, args, timeout);
  const ok = out.status === 0 && !out.error;
  const trail = (out.stdout || "") + "\n" + (out.stderr || "");
  status(
    id,
    ok ? "PASS" : "FAIL",
    "exit=" +
      out.status +
      (out.error ? "; " + out.error.message : "") +
      "; last output: " +
      trail.slice(-1100),
  );
  return ok;
};
const file = (p) => readFileSync(resolve(root, p), "utf8");
const legacyRef = "origin/recovery/import-lovable-source:src/app/modules.ts";
const old = run("git", ["show", legacyRef], 12000);
const oldText = old.status === 0 ? old.stdout : "";
const presentText = file("src/app/modules.ts");
const routes = (source) =>
  [...new Set([...source.matchAll(/\bpath:\s*"(\/[^"]*)"/g)].map((m) => m[1]))].sort();
const oldRoutes = routes(oldText);
const presentRoutes = routes(presentText);
const missing = oldRoutes.filter((r) => !presentRoutes.includes(r));
if (oldRoutes.length === 0) {
  status(
    "legacy_routes",
    "FAIL",
    "Original Lovable recovery source not accessible. Expected " +
      legacyRef +
      "; code=" +
      old.status,
  );
} else {
  status(
    "legacy_routes",
    missing.length ? "FAIL" : "PASS",
    "Recovered legacy routes=" +
      oldRoutes.length +
      "; current=" +
      presentRoutes.length +
      "; missing: " +
      (missing.join(", ") || "none") +
      "; baseline: " +
      legacyRef,
  );
}
const documented = [
  ["authentication_and_roles", "src/lib/auth/roles.ts"],
  ["offline_visit_queue", "src/lib/offline/queue.ts"],
  ["visit_workflow", "src/components/data/VisitCapture.tsx"],
  ["sales_quote_grid", "src/components/data/LineItemsGrid.tsx"],
  ["reporting_dashboard", "src/components/dashboard/OverviewDashboard.tsx"],
  ["android_entry", "android/app/src/main/java/com/muslly/volta/MainActivity.kt"],
  ["public_offline_shell", "public/sw.js"],
];
for (const [id, p] of documented)
  status(id, existsSync(resolve(root, p)) ? "PRESENT_NOT_E2E_TESTED" : "FAIL", p);
if (runFull) {
  command("unit_tests", "bun", ["run", "test"], 240000);
  command("typescript", "bun", ["x", "tsc", "--noEmit"], 240000);
  command("lint", "bun", ["run", "lint"], 240000);
  const built = command("web_and_ssr_build", "bun", ["run", "build"], 540000);
  if (built && existsSync(resolve(root, ".output/server/wrangler.json"))) {
    const generated = JSON.parse(file(".output/server/wrangler.json"));
    status(
      "nitro_cloudflare_output",
      generated.main && generated.assets && generated.compatibility_flags?.includes("nodejs_compat")
        ? "PASS"
        : "FAIL",
      "Worker entry: " +
        generated.main +
        "; generated config with assets and nodejs_compat (no deploy)",
    );
    command(
      "cloudflare_deploy_dry_run",
      "bun",
      [
        "x",
        "wrangler",
        "deploy",
        "--config",
        ".output/server/wrangler.json",
        "--dry-run",
        "--outdir",
        ".wrangler/volta-qa-dry-run",
      ],
      240000,
    );
  } else
    status(
      "nitro_cloudflare_output",
      "FAIL",
      "Build did not produce Cloudflare Worker configuration",
    );
} else status("execution_mode", "INVENTORY_ONLY", "Expensive tests/build not run");
const deviceNeeded = [
  "real Android installation/Play Protect",
  "airplane-mode 12h and post-restart write/replay",
  "actual GPS/browser permissions",
  "authenticated representative role/RLS negative tests",
  "field sales/quote approvals with non-production fixtures",
  "Cloudflare staging URL and DNS cutover verification",
];
for (const item of deviceNeeded) blocked.push(item);
status("production_and_field_acceptance", "BLOCKED", deviceNeeded.join("; "));
const report = {
  title: "VOLTA QA agent — recovery-baseline parity and deployment readiness",
  started,
  finished: new Date().toISOString(),
  source: "dahsamtransport-source/volta",
  baseline: legacyRef,
  legacyRoutes: oldRoutes,
  currentRoutes: presentRoutes,
  checks,
  blocked,
  policy:
    "No production database writes, financial actions, payments, real sales, DNS changes, or deployments. Static presence alone never proves E2E parity.",
};
async function localAI() {
  const critical = checks.filter((c) => c.state === "FAIL" || c.state === "BLOCKED");
  const summary = {
    legacyRoutes: oldRoutes,
    missingLegacyRoutes: missing,
    gates: checks.map((c) => ({ id: c.id, status: c.state })),
    unverified: blocked,
  };
  const prompt =
    "أنت وكيل مراجعة نظام VOLTA الميداني في لحج. اعتمد فقط على نتائج الاختبارات الموضحة. " +
    "تميّز بين PASS الموثق وBLOCKED والوجود البرمجي غير المختبر. " +
    "لا تدّع نجاح المبيعات أو GPS أو نشر Cloudflare أو دخول المستخدم. " +
    "رتب أول خمس فجوات وخطة اختبار عملية بالعربية دون بيانات عملاء أو قرارات مالية. " +
    "المعلومات:\n" +
    JSON.stringify(summary);
  try {
    const ctl = new AbortController();
    const timeout = setTimeout(() => ctl.abort(), 90000);
    try {
      const response = await fetch("http://127.0.0.1:11434/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        signal: ctl.signal,
        body: JSON.stringify({
          model: "qwen2.5:1.5b",
          prompt,
          stream: false,
          options: { temperature: 0.1, num_predict: 650 },
        }),
      });
      if (!response.ok) throw new Error("Local Ollama HTTP " + response.status);
      const data = await response.json();
      report.localAI = {
        model: "qwen2.5:1.5b",
        verified: false,
        warning: "AI suggestions are NOT test evidence and cannot override PASS/FAIL.",
        review: String(data.response || "").slice(0, 5500),
      };
      status(
        "local_ai_analysis",
        "COMPLETED_UNVERIFIED_ADVICE",
        "Local Ollama review generated, independent test results retained",
      );
    } finally {
      clearTimeout(timeout);
    }
  } catch (e) {
    report.localAI = { status: "unavailable", reason: String(e).slice(0, 300) };
    status(
      "local_ai_analysis",
      "BLOCKED",
      "Only local Ollama allowed; unavailable: " + String(e).slice(0, 180),
    );
  }
}
if (runAi) await localAI();
report.checks = checks;
report.finished = new Date().toISOString();
const jsonPath = resolve(reportDir, "volta-qa-agent-report.json");
writeFileSync(jsonPath, JSON.stringify(report, null, 2) + "\n", "utf8");
const md = [
  "# VOLTA QA Agent — " + report.finished,
  "Source baseline: " + legacyRef,
  "",
  "| Gate | Result | Evidence |",
  "|---|---|---|",
  ...checks.map(
    (c) =>
      "| " +
      c.id +
      " | " +
      c.state +
      " | " +
      c.evidence.replace(/\|/g, "/").replace(/\n/g, " ").slice(0, 220) +
      " |",
  ),
  "",
  "## Legacy parity",
  "Previous modules: " + oldRoutes.join(", "),
  "Current modules: " + presentRoutes.join(", "),
  "Missing routes: " + (missing.join(", ") || "none detected (structural only)"),
  "",
  "## Unverified — cannot approve operations",
  ...blocked.map((b) => "- " + b),
  "",
  report.localAI?.review
    ? "## Local AI advice (NOT verified evidence)\n" + report.localAI.review
    : "",
].join("\n");
writeFileSync(resolve(reportDir, "VOLTA-QA-REPORT.md"), md + "\n", "utf8");
process.stdout.write("REPORT=" + jsonPath + "\n");
if (checks.some((c) => c.state === "FAIL")) process.exitCode = 1;
