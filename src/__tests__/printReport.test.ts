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

  it("reports failure when the browser print dialog is blocked", () => {
    const print = vi.fn(() => {
      throw new Error("print blocked");
    });

    expect(printReport({ print })).toBe(false);
    expect(print).toHaveBeenCalledOnce();
  });
});
