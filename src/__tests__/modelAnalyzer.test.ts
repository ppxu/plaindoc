import { describe, expect, it } from "vitest";
import { analyzeDocument } from "../analyzer/localAnalyzer";
import { mergeModelPayload } from "../analyzer/modelAnalyzer";

describe("model analyzer", () => {
  it("merges only supported model report fields", () => {
    const localReport = analyzeDocument({
      text: "甲方可根据情况扣除全部押金，乙方提前退租需承担两个月租金作为违约金。",
      kind: "rental"
    });

    const report = mergeModelPayload(
      localReport,
      {
        summary: "这份合同把押金和提前退租成本写得偏重，需要签前确认。",
        findings: [
          {
            title: "押金扣除空间过大",
            severity: "red",
            explanation: "条款允许对方按情况扣除全部押金。",
            whyItMatters: "这会让退租时的扣款依据变得不稳定。",
            suggestion: "要求写明可扣款项目、上限和证据材料。",
            unexpected: "ignored"
          }
        ],
        checklist: [
          {
            question: "押金扣除项目和金额上限是否写清楚？",
            reason: "明确扣款边界能减少退租争议。",
            severity: "red"
          }
        ],
        plainLanguage: ["先把押金怎么扣问清楚，再决定是否签。"]
      },
      "test-model"
    );

    expect(report.source).toBe("model");
    expect(report.modelName).toBe("test-model");
    expect(report.findings[0].id).toContain("model-1");
    expect(report.findings[0].evidence).toBeUndefined();
    expect(report.checklist[0].severity).toBe("red");
    expect(report.score).toBe(localReport.score);
  });

  it("falls back to local fields when model payload is unusable", () => {
    const localReport = analyzeDocument({ text: "甲方和乙方签署普通文件。", kind: "unknown" });
    const report = mergeModelPayload(localReport, { findings: [{ title: "缺少字段" }] }, "test-model");

    expect(report.findings).toEqual(localReport.findings);
    expect(report.checklist).toEqual(localReport.checklist);
    expect(report.plainLanguage).toEqual(localReport.plainLanguage);
  });
});
