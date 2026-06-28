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
            localFindingId: "rental-broad-deposit-deduction",
            title: "押金扣除空间过大",
            severity: "red",
            explanation: "条款允许对方按情况扣除全部押金。",
            whyItMatters: "这会让退租时的扣款依据变得不稳定。",
            suggestion: "要求写明可扣款项目、上限和证据材料。",
            modification: "建议写明扣款项目、凭证和退还期限。",
            unexpected: "ignored"
          },
          {
            title: "模型补充提醒",
            severity: "yellow",
            explanation: "模型识别到还需要确认通知流程。",
            whyItMatters: "通知流程不清楚会影响后续举证。",
            suggestion: "要求补充书面通知方式。",
            modification: "建议写明书面通知可以通过邮件、短信或双方确认的平台发送。"
          }
        ],
        checklist: [
          {
            question: "押金扣除项目和金额上限是否写清楚？",
            reason: "明确扣款边界能减少退租争议。",
            severity: "red"
          }
        ],
        actionPlan: {
          priority: "high",
          title: "先确认押金扣除边界",
          steps: ["要求写明扣款项目。", "要求补充扣款证据。", "确认后再签署。"],
          message: "你好，签署前想确认押金扣除边界。\n请写进合同正文。"
        },
        plainLanguage: ["先把押金怎么扣问清楚，再决定是否签。"]
      },
      "test-model"
    );
    const localDepositFinding = localReport.findings.find((finding) => finding.id === "rental-broad-deposit-deduction");
    const enhancedDepositFinding = report.findings.find((finding) => finding.id === "rental-broad-deposit-deduction");

    expect(report.source).toBe("model");
    expect(report.modelName).toBe("test-model");
    expect(enhancedDepositFinding?.title).toBe("押金扣除空间过大");
    expect(enhancedDepositFinding?.evidence).toEqual(localDepositFinding?.evidence);
    expect(enhancedDepositFinding?.modification).toContain("退还期限");
    expect(report.findings.some((finding) => finding.id.startsWith("model-1-"))).toBe(true);
    expect(report.checklist[0].severity).toBe("red");
    expect(report.actionPlan.priority).toBe("high");
    expect(report.actionPlan.message).toContain("\n");
    expect(report.score).toBe(localReport.score);
    expect(report.notice).toContain("本地证据片段会被保留");
  });

  it("falls back to local fields when model payload is unusable", () => {
    const localReport = analyzeDocument({ text: "甲方和乙方签署普通文件。", kind: "unknown" });
    const report = mergeModelPayload(localReport, { findings: [{ title: "缺少字段" }] }, "test-model");

    expect(report.findings).toEqual(localReport.findings);
    expect(report.checklist).toEqual(localReport.checklist);
    expect(report.plainLanguage).toEqual(localReport.plainLanguage);
  });

  it("adds model input range notice when a long document is truncated before model analysis", () => {
    const localReport = analyzeDocument({ text: "甲方和乙方签署普通文件。", kind: "unknown" });
    const report = mergeModelPayload(
      localReport,
      { summary: "模型摘要" },
      "test-model",
      {
        text: "条".repeat(12000),
        originalLength: 12025,
        sentLength: 12000,
        truncated: true
      }
    );

    expect(report.notice).toContain("仅发送前 12000 个字符");
    expect(report.notice).toContain("完整文本仍由本地规则分析");
  });
});
