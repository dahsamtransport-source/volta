import { describe, expect, it } from "vitest";
import { lineTotal, linesTotal, toFixed, parseDec, mul } from "@/lib/decimal";
import { resolveAccess, can } from "@/lib/auth/roles";
import { checkPublishableKey } from "@/lib/config";
import { OfflineQueue, MemoryQueueStorage } from "@/lib/offline/queue";

describe("decimal", () => {
  it("avoids float error 0.1*3", () =>
    expect(toFixed(mul(parseDec("0.1"), parseDec("3")))).toBe("0.30"));
  it("line with 10% discount", () =>
    expect(toFixed(lineTotal({ quantity: "3", unitPrice: "1500.50", discountPercent: "10" }))).toBe(
      "4051.35",
    ));
  it("sums lines", () =>
    expect(
      toFixed(
        linesTotal([
          { quantity: "2", unitPrice: "0.1", discountPercent: "0" },
          { quantity: "1", unitPrice: "0.2", discountPercent: "0" },
        ]),
      ),
    ).toBe("0.40"));
  it("rejects garbage", () => expect(() => parseDec("abc")).toThrow());
});

describe("roles", () => {
  it("ignores user_metadata", () =>
    expect(
      resolveAccess({ app_metadata: {}, user_metadata: { field_sales_role: "admin" } } as never)
        .status,
    ).toBe("no_role"));
  it("rep without id is invalid", () =>
    expect(resolveAccess({ app_metadata: { field_sales_role: "representative" } }).status).toBe(
      "invalid_claims",
    ));
  it("only admin manages users", () => {
    expect(can(resolveAccess({ app_metadata: { field_sales_role: "admin" } }), "admin_users")).toBe(
      true,
    );
    expect(
      can(resolveAccess({ app_metadata: { field_sales_role: "supervisor" } }), "admin_users"),
    ).toBe(false);
  });
  it("signed out denies", () => expect(can(resolveAccess(null), "view")).toBe(false));
});

describe("key guard", () => {
  it("rejects secret keys", () => expect(checkPublishableKey("sb_secret_x").ok).toBe(false));
  it("accepts publishable", () => expect(checkPublishableKey("sb_publishable_x").ok).toBe(true));
  it("rejects missing", () => expect(checkPublishableKey("").ok).toBe(false));
});

describe("offline queue", () => {
  it("dedupes idempotency keys", async () => {
    const q = new OfflineQueue(new MemoryQueueStorage());
    expect(
      await q.enqueue({ idempotencyKey: "k", table: "visits", op: "insert", payload: {} }),
    ).toBe(true);
    expect(
      await q.enqueue({ idempotencyKey: "k", table: "visits", op: "insert", payload: {} }),
    ).toBe(false);
    expect((await q.list()).length).toBe(1);
  });
});
