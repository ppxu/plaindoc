import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { getReviewPerspectiveLabel, getReviewPerspectiveOptions, normalizeReviewPerspective } from "../data/reviewPerspectives";
import { reportToMarkdown } from "../export/markdown";

describe("review perspective", () => {
  it("offers practical role options for each document kind", () => {
    expect(getReviewPerspectiveOptions("rental").map((option) => option.id)).toEqual([
      "neutral",
      "rental_tenant",
      "rental_landlord"
    ]);
    expect(getReviewPerspectiveLabel("rental", "rental_tenant")).toBe("承租方");
  });

  it("falls back to neutral when a perspective does not match the document kind", () => {
    expect(normalizeReviewPerspective("loan", "rental_tenant")).toBe("neutral");
  });

  it("keeps the selected perspective in reports and counterparty messages", () => {
    const report = analyzeDocument({
      text: "押金 5000 元。提前退租赔偿两个月租金。",
      kind: "rental",
      perspective: "rental_tenant"
    });

    expect(report.reviewPerspective).toBe("rental_tenant");
    expect(report.actionPlan.message).toContain("我作为承租方");
  });

  it("exports review perspective in markdown reports", () => {
    const report = analyzeDocument({
      text: "押金 5000 元。提前退租赔偿两个月租金。",
      kind: "rental",
      perspective: "rental_tenant"
    });

    expect(reportToMarkdown(report)).toContain("**审阅视角：** 承租方");
  });
});
