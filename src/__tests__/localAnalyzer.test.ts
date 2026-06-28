import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { documentExamples } from "../data/examples";

describe("analyzeDocument", () => {
  it("returns a validation-style report for empty input", () => {
    const report = analyzeDocument({ text: "", kind: "rental" });

    expect(report.score).toBe(0);
    expect(report.findings).toHaveLength(0);
    expect(report.summary).toContain("请先粘贴");
  });

  it("flags broad deposit deduction in rental contracts", () => {
    const example = documentExamples.find((item) => item.kind === "rental");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "rental" });

    expect(report.findings.some((finding) => finding.id === "rental-broad-deposit-deduction")).toBe(true);
    expect(report.findings.find((finding) => finding.id === "rental-broad-deposit-deduction")?.modification).toContain("押金");
    expect(report.checklist.some((item) => item.question.includes("押金"))).toBe(true);
    expect(report.actionPlan.priority).toBe("high");
    expect(report.actionPlan.message).toContain("签署前想先确认");
  });

  it("flags vague non-compete compensation in employment agreements", () => {
    const example = documentExamples.find((item) => item.kind === "employment");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "employment" });

    expect(report.findings.some((finding) => finding.id === "employment-non-compete-vague-compensation")).toBe(true);
    expect(report.status).toBe("do_not_sign_directly");
  });

  it("flags front-loaded renovation payment risk", () => {
    const example = documentExamples.find((item) => item.kind === "renovation");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "renovation" });

    expect(report.findings.some((finding) => finding.id === "renovation-front-loaded-payment")).toBe(true);
    expect(report.facts.length).toBeGreaterThan(0);
  });

  it("flags stacked charges and acceleration in loan agreements", () => {
    const example = documentExamples.find((item) => item.kind === "loan");
    const report = analyzeDocument({ text: example?.content ?? "", kind: "loan" });

    expect(report.findings.some((finding) => finding.id === "loan-stacked-overdue-charges")).toBe(true);
    expect(report.findings.some((finding) => finding.id === "loan-broad-acceleration-clause")).toBe(true);
    expect(report.findings.find((finding) => finding.id === "loan-fees-deducted-from-principal")?.modification).toContain("本金");
    expect(report.actionPlan.priority).toBe("high");
  });
});
