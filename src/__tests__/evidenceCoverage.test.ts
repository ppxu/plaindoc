import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { mergeModelPayload } from "../analyzer/modelAnalyzer";
import { getEvidenceCoverage } from "../report/evidenceCoverage";

describe("getEvidenceCoverage", () => {
  it("summarizes fully located local-rule evidence", () => {
    const report = analyzeDocument({
      text: "押金 5000 元。甲方可根据情况扣除全部押金，乙方提前退租需赔偿两个月租金。",
      kind: "rental"
    });
    const coverage = getEvidenceCoverage(report);

    expect(report.findings.length).toBeGreaterThan(0);
    expect(coverage.total).toBe(report.findings.length);
    expect(coverage.located).toBe(report.findings.length);
    expect(coverage.missing).toBe(0);
    expect(coverage.summary).toContain("所有风险提示都有可定位证据片段");
  });

  it("warns when model-supplemented findings do not have source evidence", () => {
    const localReport = analyzeDocument({
      text: "押金 5000 元。甲方可根据情况扣除全部押金，乙方提前退租需赔偿两个月租金。",
      kind: "rental"
    });
    const report = mergeModelPayload(
      localReport,
      {
        findings: [
          {
            title: "模型补充但未定位原文的风险",
            severity: "yellow",
            explanation: "模型认为还需要确认口头承诺。",
            whyItMatters: "口头承诺很难在争议时证明。",
            suggestion: "要求对方写入正文或附件。",
            modification: "建议补充所有口头承诺以书面附件为准。"
          }
        ]
      },
      "test-model"
    );
    const coverage = getEvidenceCoverage(report);

    expect(coverage.total).toBe(report.findings.length);
    expect(coverage.missing).toBe(1);
    expect(coverage.summary).toContain("1 个风险提示缺少可定位证据");
    expect(coverage.action).toContain("要求对方提供原文位置");
  });
});
