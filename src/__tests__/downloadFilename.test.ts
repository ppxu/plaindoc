import { describe, expect, it } from "vitest";
import { buildReportMarkdownFilename } from "../export/downloadFilename";
import type { AnalysisReport } from "../types";

describe("buildReportMarkdownFilename", () => {
  it("uses document kind and generated time to create a readable Markdown filename", () => {
    expect(buildReportMarkdownFilename(createReport({ documentKind: "rental", generatedAt: "2026-06-29T15:42:11" }))).toBe(
      "plaindoc-租房合同-2026-06-29-1542.md"
    );
  });

  it("falls back safely when the report date is invalid", () => {
    expect(buildReportMarkdownFilename(createReport({ documentKind: "unknown", generatedAt: "not-a-date" }))).toBe(
      "plaindoc-不确定-unknown-date.md"
    );
  });
});

function createReport(partial: Partial<AnalysisReport>): AnalysisReport {
  return {
    summary: "摘要",
    status: "needs_attention",
    score: 60,
    facts: [],
    findings: [],
    inputWarnings: [],
    checklist: [],
    clarifyingQuestions: [],
    actionPlan: {
      priority: "medium",
      title: "下一步",
      steps: ["确认"],
      message: "请确认。"
    },
    plainLanguage: ["解释"],
    generatedAt: "2026-06-29T00:00:00.000Z",
    documentKind: "unknown",
    wordCount: 0,
    source: "local",
    disclaimer: "免责声明",
    ...partial
  };
}
