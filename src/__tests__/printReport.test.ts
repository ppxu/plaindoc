import { describe, expect, it, vi } from "vitest";
import { printReport } from "../export/printReport";

describe("printReport", () => {
  it("calls the browser print dialog when available", () => {
    const print = vi.fn();

    expect(printReport({ print })).toBe(true);
    expect(print).toHaveBeenCalledOnce();
  });

  it("reports failure when browser printing is unavailable", () => {
    expect(printReport({})).toBe(false);
  });
});
