import { describe, expect, it } from "vitest";
import { buildCommandTrend } from "../routes/command-center";

describe("buildCommandTrend", () => {
  it("returns exactly seven consecutive local calendar days", () => {
    const now = new Date(2026, 10, 9, 12, 0, 0);
    const result = buildCommandTrend([], [], now);
    expect(result).toHaveLength(7);
    expect(result.every((point) => point.visits === 0 && point.sales === 0)).toBe(true);
  });

  it("counts only rows on the matching day", () => {
    const now = new Date(2026, 10, 9, 12, 0, 0);
    const visits = [
      { id: "v1", visited_at: new Date(2026, 10, 9, 8, 0).toISOString() },
      { id: "v2", visited_at: new Date(2026, 10, 9, 9, 0).toISOString() },
    ];
    const sales = [
      { id: "s1", sold_at: new Date(2026, 10, 8, 14, 0).toISOString() },
      { id: "s2", sold_at: new Date(2026, 10, 1, 14, 0).toISOString() },
    ];
    const result = buildCommandTrend(visits, sales, now);
    expect(result[6]).toMatchObject({ visits: 2, sales: 0 });
    expect(result[5]).toMatchObject({ visits: 0, sales: 1 });
  });

  it("does not include activity outside the seven-day window", () => {
    const now = new Date(2026, 10, 9, 12, 0, 0);
    const visits = [{ id: "old", visited_at: new Date(2026, 10, 1, 10, 0).toISOString() }];
    const result = buildCommandTrend(visits, [], now);
    expect(result.reduce((total, point) => total + point.visits, 0)).toBe(0);
  });
});
